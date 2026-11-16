# Evidence: IMF DataMapper as a truth source for MACRO_ECONOMIC_INDICATOR_GENERAL

Network: Telegraph testnet. Nothing here is a production or mainnet claim.

## What was submitted
- Truth source: IMF DataMapper public API (free, no key), file `imf-macro-indicator.yaml`.
- Intent: `MACRO_ECONOMIC_INDICATOR_GENERAL` (asks: indicator, country, year; answers: rate_pct).
- Supported indicators: inflation (PCPIPCH), unemployment rate (LUR), real GDP growth (NGDP_RPCH). Annual figures only.
- Uploaded through the Anjoman Evaluators page on 16 Nov 2026. Row state: Admitted.
- Not yet claimed: eligible, frozen into a snapshot, or used in a ranking.

## Baseline check against an independent second source
Question: does the IMF report the same annual inflation as an unrelated publisher?
Second source: World Bank API, indicator FP.CPI.TOTL.ZG (inflation, consumer prices, annual %), one bulk request for all countries, year 2023 (World Bank data last updated 2026-11-11).

Method: take every country present in both datasets with a 2023 value (World Bank regional and income-group aggregates excluded), and compute the difference in percentage points (pp). Raw rows: `imf-vs-worldbank-inflation-2023.tsv`.

| Measure | Value |
|---|---|
| Countries compared | 175 |
| Median absolute difference | 0.04 pp |
| Within 0.1 pp | 120 of 175 |
| Within 0.5 pp | 146 of 175 |
| Within 1 pp | 158 of 175 |
| Within 2 pp | 163 of 175 |

Example: Nigeria 2023, IMF 24.7%, World Bank 24.66%.

## Where the two sources disagree, and why it matters for scoring
The largest gaps: South Sudan (IMF 39.7 vs World Bank 2.38), Egypt (24.4 vs 33.88), Haiti (44.1 vs 36.81), Chad (4.1 vs 10.84), Tonga (12.6 vs 6.35), Rwanda (14.0 vs 19.79).

Likely causes, not confirmed for each country: some publishers report fiscal-year rather than calendar-year averages (Egypt's fiscal year runs July to June, Haiti's October to September); different CPI series or base years; and later data revisions. The South Sudan World Bank value is far from every other published estimate and may be a data error on that side.

What this means for Telegraph: for most countries two respected publishers agree almost exactly, so a Provider answer more than about 1 pp from this reference is a meaningful signal. For a small set of countries, "inflation in year X" is genuinely ambiguous between definitions, and a single reference should not be treated as the only correct answer there.

Data-quality note on the second source: 21 World Bank country values in this response are identical, to 14 decimal places, to a World Bank regional or income-group aggregate in the same response (for example Germany equals the Euro area figure). They still sit close to the IMF in most cases, and excluding them leaves the result unchanged (154 countries, median 0.04 pp, 132 within 0.5 pp). The cause is not known.

## Second indicator: unemployment rate (LUR)
Second source: World Bank indicator SL.UEM.TOTL.ZS, which is the International Labour Organization's modelled estimate, not each country's own national figure. Raw rows: `imf-vs-worldbank-unemployment-2023.tsv`. Reproduce with `python macro-compare.py 2023 unemployment`.

| Measure | Value |
|---|---|
| Economies with an IMF unemployment figure for 2023 | 111 |
| Countries compared (in both sources) | 102 |
| Median absolute difference | 0.13 pp |
| Within 0.5 pp | 67 of 102 |
| Within 2 pp | 87 of 102 |
| Within 5 pp | 100 of 102 |

Agreement is looser than for inflation, as expected: the IMF reports national definitions, while the World Bank figure is a harmonised ILO model. The largest gaps (Jordan 22.0 vs 16.6, Bahrain 6.3 vs 1.1, Belize 3.3 vs 8.3, Georgia 16.4 vs 11.6, Morocco 13.0 vs 8.9) are countries where national and modelled definitions are known to differ.

Coverage limit: the IMF publishes unemployment for far fewer countries than inflation. For example, it has no Nigeria unemployment figure after 2018, so a 2023 Nigeria request returns no value (missing), not a wrong one.

What this means for Telegraph: for unemployment, a Provider answer within about 1 to 2 pp of this reference is consistent with a legitimate alternative definition, so a tight tolerance would wrongly penalise honest Providers. That tolerance choice belongs to the scoring path, and this evidence is offered to inform it.

## Error cases
| Case | Request | IMF response | What the node gets |
|---|---|---|---|
| Indicator code that does not exist | `/api/v1/FAKECODE/NGA` | Country, group and region list; no `values` section | No `rate_pct` value (missing) |

Out-of-scope requests (policy rates, monthly prints, core inflation, or no year given) are told in the mapping not to substitute another code, so they resolve to no value rather than a wrong one. This mapping behaviour is stated in the YAML; how the node applies it is not observed directly.

## What this does and does not show
- Inflation and unemployment were compared; real GDP growth is supported but not yet cross-checked.
- One year (2023). Years after the IMF's latest actuals are projections and will change.
- The catalogue's example question asks for the latest monthly CPI print and a policy rate. This source answers neither; it covers annual figures for a named year.

## Still to do
- Cross-check real GDP growth (NGDP_RPCH).
- Confirm the row state after the next epoch rollover.
- Organizer answer on what real requests send in `indicator` and `year`.
