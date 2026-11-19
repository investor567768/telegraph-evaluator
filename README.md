# Telegraph Evaluator: liquidity, macro, FX and company-registry truth sources

**Track:** Evaluators · **Event:** Telegraph Hackathon Season II · **Network:** Telegraph testnet (nothing here is a mainnet or production claim)

**Judges: start with the five-minute guide → [JUDGES.md](JUDGES.md)**

Free, no-key public truth sources that give Telegraph a trusted reference answer for mission-critical Intents, so the network can tell a Provider that answers correctly from one that does not. Each source comes with an independent baseline check and tested failure cases.

## Results at a glance
- **9 truth sources** on Telegraph covering **10 of the 15 H2 missions**, all **Eligible**. Screenshots: [liquidity](anjoman-liquidity.png), [macro](anjoman-macro.png), [FX](anjoman-fx.png), [company registry](anjoman-corp.png).
- **Accuracy against an independent second source:** 20 pools on 5 chains, all within 2% ([EVIDENCE.md](EVIDENCE.md)); inflation, unemployment and GDP growth for 102 to 189 countries, median gap 0.04 to 0.13 points ([EVIDENCE-macro.md](EVIDENCE-macro.md)); 29 currencies, median gap 0.15% ([EVIDENCE-fx.md](EVIDENCE-fx.md)).
- **Company registry, measured and improved (18 Nov):** the first name search found the right company for 15 of 20 full legal names and 1 wrong one. A tested change to GLEIF's all-names search raised that to **18 of 20 with no wrong company**, and fixed Japanese and Korean names ([EVIDENCE-corp.md](EVIDENCE-corp.md)).
- **Live tests through Telegraph:** liquidity on 5 chains, every delivered answer within 1% and 1 missing answer caught (traced to routing); FX, a correct 1.10 answer replaced by Telegraph with 1.00; company registry, "Siemens" resolved to the right company.
- **Ranking check (18 to 19 Nov):** Telegraph's #1-ranked `FX_NOW_EUR` miner answered a live request with a rate of 1.0 (euros per euro), wrong in either direction; two miners storing the same value were scored 1.000 and 0.710; ranks swung between epochs; and the Intent does not say whether the rate is USD/EUR or EUR/USD, so one-direction scoring cannot be fair to both ([EVIDENCE-fx-ranking.md](EVIDENCE-fx-ranking.md)).
- **Two named independent developers** tested the work; one found a bug in the [seller-check page](https://investor567768.github.io/telegraph-evaluator/seller-check.html), fixed the same day; the other shipped three changes to his own Provider because of it ([TESTERS.md](TESTERS.md)).
- **Failure cases tested:** wrong pool, wrong chain, invalid chain, invalid indicator, invalid currency, unknown company. Each returns no answer rather than a wrong one.

| Intent | Used by H2 missions | Truth sources | Row state on Anjoman | Baseline check |
|---|---|---|---|---|
| `LIQUIDITY_DEPTH_VERIFY_GENERAL` | 5: Exchange, Stablecoin, Institutional Markets, Asset Management, Web3 Native & DeFi | DexScreener, GeckoTerminal | Eligible, Eligible | 20 pools, 5 chains: median gap 0.146%, 20 of 20 within 2% |
| `MACRO_ECONOMIC_INDICATOR_GENERAL` | 5: Institutional Markets, Conflict Intelligence, Commodities, Mining & Power, Asset Management | IMF DataMapper, World Bank | Eligible, Eligible | Inflation, 175 countries vs World Bank: median gap 0.04 pp. Unemployment, 102 countries: median gap 0.13 pp. GDP growth, 189 countries: median gap 0.04 pp |
| `FX_NOW_EUR`, `FX_NOW_CAD`, `FX_NOW_SEK` | 4: Stablecoin, Institutional Markets, Commodities, Personal Agent | Frankfurter (ECB), open.er-api | Eligible, 2 each | 29 currencies: median gap 0.15%; EUR 0.16%, CAD 0.02%, SEK 0.17% |
| `CORPORATE_REGISTRY_LOOKUP_GENERAL` | 3: Institutional Markets, Legal, Asset Management | GLEIF by legal name, by registration number, by all names | Eligible, 3 | 20 companies, 13 countries: full legal name right 18 of 20, 0 wrong (all-names search) |

## Why this matters
A ranking is only as good as its reference answer. Without one, the network cannot separate a Provider that reports a pool's real liquidity, a country's real inflation or the right company from one that reports a stale, invented or wrong figure, and the apps in these mission slots cannot trust what they pay for. A wrong reference is worse than none: it marks correct Providers wrong. That is why every source here is measured, not just uploaded.

## Who this serves
- **Telegraph's ranking itself:** these Intents are marked mandatory, and a reference only counts once three independent contributors supply one.
- **Named user: Chrome, developer of PREFLIGHT Infrastructure Signals.** His miner is the Provider these truth sources checked, and its answers held up well: within 1% of both sources on every chain. He used our cross-check to ship three improvements, and called the seller-check page "simple and useful" ([TESTERS.md](TESTERS.md)).
- **Independent tester: Fexx (OathCast).** Tested the seller-check page on two chains and found a real bug ("75.07M" read as $75.07), fixed the same day ([issue #1](https://github.com/investor567768/telegraph-evaluator/issues/1)).
- **Apps on the missions above** that buy liquidity, macro, FX or company answers and need the best-ranked Provider to actually be right.

## Evidence
| File | What it is |
|---|---|
| [EVIDENCE.md](EVIDENCE.md) | Liquidity: what was uploaded, the 20-pool check, live test on 5 chains, error cases, limits |
| [EVIDENCE-macro.md](EVIDENCE-macro.md) | Macro: both sources, the 175-country check, disagreements explained, error case, limits |
| [EVIDENCE-fx.md](EVIDENCE-fx.md) | FX: both sources, the 29-currency check, the live test that caught a wrong 1.00 answer, error cases |
| [EVIDENCE-fx-ranking.md](EVIDENCE-fx-ranking.md) | FX ranking check: the Intent's undefined direction, the top-ranked miner's live 1.0 answer, same value with different scores, rank swings (with a correction to the 18 Nov version) |
| [EVIDENCE-corp.md](EVIDENCE-corp.md) | Company registry: 20-company accuracy test, 3 search methods compared, the improvement, a live job, limits |
| [TESTERS.md](TESTERS.md) | Independent testers, what each did and changed, with links |
| [dexscreener-liquidity.yaml](dexscreener-liquidity.yaml), [geckoterminal-liquidity.yaml](geckoterminal-liquidity.yaml), [imf-macro-indicator.yaml](imf-macro-indicator.yaml), [worldbank-macro-indicator.yaml](worldbank-macro-indicator.yaml), [frankfurter-fx.yaml](frankfurter-fx.yaml), [open-er-api-fx.yaml](open-er-api-fx.yaml), [gleif-corporate-registry.yaml](gleif-corporate-registry.yaml), [gleif-corporate-registry-by-number.yaml](gleif-corporate-registry-by-number.yaml), [gleif-corporate-registry-allnames.yaml](gleif-corporate-registry-allnames.yaml) | The truth sources exactly as uploaded |
| [liquidity-check-2026-11-15.tsv](liquidity-check-2026-11-15.tsv), [imf-vs-worldbank-inflation-2023.tsv](imf-vs-worldbank-inflation-2023.tsv), [imf-vs-worldbank-unemployment-2023.tsv](imf-vs-worldbank-unemployment-2023.tsv), [imf-vs-worldbank-gdp-growth-2023.tsv](imf-vs-worldbank-gdp-growth-2023.tsv), [fx-ecb-vs-erapi-2026-11-17.tsv](fx-ecb-vs-erapi-2026-11-17.tsv), [gleif-accuracy-2026-11-18.json](gleif-accuracy-2026-11-18.json), [gleif-method-compare-2026-11-18.json](gleif-method-compare-2026-11-18.json) | Raw comparison rows |
| [liquidity-compare.html](liquidity-compare.html), [macro-compare.py](macro-compare.py), [corp-search-compare.html](corp-search-compare.html) | Tools that reproduce each check |
| [CRITERIA.md](CRITERIA.md) | The official judging criteria this entry answers |

## Try it yourself
Open the [seller-check page](https://investor567768.github.io/telegraph-evaluator/seller-check.html), pick a pool, paste any Telegraph answer (plain or like "75.07M"), and compare it with both truth sources read at the same moment. No key, no install, no wallet.

## Public updates and community
| Date | Where | What |
|---|---|---|
| 17 Nov 2026 | [Telegraph Discord #showcase](https://discord.com/channels/1438396125609463881/1572225959656947774/1572225959656947774) | Build log #1: truth sources, baseline checks, live Provider test |
| 17 Nov 2026 | [Telegraph Discord #feedback](https://discord.com/channels/1438396125609463881/1572219286729007115/1572219286729007115) | Bug report: 3 issues found while testing the liquidity Intent |
| 17 Nov 2026 | [X](https://x.com/kingChrys494/status/2122669988876104176) | Public post outside the Telegraph community |
| 17 Nov 2026 | Telegraph Discord #feedback | Bug report: FX_NOW_EUR correct rate rejected, buyer given 1.00 |
| 17 Nov 2026 | [GitHub bounties #202](https://github.com/telegraphprotocol/bounties/issues/202) | /progress update |
| 18 Nov 2026 | Telegraph Discord #showcase, "Evaluator build log #1" | Tester invitation with the live seller-check page |
| 18 Nov 2026 | [PREFLIGHT issue #1](https://github.com/shreshth006/preflight-miner-config/issues/1), [#2](https://github.com/shreshth006/preflight-miner-config/issues/2) | Cross-checks of another builder's Provider |
| 18 Nov 2026 | [Issue #1 here](https://github.com/investor567768/telegraph-evaluator/issues/1) | Independent test of seller-check, bug fixed the same day |

Tutorial: [How to add a truth source to Telegraph in 15 minutes](TUTORIAL.md).

## Accounts and records
- Anjoman account wallet: `0xd020A889542a55540D13a8A4ed199cD8CF318484` (gas sponsored by Anjoman; no fees paid for uploads).
- Evaluation uploads are listed on Anjoman under the signing address shown as `0x5726…365C`.
- Coordination thread: [bounties issue #202, Web3 Native & DeFi](https://github.com/telegraphprotocol/bounties/issues/202) (claimed 15 Nov 2026).
- Eligibility: the entrant is in Nigeria; the organizers confirmed Nigeria is eligible and no KYC is required.

## Honest limits
- All 9 rows are Eligible; none is yet confirmed as frozen into a snapshot or used in a ranking.
- "Eligible" means Anjoman accepted a source as well-formed and reachable. It does not measure accuracy; the evidence pages do.
- Liquidity sources return total pool liquidity in USD, not depth at a trade size: the Intent takes no trade-size input. The organizers confirmed total liquidity is welcome.
- FX sources are daily rates, not tick-by-tick.
- The request form currently offers one macro indicator, unemployment rate. The IMF source covers annual inflation, unemployment and real GDP growth for a named year; recent years are IMF projections. The IMF uses fiscal years for some countries (India April to March), the World Bank calendar years.
- Company registry: short names ("Siemens") can match a related fund or subsidiary; companies with legal names in another script return that script, so compare `registration_id` for them; `incorporated` is GLEIF's creation date in the current legal form, not always the founding date ([EVIDENCE-corp.md](EVIDENCE-corp.md)).
- A Provider whose answer comes from the same site as a truth source will match it exactly (seen with PREFLIGHT and GeckoTerminal), which is why every Intent here has two independent sources.
- Baselines are one run each; the live tests cover one Provider, because routing sent every request to the same one.
