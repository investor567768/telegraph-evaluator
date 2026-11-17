# Evidence: FX truth sources for FX_NOW_EUR, FX_NOW_CAD and FX_NOW_SEK

Network: Telegraph testnet. Nothing here is a production or mainnet claim.

## What was submitted
- Two truth sources, each covering all three Intents in one file:
  - [`frankfurter-fx.yaml`](frankfurter-fx.yaml): Frankfurter, which serves the European Central Bank's daily reference rates. Free, no key.
  - [`open-er-api-fx.yaml`](open-er-api-fx.yaml): ExchangeRate-API open access (open.er-api.com). Free, no key.
- The request form (checked 17 Nov) asks for one input, `currency`, described as "Currency code priced against the US dollar, e.g. EUR", and returns `rate`. Both sources answer **US dollars per one unit of that currency** (for EUR, about 1.10).
- Uploaded through the Anjoman Evaluators page on 17 Nov 2026. Row state: Admitted, 6 rows (2 sources x 3 Intents).
- The Frankfurter API has moved from `api.frankfurter.app` to `api.frankfurter.dev/v1`. The YAML uses the new address directly, so the node does not depend on following a redirect.
- Why FX: the family is marked mandatory, used by 4 H2 missions (Stablecoin, Institutional Markets, Commodities, Personal Agent), and had 14 miners on FX_NOW_EUR, the fewest of the Intents checked.

## Baseline check: the two sources against each other
Both sources read on 17 Nov 2026 (Frankfurter dated 2026-11-17; open.er-api last updated 00:02 UTC). Every currency both publish was compared, as USD per one unit. Raw rows: [fx-ecb-vs-erapi-2026-11-17.tsv](fx-ecb-vs-erapi-2026-11-17.tsv).

| Measure | Value |
|---|---|
| Currencies compared | 29 |
| Median gap | 0.154% |
| Within 0.25% | 23 of 29 |
| Within 0.5% | 27 of 29 |
| Within 2% | 29 of 29 |

The three Intents:

| Intent | Frankfurter (ECB) | open.er-api | Gap |
|---|---|---|---|
| FX_NOW_EUR | 1.098901 | 1.100614 | 0.16% |
| FX_NOW_CAD | 0.699741 | 0.699609 | 0.02% |
| FX_NOW_SEK | 0.098911 | 0.099082 | 0.17% |

Largest gaps: Brazilian real 1.17%, Indian rupee 0.51%, Icelandic krona 0.46%. The ECB publishes one fix a day at about 16:00 CET, while open.er-api updates at a different time, so currencies that move more during the day differ more. A tolerance of about 0.5% fits these three Intents.

## Live test: a real Telegraph request (17 Nov 2026, about 16:12 UTC)
New job, By intent, FX_NOW_EUR, currency `EUR`. Price $0.01. [Screenshot](fx-live-test-eur-answer.png).

| Step | Value | Against the truth sources |
|---|---|---|
| First Provider answer | 1.100615 | Matches open.er-api (1.100615) exactly; 0.16% from ECB (1.0989) |
| What Telegraph handed the buyer | **1.00** | About 9% off both |

Telegraph's verification step read the request as "EUR against EUR", called the correct answer "incorrect", and replaced it with 1.00. Both truth sources show 1.10 for the same moment ([ECB](frankfurter-eur-1713.png), [open.er-api](open-er-api-eur-1713.png)). With these truth sources in the pool, the first answer is the one that passes and the 1.00 answer fails. Reported in Telegraph Discord #feedback on 17 Nov.

## Error cases
| Input | Frankfurter | open.er-api | What the node gets |
|---|---|---|---|
| Currency code that does not exist (`XYZ`) | `{"message":"not found"}` ([screenshot](error-frankfurter-xyz.png)) | `{"result":"error","error-type":"unsupported-code"}` ([screenshot](error-erapi-xyz.png)) | No `rate` (missing), never a wrong number |

## Limits
- Both are daily rates, not tick-by-tick. The Intent says "live"; between daily updates these are the latest official figures.
- One day of comparison (17 Nov) and one live request.
- Rows are Admitted, not yet confirmed Eligible.
