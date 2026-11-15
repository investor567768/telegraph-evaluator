# Telegraph Liquidity Evaluator

**Track:** Evaluators · **Intent:** `LIQUIDITY_DEPTH_VERIFY_GENERAL` · **Network:** Telegraph testnet · **Event:** Telegraph Hackathon Season II

A free, no-key truth source that tells Telegraph the correct USD liquidity of a DEX pool, so the network can mark which Providers answer liquidity questions correctly. It comes with evidence that the source agrees with an independent second provider.

## Why this matters
`LIQUIDITY_DEPTH_VERIFY` is used by 5 of the 15 Season II missions: Exchange, Stablecoin, Institutional Markets, Asset Management, and Web3 Native & DeFi. A ranking needs a trusted reference answer. Without one, the network cannot tell a Provider that reports a pool's real liquidity from one that reports a stale or invented figure, and apps in those missions cannot rely on the answer they pay for.

## What was submitted
| Item | Detail |
|---|---|
| Truth source | DexScreener public API, `https://api.dexscreener.com/latest/dex/pairs/{chain}/{pool}` |
| Answer field | `liquidity_usd`, read from `pairs[0].liquidity.usd` |
| Inputs | `chain` (for example `ethereum`, `base`, `bsc`, `arbitrum`, `polygon`) and `pool` (pool contract address) |
| File | [`dexscreener-liquidity.yaml`](dexscreener-liquidity.yaml) |
| Uploaded | 15 Nov 2026, 14:44 UTC, through the Anjoman Evaluators page |
| Anjoman response | "Sent. 1 stored, 0 already there, 0 refused." Row state: **Admitted** |

## For judges
Each row answers one line of the Evaluators scoring table in [`CRITERIA.md`](CRITERIA.md).

| Criterion (points) | Our answer | Where to check |
|---|---|---|
| Measurement validity, quality discrimination, baseline evidence (40, minimum 28) | DexScreener was compared with GeckoTerminal on 20 pools across 5 chains. Median difference 0.146%, largest 0.375%, 20 of 20 within 2%. Because two independent sources agree within 0.4%, a Provider off by more than about 1% should stand out against this reference (inferred, not yet tested on live Provider answers). | [`EVIDENCE.md`](EVIDENCE.md), [`liquidity-check-2026-11-15.tsv`](liquidity-check-2026-11-15.tsv) |
| Integrity and robustness (15) | Free public API, no key, nothing to leak. Independent of the Providers being ranked. Tested on 3 error cases (unknown pool, wrong chain, invalid chain): each returns no number or an error status, never a wrong value. Remaining gaps are listed rather than hidden. | [`EVIDENCE.md`](EVIDENCE.md), "Error cases" and "What this does and does not show" |
| Reproducibility and protocol compatibility (10) | Written in the miner YAML format; accepted by Anjoman with no refusals. Anyone can rerun the comparison by opening [`liquidity-compare.html`](liquidity-compare.html) in a browser. | Upload record above; the HTML tool |
| Useful coverage and demonstrated improvement (10) | Covers a mandatory Intent used by 5 missions, across 5 chains and pool sizes from $0.24M to $75M. Improvement in rankings is not yet measured. | [`EVIDENCE.md`](EVIDENCE.md) |
| Documentation and integration clarity (5) | This page, the evidence page, and the steps below. | This README |
| Organic growth, education, developer activation (20) | In progress: public updates and a tutorial to follow. | Links will be added here |

## Reproduce the check (2 minutes, no setup)
1. Download [`liquidity-compare.html`](liquidity-compare.html).
2. Open it in Chrome, Edge or Firefox.
3. Click **Run the check**.
4. Read the summary, or click **Copy results** for the raw rows.

To check a single pool by hand, open this address in a browser and find `"liquidity":{"usd":`:
```
https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
```

## Honest limits
- Testnet only. Nothing here is a production or customer claim.
- The source is admitted, but not yet confirmed as eligible, frozen into a snapshot, or used in a ranking.
- The Intent description mentions depth and slippage at a trade size; its only answer field is `liquidity_usd`. This source answers total pool liquidity in USD. This is an open question for the organizers.
- Tested on large, active pools on one day. Small pools and repeat runs are still to do.

## Files
| File | What it is |
|---|---|
| [`dexscreener-liquidity.yaml`](dexscreener-liquidity.yaml) | The truth source exactly as uploaded |
| [`EVIDENCE.md`](EVIDENCE.md) | Method, results and limits of the baseline check |
| [`liquidity-check-2026-11-15.tsv`](liquidity-check-2026-11-15.tsv) | Raw results of the 20-pool comparison |
| [`liquidity-compare.html`](liquidity-compare.html) | The browser tool that produced them |
| [`CRITERIA.md`](CRITERIA.md) | The official judging criteria this entry answers |
