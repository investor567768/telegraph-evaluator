# Evidence: IMF and World Bank truth sources for MACRO_ECONOMIC_INDICATOR_GENERAL

Network: Telegraph testnet. Nothing here is a production or mainnet claim.

## What was submitted
- Truth source: IMF DataMapper public API (free, no key), file `imf-macro-indicator.yaml`.
- Intent: `MACRO_ECONOMIC_INDICATOR_GENERAL` (asks: indicator, country, year; answers: rate_pct).
- Supported indicators: inflation (PCPIPCH), unemployment rate (LUR), real GDP growth (NGDP_RPCH). Annual figures only.
- Uploaded through the Anjoman Evaluators page on 16 Nov 2026. Row state: Admitted at upload (11:17 UTC), Eligible when checked at 12:59 UTC the same day ([screenshot](anjoman-macro.png)).
- Not yet claimed: frozen into a snapshot, or used in a ranking.

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

## Third indicator: real GDP growth (NGDP_RPCH)
Second source: World Bank indicator NY.GDP.MKTP.KD.ZG (GDP growth, annual %, constant prices). Raw rows: `imf-vs-worldbank-gdp-growth-2023.tsv`. Reproduce with `python macro-compare.py 2023 gdp`.

| Measure | Value |
|---|---|
| Countries compared (in both sources) | 189 |
| Median absolute difference | 0.04 pp |
| Within 0.1 pp | 140 of 189 |
| Within 0.5 pp | 168 of 189 |
| Within 1 pp | 178 of 189 |
| Within 2 pp | 183 of 189 |

This is the closest agreement of the three indicators and the widest coverage. Spot checks: Nigeria 3.3 vs 3.32, United States 2.9 vs 2.93, Cote d'Ivoire 6.6 vs 6.6, DR Congo 8.5 vs 8.53. No World Bank country value repeats an aggregate row (the quirk seen in the inflation data does not occur here).

Largest gaps: Timor-Leste 2.4 vs -18.1 (likely because the IMF reports non-oil GDP for Timor-Leste while the World Bank figure includes the declining oil sector), Sudan -23.5 vs -29.4 (wartime estimates, both highly uncertain), Tuvalu -0.9 vs 3.5, Malta 7.1 vs 10.6 (revision timing). Six of 189 differ by more than 2 pp.

## Second truth source: World Bank (added 17 Nov 2026)
Why: the Anjoman request form for this Intent (checked 17 Nov) offers one indicator, **unemployment rate**, and its hint defines it as the World Bank series `SL.UEM.TOTL.ZS` (modelled ILO estimate). So the World Bank is the reference the Intent itself cites. The IMF source stays as an independent second source.

- File: `worldbank-macro-indicator.yaml`. World Bank Indicators API, free, no key. Answer at `1.0.value`, in percent.
- Uploaded 17 Nov 2026, 15:26 UTC. Row state: Admitted (checked at the next epoch rollover).
- Covers gaps in the IMF source: the IMF has no Nigeria unemployment figure after 2018; the World Bank returns **3.074%** for Nigeria, 2023 ([screenshot](worldbank-nigeria-2023.png)).
- Agreement with the IMF on unemployment, 2023: 102 countries, median gap 0.13 points (section above). Each source checks the other.
- Error behaviour: an invalid country code returns an error message with no second list element, and a year with no figure returns `"value": null`. Either way the answer is missing rather than wrong.

## Error cases
| Case | Request | IMF response | What the node gets |
|---|---|---|---|
| Indicator code that does not exist | `/api/v1/FAKECODE/NGA` | Country, group and region list; no `values` section | No `rate_pct` value (missing) |

Out-of-scope requests (policy rates, monthly prints, core inflation, or no year given) are told in the mapping not to substitute another code, so they resolve to no value rather than a wrong one. This mapping behaviour is stated in the YAML; how the node applies it is not observed directly.

## What this does and does not show
- All three supported indicators were compared against the World Bank: inflation (175 countries), unemployment (102) and real GDP growth (189).
- One year (2023). Years after the IMF's latest actuals are projections and will change.
- The catalogue's example question asks for the latest monthly CPI print and a policy rate. This source answers neither; it covers annual figures for a named year.

## Still to do
- Confirm the World Bank row turns Eligible after the epoch rollover.
- Answered by the request form itself (17 Nov): `indicator` is chosen from a list (currently only "unemployment rate"), `country` is typed, `year` is required.
