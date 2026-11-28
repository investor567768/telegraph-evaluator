# For judges (Evaluators track)

Live site: **https://telegraph-evaluator.vercel.app** (try every source there). All sources are free, keyless and accepted ("Eligible") by Telegraph's evaluator pools.

| What the rules prioritise | Our evidence |
|---|---|
| **Enabling the most distinct commercial missions** | Truth sources on 13 Intents that together appear in **all 15 of 15** missions: TASK_EXECUTION_QUALITY_GENERAL, SHIPMENT_DELAY_RISK_GENERAL, B2B_IDENTITY_ENRICHMENT_GENERAL, FX_NOW_EUR, FX_NOW_CAD, FX_NOW_SEK, MACRO_ECONOMIC_INDICATOR, LIQUIDITY_DEPTH_VERIFY_GENERAL, CORPORATE_REGISTRY_LOOKUP_GENERAL, WEATHER_FORECAST_VERIFY_GENERAL, VULNERABILITY_TRIAGE_GENERAL, CVE_LOOKUP_CVSS, TRAVEL_DISRUPTION_GENERAL |
| **Meeting missing mission-critical Intent needs** | TRAVEL_DISRUPTION_GENERAL (mission 15) had 2 of the 3 contributors it needs to count; ours completed it on 21 Nov 2026 |
| **Proven measurement improvement** | Caught a miner answering EUR/USD inverted (0.91 instead of 1.097) and the #1-ranked miner answering "rate 1.0" ([FX evidence](EVIDENCE-fx-ranking.md)). Each new checker fixes a known weakness of the plain source: CVE takes NIST's own score on purpose, not whichever is listed first; weather resolves place names ("Lagos" vs "Lagos, Portugal") and covers any day back to 1940; travel ignores closures that don't affect airline flights (for example "closed to transient general aviation") |
| **Independently checked** | Tested by other builders: Fexx (OathCast) and Chrome (PREFLIGHT); one bug found and fixed the same day ([testers](TESTERS.md)) |
| **Technical quality** | Every answer says where it came from; unknown or unfinished cases return an error, never a guess; tests in `test/` (`npm test`) |

Public posts on X: [first post](https://x.com/kingChrys494/status/2122669988876104176), [3-minute demo video](https://x.com/kingChrys494/status/2123346766846206144) and the [21 Nov update with the live checkers](https://x.com/kingChrys494/status/2124070054975189012).

---

# Telegraph Evaluator: liquidity, macro, FX, company-registry, CVE, weather and airport truth sources

**Track:** Evaluators · **Event:** Telegraph Hackathon Season II · **Network:** Telegraph testnet (nothing here is a mainnet or production claim)

**Judges: start with the five-minute guide → [JUDGES.md](JUDGES.md)** · **3-minute demo video:** [on X](https://x.com/kingChrys494/status/2123346766846206144) · [file in this repo](demo.mp4)

Free, no-key public truth sources that give Telegraph a trusted reference answer for mission-critical Intents, so the network can tell a Provider that answers correctly from one that does not. Each source comes with an independent baseline check and tested failure cases.

## Results at a glance
- **9 truth sources** (6 Intents) uploaded first, covering **10 of the 15 H2 missions**, all **Eligible**. The three live checkers added on 20 to 21 Nov (below) add 4 more Intents and bring the total to **10 Intents covering all 15 of 15 missions**; the B2B identity checker added on 25 Nov makes 11; Digitraffic port calls (26 Nov) and the delivery check (27 Nov) make 13. Screenshots: [liquidity](anjoman-liquidity.png), [macro](anjoman-macro.png), [FX](anjoman-fx.png), [company registry](anjoman-corp.png).
- **Accuracy against an independent second source:** 20 pools on 5 chains, all within 2% ([EVIDENCE.md](EVIDENCE.md)); inflation, unemployment and GDP growth for 102 to 189 countries, median gap 0.04 to 0.13 points ([EVIDENCE-macro.md](EVIDENCE-macro.md)); 29 currencies, median gap 0.15% ([EVIDENCE-fx.md](EVIDENCE-fx.md)).
- **Company registry, measured and improved (18 Nov):** the first name search found the right company for 15 of 20 full legal names and 1 wrong one. A tested change to GLEIF's all-names search raised that to **18 of 20 with no wrong company**, and fixed Japanese and Korean names ([EVIDENCE-corp.md](EVIDENCE-corp.md)).
- **Preference pairs for four new areas (26 Nov):** 125 rows uploaded to Intents that had only one contributor: `SHIPMENT_DELAY_RISK_GENERAL` (20 pairs built on documented disruptions such as the 2021 Suez blockage, the 2021 LA/Long Beach backlog and the 2024 Red Sea diversions), `REGRESSION_VERIFY_GENERAL` (41 pairs; every test was executed, so each verdict is proven) `WAREHOUSE_INVENTORY_GENERAL` (22 pairs; every count recalculated by a second script) and `DATACENTER_TELEMETRY_VERIFY_GENERAL` (22 pairs on PUE, rack inlet temperature against the ASHRAE recommended 18 to 27 °C range, and generator readiness; readings are given in the question and each answer is calculated). All show **Admitted** on Anjoman and are checked at the next epoch rollover. One regression pair was rejected as a near duplicate. Files: [pairs/](pairs/).
- **Two new truth sources (26 and 27 Nov):** `SHIPMENT_DELAY_RISK_GENERAL` now has a live source as well as pairs: Fintraffic Digitraffic port calls (planned and actual arrival and departure times for every ship call at Finnish ports, no key) ([digitraffic-truth-source.yaml](digitraffic-truth-source.yaml)). `TASK_EXECUTION_QUALITY_GENERAL` uses this repo's delivery checker: it takes the order an agent was given and the report it delivered, checks each claim against GLEIF and returns accept, reject or hold with a score ([delivery-check-truth-evaluator.yaml](delivery-check-truth-evaluator.yaml)). Anyone can try it on the homepage with **Check your own**; a live test on Apple Inc. (not one of the built-in Siemens samples) returned **accept**, score 1.
- **Preference pairs for B2B identity enrichment (24 Nov):** 4 pairs submitted for `B2B_IDENTITY_ENRICHMENT_GENERAL`, all **Eligible** on Anjoman. Each pair has a prompt, a better answer and a worse one. The better answers state only what a public source supports (for example, an employee count is given as a range when sources disagree, and a reserved `.example` domain returns "no company can be identified"). The worse answers invent exact figures, registration numbers or a CEO. These are pairs, not a live truth source, and we wrote them ourselves. Three were uploaded as a file ([b2b-pairs.jsonl](b2b-pairs.jsonl)) and one was added by hand in the form.
- **Live tests through Telegraph:** liquidity on 5 chains, every delivered answer within 1% and 1 missing answer caught (traced to routing); FX, a correct 1.10 answer replaced by Telegraph with 1.00; company registry, "Siemens" resolved to the right company.
- **Day-2 live checks (19 Nov):** USD/CAD 1.4305 and USD/SEK 10.1596 delivered correctly; a USD/EUR answer stated "1 EUR is worth 0.91125 USD" although the miner had returned 1 EUR = 1.097391 USD ([EVIDENCE-fx-ranking.md](EVIDENCE-fx-ranking.md#6-day-2-live-checks-19-nov-2026)).
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
| [dexscreener-liquidity.yaml](dexscreener-liquidity.yaml), [geckoterminal-liquidity.yaml](geckoterminal-liquidity.yaml), [imf-macro-indicator.yaml](imf-macro-indicator.yaml), [worldbank-macro-indicator.yaml](worldbank-macro-indicator.yaml), [frankfurter-fx.yaml](frankfurter-fx.yaml), [open-er-api-fx.yaml](open-er-api-fx.yaml), [gleif-corporate-registry.yaml](gleif-corporate-registry.yaml), [gleif-corporate-registry-by-number.yaml](gleif-corporate-registry-by-number.yaml), [gleif-corporate-registry-allnames.yaml](gleif-corporate-registry-allnames.yaml), [digitraffic-truth-source.yaml](digitraffic-truth-source.yaml), [delivery-check-truth-evaluator.yaml](delivery-check-truth-evaluator.yaml) | The truth sources exactly as uploaded |
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
| 18 Nov 2026 | [Telegraph Discord #feedback](https://discord.com/channels/1438396125609463881/1572623052196544652/1572623052196544652) | Routing: routed answers differ from the miner's direct answers ([ROUTING-EXAMPLES.md](ROUTING-EXAMPLES.md)) |
| 18 Nov 2026 | [Telegraph Discord #feedback](https://discord.com/channels/1438396125609463881/1572649494619623606/1572649494619623606) | FX_NOW_EUR ranking findings; public correction posted 19 Nov |
| 19 Nov 2026 | [X](https://x.com/kingChrys494/status/2123346766846206144), [Discord #showcase](https://discord.com/channels/1438396125609463881/1572225959656947774/1572907047811420281) | 3-minute demo video |
| 28 Nov 2026 | [X](https://x.com/kingChrys494/status/2126620061179769134), [Discord #showcase](https://discord.com/channels/1438396125609463881/1572225959656947774/1576180529160786060) | Update with a 30-second clip: truth sources grew from 9 to 13 Intents (all 15 of 15 missions), live FAA airport status, Finnish port arrivals and datacenter telemetry pairs added, how-it-works section and a menu for phones. The Discord post invites independent testing |

Tutorial: [How to add a truth source to Telegraph in 15 minutes](TUTORIAL.md).

## Accounts and records
- Anjoman account wallet: `0xd020A889542a55540D13a8A4ed199cD8CF318484` (gas sponsored by Anjoman; no fees paid for uploads).
- Evaluation uploads are listed on Anjoman under the signing address shown as `0x5726…365C`.
- Coordination thread: [bounties issue #202, Web3 Native & DeFi](https://github.com/telegraphprotocol/bounties/issues/202) (claimed 15 Nov 2026).
- Eligibility: the entrant is in Nigeria; the organizers confirmed Nigeria is eligible and no KYC is required.

## Delivery check: did the agent do the job it was paid for? (commercial use case #8, added 26 Nov 2026)

An independent evaluator for agent commerce. A buyer orders a company due diligence report from an agent; before the agent is paid, the evaluator checks the report against the public register (GLEIF) and returns the same decision an ACP evaluator makes: **complete** (pay the agent) or **reject** (refund the buyer). Answers the `TASK_EXECUTION_QUALITY_GENERAL` Intent (`verdict`, `reason`, `score`).

One order (due diligence on Siemens Aktiengesellschaft: legal name, LEI, registration number, jurisdiction, status, registered address), three reports. Click each; the register is queried live:

| Report | What is in it | Verdict | Open it |
|---|---|---|---|
| Correct | All six fields right | **accept**, score 1, ACP *complete* | [/api/delivery-check?sample=correct](https://telegraph-evaluator.vercel.app/api/delivery-check?sample=correct) |
| Incorrect | Gives the LEI as the registration number (a mistake a real agent made on 18 Nov) and a wrong address | **reject_incorrect**, score 0, ACP *reject*: shows each claim beside the register value | [/api/delivery-check?sample=incorrect](https://telegraph-evaluator.vercel.app/api/delivery-check?sample=incorrect) |
| Incomplete | Nothing wrong, but 3 of the 6 requested fields are missing | **reject_incomplete**, score 0.5, ACP *reject*: names the missing fields | [/api/delivery-check?sample=incomplete](https://telegraph-evaluator.vercel.app/api/delivery-check?sample=incomplete) |

Check your own: `POST /api/delivery-check` with `{"task": {"company": "...", "required": ["legal_name","lei",...]}, "result": "Legal name: ...\nLEI: ..."}` (the report can be JSON or "Field: value" lines).

How it decides, in order: any claim the register contradicts rejects the job as incorrect; otherwise any missing required field rejects it as incomplete; otherwise it accepts. The company is identified from the **order**, never from the report, so a wrong report cannot choose what it is checked against. If the order is ambiguous (for example just "Siemens", which matches 130 entities) it gives no verdict rather than guessing. Claims the register cannot confirm (revenue, CEO, employees, tax ID) are listed as *not checked*, never counted as right or wrong.

Honest limits: this checks the fields a public register holds. It does not judge a report's analysis or opinions. It runs as a sandbox evaluator with ACP's complete/reject logic; it is not registered as an evaluator address on Virtuals. Tests: [test/delivery-check.test.js](test/delivery-check.test.js).

## Honest limits
- All 9 rows are Eligible. Anjoman paid an "Evaluator · material" reward for epoch 13 ($0.0054 test USDC, [screenshot](anjoman-evaluator-reward.png)), which shows the material is in use; how much it moved any ranking is not shown by Anjoman.
- "Eligible" means Anjoman accepted a source as well-formed and reachable. It does not measure accuracy; the evidence pages do.
- Liquidity sources return total pool liquidity in USD, not depth at a trade size: the Intent takes no trade-size input. The organizers confirmed total liquidity is welcome.
- FX sources are daily rates, not tick-by-tick.
- The request form currently offers one macro indicator, unemployment rate. The IMF source covers annual inflation, unemployment and real GDP growth for a named year; recent years are IMF projections. The IMF uses fiscal years for some countries (India April to March), the World Bank calendar years.
- Company registry: short names ("Siemens") can match a related fund or subsidiary; companies with legal names in another script return that script, so compare `registration_id` for them; `incorporated` is GLEIF's creation date in the current legal form, not always the founding date ([EVIDENCE-corp.md](EVIDENCE-corp.md)).
- A Provider whose answer comes from the same site as a truth source will match it exactly (seen with PREFLIGHT and GeckoTerminal), which is why every Intent here has two independent sources.
- Baselines are one run each; the live tests cover one Provider, because routing sent every request to the same one.

## Live truth-source checkers (added 21 to 25 Nov 2026)

Four truth sources run as small public endpoints on this repo's site, **[telegraph-evaluator.vercel.app](https://telegraph-evaluator.vercel.app)**, where anyone can try them:

| Checker | Intents | Reference | Code |
|---|---|---|---|
| CVE severity score | `CVE_LOOKUP_CVSS`, `VULNERABILITY_TRIAGE_GENERAL` | NIST National Vulnerability Database (NIST's own score first), CVE.org as fallback | [api/truth/cve.js](api/truth/cve.js) |
| Observed weather on a past day | `WEATHER_FORECAST_VERIFY_GENERAL` | Open-Meteo, with its own place search; any day back to 1940 | [api/truth/weather.js](api/truth/weather.js) |
| Disruption at a US airport right now | `TRAVEL_DISRUPTION_GENERAL` | FAA National Airspace System status feed (nasstatus.faa.gov). Scope: US airports, airport-level disruption, not individual flight numbers | [api/truth/travel.js](api/truth/travel.js) |
| Who is behind a company domain (added 25 Nov, admitted on Anjoman) | `B2B_IDENTITY_ENRICHMENT_GENERAL` | DNS (does the domain exist; reserved `.example`-type domains are never a business), Wikidata (the company whose official website is this domain: HQ, employees with their date, industry, current CEO, LEI), then GLEIF with that LEI (legal name, registration number and authority, addresses). Scope: companies on Wikidata with this website; tax ID is always `not_verifiable`; employee figures that disagree for the same year come back as a range | [api/truth/b2b.js](api/truth/b2b.js) |

Every answer says where it came from (which organisation scored the CVE, or which place, coordinates and data set were used). Unknown, unscored or unfinished cases return an error rather than a guess. Tests: `npm test`.

Note: the first CVE version briefly ran from the miner's site (telegraph-provider) on 20 Nov. It was moved here on 21 Nov so each track's code lives in its own repo.

