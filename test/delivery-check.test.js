import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answer, deps, readReport, readTask, normName, normCountry, SAMPLES, SAMPLE_ORDER } from '../api/delivery-check.js';

const read = f => SAMPLES[f.replace(/^report-|\.txt$/g, '')];
const ORDER = SAMPLE_ORDER;

// Siemens AG as GLEIF records it (values recorded live on 18 Nov 2026, see EVIDENCE-corp.md),
// plus the Siemens pension fund that a loose name search would also return.
const rec = (lei, name, extra = {}) => ({ type: 'lei-records', id: lei, attributes: { lei, entity: {
  legalName: { name }, registeredAs: 'HRB 6684', jurisdiction: 'DE', status: 'ACTIVE',
  legalAddress: { addressLines: ['Werner-von-Siemens-Str. 1'], city: 'München', postalCode: '80333', country: 'DE' },
  headquartersAddress: { addressLines: ['Werner-von-Siemens-Str. 1'], city: 'München', postalCode: '80333', country: 'DE' },
  ...extra } } });
const SIEMENS = rec('W38RGI023J3WT1HWRP32', 'Siemens Aktiengesellschaft');
const FUND = rec('529900ABCDEFGHIJ0K12', 'Siemens-Fonds Siemens-Rente', { registeredAs: 'HRB 0000' });

let calls;
function mock(map) {
  calls = [];
  deps.fetch = async url => {
    calls.push(url);
    for (const [k, v] of Object.entries(map)) if (url.includes(k)) return { ok: true, status: 200, json: async () => v };
    return { ok: false, status: 404, json: async () => ({}) };
  };
}
const byName = () => mock({ 'filter[entity.legalName]': { data: [FUND, SIEMENS] }, 'lei-records/W38RGI023J3WT1HWRP32': { data: SIEMENS } });

test('correct report is accepted: every required field matches', async () => {
  byName();
  const a = await answer({ task: ORDER, result: read('report-correct.txt') });
  assert.equal(a.verdict, 'accept');
  assert.equal(a.score, 1);
  assert.equal(a.acp.action, 'complete');
  assert.equal(a.company.lei, 'W38RGI023J3WT1HWRP32');
  assert.deepEqual(a.checks.filter(c => c.required).map(c => c.result), Array(6).fill('match'));
  assert.deepEqual(a.not_checked, []);
});

test('a fabricated CEO the register cannot confirm holds payment instead of releasing it', async () => {
  byName();
  const a = await answer({ task: ORDER, result: read('report-unchecked.txt') });
  assert.equal(a.verdict, 'hold_unchecked');
  assert.equal(a.acp.action, 'hold');
  assert.deepEqual(a.not_checked, ['CEO']);
  assert.match(a.reason, /CEO.*cannot confirm/);
  assert.deepEqual(a.checks.filter(c => c.required).map(c => c.result), Array(6).fill('match'));
});

test('keys written as tax_id, taxId or employee_count are caught too', async () => {
  byName();
  for (const key of ['tax_id', 'taxId', 'employee_count']) {
    const a = await answer({ task: ORDER, result: read('report-correct.txt') + `${key}: US12345\n` });
    assert.equal(a.verdict, 'hold_unchecked', key);
    assert.equal(a.acp.action, 'hold', key);
  }
});

test('a plain note that states no fact does not block payment', async () => {
  byName();
  const a = await answer({ task: ORDER, result: read('report-correct.txt') + 'Summary: Large German industrial group.\n' });
  assert.equal(a.verdict, 'accept');
  assert.equal(a.acp.action, 'complete');
});

test('incorrect report is rejected and names each wrong claim', async () => {
  byName();
  const a = await answer({ task: ORDER, result: read('report-incorrect.txt') });
  assert.equal(a.verdict, 'reject_incorrect');
  assert.equal(a.score, 0);
  assert.equal(a.acp.action, 'reject');
  const wrong = Object.fromEntries(a.checks.filter(c => c.result === 'mismatch').map(c => [c.field, c]));
  assert.deepEqual(Object.keys(wrong).sort(), ['registered_address', 'registration_number']);
  assert.match(wrong.registration_number.why, /gives the LEI as the registration number/);
  assert.match(wrong.registered_address.why, /street and postal code and city/);
  // "Siemens AG" is the same legal name as "Siemens Aktiengesellschaft".
  assert.equal(a.checks.find(c => c.field === 'legal_name').result, 'match');
});

test('incomplete report is rejected as incomplete and lists what is missing', async () => {
  byName();
  const a = await answer({ task: ORDER, result: read('report-incomplete.txt') });
  assert.equal(a.verdict, 'reject_incomplete');
  assert.equal(a.score, 0.5);
  assert.deepEqual(a.checks.filter(c => c.result === 'missing').map(c => c.field), ['registration_number', 'entity_status', 'registered_address']);
  assert.match(a.reason, /registration number, entity status, registered address/);
});

test('the company comes from the order, not the report: a report about another company fails', async () => {
  byName();
  const a = await answer({ task: ORDER, result: 'Legal name: Siemens-Fonds Siemens-Rente\nLEI: 529900ABCDEFGHIJ0K12\nRegistration number: HRB 0000\nJurisdiction: DE\nStatus: Active\nRegistered address: Werner-von-Siemens-Str. 1, 80333 München' });
  assert.equal(a.verdict, 'reject_incorrect');
  assert.equal(a.company.legal_name, 'Siemens Aktiengesellschaft');
  assert.ok(a.checks.some(c => c.field === 'lei' && c.result === 'mismatch'));
});

test('an order the register cannot pin down gets no verdict rather than a guess', async () => {
  mock({ 'filter[entity.legalName]': { data: [] } });
  const a = await answer({ task: { company: 'Siemens' }, result: read('report-correct.txt') });
  assert.equal(a.verdict, 'not_assessed');
  assert.equal(a.acp.action, 'hold');
  assert.match(a.reason, /No GLEIF entity has the exact legal name "Siemens"/);
});

test('an order by LEI looks the company up directly', async () => {
  mock({ 'lei-records/W38RGI023J3WT1HWRP32': { data: SIEMENS } });
  const a = await answer({ task: { lei: 'W38RGI023J3WT1HWRP32', required: ['legal_name', 'registration_number'] }, result: { legal_name: 'Siemens AG', registration_number: 'HRB6684' } });
  assert.equal(a.verdict, 'accept');
  assert.equal(calls.length, 1);
});

test('registration numbers match with extra words but not with extra digits', async () => {
  mock({ 'lei-records/W38RGI023J3WT1HWRP32': { data: SIEMENS } });
  const ok = await answer({ task: { lei: 'W38RGI023J3WT1HWRP32', required: ['registration_number'] }, result: 'Registration number: HRB 6684 (Amtsgericht München)' });
  assert.equal(ok.verdict, 'accept');
  const bad = await answer({ task: { lei: 'W38RGI023J3WT1HWRP32', required: ['registration_number'] }, result: 'Registration number: HRB 66840' });
  assert.equal(bad.verdict, 'reject_incorrect');
});

test('a wrong status or jurisdiction is caught', async () => {
  mock({ 'lei-records/W38RGI023J3WT1HWRP32': { data: SIEMENS } });
  const a = await answer({ task: { lei: 'W38RGI023J3WT1HWRP32', required: ['jurisdiction', 'entity_status'] }, result: { jurisdiction: 'Netherlands', status: 'Dissolved' } });
  assert.equal(a.verdict, 'reject_incorrect');
  assert.equal(a.checks.filter(c => c.result === 'mismatch').length, 2);
});

test('reads JSON and text reports, and text orders', () => {
  assert.deepEqual(readReport({ 'Legal Name': 'X AG', lei_code: 'ABC' }).claims, { legal_name: 'X AG', lei: 'ABC' });
  assert.equal(readReport('- Registered office: 1 Main St, London').claims.registered_address, '1 Main St, London');
  const t = readTask('Due diligence on Siemens Aktiengesellschaft: legal name, LEI, registration number and registered address.');
  assert.equal(t.company, 'Siemens Aktiengesellschaft');
  assert.deepEqual(t.required, ['legal_name', 'lei', 'registration_number', 'registered_address']);
  assert.throws(() => readReport(''), /result is required/);
  assert.throws(() => readTask(''), /task is required/);
});

test('names and countries normalise sensibly', () => {
  assert.equal(normName('Siemens Aktiengesellschaft'), normName('SIEMENS AG'));
  assert.equal(normName('Acme Limited'), normName('Acme Ltd.'));
  assert.notEqual(normName('Siemens Energy AG'), normName('Siemens AG'));
  assert.equal(normCountry('Germany'), 'DE');
  assert.equal(normCountry('de'), 'DE');
  assert.equal(normCountry('Federal Republic of Germany'), 'DE');
});

test('the demo link answers with the built-in order and report', async () => {
  const { default: handler } = await import('../api/delivery-check.js');
  byName();
  const run = async q => { let out; const res = { setHeader() {}, status(c) { this.c = c; return this; }, json(b) { out = b; return this; }, end() { return this; } }; await handler({ method: 'GET', query: q }, res); return { code: res.c, out }; };
  assert.equal((await run({ sample: 'correct' })).out.verdict, 'accept');
  assert.equal((await run({ sample: 'incorrect' })).out.verdict, 'reject_incorrect');
  assert.equal((await run({ sample: 'incomplete' })).out.verdict, 'reject_incomplete');
  assert.equal((await run({ sample: 'unchecked' })).out.verdict, 'hold_unchecked');
  assert.equal((await run({ sample: 'nope' })).code, 400);
});
