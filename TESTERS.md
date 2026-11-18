# Independent testers and developer activation

Who used this work, what they did, and where to verify it. All links are public. Network: Telegraph testnet.

## Invitation (18 Nov 2026)
Tester invitation posted in the Telegraph Discord showcase thread "Evaluator build log #1": open the live [seller-check page](https://investor567768.github.io/telegraph-evaluator/seller-check.html), pick a pool, paste any liquidity number, reply with the pool, the number, both sources' readings and the verdict.

## Tester 1: Fexx (OathCast), independent developer
- **What he did:** ran the live seller-check page 4 times on 18 Nov (about 11:41 to 11:50 UTC) on Ethereum and Base, then read the code. Posted results and screenshots as [issue #1 on this repository](https://github.com/investor567768/telegraph-evaluator/issues/1) ([screenshots](https://github.com/investor567768/telegraph-evaluator/issues/1#issuecomment-6977800130)).
- **What he found:** two correct verdicts, one correct refusal on a wrong chain, and a real bug: a seller answer typed as "75.07M" was read as $75.07. Plus four suggestions (show the gap between the two sources, per-source times, a zero reserve divides by zero, friendly message on HTTP 429).
- **What changed:** all of it fixed the same day in commit `1fd64a1`, which closed the issue. The page now reads k / m / b amounts, refuses anything it cannot read, shows the amount it read, gives no verdict when the two sources disagree by more than 2%, and shows each source's reply time. Live check after the fix: "75.07M" read as $75,070,000.00, within 2% of both sources ([screenshot](seller-check-v2-75.07M.png)).
- Fexx is himself an H2 entrant on the Miners and Evaluators tracks.

## Tester 2 and named user: Chrome (PREFLIGHT Infrastructure Signals), liquidity Provider
- **Who:** developer of PREFLIGHT, the Provider Telegraph routed every liquidity, macro and corporate registry request to during these tests. His miner's answers are exactly what these truth sources check.
- **What he did:** ran seller-check on the Ethereum WETH/USDC pool at 11:53 UTC on 18 Nov with his miner's answer, $75,049,059.64, against DexScreener $75,046,104.82 and GeckoTerminal $75,049,059.64: within 0.00% of both. His words in the showcase thread: "Simple and useful, nice one!" Agreed to be credited.
- **What he changed because of this work:** after our cross-check of his miner ([issue #1 on his repository](https://github.com/shreshth006/preflight-miner-config/issues/1)) he "shipped three changes from it" ([Discord message](https://discord.com/channels/1438396125609463881/1498654113376899112/1572564331273396247)). He also explained that the Polygon blank and averaged readings in our 16 Nov live test came from Telegraph's routing layer, not his miner; [EVIDENCE.md](EVIDENCE.md#live-test-across-five-chains-16-nov-2026) is corrected accordingly.
- **Why it matters to him:** a wrong or missing answer, wherever it comes from, ranks a Provider lower, and a lower rank means fewer paid jobs. His own answers held up well against the truth sources; where problems appeared, the sources helped show they came from routing, not his miner. One small open suggestion on field naming for company answers is in [issue #2](https://github.com/shreshth006/preflight-miner-config/issues/2).
- His answer matched GeckoTerminal to the cent, which suggests his miner reads GeckoTerminal directly, a sound choice. It is also why each Intent here has two independent sources: a check against one source only confirms a Provider that uses that same source.

## Work done for other builders
- **PREFLIGHT (liquidity and macro):** cross-check of 18 Nov, liquidity within 0.17% and 0.14% of the two truth sources; India 2025 unemployment matched the World Bank exactly, with the IMF fiscal-year difference explained. [Issue #1](https://github.com/shreshth006/preflight-miner-config/issues/1).
- **OathCast sanctions screening (Fexx):** six-name test on 18 Nov. All six correct, including VTB's Russian legal name taken from GLEIF. Found an unrelated bank ("VVB, PAO") scoring 0.96 to 0.98 on VTB searches, and no closest name shown on a no-match. Fexx fixed both the same day.
