import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answer, normaliseDomain, pickEmployees, deps, cache } from '../api/truth/b2b.js';

const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
let calls = [];
function mockFetch(routes) {
  calls = [];
  globalThis.fetch = async url => {
    calls.push(url);
    for (const [part, resp] of routes) if (url.includes(part)) return typeof resp === 'function' ? resp(url) : resp;
    throw new Error('unexpected url ' + url);
  };
}
const item = id => ({ 'entity-type': 'item', id });
const st = (value, extra = {}) => ({ rank: 'normal', mainsnak: { datavalue: { value } }, ...extra });
const q = (p, value) => ({ [p]: [{ datavalue: { value } }] });

// Test fixture in the shape of Wikidata's Special:EntityData JSON (values are test data).
const ENT = { entities: { Q1: {
  labels: { en: { value: 'Atlas Copco' } },
  claims: {
    P159: [st(item('Q10'), { qualifiers: q('P6375', { text: 'Sickla industriväg 19', language: 'sv' }) })],
    P17: [st(item('Q34'))],
    P452: [st(item('Q20'))],
    P169: [st(item('Q30')), st(item('Q31'), { qualifiers: q('P582', { time: '+2020-01-01T00:00:00Z' }) })],
    P1278: [st('213800ABCDEFGHIJKL12')],
    P1128: [
      st({ amount: '+49000' }, { qualifiers: q('P585', { time: '+2022-12-31T00:00:00Z' }) }),
      st({ amount: '+53700' }, { qualifiers: q('P585', { time: '+2024-12-31T00:00:00Z' }) }),
    ],
  },
} } };
const LABELS = { entities: {
  Q10: { labels: { en: { value: 'Nacka' } } }, Q34: { labels: { en: { value: 'Sweden' } } },
  Q20: { labels: { en: { value: 'industrial machinery' } } }, Q30: { labels: { en: { value: 'Current CEO' } } },
  Q31: { labels: { en: { value: 'Former CEO' } } },
} };
const GLEIF = { data: { attributes: {
  entity: {
    legalName: { name: 'Atlas Copco Aktiebolag' }, registeredAs: '556014-2720', registeredAt: { id: 'RA000544' },
    jurisdiction: 'SE', status: 'ACTIVE',
    legalAddress: { addressLines: ['Sickla Industriväg 19'], city: 'Nacka', postalCode: '131 54', country: 'SE' },
    headquartersAddress: { addressLines: ['Sickla Industriväg 19'], city: 'Nacka', postalCode: '131 54', country: 'SE' },
  },
  registration: { status: 'ISSUED' },
} } };
const SPARQL = ids => json({ results: { bindings: ids.map(id => ({ item: { value: 'http://www.wikidata.org/entity/' + id } })) } });

test('normalises domains, URLs and emails', () => {
  assert.equal(normaliseDomain({ domain: 'https://www.AtlasCopcoGroup.com/en/contact' }), 'atlascopcogroup.com');
  assert.equal(normaliseDomain({ email: 'jane@fanuc.com' }), 'fanuc.com');
  assert.equal(normaliseDomain({ query: 'Enrich acme.io: legal entity name, tax ID' }), 'acme.io');
  assert.throws(() => normaliseDomain({ domain: 'Atlas Copco' }), /domain is required/);
});

test('reserved .example domain: no company, nothing guessed, no network call', async () => {
  cache.clear(); mockFetch([]);
  const a = await answer({ domain: 'supplier-check.example' });
  assert.equal(a.domain_valid, false);
  assert.equal(a.company_found, false);
  assert.ok(a.not_verifiable.includes('ceo') && a.not_verifiable.includes('tax_id'));
  assert.equal(calls.length, 0);
});

test('domain that does not resolve: no company', async () => {
  cache.clear(); mockFetch([]); deps.resolve = async () => false;
  const a = await answer({ domain: 'no-such-company-xyz123.com' });
  assert.equal(a.domain_valid, false);
  assert.match(a.note, /does not resolve/);
});

test('no Wikidata entry: says so, states nothing', async () => {
  cache.clear(); deps.resolve = async () => true;
  mockFetch([['query.wikidata.org', SPARQL([])], ['exturlusage', json({ query: { exturlusage: [] } })]]);
  const a = await answer({ domain: 'small-unknown-maker.cn' });
  assert.equal(a.domain_valid, true);
  assert.equal(a.company_found, false);
  assert.equal(a.legal_entity_name, undefined);
  assert.equal(a.not_verifiable.length, 7);
});

test('two Wikidata entries share the site: ambiguous, nothing stated', async () => {
  cache.clear(); deps.resolve = async () => true;
  mockFetch([['query.wikidata.org', SPARQL(['Q1', 'Q2'])]]);
  const a = await answer({ domain: 'shared.com' });
  assert.equal(a.company_found, false);
  assert.match(a.note, /More than one/);
});

test('found: legal name and number from GLEIF, staff dated, former CEO dropped, tax ID never stated', async () => {
  cache.clear(); deps.resolve = async () => true;
  mockFetch([
    ['query.wikidata.org', SPARQL(['Q1'])],
    ['Special:EntityData', json(ENT)],
    ['wbgetentities', json(LABELS)],
    ['api.gleif.org', json(GLEIF)],
  ]);
  const a = await answer({ domain: 'atlascopcogroup.com' });
  assert.equal(a.company_found, true);
  assert.equal(a.legal_entity_name, 'Atlas Copco Aktiebolag');
  assert.equal(a.registration_number, '556014-2720');
  assert.equal(a.jurisdiction, 'SE');
  assert.match(a.headquarters, /Nacka/);
  assert.equal(a.employee_count, 53700);
  assert.equal(a.employee_count_as_of, '2024-12-31');
  assert.deepEqual(a.ceo, ['Current CEO']);
  assert.equal(a.tax_id, null);
  assert.deepEqual(a.not_verifiable, ['tax_id']);
  assert.match(a.sources.legal_entity_name, /gleif/);
  assert.match(a.sources.employee_count, /2024-12-31/);
});

test('no LEI on Wikidata: legal name and number are not verifiable, HQ from Wikidata', async () => {
  cache.clear(); deps.resolve = async () => true;
  const noLei = structuredClone(ENT); delete noLei.entities.Q1.claims.P1278;
  mockFetch([['query.wikidata.org', SPARQL(['Q1'])], ['Special:EntityData', json(noLei)], ['wbgetentities', json(LABELS)]]);
  const a = await answer({ domain: 'atlascopcogroup.com' });
  assert.equal(a.legal_entity_name, null);
  assert.ok(a.not_verifiable.includes('legal_entity_name') && a.not_verifiable.includes('registration_number'));
  assert.equal(a.headquarters, 'Sickla industriväg 19, Nacka, Sweden');
  assert.ok(!calls.some(u => u.includes('gleif')));
});

test('employees: different figures for the same year give a range, not one number', () => {
  const e = pickEmployees({ P1128: [
    st({ amount: '+52800' }, { qualifiers: q('P585', { time: '+2024-12-31T00:00:00Z' }) }),
    st({ amount: '+55000' }, { qualifiers: q('P585', { time: '+2024-06-30T00:00:00Z' }) }),
    st({ amount: '+40000' }, { qualifiers: q('P585', { time: '+2019-12-31T00:00:00Z' }) }),
  ] });
  assert.equal(e.value, null);
  assert.deepEqual(e.range, [52800, 55000]);
  assert.equal(e.as_of, '2024');
});

test('Wikidata down: error, never a made-up answer', async () => {
  cache.clear(); deps.resolve = async () => true;
  mockFetch([['query.wikidata.org', json({}, 503)]]);
  await assert.rejects(answer({ domain: 'fanuc.com' }), /limiting requests/);
});

test('official website with a path is found; items that only cite the domain are dropped', async () => {
  cache.clear(); deps.resolve = async () => true;
  let sparqlCalls = 0;
  mockFetch([
    ['query.wikidata.org', () => (++sparqlCalls === 1 ? SPARQL([])
      : json({ results: { bindings: [
        { item: { value: 'http://www.wikidata.org/entity/Q1' }, site: { value: 'https://www.atlascopcogroup.com/en' } },
        { item: { value: 'http://www.wikidata.org/entity/Q9' }, site: { value: 'https://other-company.com/' } },
      ] } }))],
    ['exturlusage', json({ query: { exturlusage: [
      { title: 'Q1', url: 'https://www.atlascopcogroup.com/en' },
      { title: 'Q9', url: 'https://www.atlascopcogroup.com/en/media/press-release-2024' },
      { title: 'Q5', url: 'https://notatlascopcogroup.com/' },
    ] } })],
    ['Special:EntityData', json(ENT)], ['wbgetentities', json(LABELS)], ['api.gleif.org', json(GLEIF)],
  ]);
  const a = await answer({ domain: 'atlascopcogroup.com' });
  assert.equal(a.company_found, true);
  assert.equal(a.legal_entity_name, 'Atlas Copco Aktiebolag');
});
