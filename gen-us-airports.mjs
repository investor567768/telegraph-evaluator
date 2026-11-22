// Builds api/truth/us-airports.js from the public OurAirports file (public domain).
// Download once:  https://davidmegginson.github.io/ourairports-data/airports.csv
// Run from the repo root:  node gen-us-airports.mjs airports.csv
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2] || 'airports.csv';
const text = readFileSync(src, 'utf8');

// Small CSV reader that understands quoted fields with commas and doubled quotes.
function parse(t) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

const rows = parse(text);
const h = rows[0];
const col = n => { const i = h.indexOf(n); if (i < 0) throw new Error('column missing: ' + n); return i; };
const [iType, iCountry, iIata, iLocal] = ['type', 'iso_country', 'iata_code', 'local_code'].map(col);
const OK_COUNTRY = new Set(['US', 'PR', 'VI', 'GU', 'MP', 'AS']);
const codes = new Set();
for (const r of rows.slice(1)) {
  if (!r[iCountry] || !OK_COUNTRY.has(r[iCountry]) || r[iType] === 'closed') continue;
  for (const v of [r[iIata], r[iLocal]]) if (/^[A-Z]{3}$/.test(v || '')) codes.add(v);
}
const list = [...codes].sort();
const out = `// US airport codes (3 letters) the FAA status feed can speak for, including territories.
// Generated ${new Date().toISOString().slice(0, 10)} from OurAirports (public domain), ${list.length} codes, by gen-us-airports.mjs.
// Why it exists: the FAA feed lists only airports that HAVE a problem, so an unknown or non-US code
// would look like "no disruption". The checker refuses codes that are not in this list.
export const US_AIRPORTS = new Set(${JSON.stringify(list)});
`;
writeFileSync(new URL('./api/truth/us-airports.js', import.meta.url), out);
console.log(`Wrote api/truth/us-airports.js with ${list.length} codes.`);
for (const must of ['ATL', 'JFK', 'LAX', 'ORD', 'SFO', 'EWR', 'SJU']) if (!codes.has(must)) console.log('WARNING: missing ' + must);
for (const must of ['LOS', 'ZZZ', 'LHR']) if (codes.has(must)) console.log('WARNING: should not be in the list: ' + must);
