// Truth source for Telegraph evaluators: B2B identity enrichment from a company domain.
// Intent: B2B_IDENTITY_ENRICHMENT_GENERAL ("Enrich acme.io: legal entity name, tax ID, HQ address,
// employee count and CEO").
//
// Rule: every field comes from a named public source, or it is listed in `not_verifiable`.
// Nothing is guessed. Employee counts carry their date, and a range is given when the source
// holds different figures for the same year.
//
// Sources (no API key):
//   1. DNS: does the domain exist at all? Reserved documentation domains (RFC 2606: .example,
//      .test, .invalid, .localhost, example.com/.net/.org) are never a real business.
//   2. Wikidata (CC0): the company whose "official website" (P856) is this domain. Gives the
//      common name, headquarters (P159), country (P17), employees (P1128 with date), industry
//      (P452), chief executive (P169, current only) and the LEI (P1278).
//   3. GLEIF (free LEI register): with that LEI, the legal name, registration number and
//      authority, jurisdiction, registered and headquarters addresses, and entity status.
//
// Scope, stated plainly: only companies listed on Wikidata with this website are found. Tax IDs
// are never available from these sources and are always `not_verifiable`.

import { promises as dns } from 'node:dns';

const UA = { 'user-agent': 'telegraph-evaluator/1.0 (+https://github.com/investor567768/telegraph-evaluator)', accept: 'application/json' };
const SPARQL = 'https://query.wikidata.org/sparql';
const ENTITY = id => `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`;
const LABELS = ids => `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join('|')}&props=labels&languages=en&format=json`;
const GLEIF = lei => `https://api.gleif.org/api/v1/lei-records/${lei}`;
const TTL = 12 * 3600 * 1000;
const cache = new Map();

class AnswerError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

// Swappable for tests.
const deps = {
  resolve: async host => {
    for (const fn of [dns.resolve4, dns.resolve6, dns.resolveMx]) {
      try { const r = await fn.call(dns, host); if (r && r.length) return true; }
      catch (e) { if (!['ENOTFOUND', 'ENODATA', 'ESERVFAIL', 'NXDOMAIN'].includes(e.code)) return null; }
    }
    return false;
  },
};

const RESERVED_TLD = /\.(example|test|invalid|localhost)$/i;
const RESERVED_NAME = /^(example\.(com|net|org))$/i;

function normaliseDomain(params) {
  let raw = params.domain || params.url || params.website || params.email || params.query || params.q || '';
  raw = String(raw).trim();
  if (raw.includes('@') && !raw.includes('/')) raw = raw.split('@').pop();
  const m = raw.match(/(?:https?:\/\/)?([a-z0-9][a-z0-9.-]*\.[a-z]{2,})(?=[\/:?#\s]|$|["'),.;:!])/i);
  if (!m) throw new AnswerError(400, 'domain is required, for example domain=fanuc.com (a URL or work email also works).');
  return m[1].toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
}

async function getJson(url, who, opts = {}) {
  let r;
  try { r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000), ...opts }); }
  catch (e) { throw new AnswerError(502, `${who} could not be reached (${e.name === 'TimeoutError' ? 'no answer within 20 s' : e.message}). Try again shortly.`); }
  if (r.status === 404) return null;
  if (r.status === 429 || r.status === 503) throw new AnswerError(503, `${who} is limiting requests. Try again in about a minute.`);
  if (!r.ok) throw new AnswerError(502, `${who} answered HTTP ${r.status}.`);
  return r.json();
}

function siteVariants(domain) {
  const out = [];
  for (const scheme of ['https', 'http']) for (const host of [domain, 'www.' + domain]) for (const slash of ['', '/']) out.push(`<${scheme}://${host}${slash}>`);
  return out;
}

const EXTURL = (proto, q) => `https://www.wikidata.org/w/api.php?action=query&list=exturlusage&euprotocol=${proto}&euquery=${encodeURIComponent(q)}&eunamespace=0&eulimit=50&format=json`;
const hostOf = u => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch { return null; } };

async function findItem(domain) {
  const ask = q => getJson(`${SPARQL}?format=json&query=${encodeURIComponent(q)}`, 'Wikidata', { headers: { ...UA, accept: 'application/sparql-results+json' } });
  // 1. Exact home page (fast, indexed).
  let j = await ask(`SELECT DISTINCT ?item WHERE { VALUES ?site { ${siteVariants(domain).join(' ')} } ?item wdt:P856 ?site . } LIMIT 5`);
  let ids = ((j && j.results && j.results.bindings) || []).map(b => b.item.value.split('/').pop());
  if (ids.length) return ids;
  // 2. Official website with a path, e.g. https://www.atlascopcogroup.com/en: find items that link to
  //    the domain, then keep only those whose official website (P856) is on this exact host.
  const lists = await Promise.all(['https', 'http'].flatMap(p => [domain, '*.' + domain].map(q => getJson(EXTURL(p, q), 'Wikidata').catch(() => null))));
  const cands = [...new Set(lists.flatMap(l => ((l && l.query && l.query.exturlusage) || []).filter(x => hostOf(x.url) === domain).map(x => x.title)).filter(t => /^Q\d+$/.test(t)))].slice(0, 40);
  if (!cands.length) return [];
  j = await ask(`SELECT DISTINCT ?item ?site WHERE { VALUES ?item { ${cands.map(c => 'wd:' + c).join(' ')} } ?item wdt:P856 ?site . }`);
  ids = [...new Set(((j && j.results && j.results.bindings) || []).filter(b => hostOf(b.site.value) === domain).map(b => b.item.value.split('/').pop()))];
  return ids;
}

const live = s => s && s.rank !== 'deprecated';
const val = s => s && s.mainsnak && s.mainsnak.datavalue && s.mainsnak.datavalue.value;
const qual = (s, p) => s && s.qualifiers && s.qualifiers[p] && s.qualifiers[p][0] && s.qualifiers[p][0].datavalue && s.qualifiers[p][0].datavalue.value;
const ranked = list => { const l = (list || []).filter(live); const pref = l.filter(s => s.rank === 'preferred'); return pref.length ? pref : l; };

function pickEmployees(claims) {
  const rows = (claims.P1128 || []).filter(live).map(s => ({
    n: Math.round(Number(String((val(s) || {}).amount || '').replace('+', ''))),
    date: (qual(s, 'P585') || {}).time ? qual(s, 'P585').time.replace(/^\+/, '').slice(0, 10).replace(/-00/g, '') : null,
    rank: s.rank,
  })).filter(r => isFinite(r.n) && r.n > 0);
  if (!rows.length) return null;
  const dated = rows.filter(r => r.date).sort((a, b) => b.date.localeCompare(a.date));
  if (!dated.length) {
    const p = rows.find(r => r.rank === 'preferred') || rows[0];
    return { value: p.n, range: null, as_of: null };
  }
  const year = dated[0].date.slice(0, 4);
  const same = [...new Set(dated.filter(r => r.date.startsWith(year)).map(r => r.n))];
  if (same.length > 1) return { value: null, range: [Math.min(...same), Math.max(...same)], as_of: year };
  return { value: dated[0].n, range: null, as_of: dated[0].date };
}

function fmtAddress(a) {
  if (!a) return null;
  return [...(a.addressLines || []), a.city, a.region, a.postalCode, a.country].filter(Boolean).join(', ') || null;
}

async function answer(params) {
  const domain = normaliseDomain(params);
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  const checked_at = new Date().toISOString();
  const ALL = ['legal_entity_name', 'registration_number', 'headquarters', 'employee_count', 'industry', 'ceo', 'tax_id'];
  const base = { domain, checked_at, tax_id: null };

  if (RESERVED_TLD.test(domain) || RESERVED_NAME.test(domain)) {
    return { ...base, domain_valid: false, company_found: false,
      note: `${domain} is a reserved documentation domain (RFC 2606). It never belongs to a real business, so no company can be identified.`,
      not_verifiable: ALL, sources: {} };
  }

  const resolves = await deps.resolve(domain);
  if (resolves === false) {
    return { ...base, domain_valid: false, company_found: false,
      note: `${domain} does not resolve in DNS, so no company can be identified from it.`,
      not_verifiable: ALL, sources: { domain_valid: 'DNS lookup' } };
  }

  const ids = await findItem(domain);
  if (ids.length !== 1) {
    const value = { ...base, domain_valid: resolves, company_found: false,
      note: ids.length ? `More than one Wikidata entry (${ids.join(', ')}) lists ${domain} as its website, so the company is ambiguous and nothing is stated.`
        : `No Wikidata entry lists ${domain} as its official website. Nothing about the company is stated rather than guessed.`,
      not_verifiable: ALL, sources: { domain_valid: resolves === null ? 'DNS lookup failed, unknown' : 'DNS lookup' } };
    cache.set(domain, { at: Date.now(), value });
    return value;
  }

  const qid = ids[0];
  const ent = await getJson(ENTITY(qid), 'Wikidata');
  const e = ent && ent.entities && (ent.entities[qid] || Object.values(ent.entities)[0]);
  if (!e) throw new AnswerError(502, `Wikidata returned no record for ${qid}.`);
  const c = e.claims || {};

  const hq = ranked(c.P159)[0];
  const ceos = (c.P169 || []).filter(live).filter(s => !qual(s, 'P582'));
  const need = [hq && val(hq) && val(hq).id, ...ranked(c.P17).map(s => (val(s) || {}).id), ...ranked(c.P452).map(s => (val(s) || {}).id), ...ceos.map(s => (val(s) || {}).id)].filter(Boolean);
  const labelsJ = need.length ? await getJson(LABELS([...new Set(need)].slice(0, 50)), 'Wikidata') : null;
  const label = id => (labelsJ && labelsJ.entities && labelsJ.entities[id] && labelsJ.entities[id].labels && labelsJ.entities[id].labels.en && labelsJ.entities[id].labels.en.value) || null;

  const lei = (val(ranked(c.P1278)[0]) || null);
  let g = null;
  if (typeof lei === 'string' && /^[A-Z0-9]{20}$/.test(lei)) {
    const gj = await getJson(GLEIF(lei), 'GLEIF').catch(() => null);
    g = gj && gj.data && gj.data.attributes;
  }

  const emp = pickEmployees(c);
  const hqStreet = hq && qual(hq, 'P6375') && qual(hq, 'P6375').text;
  const hqCity = hq && val(hq) && label(val(hq).id);
  const country = ranked(c.P17).map(s => label((val(s) || {}).id)).filter(Boolean)[0] || null;
  const industry = ranked(c.P452).map(s => label((val(s) || {}).id)).filter(Boolean);
  const ceo = ceos.map(s => label((val(s) || {}).id)).filter(Boolean);
  const wdUrl = `https://www.wikidata.org/wiki/${qid}`;
  const gUrl = lei ? `https://search.gleif.org/#/record/${lei}` : null;

  const value = {
    ...base,
    domain_valid: resolves,
    company_found: true,
    common_name: (e.labels && e.labels.en && e.labels.en.value) || null,
    legal_entity_name: g ? g.entity.legalName.name : null,
    lei: g ? lei : null,
    lei_status: g ? `${g.entity.status}, ${g.registration.status}` : null,
    registration_number: g && g.entity.registeredAs ? g.entity.registeredAs : null,
    registration_authority: g && g.entity.registeredAt ? g.entity.registeredAt.id : null,
    jurisdiction: g ? g.entity.jurisdiction : null,
    registered_address: g ? fmtAddress(g.entity.legalAddress) : null,
    headquarters: g ? fmtAddress(g.entity.headquartersAddress) : ([hqStreet, hqCity, country].filter(Boolean).join(', ') || null),
    employee_count: emp ? emp.value : null,
    employee_count_range: emp ? emp.range : null,
    employee_count_as_of: emp ? emp.as_of : null,
    industry: industry.length ? industry : null,
    ceo: ceo.length ? ceo : null,
  };

  value.sources = {
    domain_valid: 'DNS lookup',
    common_name: wdUrl,
    ...(g ? { legal_entity_name: gUrl, registration_number: gUrl, registered_address: gUrl, headquarters: gUrl } : value.headquarters ? { headquarters: wdUrl } : {}),
    ...(emp ? { employee_count: `${wdUrl} (P1128${emp.as_of ? ', dated ' + emp.as_of : ', undated'})` } : {}),
    ...(industry.length ? { industry: wdUrl } : {}),
    ...(ceo.length ? { ceo: `${wdUrl} (current P169, may lag recent changes)` } : {}),
  };
  value.not_verifiable = [
    !value.legal_entity_name && 'legal_entity_name', !value.registration_number && 'registration_number',
    !value.headquarters && 'headquarters', !emp && 'employee_count', !value.industry && 'industry',
    !value.ceo && 'ceo', 'tax_id',
  ].filter(Boolean);
  value.note = 'Each field names its source. Fields in not_verifiable were not found in a public source and are not guessed. Tax IDs are not available from these sources.';

  cache.set(domain, { at: Date.now(), value });
  return value;
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('access-control-allow-origin', '*');
  try {
    const out = await answer(Object.fromEntries(url.searchParams.entries()));
    res.setHeader('cache-control', 'public, s-maxage=43200, stale-while-revalidate=86400');
    res.statusCode = 200;
    res.end(JSON.stringify(out));
  } catch (e) {
    res.statusCode = e instanceof AnswerError ? e.status : 500;
    res.end(JSON.stringify({ error: e.message, checked_at: new Date().toISOString() }));
  }
}

export { answer, normaliseDomain, pickEmployees, siteVariants, deps, AnswerError, cache };
