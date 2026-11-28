// Delivery check: an independent evaluator for agent commerce jobs (Telegraph commercial use case #8).
// Intent it answers: TASK_EXECUTION_QUALITY_GENERAL ("here is the task and the agent's output: how well
// was it executed?"). Answers `verdict`, `reason`, `score`, plus an ACP-style action.
//
// The job checked here: a company due diligence report bought from an agent. Every claim in the report
// is compared with the company's record in GLEIF, the free public LEI register. The company is looked
// up from the TASK (the buyer's order), never from the report, so a wrong report cannot choose the
// record it is checked against.
//
// Verdicts:
//   accept             every required field is present and every checkable claim matches the register
//   reject_incorrect   at least one claim contradicts the register (field, claim and register value shown)
//   reject_incomplete  nothing contradicts the register, but required fields are missing
//   hold_unchecked     the register fields all match, but the report also states facts the register cannot confirm
//                      (a CEO, revenue, employees, owners...). Payment is held, not released.
// ACP mapping: accept -> complete (pay the provider); either reject -> reject (refund the buyer);
// hold_unchecked -> hold (do not pay until the unchecked claims are confirmed another way).
// This is the evaluator decision in Virtuals' Agent Commerce Protocol (ERC-8183): one evaluator
// alone completes or rejects a submitted job. This code runs as a sandbox evaluator; it is not
// registered as an evaluator address on Virtuals.
//
// Fields the register cannot confirm (revenue, CEO, employees, tax ID...) are listed as `not_checked`,
// never counted as right or wrong. But a report that states such a fact cannot be paid as if it were
// verified: the job is held (hold_unchecked) instead of accepted.

const UA = { 'user-agent': 'telegraph-evaluator/1.0 (+https://github.com/investor567768/telegraph-evaluator)', accept: 'application/vnd.api+json, application/json' };
const GLEIF_LEI = lei => `https://api.gleif.org/api/v1/lei-records/${lei}`;
const GLEIF_NAME = name => `https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=${encodeURIComponent(name)}&page[size]=10`;

class AnswerError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

// Swappable for tests.
const deps = { fetch: (...a) => fetch(...a) };

export const FIELDS = ['legal_name', 'lei', 'registration_number', 'jurisdiction', 'entity_status', 'registered_address', 'headquarters_address'];
const DEFAULT_REQUIRED = ['legal_name', 'lei', 'registration_number', 'jurisdiction', 'entity_status', 'registered_address'];

// Words a buyer or an agent may use for each field.
const ALIASES = {
  legal_name: ['legal name', 'legal entity name', 'registered name', 'company name', 'entity name', 'name'],
  lei: ['lei', 'legal entity identifier', 'lei code'],
  registration_number: ['registration number', 'registration no', 'registration id', 'company number', 'commercial register number', 'register number', 'registered as', 'reg no', 'registration'],
  jurisdiction: ['jurisdiction', 'country of incorporation', 'incorporated in', 'country'],
  entity_status: ['entity status', 'status', 'company status', 'legal status'],
  registered_address: ['registered address', 'legal address', 'registered office', 'address'],
  headquarters_address: ['headquarters address', 'headquarters', 'hq address', 'hq', 'head office'],
};
// Report keys that state a fact about the company which the register cannot confirm.
const FACT_KEY = /\b(ceo|chief|executive|founder|owner|owners|ownership|director|directors|board|shareholder|shareholders|subsidiar\w*|revenue|turnover|profit|income|employee|employees|headcount|staff|tax|vat|ein|duns|valuation|market cap|funding|rating)\b/i;
const ALIAS_LIST = Object.entries(ALIASES).flatMap(([f, ws]) => ws.map(w => [w, f])).sort((a, b) => b[0].length - a[0].length);

const COUNTRIES = { germany: 'DE', deutschland: 'DE', 'united kingdom': 'GB', uk: 'GB', 'great britain': 'GB', england: 'GB', 'united states': 'US', usa: 'US', 'united states of america': 'US', france: 'FR', sweden: 'SE', netherlands: 'NL', 'the netherlands': 'NL', japan: 'JP', china: 'CN', nigeria: 'NG', switzerland: 'CH', italy: 'IT', spain: 'ES', ireland: 'IE', india: 'IN', canada: 'CA', denmark: 'DK', norway: 'NO', finland: 'FI', austria: 'AT', belgium: 'BE', luxembourg: 'LU', singapore: 'SG', 'hong kong': 'HK', 'south korea': 'KR', korea: 'KR', taiwan: 'TW', australia: 'AU', brazil: 'BR' };

// Legal-form words that mean the same thing.
const FORMS = [[/\baktiengesellschaft\b/g, 'ag'], [/\bgesellschaft mit beschr(?:a|ae|ä)nkter haftung\b/g, 'gmbh'], [/\blimited\b/g, 'ltd'], [/\bincorporated\b/g, 'inc'], [/\bcorporation\b/g, 'corp'], [/\bpublic limited company\b/g, 'plc'], [/\baktiebolag\b/g, 'ab'], [/\bsocietas europaea\b/g, 'se'], [/\bcompany\b/g, 'co']];

const fold = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').toLowerCase();
export function normName(s) {
  let t = fold(s).replace(/[.,'"()&]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [re, to] of FORMS) t = t.replace(re, to);
  return t.replace(/\s+/g, ' ').trim();
}
const normId = s => fold(s).replace(/[^a-z0-9]/g, '');
export function normCountry(s) {
  const t = fold(s).replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^[a-z]{2}$/.test(t)) return t.toUpperCase();
  if (COUNTRIES[t]) return COUNTRIES[t];
  const hit = Object.keys(COUNTRIES).sort((a, b) => b.length - a.length).find(k => new RegExp(`\\b${k}\\b`).test(t));
  return hit ? COUNTRIES[hit] : null;
}
const normStreet = s => fold(s).replace(/strasse\b/g, 'str').replace(/str\./g, 'str').replace(/[^a-z0-9]/g, '');

// --- Reading the report -------------------------------------------------------------------------
// A report may be a JSON object or text with "Field: value" lines.
function fieldFor(key) {
  const k = fold(key).replace(/[_-]/g, ' ').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  if (FIELDS.includes(k.replace(/ /g, '_'))) return k.replace(/ /g, '_');
  const exact = ALIAS_LIST.find(([w]) => w === k);
  return exact ? exact[1] : null;
}

export function readReport(result) {
  if (result == null || result === '') throw new AnswerError(400, 'result is required: the report the agent delivered (a JSON object or text with "Field: value" lines).');
  let obj = result;
  if (typeof result === 'string') {
    const t = result.trim();
    if (t.startsWith('{')) { try { obj = JSON.parse(t); } catch { obj = t; } } else obj = t;
  }
  const claims = {}, extra = {};
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (v == null || v === '') continue;
      const val = typeof v === 'object' ? Object.values(v).filter(Boolean).join(', ') : String(v);
      const f = fieldFor(k);
      if (f && !claims[f]) claims[f] = val.trim(); else if (!f) extra[k] = val.trim();
    }
  } else {
    for (const line of obj.split(/\r?\n|;\s+(?=[A-Za-z ]{2,40}:)/)) {
      const m = line.match(/^\s*[-*•]?\s*([A-Za-z][A-Za-z _/()-]{1,40}?)\s*[:=]\s*(.+?)\s*$/);
      if (!m) continue;
      const f = fieldFor(m[1]);
      if (!f && /\b(report|title|subject|re)\b/i.test(m[1])) continue; // a heading, not a claim
      if (f && !claims[f]) claims[f] = m[2]; else if (!f) extra[m[1].trim()] = m[2];
    }
  }
  return { claims, extra };
}

// --- Reading the order --------------------------------------------------------------------------
export function readTask(task) {
  if (task == null || task === '') throw new AnswerError(400, 'task is required: the order the buyer placed, for example {"company":"Siemens Aktiengesellschaft","required":["legal_name","lei","registration_number"]} or text naming the company and the fields wanted.');
  let t = task;
  if (typeof t === 'string' && t.trim().startsWith('{')) { try { t = JSON.parse(t); } catch { /* text */ } }
  if (typeof t === 'object') {
    const company = t.company || t.company_name || t.legal_name || t.entity || null;
    const lei = t.lei ? String(t.lei).toUpperCase().trim() : null;
    const req = Array.isArray(t.required) ? t.required.map(fieldFor).filter(Boolean) : DEFAULT_REQUIRED;
    if (!company && !lei) throw new AnswerError(400, 'task must name the company (company) or its LEI (lei).');
    return { company, lei, required: [...new Set(req)] };
  }
  const text = String(t);
  const lei = (text.match(/\b[A-Z0-9]{18}[0-9]{2}\b/) || [])[0] || null;
  let company = (text.match(/(?:due diligence|report|check|verify|on|for)\s+(?:on|for)?\s*["“]?([A-Z][\w&.,'\- ]{2,80}?)["”]?\s*(?::|—|-|\(|,\s*(?:legal|lei|registration|jurisdiction|status|address)|$)/i) || [])[1] || null;
  if (company) company = company.trim();
  const wanted = [];
  const low = fold(text);
  for (const [w, f] of ALIAS_LIST) if (new RegExp(`\\b${w}\\b`).test(low) && !wanted.includes(f)) wanted.push(f);
  if (!company && !lei) throw new AnswerError(400, 'could not tell which company the order is about; pass task as JSON with "company" or "lei".');
  return { company, lei, required: wanted.length ? FIELDS.filter(f => wanted.includes(f)) : DEFAULT_REQUIRED };
}

// --- The register ---------------------------------------------------------------------------------
async function getJson(url) {
  let r;
  try { r = await deps.fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) }); }
  catch (e) { throw new AnswerError(502, `GLEIF could not be reached (${e.name === 'TimeoutError' ? 'no answer within 20 s' : e.message}). Try again shortly.`); }
  if (r.status === 404) return null;
  if (!r.ok) throw new AnswerError(502, `GLEIF answered HTTP ${r.status}. Try again shortly.`);
  return r.json();
}

function fromGleif(rec) {
  const a = rec.attributes || {}, e = a.entity || {};
  const addr = x => x ? { lines: x.addressLines || [], city: x.city || null, postal_code: x.postalCode || null, country: x.country || null } : null;
  return {
    lei: a.lei || rec.id, legal_name: e.legalName && e.legalName.name, registration_number: e.registeredAs || null,
    jurisdiction: e.jurisdiction || null, entity_status: e.status || null,
    registered_address: addr(e.legalAddress), headquarters_address: addr(e.headquartersAddress),
  };
}

async function findCompany({ company, lei }) {
  if (lei) {
    const j = await getJson(GLEIF_LEI(lei));
    if (!j || !j.data) return { record: null, note: `The order's LEI ${lei} is not in GLEIF.`, source: GLEIF_LEI(lei) };
    return { record: fromGleif(j.data), source: GLEIF_LEI(lei) };
  }
  const j = await getJson(GLEIF_NAME(company));
  const hits = ((j && j.data) || []).filter(d => normName(d.attributes.entity.legalName.name) === normName(company));
  const active = hits.filter(d => d.attributes.entity.status === 'ACTIVE');
  const pick = active.length === 1 ? active : hits;
  if (pick.length === 1) return { record: fromGleif(pick[0]), source: GLEIF_NAME(company) };
  return { record: null, source: GLEIF_NAME(company),
    note: pick.length ? `${pick.length} GLEIF entities share the legal name "${company}", so the order is ambiguous. Give the LEI in the order.` : `No GLEIF entity has the exact legal name "${company}". Give the full legal name or the LEI in the order.` };
}

// --- Comparing one claim ------------------------------------------------------------------------
const fmtAddr = a => a ? [...a.lines, a.postal_code, a.city, a.country].filter(Boolean).join(', ') : null;

function compare(field, claim, reg) {
  const truth = reg[field];
  if (truth == null || (typeof truth === 'object' && !fmtAddr(truth))) return { result: 'not_checked', register: null, why: 'GLEIF holds no value for this field.' };
  switch (field) {
    case 'legal_name':
      return normName(claim) === normName(truth) ? { result: 'match', register: truth } : { result: 'mismatch', register: truth, why: 'The legal name differs from the register.' };
    case 'lei':
      return normId(claim) === normId(truth) ? { result: 'match', register: truth } : { result: 'mismatch', register: truth, why: 'This LEI belongs to a different entity, or does not exist.' };
    case 'registration_number': {
      // "HRB 6684 (Amtsgericht München)" matches HRB 6684; "HRB 66840" does not.
      const pat = new RegExp('(?<![a-z0-9])' + normId(truth).split('').join('[^a-z0-9]*') + '(?![0-9])');
      if (normId(claim) === normId(truth) || pat.test(fold(claim))) return { result: 'match', register: truth };
      if (normId(claim) === normId(reg.lei)) return { result: 'mismatch', register: truth, why: 'The report gives the LEI as the registration number. They are different identifiers.' };
      return { result: 'mismatch', register: truth, why: 'The registration number differs from the register.' };
    }
    case 'jurisdiction': {
      const c = normCountry(claim);
      const t = String(truth).split('-')[0].toUpperCase();
      if (!c) return { result: 'unreadable', register: truth, why: 'The jurisdiction in the report could not be read as a country.' };
      return c === t ? { result: 'match', register: truth } : { result: 'mismatch', register: truth, why: 'The jurisdiction differs from the register.' };
    }
    case 'entity_status': {
      const c = fold(claim);
      const active = /\bactive\b/.test(c) && !/\binactive\b/.test(c);
      const inactive = /\b(inactive|dissolved|liquidat|struck off|closed|ceased)\w*/.test(c);
      if (!active && !inactive) return { result: 'unreadable', register: truth, why: 'The status in the report is not active or inactive.' };
      return (active ? 'ACTIVE' : 'INACTIVE') === truth ? { result: 'match', register: truth } : { result: 'mismatch', register: truth, why: 'The status differs from the register.' };
    }
    case 'registered_address':
    case 'headquarters_address': {
      const c = fold(claim).replace(/[^a-z0-9 ]/g, ' ');
      const pc = truth.postal_code ? normId(truth.postal_code) : null;
      const city = truth.city ? fold(truth.city).replace(/[^a-z ]/g, ' ').trim() : null;
      const cityAlt = { munchen: 'munich', koln: 'cologne', wien: 'vienna', zurich: 'zurich', milano: 'milan', roma: 'rome', praha: 'prague', 'den haag': 'the hague', lisboa: 'lisbon', warszawa: 'warsaw', kobenhavn: 'copenhagen', goteborg: 'gothenburg' }[city];
      const pcOk = !pc || normId(claim).includes(pc);
      const cityOk = !city || c.includes(city) || (cityAlt && c.includes(cityAlt));
      const street = truth.lines[0] ? normStreet(truth.lines[0]).replace(/\d+.*$/, '') : null;
      const streetOk = !street || normStreet(claim).includes(street.slice(0, Math.max(6, street.length - 2)));
      if (pcOk && cityOk && streetOk) return { result: 'match', register: fmtAddr(truth) };
      const off = [!streetOk && 'street', !pcOk && 'postal code', !cityOk && 'city'].filter(Boolean);
      return { result: 'mismatch', register: fmtAddr(truth), why: `The ${off.join(' and ')} differ${off.length > 1 ? '' : 's'} from the register.` };
    }
  }
  return { result: 'not_checked', register: null };
}

// --- The verdict ----------------------------------------------------------------------------------
async function answer(params) {
  const order = readTask(params.task);
  const { claims, extra } = readReport(params.result);
  const checked_at = new Date().toISOString();
  const found = await findCompany(order);

  if (!found.record) {
    return { verdict: 'not_assessed', score: null, reason: `${found.note} No verdict is given, because the report cannot be checked against the right company.`,
      acp: { action: 'hold', reason: 'The evaluator could not identify the company in the order.' },
      intent: 'TASK_EXECUTION_QUALITY_GENERAL', order, checks: [], checked_at, sources: { register: found.source } };
  }
  const reg = found.record;
  const checks = [];
  for (const f of FIELDS) {
    const required = order.required.includes(f);
    if (claims[f] == null) { if (required) checks.push({ field: f, required, claimed: null, register: f.endsWith('address') ? fmtAddr(reg[f]) : reg[f], result: 'missing' }); continue; }
    checks.push({ field: f, required, claimed: claims[f], ...compare(f, claims[f], reg) });
  }
  const wrong = checks.filter(c => c.result === 'mismatch');
  const missing = checks.filter(c => c.result === 'missing');
  const unreadable = checks.filter(c => c.result === 'unreadable' && c.required);
  const reqChecks = checks.filter(c => c.required);
  const matched = reqChecks.filter(c => c.result === 'match').length;
  const score = reqChecks.length ? Math.round((wrong.length ? 0 : matched / reqChecks.length) * 100) / 100 : null;
  const list = cs => cs.map(c => c.field.replace(/_/g, ' ')).join(', ');

  let verdict, reason;
  if (wrong.length) {
    verdict = 'reject_incorrect';
    reason = `${wrong.length} claim${wrong.length > 1 ? 's contradict' : ' contradicts'} the GLEIF register: ` + wrong.map(c => `${c.field.replace(/_/g, ' ')} says "${c.claimed}" but the register says "${c.register}"${c.why ? ` (${c.why})` : ''}`).join('; ') + '.';
  } else if (missing.length || unreadable.length) {
    verdict = 'reject_incomplete';
    reason = `Nothing in the report contradicts the register, but the order asked for ${list([...missing, ...unreadable])} and the report ${missing.length && unreadable.length ? 'leaves some out and gives others in a form that cannot be checked' : missing.length ? 'does not give ' + (missing.length > 1 ? 'them' : 'it') : 'gives ' + (unreadable.length > 1 ? 'them' : 'it') + ' in a form that cannot be checked'}.`;
  } else {
    verdict = 'accept';
    reason = `All ${matched} required fields are present and match the GLEIF register for ${reg.legal_name} (LEI ${reg.lei}).`;
  }
  const unchecked = Object.keys(extra);
  const unverified = unchecked.filter(k => FACT_KEY.test(k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ')));
  if (verdict === 'accept' && unverified.length) {
    verdict = 'hold_unchecked';
    reason = `All ${matched} required fields are present and match the GLEIF register for ${reg.legal_name} (LEI ${reg.lei}), but the report also states ${unverified.join(', ')}, which the register cannot confirm. Payment is held until those claims are confirmed another way.`;
  } else if (unchecked.length) reason += ` Not checked, because the register does not hold them: ${unchecked.join(', ')}.`;

  return {
    verdict, score, reason,
    acp: verdict === 'accept' ? { action: 'complete', reason: 'Deliverable meets the order; release payment to the provider.' }
      : verdict === 'hold_unchecked' ? { action: 'hold', reason: `The report states facts this evaluator cannot check (${unverified.join(', ')}). Confirm them before releasing payment.` }
      : { action: 'reject', reason: verdict === 'reject_incorrect' ? 'Deliverable contains claims the public register contradicts; refund the buyer.' : 'Deliverable is missing required parts of the order; refund the buyer or ask for a corrected delivery.' },
    intent: 'TASK_EXECUTION_QUALITY_GENERAL',
    company: { legal_name: reg.legal_name, lei: reg.lei },
    order, checks, not_checked: unchecked, checked_at,
    sources: { register: GLEIF_LEI(reg.lei) },
    method: 'The company is identified from the order, never from the report. Each claim is compared with its GLEIF record field by field. Any contradiction rejects the job as incorrect; otherwise any missing required field rejects it as incomplete; otherwise it is accepted. Claims GLEIF cannot confirm are listed as not checked, and a report that states facts of that kind (for example a CEO or revenue) is held rather than paid.',
    mode: 'sandbox evaluator: same complete/reject decision as an ACP evaluator, not registered on Virtuals',
  };
}

// --- Built-in demo: one order, three reports (try ?sample=correct, ?sample=incorrect, ?sample=incomplete) ---
export const SAMPLE_ORDER = {"company": "Siemens Aktiengesellschaft", "required": ["legal_name", "lei", "registration_number", "jurisdiction", "entity_status", "registered_address"]};
export const SAMPLES = {
  "correct": "Due diligence report: Siemens AG\nLegal name: Siemens Aktiengesellschaft\nLEI: W38RGI023J3WT1HWRP32\nRegistration number: HRB 6684 (Amtsgericht München)\nJurisdiction: Germany\nStatus: Active\nRegistered address: Werner-von-Siemens-Straße 1, 80333 Munich, Germany\n",
  "incorrect": "Due diligence report: Siemens AG\nLegal name: Siemens AG\nLEI: W38RGI023J3WT1HWRP32\nRegistration number: W38RGI023J3WT1HWRP32\nJurisdiction: Germany\nStatus: Active\nRegistered address: Nonnendammallee 101, 13629 Berlin, Germany\n",
  "unchecked": "Due diligence report: Siemens AG\nLegal name: Siemens Aktiengesellschaft\nLEI: W38RGI023J3WT1HWRP32\nRegistration number: HRB 6684 (Amtsgericht München)\nJurisdiction: Germany\nStatus: Active\nRegistered address: Werner-von-Siemens-Straße 1, 80333 Munich, Germany\nCEO: Jane Doe\n",
  "incomplete": "Due diligence report: Siemens AG\nLegal name: Siemens Aktiengesellschaft\nLEI: W38RGI023J3WT1HWRP32\nJurisdiction: DE\nSummary: Large German industrial group, listed in Frankfurt.\n"
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  let params = { ...(req.query || {}) };
  if (req.method === 'POST') {
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
    params = { ...params, ...(b || {}) };
  }
  try {
    if (params.sample) {
      if (!SAMPLES[params.sample]) throw new AnswerError(400, 'sample must be correct, incorrect, incomplete or unchecked.');
      params = { task: SAMPLE_ORDER, result: SAMPLES[params.sample] };
    }
    const out = await answer(params);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(out);
  } catch (e) {
    const status = e instanceof AnswerError ? e.status : 500;
    return res.status(status).json({ error: e instanceof AnswerError ? e.message : 'Unexpected error: ' + e.message });
  }
}

export { answer, deps, AnswerError };
