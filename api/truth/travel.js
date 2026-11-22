// Truth source for Telegraph evaluators: is there operational disruption at a US airport right now?
// Intent: TRAVEL_DISRUPTION_GENERAL (asks route_or_flight; answers route_or_flight, disrupted,
// status, delay_minutes, reason).
//
// Source (no API key): the US Federal Aviation Administration's live National Airspace System status,
//   https://nasstatus.faa.gov/api/airport-status-information  (XML, refreshed every few minutes)
// It lists ground stops, ground delay programs, general arrival/departure delays and airport closures.
// Scope, stated in every answer: US airports, airport-level disruption (not individual flight numbers).

import { US_AIRPORTS } from './us-airports.js';
const FAA = 'https://nasstatus.faa.gov/api/airport-status-information';
const UA = { 'user-agent': 'telegraph-evaluator/1.0 (+https://github.com/investor567768/telegraph-evaluator)' };
const TTL = 2 * 60 * 1000;
let cached = null;

class AnswerError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? m[1].trim() : null; };
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// "1 hour and 2 minutes", "45 minutes", "2 hours" -> minutes
function minutes(text) {
  const t = String(text || '').toLowerCase();
  const h = t.match(/(\d+)\s*hour/); const m = t.match(/(\d+)\s*minute/);
  if (!h && !m) return null;
  return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0);
}

// A closure like "SNA AD AP CLSD DLY 0730-1415" only applies inside its daily UTC window.
function closureActive(reason, now) {
  const r = String(reason || '').toUpperCase();
  if (/CLSD TO /.test(r)) return false; // closed only to a class of traffic (e.g. transient GA), not to airline flights
  const d = r.match(/DLY (\d{4})-(\d{4})/);
  if (!d) return true;
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  const a = +d[1].slice(0, 2) * 60 + +d[1].slice(2), b = +d[2].slice(0, 2) * 60 + +d[2].slice(2);
  return a <= b ? mins >= a && mins < b : mins >= a || mins < b;
}

// Turn the FAA XML into one list of events per airport.
function parseFaa(xml) {
  const updated = tag(xml, 'Update_Time');
  const events = [];
  for (const block of xml.split(/<Delay_type>/).slice(1)) {
    const name = clean(tag(block, 'Name'));
    const kind = /ground stop/i.test(name) ? 'ground stop'
      : /ground delay/i.test(name) ? 'ground delay program'
      : /arrival|departure/i.test(name) ? 'arrival/departure delays'
      : /closure/i.test(name) ? 'closure'
      : /airspace flow/i.test(name) ? null : null;
    if (!kind) continue;
    const items = block.match(/<(Airport|Ground_Delay|Program|Delay)>[\s\S]*?<\/\1>/g) || [];
    for (const it of items) {
      const arpt = clean(tag(it, 'ARPT')).toUpperCase();
      if (!arpt) continue;
      const reason = clean(tag(it, 'Reason'));
      let delay = null;
      if (kind === 'ground delay program') delay = minutes(tag(it, 'Max')) ?? minutes(tag(it, 'Avg'));
      if (kind === 'arrival/departure delays') delay = Math.max(...[...it.matchAll(/<Max>([\s\S]*?)<\/Max>/g)].map(x => minutes(x[1]) ?? 0), 0) || null;
      const until = clean(tag(it, 'End_Time') || tag(it, 'Reopen')) || null;
      events.push({ arpt, kind, reason, delay, until });
    }
  }
  return { updated, events };
}

async function feed() {
  if (cached && Date.now() - cached.at < TTL) return cached.value;
  let r;
  try { r = await fetch(FAA, { headers: UA }); }
  catch (e) { throw new AnswerError(502, 'The FAA status feed could not be reached. Try again shortly.'); }
  if (!r.ok) throw new AnswerError(502, `The FAA status feed answered HTTP ${r.status}.`);
  const xml = await r.text();
  if (!/AIRPORT_STATUS_INFORMATION/.test(xml)) throw new AnswerError(502, 'The FAA status feed returned something unexpected.');
  const value = parseFaa(xml);
  cached = { at: Date.now(), value };
  return value;
}

// Pull airport codes out of "Is DL404 delayed at ATL?", "JFK-LAX", "KATL", "ATL ground stop?"
const NOT_AIRPORTS = new Set(['FAA', 'THE', 'AND', 'ARE', 'ANY', 'NOW', 'FOR', 'USA', 'UTC', 'GMT', 'EST', 'PST', 'DAY', 'HAS', 'WAS', 'NOT', 'ITS', 'OUT', 'GDP', 'ETA', 'ETD']);
function airportsIn(raw) {
  const s = String(raw || '').toUpperCase();
  const codes = [];
  for (const m of s.matchAll(/\b(K?)([A-Z]{3})\b/g)) {
    const code = m[1] && m[0].length === 4 ? m[2] : m[0].length === 3 ? m[0] : null;
    if (code && !NOT_AIRPORTS.has(code) && !codes.includes(code)) codes.push(code);
  }
  return codes;
}

async function answer(params, now = new Date()) {
  const raw = String(params.route_or_flight || params.airport || params.route || '').trim();
  if (!raw) throw new AnswerError(400, 'route_or_flight is required and must name a US airport, for example "ATL", "JFK-LAX" or "DL404 at ATL".');
  const requested = airportsIn(raw);
  if (!requested.length) throw new AnswerError(400, `No airport code found in "${raw}". This source reports FAA airport-level disruption, so name the airport, for example "DL404 at ATL".`);
  // Only airports the FAA feed can speak for. The feed lists airports that HAVE a problem, so for an
  // unknown or non-US code, "nothing listed" would wrongly read as "no disruption".
  const codes = requested.filter(c => US_AIRPORTS.has(c));
  const ignored = requested.filter(c => !US_AIRPORTS.has(c));
  if (!codes.length) throw new AnswerError(400, `${ignored.join(', ')} is not a US airport this source covers. It reports FAA airport-level disruption at US airports only (including territories), so it cannot say anything about it.`);

  const { updated, events } = await feed();
  const hits = events.filter(e => codes.includes(e.arpt) && (e.kind !== 'closure' || closureActive(e.reason, now)));
  const order = ['ground stop', 'closure', 'ground delay program', 'arrival/departure delays'];
  hits.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  const delays = hits.map(h => h.delay).filter(x => x != null);

  return {
    route_or_flight: raw,
    airports_checked: codes,
    ...(ignored.length ? { ignored_codes: ignored } : {}),
    disrupted: hits.length > 0,
    status: hits.length ? hits.map(h => `${h.arpt}: ${h.kind}${h.until ? ` until ${h.until}` : ''}`).join('; ') : `no FAA-reported disruption at ${codes.join(', ')}`,
    delay_minutes: delays.length ? Math.max(...delays) : (hits.length ? null : 0),
    reason: hits.length ? hits.map(h => `${h.arpt}: ${h.reason || h.kind}`).join('; ') : 'none reported',
    faa_updated: updated,
    scope: 'US airports, airport-level disruption from the FAA; individual flight numbers are not tracked',
    source_url: FAA,
    checked_at: now.toISOString(),
  };
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('access-control-allow-origin', '*');
  try {
    const out = await answer(Object.fromEntries(url.searchParams.entries()));
    res.setHeader('cache-control', 'public, s-maxage=60');
    res.statusCode = 200;
    res.end(JSON.stringify(out));
  } catch (e) {
    res.statusCode = e instanceof AnswerError ? e.status : 500;
    res.end(JSON.stringify({ error: e.message, checked_at: new Date().toISOString() }));
  }
}

export { answer, parseFaa, airportsIn, minutes, closureActive, AnswerError };
export const _reset = () => { cached = null; };
