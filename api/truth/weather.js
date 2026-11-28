// Truth source for Telegraph evaluators: what the weather actually was on a past day.
// Intent: WEATHER_FORECAST_VERIFY_GENERAL (asks location, date; answers location, date,
// temp_max_c, temp_min_c, precipitation_mm, condition).
//
// Sources (Open-Meteo, no API key; named by Telegraph as a reference for this Intent):
//   Place lookup:  https://geocoding-api.open-meteo.com/v1/search?name=...
//   Last ~3 months: https://api.open-meteo.com/v1/forecast?...&start_date=&end_date=   (best-match analysis)
//   Older days:     https://archive-api.open-meteo.com/v1/archive?...                  (ERA5 reanalysis)
// The day runs midnight to midnight in the place's own time zone (timezone=auto).
// Every answer says which place was matched, its coordinates and which data set was used.

const GEO = q => `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=en&format=json`;
const DAILY = 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code';
const RECENT = (lat, lon, d) => `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${d}&end_date=${d}&daily=${DAILY}&timezone=auto`;
const ARCHIVE = (lat, lon, d) => `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${d}&end_date=${d}&daily=${DAILY}&timezone=auto`;
const UA = { 'user-agent': 'telegraph-provider/1.0 (+https://github.com/investor567768)' };
const RECENT_DAYS = 85;
const cache = new Map();

class AnswerError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

// WMO weather codes (the daily code is the most significant weather of the day)
function condition(code) {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly cloudy';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain showers';
  if (code === 85 || code === 86) return 'snow showers';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return null;
}

async function getJson(url, who) {
  let r;
  try { r = await fetch(url, { headers: UA }); }
  catch (e) { throw new AnswerError(502, `${who} could not be reached. Try again shortly.`); }
  if (r.status === 429) throw new AnswerError(503, `${who} is limiting requests. Try again shortly.`);
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new AnswerError(r.status === 400 ? 400 : 502, `${who} refused the request${body && body.reason ? ': ' + body.reason : ` (HTTP ${r.status})`}.`);
  return body;
}

// Today's date at a place, as YYYY-MM-DD, or null when the time zone is unknown.
function localDay(now, tz) {
  if (!tz) return null;
  try {
    const s = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
  } catch { return null; }
}

function checkFormat(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) throw new AnswerError(400, 'date is required as YYYY-MM-DD, for example 2026-11-19.');
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (isNaN(d) || d.toISOString().slice(0, 10) !== `${m[1]}-${m[2]}-${m[3]}`) throw new AnswerError(400, `"${s}" is not a real date.`);
  if (d < new Date(Date.UTC(1940, 0, 1))) throw new AnswerError(404, 'Records start in 1940.');
  return { m, d };
}

// A day is finished only when it has ended where the place is, not in UTC. Without a time zone the
// check falls back to the UTC date.
function parseDate(raw, now = new Date(), tz = null) {
  const { m, d } = checkFormat(raw);
  const local = localDay(now, tz);
  const todayIso = local || now.toISOString().slice(0, 10);
  const today = new Date(`${todayIso}T00:00:00Z`);
  if (d >= today) throw new AnswerError(400, local
    ? `${m[0]} has not finished yet in ${tz} (the local date there is ${local}). This source answers what was observed on a past day.`
    : `${m[0]} has not finished yet. This source answers what was observed on a past day.`);
  return { iso: m[0], ageDays: Math.round((today - d) / 86400000), local_today: todayIso, timezone: local ? tz : 'UTC' };
}

const placeLabel = p => [p.name, p.admin1 !== p.name ? p.admin1 : null, p.country].filter(Boolean).join(', ');

async function resolvePlace(raw) {
  const text = String(raw || '').trim();
  if (!text) throw new AnswerError(400, 'location is required, for example "Lisbon" or "Lagos, Nigeria".');
  const [name, ...rest] = text.split(',').map(x => x.trim()).filter(Boolean);
  const hint = rest.join(' ').toLowerCase();
  const res = (await getJson(GEO(name), 'Open-Meteo place search')) || {};
  let list = res.results || [];
  if (hint) {
    const narrowed = list.filter(p => [p.country, p.country_code, p.admin1, p.admin2].some(v => v && (hint.includes(String(v).toLowerCase()) || String(v).toLowerCase().includes(hint))));
    if (narrowed.length) list = narrowed;
  }
  if (!list.length) throw new AnswerError(404, `Could not find a place called "${text}". Add the country, for example "${name}, Portugal".`);
  // Different places that share the name (different country or region). Never pick one silently.
  const seen = new Set(), distinct = [];
  for (const p of list) { const k = `${p.country_code}|${p.admin1}`; if (!seen.has(k)) { seen.add(k); distinct.push(p); } }
  return { place: list[0], ambiguous: distinct.length > 1,
    others: distinct.slice(1, 6).map(p => ({ location: placeLabel(p), latitude: p.latitude, longitude: p.longitude })) };
}

async function answer(params, now = new Date()) {
  const { m } = checkFormat(params.date);
  const horizon = new Date(now.getTime() + 14 * 3600e3).toISOString().slice(0, 10); // the furthest-ahead clock on earth
  if (m[0] >= horizon) throw new AnswerError(400, `${m[0]} has not finished yet anywhere. This source answers what was observed on a past day.`);
  const { place, ambiguous, others } = await resolvePlace(params.location || params.place || params.city);
  const { iso, ageDays } = parseDate(params.date, now, place.timezone);
  const place_match = ambiguous
    ? { ambiguous: true, used: placeLabel(place), other_places: others,
        note: 'More than one place has this name. The first match from the place search was used. Add the country or region to choose, for example "Paris, France".' }
    : { ambiguous: false };
  const key = `${place.latitude},${place.longitude},${iso}`;
  if (cache.has(key)) return { ...cache.get(key), place_match };

  const archive = ageDays > RECENT_DAYS;
  const url = (archive ? ARCHIVE : RECENT)(place.latitude, place.longitude, iso);
  const w = await getJson(url, archive ? 'Open-Meteo archive' : 'Open-Meteo');
  const d = w && w.daily;
  const at = i => (d && Array.isArray(d[i]) ? d[i][0] : null);
  const tmax = at('temperature_2m_max'), tmin = at('temperature_2m_min'), rain = at('precipitation_sum'), code = at('weather_code');
  if (tmax === null || tmax === undefined) throw new AnswerError(404, `No observed values yet for ${iso}${archive ? ' (the archive runs about 5 days behind)' : ''}.`);

  const value = {
    location: placeLabel(place),
    latitude: place.latitude,
    longitude: place.longitude,
    date: iso,
    temp_max_c: tmax,
    temp_min_c: tmin,
    precipitation_mm: rain,
    condition: condition(code),
    weather_code: code,
    timezone: w.timezone || null,
    data_source: archive ? 'Open-Meteo archive (ERA5 reanalysis)' : 'Open-Meteo (best-match analysis of national weather services)',
    source_url: url,
    checked_at: new Date().toISOString(),
  };
  cache.set(key, value);
  return { ...value, place_match };
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('access-control-allow-origin', '*');
  try {
    const out = await answer(Object.fromEntries(url.searchParams.entries()));
    res.setHeader('cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.statusCode = 200;
    res.end(JSON.stringify(out));
  } catch (e) {
    res.statusCode = e instanceof AnswerError ? e.status : 500;
    res.end(JSON.stringify({ error: e.message, checked_at: new Date().toISOString() }));
  }
}

export { answer, parseDate, resolvePlace, condition, AnswerError, cache };
