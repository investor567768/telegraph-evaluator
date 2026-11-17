# Five-minute judges' guide

Track: Evaluators. Network: Telegraph testnet. Everything below can be checked without a wallet or any sign-up, except step 2, which needs a free Anjoman sign-in.

> Demo video: _to be added._

## 1. What this is (1 minute)
Three free, no-key truth sources that give Telegraph reference answers for two mandatory Intents used by ten H2 mission slots:
- `LIQUIDITY_DEPTH_VERIFY_GENERAL`: DexScreener and GeckoTerminal, pool liquidity in USD.
- `MACRO_ECONOMIC_INDICATOR_GENERAL`: IMF DataMapper and World Bank, annual figures in percent. The World Bank series is the one the Intent itself cites for unemployment.

## 2. Confirm they are on the network (1 minute)
1. Sign in at [anjoman.ai](https://anjoman.ai) and open [Evaluators](https://anjoman.ai/dashboard/eval).
2. Select each Intent above. The contributor's submissions are listed under `0x5726…365C`.
3. Expected: liquidity shows **Eligible · 2**; macro shows **Eligible · 1** (IMF) and **Admitted · 1** (World Bank, uploaded 17 Nov).

No sign-in? Screenshots of both rows: [liquidity](anjoman-liquidity.png), [macro](anjoman-macro.png).

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

## 5. Failure cases (1 minute)
A wrong input gives no number, never a wrong one:
| Input | Response |
|---|---|
| Liquidity, pool that does not exist | `{"pairs":null}` |
| Liquidity, real pool on the wrong chain | `{"pairs":null}` |
| Liquidity, invalid chain name | HTTP 400 |
| Macro, indicator code that does not exist | No `values` section |

Details: [EVIDENCE.md](EVIDENCE.md#error-cases-tested-15-nov-2026-about-1551-utc), [EVIDENCE-macro.md](EVIDENCE-macro.md#error-cases).

## Where to look for each criterion
Criterion names are the organizers' own wording (Section 6, Evaluators; full text in [CRITERIA.md](CRITERIA.md)).

| Criterion | Points | Where to look |
|---|---|---|
| Measurement validity, quality discrimination, and baseline evidence | 40 (minimum 28) | Two independent baseline checks: [EVIDENCE.md](EVIDENCE.md), [EVIDENCE-macro.md](EVIDENCE-macro.md). Disagreements between publishers are named and explained, not hidden. Live seller test: accurate answers, a stale input and a missing answer all told apart. |
| Integrity and robustness | 15 | Free public sources independent of the Providers ranked; no keys to leak; failure cases in step 5; data-quality issue in the second source flagged in [EVIDENCE-macro.md](EVIDENCE-macro.md). |
| Reproducibility and protocol compatibility | 10 | Miner YAML format, accepted by Anjoman with no refusals; steps 3 and 4 rerun each check. |
| Useful evaluation coverage and demonstrated improvement | 10 | Two mandatory Intents, ten mission slots, five chains; inflation for 175 countries, unemployment for 102 and GDP growth for 189. Live test of a real seller on 5 chains: 4 accurate within 1%, 1 missing answer caught ([EVIDENCE.md](EVIDENCE.md#live-test-across-five-chains-16-nov-2026)). Ranking improvement not yet measured. |
| Documentation and integration clarity | 5 | This guide, [README.md](README.md), the two evidence pages. |
| Organic growth, education, and developer activation | 20 | Public updates so far: showcase build log, #feedback bug report, X post, GitHub /progress (all 17 Nov), listed with links in the [README](README.md#public-updates-and-community). Anyone can test Providers with [seller-check.html](seller-check.html). Tutorial: [TUTORIAL.md](TUTORIAL.md). Independent testers to be added. |

Entry requirements (Section 5): the bounties repository is starred by this GitHub account; the network used is stated on every page (testnet).
