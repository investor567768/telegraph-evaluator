import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answer, airportsIn, minutes, closureActive, _reset } from '../api/truth/travel.js';

// Closures copied from the live FAA feed on 21 Nov 2026 09:44 GMT; delay blocks follow the FAA's published layout.
const XML = `<AIRPORT_STATUS_INFORMATION><Update_Time>Sat Nov 21 09:44:16 2026 GMT</Update_Time>
<Delay_type><Name>Airport Closures</Name><Airport_Closure_List>
<Airport><ARPT>SNA</ARPT><Reason>!SNA 11/020 SNA AD AP CLSD DLY 0730-1415 2611150730-2611211415</Reason><Start>Nov 15 at 07:30 UTC.</Start><Reopen>Nov 21 at 14:15 UTC.</Reopen></Airport>
<Airport><ARPT>PNS</ARPT><Reason>!PNS 11/069 PNS AD AP CLSD EXC HEL OPS 2611210600-2611211100</Reason><Start>Nov 21 at 06:00 UTC.</Start><Reopen>Nov 21 at 11:00 UTC.</Reopen></Airport>
<Airport><ARPT>LAX</ARPT><Reason>!LAX 05/277 LAX AD AP CLSD TO NON SKED TRANSIENT GA ACFT EXC 24HR PPR</Reason><Start>May 27 at 18:26 UTC.</Start><Reopen>May 28 at 16:00 UTC.</Reopen></Airport>
</Airport_Closure_List></Delay_type>
<Delay_type><Name>Ground Delay Programs</Name><Ground_Delay_List>
<Ground_Delay><ARPT>SFO</ARPT><Reason>low ceilings</Reason><Avg>1 hour and 2 minutes</Avg><Max>2 hours and 15 minutes</Max></Ground_Delay>
</Ground_Delay_List></Delay_type>
<Delay_type><Name>Ground Stops</Name><Ground_Stop_List>
<Program><ARPT>ATL</ARPT><Reason>thunderstorms</Reason><End_Time>10:45 am EST.</End_Time></Program>
</Ground_Stop_List></Delay_type>
<Delay_type><Name>General Arrival/Departure Delay Info</Name><Arrival_Departure_Delay_List>
<Delay><ARPT>EWR</ARPT><Reason>volume</Reason><Arrival_Departure Type="Departure"><Min>16 minutes</Min><Max>30 minutes</Max><Trend>Increasing</Trend></Arrival_Departure></Delay>
</Arrival_Departure_Delay_List></Delay_type>
</AIRPORT_STATUS_INFORMATION>`;

const NOW = new Date('2026-11-21T09:50:00Z');
function mock() { _reset(); globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => XML }); }

test('airport codes from free text', () => {
  assert.deepEqual(airportsIn('Is DL404 delayed today, and is there an FAA ground stop at ATL?'), ['ATL']);
  assert.deepEqual(airportsIn('JFK-LAX'), ['JFK', 'LAX']);
  assert.deepEqual(airportsIn('KSFO'), ['SFO']);
});

test('minutes parsing', () => {
  assert.equal(minutes('1 hour and 2 minutes'), 62);
  assert.equal(minutes('30 minutes'), 30);
  assert.equal(minutes('nothing'), null);
});

test('closures: daily window, "closed to" GA only, closed except helicopters', () => {
  assert.equal(closureActive('SNA AD AP CLSD DLY 0730-1415', NOW), true);
  assert.equal(closureActive('SNA AD AP CLSD DLY 0730-1415', new Date('2026-11-21T20:00:00Z')), false);
  assert.equal(closureActive('LAX AD AP CLSD TO NON SKED TRANSIENT GA ACFT', NOW), false);
  assert.equal(closureActive('PNS AD AP CLSD EXC HEL OPS', NOW), true);
});

test('ground stop at ATL', async () => {
  mock();
  const a = await answer({ route_or_flight: 'Is DL404 delayed today, and is there an FAA ground stop at ATL?' }, NOW);
  assert.equal(a.disrupted, true);
  assert.match(a.status, /ATL: ground stop until 10:45 am EST/);
  assert.match(a.reason, /thunderstorms/);
});

test('ground delay at SFO gives the max delay', async () => {
  mock();
  const a = await answer({ route_or_flight: 'SFO' }, NOW);
  assert.equal(a.delay_minutes, 135);
});

test('route picks the worst airport; GA-only closure at LAX is not a disruption', async () => {
  mock();
  const a = await answer({ route_or_flight: 'EWR-LAX' }, NOW);
  assert.equal(a.disrupted, true);
  assert.equal(a.delay_minutes, 30);
  assert.doesNotMatch(a.status, /LAX/);
});

test('quiet airport is not disrupted; no airport code is an error', async () => {
  mock();
  const a = await answer({ route_or_flight: 'ORD' }, NOW);
  assert.equal(a.disrupted, false);
  assert.equal(a.delay_minutes, 0);
  await assert.rejects(answer({ route_or_flight: 'DL404' }, NOW), e => e.status === 400);
});
