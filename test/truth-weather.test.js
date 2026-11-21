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
