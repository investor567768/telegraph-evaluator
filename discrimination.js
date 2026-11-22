// Discrimination test for the live truth-source checkers.
// Question it answers: can each checker, used as the reference, tell a RIGHT answer from a WRONG one
// and from an INCOMPLETE one, and does it refuse to guess when it has no answer?
//
// Run:  node discrimination.js            (needs Node 18+, no install, no key)
//       node discrimination.js https://telegraph-evaluator.vercel.app
// Writes EVIDENCE-discrimination.md next to this file.
//
// Honest scope: the "submitted" answers are written by us (right, off by a little, off by a lot,
// missing). They show how the reference separates answers. They are NOT answers from real miners.
// The scoring rules below are ours and are stated in the output, so a reviewer can disagree with them.
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'https://telegraph-evaluator.vercel.app').replace(/\/$/, '');
const rows = [];
let pass = 0, fail = 0;

async function get(path) {
  const r = await fetch(BASE + path, { signal: AbortSignal.timeout(30000) });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}

function record(checker, caseName, submitted, reference, verdict, expected) {
  const ok = verdict === expected;
  ok ? pass++ : fail++;
  rows.push({ checker, caseName, submitted, reference, verdict, expected, ok });
}

const missing = v => v === null || v === undefined || v === '';

// ---- Rule 1: CVE score. Correct only if equal to the reference to one decimal place.
function cveVerdict(sub, ref) {
  if (missing(sub)) return 'incomplete';
  return Math.abs(Number(sub) - Number(ref)) < 0.05 ? 'correct' : 'wrong';
}
// Anchors: the newest-version (CVSS 3.1) score NIST publishes for these well-known CVEs on nvd.nist.gov.
// (EternalBlue was first scored 8.1 under CVSS 3.0; NIST's current 3.1 score is 8.8, which the checker returns on purpose: newest version first.)
const CVES = [['CVE-2021-44228', 10.0, 'Log4Shell'], ['CVE-2014-0160', 7.5, 'Heartbleed'], ['CVE-2017-0144', 8.8, 'EternalBlue']];
for (const [id, anchor, name] of CVES) {
  const { status, body } = await get(`/api/truth/cve?cve_id=${id}`);
  const ref = body && body.cvss_score;
  record('CVE', `${name}: reference matches the published NIST score`, anchor, ref, status === 200 && Math.abs(ref - anchor) < 0.05 ? 'correct' : 'wrong', 'correct');
  if (status !== 200) continue;
  record('CVE', `${name}: right answer`, ref, ref, cveVerdict(ref, ref), 'correct');
  record('CVE', `${name}: off by 0.1`, +(ref - 0.1).toFixed(1), ref, cveVerdict(+(ref - 0.1).toFixed(1), ref), 'wrong');
  record('CVE', `${name}: off by 2.5`, +(ref - 2.5).toFixed(1), ref, cveVerdict(+(ref - 2.5).toFixed(1), ref), 'wrong');
  record('CVE', `${name}: no score given`, null, ref, cveVerdict(null, ref), 'incomplete');
}
{
  const { status, body } = await get('/api/truth/cve?cve_id=CVE-2099-0001');
  record('CVE', 'Made-up CVE: reference refuses to guess', '-', status + ' ' + (body && body.error ? 'error' : 'answer'), status >= 400 && body && body.error ? 'no answer' : 'guessed', 'no answer');
}

// ---- Rule 2: observed maximum temperature. Correct if within 1.0 degC of the reference.
function wxVerdict(sub, ref) {
  if (missing(sub)) return 'incomplete';
  return Math.abs(Number(sub) - Number(ref)) <= 1.0 ? 'correct' : 'wrong';
}
const DAY = '2024-06-15';
{
  const { status, body } = await get(`/api/truth/weather?location=${encodeURIComponent('Lagos, Nigeria')}&date=${DAY}`);
  if (status === 200) {
    const ref = body.temp_max_c;
    record('Weather', `Lagos ${DAY}: right answer`, ref, ref, wxVerdict(ref, ref), 'correct');
    record('Weather', 'Within 1.0 degC (+0.5)', +(ref + 0.5).toFixed(1), ref, wxVerdict(ref + 0.5, ref), 'correct');
    record('Weather', 'Off by 3 degC', +(ref + 3).toFixed(1), ref, wxVerdict(ref + 3, ref), 'wrong');
    record('Weather', 'No temperature given', null, ref, wxVerdict(null, ref), 'incomplete');
  } else record('Weather', 'Lagos reference loads', '-', status, 'error', 'correct');
  const a = await get(`/api/truth/weather?location=${encodeURIComponent('Lagos')}&date=${DAY}`);
  const b = await get(`/api/truth/weather?location=${encodeURIComponent('Lagos, Portugal')}&date=${DAY}`);
  const la = a.body && a.body.location, lb = b.body && b.body.location;
  record('Weather', 'Same name, two places: "Lagos" vs "Lagos, Portugal"', `${la} | ${lb}`, '-', la && lb && la !== lb ? 'told apart' : 'merged', 'told apart');
  const f = await get(`/api/truth/weather?location=Lagos&date=2099-01-01`);
  record('Weather', 'Future day: reference refuses to guess', '-', f.status, f.status >= 400 && f.body && f.body.error ? 'no answer' : 'guessed', 'no answer');
}

// ---- Rule 3: airport disruption flag. Correct only if the same true/false as the reference.
function trVerdict(sub, ref) {
  if (missing(sub)) return 'incomplete';
  return Boolean(sub) === Boolean(ref) ? 'correct' : 'wrong';
}
for (const q of ['ATL', 'JFK']) {
  const { status, body } = await get(`/api/truth/travel?route_or_flight=${q}`);
  if (status !== 200) { record('Airport', `${q} reference loads`, '-', status, 'error', 'correct'); continue; }
  const ref = body.disrupted;
  record('Airport', `${q} right answer (${ref ? 'disrupted' : 'no disruption'} now)`, ref, ref, trVerdict(ref, ref), 'correct');
  record('Airport', `${q} opposite answer`, !ref, ref, trVerdict(!ref, ref), 'wrong');
  record('Airport', `${q} no answer given`, null, ref, trVerdict(null, ref), 'incomplete');
}
for (const [q, why] of [['LOS', 'non-US airport'], ['ZZZ', 'unknown code'], ['DL404', 'flight number only']]) {
  const { status, body } = await get(`/api/truth/travel?route_or_flight=${q}`);
  record('Airport', `${q} (${why}): reference refuses to guess`, '-', status, status >= 400 && body && body.error ? 'no answer' : 'guessed', 'no answer');
}

// ---- Report
const today = new Date().toISOString().slice(0, 10);
let md = `# Discrimination test: can each checker tell right, wrong and incomplete answers apart?\n\n`;
md += `Run on ${today} against ${BASE}. Script: [discrimination.js](discrimination.js) (Node 18+, no key, no install).\n\n`;
md += `**Scoring rules (ours, stated so they can be challenged):** CVE: correct only if equal to the reference to one decimal. Weather: correct if the maximum temperature is within 1.0 degC of the reference. Airport: correct only if the disrupted flag matches the reference. A missing answer is incomplete. When the reference has no answer, it must say so instead of guessing.\n\n`;
md += `**Scope:** the submitted answers are written by us to probe the reference (right, slightly off, far off, missing). They are not answers from real miners. Real-miner evidence is in [EVIDENCE-fx-ranking.md](EVIDENCE-fx-ranking.md) and [EVIDENCE-corp.md](EVIDENCE-corp.md). The airport checker reads a live feed, so its reference changes with the day.\n\n`;
md += `**Result: ${pass} of ${pass + fail} cases behaved as expected.**\n\n| Checker | Case | Submitted | Reference | Verdict | Expected | |\n|---|---|---|---|---|---|---|\n`;
for (const r of rows) md += `| ${r.checker} | ${r.caseName} | ${r.submitted} | ${r.reference} | ${r.verdict} | ${r.expected} | ${r.ok ? 'pass' : '**FAIL**'} |\n`;
writeFileSync(new URL('./EVIDENCE-discrimination.md', import.meta.url), md);
console.log(md);
if (fail) console.log(`\n${fail} case(s) did not behave as expected. Send this output to Claude.`);
