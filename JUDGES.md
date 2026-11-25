# Five-minute judges' guide

Track: Evaluators. Network: Telegraph testnet. Everything below can be checked without a wallet or any sign-up, except step 2, which needs a free Anjoman sign-in.

> Demo video (3 min): [on X](https://x.com/kingChrys494/status/2123346766846206144) · [file in this repo](demo.mp4)
>
> Independent testers and what they changed: [TESTERS.md](TESTERS.md).

## 1. What this is (1 minute)
Nine free, no-key truth sources that give Telegraph reference answers for mandatory Intents used by 10 of the 15 H2 missions. Three live checkers added on 20 to 21 Nov (CVE, weather, airport disruption, see the README) bring the total to 10 Intents covering all 15 of 15 missions, and a B2B identity checker added on 25 Nov makes 11. The nine sources are:
- `LIQUIDITY_DEPTH_VERIFY_GENERAL`: DexScreener and GeckoTerminal, pool liquidity in USD.
- `FX_NOW_EUR`, `FX_NOW_CAD`, `FX_NOW_SEK`: Frankfurter (European Central Bank) and open.er-api, US dollars per one unit of the currency. See [EVIDENCE-fx.md](EVIDENCE-fx.md).
- `MACRO_ECONOMIC_INDICATOR_GENERAL`: IMF DataMapper and World Bank, annual figures in percent. The World Bank series is the one the Intent itself cites for unemployment.
- `CORPORATE_REGISTRY_LOOKUP_GENERAL`: GLEIF, the global Legal Entity Identifier register, searched three ways (legal name, registration number, all names). See [EVIDENCE-corp.md](EVIDENCE-corp.md).

## 2. Confirm they are on the network (1 minute)
1. Sign in at [anjoman.ai](https://anjoman.ai) and open [Evaluators](https://anjoman.ai/dashboard/eval).
2. Select each Intent above. The contributor's submissions are listed under `0x5726…365C`.
3. Expected: liquidity **Eligible · 2**; macro **Eligible · 2**; each FX Intent **Eligible · 2**; corporate registry **Eligible · 3**.

No sign-in? Screenshots: [liquidity](anjoman-liquidity.png), [macro](anjoman-macro.png), [FX](anjoman-fx.png), [company registry](anjoman-corp.png).

## 3. Reproduce the liquidity check (1 minute)
1. Download [liquidity-compare.html](liquidity-compare.html) and open it in Chrome, Edge or Firefox.
2. Click **Run the check**.
3. Expected: 20 pools across 5 chains, median gap about 0.15%, all within 2%. Pools and values change with the market; the agreement should not.

Check one pool by hand (look for `"liquidity":{"usd":`):
```
https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
```

## 4. Reproduce the macro check (1 minute)
Needs Python 3 and nothing else (no packages to install, no key). Download [macro-compare.py](macro-compare.py), open a terminal in the same folder, then run:
```
python macro-compare.py 2023
```
Expected: 175 countries in both IMF and World Bank, median gap 0.04 percentage points, 146 within 0.5. The largest gaps (Egypt, Haiti, South Sudan) are explained in [EVIDENCE-macro.md](EVIDENCE-macro.md).

```
python macro-compare.py 2023 unemployment
```
Expected: 102 countries, median gap 0.13 percentage points. Looser by design: the World Bank figure is a modelled ILO estimate, the IMF uses national definitions.

```
python macro-compare.py 2023 gdp
```
Expected: 189 countries, median gap 0.04 percentage points (Nigeria 3.3 vs 3.32).

Check one value by hand (Nigeria 2023 is 24.7 in `values.PCPIPCH.NGA`):
```
https://www.imf.org/external/datamapper/api/v1/PCPIPCH/NGA
```

## 5. Reproduce the company-registry comparison (3 minutes, optional)
1. Download [corp-search-compare.html](corp-search-compare.html) and open it in Chrome, Edge or Firefox.
2. Click **Run comparison (120 lookups)**. It waits between requests to stay under GLEIF's rate limit.
3. Expected: with full legal names, the all-names search (`names`) puts the right company first 18 times out of 20 with none wrong; the legal-name search 15 with 1 wrong; full-text 10 with 8 wrong. Details: [EVIDENCE-corp.md](EVIDENCE-corp.md).

Check one company by hand (Toyota is found only through its English other name):
```
https://api.gleif.org/api/v1/lei-records?filter[entity.names]=Toyota%20Motor%20Corporation&filter[entity.legalAddress.country]=JP&page[size]=1
```

## 6. Failure cases (1 minute)
A wrong input gives no number, never a wrong one:
| Input | Response |
|---|---|
| Liquidity, pool that does not exist | `{"pairs":null}` |
| Liquidity, real pool on the wrong chain | `{"pairs":null}` |
| Liquidity, invalid chain name | HTTP 400 |
| Macro, indicator code that does not exist | No `values` section |
| FX, currency code that does not exist | `not found` / `unsupported-code` |
| Company registry, name not in GLEIF (e.g. "Naspers Limited") | Empty `data` list |

Details: [EVIDENCE.md](EVIDENCE.md#error-cases-tested-15-nov-2026-about-1551-utc), [EVIDENCE-macro.md](EVIDENCE-macro.md#error-cases).

## Where to look for each criterion
Criterion names are the organizers' own wording (Section 6, Evaluators; full text in [CRITERIA.md](CRITERIA.md)).

| Criterion | Points | Where to look |
|---|---|---|
| Measurement validity, quality discrimination, and baseline evidence | 40 (minimum 28) | Independent baseline checks: [EVIDENCE.md](EVIDENCE.md), [EVIDENCE-macro.md](EVIDENCE-macro.md), [EVIDENCE-fx.md](EVIDENCE-fx.md). Disagreements between publishers are named and explained, not hidden. Live seller test: accurate answers, a stale input and a missing answer all told apart. FX live test: a correct 1.10 answer was replaced by Telegraph with 1.00. Company registry: the reference itself was measured (20 companies), found to pick the wrong company for some names, and improved with a tested search change (15 to 18 right, 1 to 0 wrong); a live job then showed a Provider's wrong `registration_id` ([EVIDENCE-corp.md](EVIDENCE-corp.md)). |
| Integrity and robustness | 15 | Free public sources; two independent sources per Intent, because a Provider reading the same site will match one exactly (seen with PREFLIGHT and GeckoTerminal); no keys to leak; failure cases in step 6; a reference that could name the wrong company was found and fixed rather than left in place; data-quality issue in the second macro source flagged in [EVIDENCE-macro.md](EVIDENCE-macro.md). |
| Reproducibility and protocol compatibility | 10 | Miner YAML format; all 9 sources Eligible on Anjoman with no refusals; steps 3, 4 and 5 rerun each check. |
| Useful evaluation coverage and demonstrated improvement | 10 | Eleven Intents covering all 15 of 15 missions: six uploaded first (liquidity, macro, three FX, company registry, 10 missions), four added 20 to 21 Nov (CVE lookup, vulnerability triage, weather verification, airport disruption) and B2B identity enrichment on 25 Nov, plus 4 Eligible preference pairs for it; inflation for 175 countries, unemployment for 102 and GDP growth for 189; companies in 13 countries. Measured improvement of a reference: company registry 15 to 18 of 20 right. Live test of a real seller on 5 chains ([EVIDENCE.md](EVIDENCE.md#live-test-across-five-chains-16-nov-2026)). A Provider shipped three changes after our checks ([TESTERS.md](TESTERS.md)). Ranking improvement not yet measured. |
| Documentation and integration clarity | 5 | This guide, [README.md](README.md), four evidence pages, [TUTORIAL.md](TUTORIAL.md). |
| Organic growth, education, and developer activation | 20 | **Invitation:** tester call with the live [seller-check page](https://investor567768.github.io/telegraph-evaluator/seller-check.html) (18 Nov). **Independent developers acted:** Fexx tested it and filed [issue #1](https://github.com/investor567768/telegraph-evaluator/issues/1), a bug fixed the same day; Chrome (PREFLIGHT) tested it and shipped three changes to his own Provider after our cross-check. Details and links: [TESTERS.md](TESTERS.md). **Updates:** showcase build log, #feedback bug reports, X post, GitHub /progress, listed in the [README](README.md#public-updates-and-community). **Education:** [TUTORIAL.md](TUTORIAL.md). |

Entry requirements (Section 5): the bounties repository is starred by this GitHub account; the network used is stated on every page (testnet).
