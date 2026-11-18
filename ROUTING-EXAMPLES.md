# Routed answers from the 16 Nov 2026 live tests

What a buyer received through Telegraph for two cases discussed in the Telegraph Discord on 18 Nov: the missing Polygon value and the averaged Ethereum reading. This is the **routed side only**; the direct Miner side is held by the Miner's developer. Times are UTC (Anjoman shows Lagos time, UTC+1). Network: Telegraph testnet. All requests used the "By intent" form for `LIQUIDITY_DEPTH_VERIFY_GENERAL` and were routed to PREFLIGHT Infrastructure Signals.

## Case 1: Ethereum, averaged reading
Pool `0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640`, chain `ethereum`.

| Request | Time (UTC) | Routed answer | Receipt |
|---|---|---|---|
| Q4 | 14:43 | $77,611,767.99 (0.5 s) | not captured ([screenshot](live-test-2-intent-answered.png)) |
| Q5 | 15:05 | "approximately $77.2 million (averaging the reported values of $77,611,767.99, $77,275,537.61, and $76,868,432.13)" (0.8 s, $0.03) | `0xca8491…bc9cac` ([result](live-test-3-result.png), [receipt](live-test-3-receipt.png)) |

At 15:06 to 15:07 UTC DexScreener read $76,660,660.46 and GeckoTerminal $76,868,432.13. One of the three averaged values equals the Q4 answer from 22 minutes earlier; another equals GeckoTerminal exactly.

## Case 2: Polygon, missing value then retry
Pool `0x9b08288c3be4f62bbf8d1c20ac9c5e6f9467d8b7`, chain `polygon`, same job thread.

| Request | Time (UTC) | Routed answer | Receipt |
|---|---|---|---|
| Q1 | 15:42 | "The data returned only provides the total liquidity in USD: **" (number missing). Anjoman: "Only part of this job was done" (0.3 s) | not captured ([screenshot](live-test-polygon-answer.png)) |
| Q2 | 15:51 | "A provider returned only the total liquidity in USD (1,328,873)" and "Multiple attempts to retrieve this information failed or were cut off due to budget limits" (0.3 s, $0.01). No spending limit was set. | `0xa3318a…8644cb` ([screenshot](live-test-polygon-retry-answer.png), [receipt](polygon-receipt-2026-11-16.png)) |

The job's "Copy technical details (JSON)" returns `{"liquidity_usd": 1328873}`. At 15:48:45 UTC, between Q1 and Q2, DexScreener read $1,329,609.68 and GeckoTerminal $1,327,518.71.

The receipt's "Why this miner" text says the router read the request as asking for "the current price and active price range (or tick range)" and passed the full question to the Miner in a `query` parameter, alongside `pool` and `chain`. That may be relevant to why some answers were marked incomplete.

Receipt codes are shown shortened on Anjoman; full values were not available from the job page.
