# FX_NOW_EUR: how Telegraph ranks EUR miners (18 to 19 Nov 2026)

Network: Telegraph testnet. Times UTC unless marked Lagos (UTC+1).

> **Correction (19 Nov 2026).** The first version of this page (18 Nov) said several miners report the rate "upside down" and are about 17% off. That was wrong. The official Intent definition allows either direction: "the live mid-market rate between the US dollar and the euro (USD/EUR or EUR/USD)" (organizers' `catalog/intents.json`). A miner answering 0.9117 euros per dollar and one answering 1.0968 dollars per euro are both giving a valid rate. The findings below are the ones that hold.

## 1. The direction of the answer is not defined, and that affects scoring
- The Intent catalog allows **USD/EUR or EUR/USD**.
- Anjoman's request form describes the input as a currency "priced against the US dollar", which suggests dollars per euro (about 1.10).
- Every EUR miner whose manifest we read stores **euros per dollar** (about 0.91): Fx Frankfurter, Coinbase FX Now, Open ER-API FX Now, ExchangeRate-API v4 FX Now; A1 Preflight returns 0.9117 as `rate` and 1.0968 as `inverse_rate` ([screenshot](live-a1-preflight-fx.png)).
- Our own truth source ([frankfurter-fx.yaml](frankfurter-fx.yaml)) reports **dollars per euro** (1.0989 on 17 Nov ECB data).

So a reference in one direction marks every correct answer in the other direction as about 17% wrong. Until the Intent fixes one direction, any scoring that compares a single number cannot be fair to both. **Suggested fix:** state the direction in the Intent (for example "US dollars per 1 euro") or accept a value and its inverse.

## 2. Telegraph's #1-ranked miner gave an answer that is wrong in either direction
- **18 Nov 16:04 UTC**, "By intent" form, `FX_NOW_EUR`, currency `EUR`, routed to **Coinbase FX Now** (miner 31009), then ranked #1 (0.990), 0.4 s, $0.01 of test funds.
- Answer: EUR as the base currency at a rate of **1.0** (euros per euro), plus unrelated rates (ADA 7.27, AED 4.03). Neither 0.91 nor 1.10 was delivered. Anjoman marked the job "partly done", while its trail also shows "Checked the result: Result verified".
- Shared receipt with full signal hash: https://anjoman.ai/shared/O4CJgFdb4GakfOvGmJj1IQ (`0xebfc75ec31812b9234b8fc8edbed836ee4c1cb5f8ac80aea9a986c361c58f400`). Screenshots: [answer](live-job-fx-eur-coinbase-answer.png), [receipt](live-job-fx-eur-coinbase-receipt.png).
- The same 1.0 figure was seen on 17 Nov ([EVIDENCE-fx.md](EVIDENCE-fx.md)).

## 3. Same value, very different scores
Both manifests store `rates.EUR` from a USD base. Called live at about 15:43 UTC on 18 Nov:

| Miner | Leaderboard score (18 Nov, latest epoch) | Value its manifest stores |
|---|---|---|
| Fx Frankfurter | 1.000 (#3) | 0.91174 ([screenshot](live-frankfurter-usd-eur.png)) |
| Coinbase FX Now | 0.710 (#11) | 0.91191 ([screenshot](live-coinbase-usd.png)) |

The values are 0.02% apart; the scores are 1.000 and 0.710.

## 4. Ranks swing between epochs without configuration changes

| Miner | 18 Nov (epoch 10/11) | 19 Nov 06:23 UTC |
|---|---|---|
| Coinbase FX Now | #11 (0.710) in epoch 10, **#1 (0.990)** in epoch 11 ([history](coinbase-scoring-history.png)) | not in top 8 |
| Open ER-API FX Now | #7 (0.920) | **#1 (1.000)** |
| ExchangeRate-API v4 | #9 (0.900) | #2 (0.970) |
| A1 Preflight | #1 (1.000) | #3 (0.960) |
| Fx Frankfurter | #3 (1.000) | #5 (0.960) |

Leaderboard snapshots: 18 Nov [page 1](leaderboard-fx-eur-p1a.png), [continued](leaderboard-fx-eur-p1b.png), [page 2](leaderboard-fx-eur-p2.png), raw list [leaderboard-fx-eur-2026-11-18.tsv](leaderboard-fx-eur-2026-11-18.tsv); 19 Nov [snapshot](leaderboard-fx-eur-2026-11-19.png).

## 5. Scores cannot be checked from Anjoman
Each scoring row has the headings "Question", "Ground truth" and "Miner answer (converted)", all empty ([screenshot](coinbase-scoring-detail-empty.png)). A buyer or evaluator cannot see what a miner was compared against.

A miner reporting a different quantity altogether, CBR FX Now (roubles per US dollar), scored 0.000, so the ranking does catch some wrong answers.

## 6. Day-2 live checks (19 Nov 2026)
Plain-language requests on Anjoman, Multi-miner ON. Times UTC.

| Time | Request | Intent detected | Miner | Answer | Correct? |
|---|---|---|---|---|---|
| 06:57 | "What is the current USD/CAD mid-market rate?" | FX_NOW_CAD | PREFLIGHT | 1.4305 CAD per USD (ECB, 18 Nov), direction stated | yes |
| 06:58 | "What is the current USD/SEK mid-market rate?" | FX_NOW_SEK | PREFLIGHT | 10.1596 SEK per USD (ECB, 18 Nov), direction stated | yes |
| 07:01 | "What is the current EUR/USD mid-market rate?" | FX_NOW_EUR | Open ER-API FX Now | "0.91125 USD per EUR ... 1 EUR is worth approximately 0.91125 USD", while also stating the miner reported 1 EUR = 1.097391 USD | **no** |

The EUR miner's value was right; the final answer inverted it and labelled the inverse as US dollars per euro, which is false in either direction (1 EUR is about 1.097 USD). Same pattern as 17 Nov, when a correct 1.10 was delivered as 1.00. Shared receipt: https://anjoman.ai/shared/lX7bbMWdryNalDOmB_EzKg. Screenshots: [CAD](live-job-fx-cad-2026-11-19.png), [SEK](live-job-fx-sek-2026-11-19.png), [EUR](live-job-fx-eur-2026-11-19.png). CAD and SEK leaderboards on 19 Nov: the same seven miners at 1.000 on both ([CAD](leaderboard-fx-cad-2026-11-19.png), [SEK](leaderboard-fx-sek-2026-11-19.png)).

## Limits
- One live job through Telegraph; routing chose the miner. Other miners' values come from calling what their manifests call, not from answers observed through Telegraph.
- How the node converts a stored value before scoring is not shown, so the cause of the score differences is not established here.
- Leaderboard snapshots are from 18 Nov about 15:34 UTC and 19 Nov 06:23 UTC.
