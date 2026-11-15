# Evidence: DexScreener as a truth source for LIQUIDITY_DEPTH_VERIFY_GENERAL

Network: Telegraph testnet. Nothing here is a production or mainnet claim.

## What was submitted
- Truth source: DexScreener public API (free, no key), file [`dexscreener-liquidity.yaml`](dexscreener-liquidity.yaml).
- Intent: `LIQUIDITY_DEPTH_VERIFY_GENERAL` (asks: pool, chain; answers: liquidity_usd).
- Uploaded through the Anjoman Evaluators page on 15 Nov 2026, 15:44 Lagos (14:44 UTC).
- Result shown by Anjoman: "Sent. 1 stored, 0 already there, 0 refused." Row state: Admitted.
- Submissions are listed under 0x5726...365C; the account wallet is 0xd020A889542a55540D13a8A4ed199cD8CF318484.
- Not yet claimed: that the row is eligible, frozen into a snapshot, or used in a ranking.

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
- Confirm row state after the next epoch rollover.
