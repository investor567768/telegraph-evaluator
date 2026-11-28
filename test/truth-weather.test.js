import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answer, parseDate, condition, cache } from '../api/truth/weather.js';

const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
let calls = [];
function mockFetch(routes) {
  calls = [];
  globalThis.fetch = async url => {
    calls.push(url);
    for (const [part, resp] of routes) if (url.includes(part)) return resp;
    throw new Error('unexpected url ' + url);
  };
}
const NOW = new Date('2026-11-21T08:00:00Z');
const GEO_LAGOS = { results: [
  { name: 'Lagos', latitude: 6.45407, longitude: 3.39467, country: 'Nigeria', country_code: 'NG', admin1: 'Lagos' },
  { name: 'Lagos', latitude: 37.10202, longitude: -8.67422, country: 'Portugal', country_code: 'PT', admin1: 'Faro' },
] };
// Values from the real Open-Meteo answer for Lagos, 2026-11-19, checked in a browser on 20 Nov 2026
const LAGOS_DAY = { timezone: 'Africa/Lagos', daily: { time: ['2026-11-19'], temperature_2m_max: [30.8], temperature_2m_min: [27.5], precipitation_sum: [1.5], weather_code: [61] } };

test('dates: past days only, real dates only', () => {
  assert.equal(parseDate('2026-11-19', NOW).iso, '2026-11-19');
  assert.throws(() => parseDate('2026-11-21', NOW), /has not finished/);
  assert.throws(() => parseDate('2026-02-30', NOW), /not a real date/);
  assert.throws(() => parseDate('yesterday', NOW), /YYYY-MM-DD/);
});

test('weather codes become words', () => {
  assert.equal(condition(0), 'clear');
  assert.equal(condition(63), 'rain');
  assert.equal(condition(95), 'thunderstorm');
});

test('Lagos yesterday: recent endpoint, real values', async () => {
  cache.clear();
  mockFetch([['geocoding-api', json(GEO_LAGOS)], ['api.open-meteo.com/v1/forecast', json(LAGOS_DAY)]]);
  const a = await answer({ location: 'Lagos', date: '2026-11-19' }, NOW);
  assert.equal(a.temp_max_c, 30.8);
  assert.equal(a.temp_min_c, 27.5);
  assert.equal(a.precipitation_mm, 1.5);
  assert.equal(a.condition, 'rain');
  assert.equal(a.location, 'Lagos, Nigeria');
  assert.match(calls[1], /latitude=6.45407&longitude=3.39467/);
});

test('"Lagos, Portugal" picks the Portuguese town', async () => {
  cache.clear();
  mockFetch([['geocoding-api', json(GEO_LAGOS)], ['api.open-meteo.com/v1/forecast', json(LAGOS_DAY)]]);
  const a = await answer({ location: 'Lagos, Portugal', date: '2026-11-19' }, NOW);
  assert.match(a.location, /Portugal/);
  assert.match(calls[1], /latitude=37.10202/);
});

test('old dates use the archive', async () => {
  cache.clear();
  mockFetch([['geocoding-api', json(GEO_LAGOS)], ['archive-api.open-meteo.com', json({ ...LAGOS_DAY, daily: { ...LAGOS_DAY.daily, time: ['2020-01-15'] } })]]);
  const a = await answer({ location: 'Lagos', date: '2020-01-15' }, NOW);
  assert.match(a.data_source, /archive/);
  assert.match(calls[1], /archive-api/);
});

test('unknown place and missing values are errors, not guesses', async () => {
  cache.clear();
  mockFetch([['geocoding-api', json({})]]);
  await assert.rejects(answer({ location: 'Nowhereville', date: '2026-11-19' }, NOW), e => e.status === 404);
  mockFetch([['geocoding-api', json(GEO_LAGOS)], ['api.open-meteo.com', json({ daily: { temperature_2m_max: [null] } })]]);
  await assert.rejects(answer({ location: 'Lagos', date: '2026-11-18' }, NOW), e => e.status === 404);
});

test('a day is finished where the place is, not in UTC: Auckland already ended 28 Nov at 11:37Z', async () => {
  cache.clear();
  const AKL = { results: [{ name: 'Auckland', latitude: -36.84853, longitude: 174.76349, country: 'New Zealand', country_code: 'NZ', admin1: 'Auckland', timezone: 'Pacific/Auckland' }] };
  mockFetch([['geocoding-api', json(AKL)], ['api.open-meteo.com/v1/forecast', json({ timezone: 'Pacific/Auckland', daily: { time: ['2026-11-28'], temperature_2m_max: [19], temperature_2m_min: [12], precipitation_sum: [0.4], weather_code: [3] } })]]);
  const a = await answer({ location: 'Auckland', date: '2026-11-28' }, new Date('2026-11-28T11:37:00Z'));
  assert.equal(a.date, '2026-11-28');
  assert.equal(a.temp_max_c, 19);
});

test('and the other way round: Honolulu has not finished 27 Nov at 02:00Z on 28 Nov', async () => {
  cache.clear();
  const HNL = { results: [{ name: 'Honolulu', latitude: 21.30694, longitude: -157.85833, country: 'United States', country_code: 'US', admin1: 'Hawaii', timezone: 'Pacific/Honolulu' }] };
  mockFetch([['geocoding-api', json(HNL)]]);
  await assert.rejects(() => answer({ location: 'Honolulu', date: '2026-11-27' }, new Date('2026-11-28T02:00:00Z')), /has not finished yet in Pacific\/Honolulu/);
});

test('a date that is not finished anywhere is refused before any lookup', async () => {
  cache.clear();
  mockFetch([]);
  await assert.rejects(() => answer({ location: 'Auckland', date: '2026-11-30' }, new Date('2026-11-28T11:37:00Z')), /has not finished yet anywhere/);
  assert.equal(calls.length, 0);
});

test('an ambiguous name is flagged with the other places, never picked silently', async () => {
  cache.clear();
  const PARIS = { results: [
    { name: 'Paris', latitude: 48.85341, longitude: 2.3488, country: 'France', country_code: 'FR', admin1: 'Ile-de-France', timezone: 'Europe/Paris' },
    { name: 'Paris', latitude: 33.66094, longitude: -95.55551, country: 'United States', country_code: 'US', admin1: 'Texas', timezone: 'America/Chicago' },
  ] };
  mockFetch([['geocoding-api', json(PARIS)], ['api.open-meteo.com/v1/forecast', json({ timezone: 'Europe/Paris', daily: { time: ['2026-11-19'], temperature_2m_max: [9], temperature_2m_min: [4], precipitation_sum: [0], weather_code: [3] } })]]);
  const a = await answer({ location: 'Paris', date: '2026-11-19' }, NOW);
  assert.equal(a.place_match.ambiguous, true);
  assert.match(a.place_match.used, /France/);
  assert.match(a.place_match.other_places[0].location, /Texas/);
  const b = await answer({ location: 'Paris, France', date: '2026-11-19' }, NOW);
  assert.equal(b.place_match.ambiguous, false);
});
