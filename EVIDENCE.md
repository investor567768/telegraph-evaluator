# Evidence: DexScreener as a truth source for LIQUIDITY_DEPTH_VERIFY_GENERAL

Network: Telegraph testnet. Nothing here is a production or mainnet claim.

## What was submitted
- Truth source: DexScreener public API (free, no key), file [`dexscreener-liquidity.yaml`](dexscreener-liquidity.yaml).
- Intent: `LIQUIDITY_DEPTH_VERIFY_GENERAL` (asks: pool, chain; answers: liquidity_usd).
- Uploaded through the Anjoman Evaluators page on 15 Nov 2026, 15:44 Lagos (14:44 UTC).
- Result shown by Anjoman: "Sent. 1 stored, 0 already there, 0 refused." Row state: Admitted.
- Submissions are listed under 0x5726...365C; the account wallet is 0xd020A889542a55540D13a8A4ed199cD8CF318484.
- Row state changed to Eligible (seen 15 Nov 2026, 16:14 UTC). Not yet claimed: frozen into a snapshot or used in a ranking.
- Second truth source: GeckoTerminal (`geckoterminal-liquidity.yaml`), uploaded 16:16 UTC, now Eligible (seen 16 Nov 2026; [screenshot](anjoman-liquidity.png)). Its agreement with DexScreener is the baseline check below.

## Baseline check against an independent second source
Question: does DexScreener report the same pool liquidity as an unrelated provider?
Second source: GeckoTerminal public API (CoinGecko), field `reserve_in_usd`.

Method (repeatable with [`liquidity-compare.html`](liquidity-compare.html), opened in any browser):
1. Take the first 4 pools GeckoTerminal lists for each of 5 chains (Ethereum, Base, BNB Chain, Arbitrum, Polygon).
2. Ask DexScreener for the same pool addresses and read `pairs[].liquidity.usd`.
3. Difference = (DexScreener - GeckoTerminal) / GeckoTerminal.

Result, run at 2026-11-15T14:53:41Z (raw rows in [`liquidity-check-2026-11-15.tsv`](liquidity-check-2026-11-15.tsv)):

| Measure | Value |
|---|---|
| Pools checked | 20 |
| Found in both sources | 20 |
| Median absolute difference | 0.146% |
| Largest absolute difference | 0.375% |
| Within 2% | 20 of 20 |
| Pool sizes covered | $241,570 to $75.2 million |

## Live test: a real Telegraph seller checked against these truth sources (16 Nov 2026)
Pool: Uniswap v3 WETH/USDC 0.05%, Ethereum, `0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640`. Requests made from the Anjoman "New job" page with this account (free credits). Times are UTC.

| Request | How it was asked | Result | Screenshot |
|---|---|---|---|
| Q1 to Q3, about 14:20 to 14:40 | Plain-English question, intent not chosen | Failed three times: "Both lookup attempts returned empty results." DexScreener at 14:26 reported $76,586,808.79 for the same pool. | [live-test-1](live-test-1-free-text-failed.png) |
| Q4, 14:43 | Intent chosen (`LIQUIDITY_DEPTH_VERIFY_GENERAL`, pool + chain filled in) | Answered in 0.5 s by PREFLIGHT Infrastructure Signals: $77,611,767.99 | [live-test-2](live-test-2-intent-answered.png) |
| Q5, 15:05 | Same, run again | Answered in 0.8 s by PREFLIGHT: about $77.2 million, the average of $77,611,767.99, $77,275,537.61 and $76,868,432.13. Price $0.03, receipt `0xca8491…bc9cac` | [result](live-test-3-result.png), [receipt](live-test-3-receipt.png) |

Same-moment comparison for Q5:

| Source | Liquidity (USD) | Read at (UTC) | Seller's answer vs this source |
|---|---|---|---|
| PREFLIGHT (seller, Q5) | 77,251,912.58 (average of its three readings) | 15:05 | |
| DexScreener (truth source) | 76,660,660.46 | 15:06 | +0.77% |
| GeckoTerminal (truth source) | 76,868,432.13 | 15:07 | +0.50% |

Screenshots: [DexScreener](live-test-3-dexscreener.png), [GeckoTerminal](live-test-3-geckoterminal.png). The two truth sources differ from each other by 0.27%.

What this shows:
1. **The seller is within 1% of both truth sources.** Under a 2% tolerance (the agreement band found in the 20-pool baseline) this answer passes.
2. **The seller's answer includes a stale input.** One of its three readings, $77,611,767.99, is identical to the figure it gave 22 minutes earlier (Q4), while both truth sources had moved. Averaging in a stale reading pulled its answer up. A fresh truth source is what makes this visible: the seller's other reading, $76,868,432.13, matches GeckoTerminal exactly.
3. **Free-text requests failed; structured requests succeeded.** The same question failed 3 of 3 times without the intent chosen and succeeded 2 of 2 times with it. The failure is in turning the question into inputs, not in the seller. To be reported on the Telegraph feedback channel.
4. **The intent's own checker and its declared output disagree.** The New job form says this intent returns `liquidity_usd`. Telegraph's checker marked both answers "not established" because they did not include bid-ask depth or slippage. These truth sources cover `liquidity_usd` only (see limits).

Limits: one pool per chain, one seller (routing chose the same Miner every time), one afternoon. This is a live spot check, not a ranking study.

## Live test across five chains (16 Nov 2026)
Same method on one large pool per chain: ask with the intent chosen, then read both truth sources with [seller-check.html](seller-check.html) within about two minutes. Raw rows: [live-seller-test-2026-11-16.tsv](live-seller-test-2026-11-16.tsv). Every request was routed to PREFLIGHT Infrastructure Signals.

| Chain | Seller answer (USD) | DexScreener | GeckoTerminal | vs DexScreener | vs GeckoTerminal | Screenshots |
|---|---|---|---|---|---|---|
| Ethereum | 77,251,912.58 | 76,660,660.46 | 76,868,432.13 | +0.77% | +0.50% | see section above |
| Base | 3,942,594.80 | 3,925,494.23 | 3,932,471.72 | +0.44% | +0.26% | [answer](live-test-base-answer.png), [check](live-test-base-check.png) |
| BSC | 11,824,450.26 | 11,820,493.23 | 11,834,009.75 | +0.03% | −0.08% | [answer](live-test-bsc-answer.png), [check](live-test-bsc-check-first-read.png) |
| Arbitrum | 26,557,165.79 | 26,579,804.07 | 26,573,517.20 | −0.09% | −0.06% | [answer](live-test-arbitrum-answer.png), [check](live-test-arbitrum-check.png) |
| Polygon | **no number delivered** | 1,329,609.68 | 1,327,518.71 | fail | fail | [answer](live-test-polygon-answer.png), [check](live-test-polygon-check.png) |
| Polygon, retry 9 min later | 1,328,873 | 1,330,265.66 | 1,328,643.52 | −0.10% | +0.02% | [answer](live-test-polygon-retry-answer.png), [check](live-test-polygon-retry-check.png) |

Notes on the readings: for BSC, the first check screenshot was taken with the previous pool's answer still in the box, so its percentages are wrong; the liquidity readings in it (15:21 UTC, one minute after the answer) are correct and are the ones used above. A re-read 9 minutes later gave +0.10% and +0.35% ([screenshot](live-test-bsc-check-reread.png)). For Arbitrum the first check had the same mistake; the corrected re-read at 15:36 UTC is used.

Result: on the first request per chain, 4 of 5 answered within 1% of both truth sources and 1 of 5 (Polygon) returned a reply that states the total liquidity "in USD: **" with the number missing, marked by Anjoman as partly done. Both truth sources had a value for that pool at the same moment (about $1.33 million, agreeing to 0.16%). A retry 9 minutes later did return a number, within 0.10% of both truth sources; that reply said earlier attempts "failed or were cut off due to budget limits", although no spending limit was set on this job. So the missing answer was intermittent, not a pool the seller cannot serve: 5 of 6 liquidity requests delivered an accurate number, 1 of 6 delivered none. Together with the free-text failures above, the truth sources separated three kinds of outcome: an accurate answer, an answer carrying a stale input, and a missing answer.

## What this does and does not show
- It shows the two providers agree closely on pool liquidity for these pools at one moment.
- 16 of 20 differences are positive (DexScreener slightly higher). The likely cause is timing or token-price differences between the two APIs; this is not confirmed.
- The sample is GeckoTerminal's most active pools, so it leans toward large, busy pools. Small, new or illiquid pools are not yet tested.
- One run on one day. It does not show stability over time.
- Both providers index the same blockchains, so agreement confirms consistent reading of on-chain reserves; it is not a check against a pool contract directly.
- The Intent description mentions depth and slippage at a trade size, while its only answer field is `liquidity_usd`. This source answers total pool liquidity in USD. Open question with the organizers.

## Error cases (tested 15 Nov 2026, about 15:51 UTC)
What the source returns when the input is wrong, so the node never takes a false number from it.

| Case | Request | DexScreener response | What the node gets |
|---|---|---|---|
| Pool address that does not exist | `ethereum/0x0000000000000000000000000000000000000001` | HTTP 200, `{"pairs":null,"pair":null}` | No `liquidity_usd` value |
| Real pool asked on the wrong chain | `base/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640` (an Ethereum pool) | HTTP 200, `{"pairs":null,"pair":null}` | No `liquidity_usd` value |
| Chain name that does not exist | `notachain/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640` | HTTP 400 Bad Request (HTML page) | Error status |

In all three, the source gives no number at all rather than a wrong one. Per the Anjoman truth-source docs, a source that returns an error status or an unreadable answer is not counted, and if no reference exists for a question the Intent is simply not ranked that epoch, with no penalty to Providers. So a bad input cannot push a wrong reference value into a ranking through this source. (How the node's parser handles `pairs: null` specifically is inferred from those docs, not observed on the node.)

## Still to do
- Small pools (under $50,000) and a repeat run on a different day.
- Repeat the live test on more pools and chains, and with other sellers if routing allows.
