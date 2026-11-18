# FX_NOW_EUR: Telegraph's top-ranked answer vs the truth source (18 Nov 2026)

Network: Telegraph testnet. Times UTC. `FX_NOW_EUR` asks for the euro priced in US dollars: **US dollars per 1 euro**. The truth sources here ([frankfurter-fx.yaml](frankfurter-fx.yaml), European Central Bank; [open-er-api-fx.yaml](open-er-api-fx.yaml)) answer that directly.

## The live job
- **16:04 UTC**, "By intent" form, `FX_NOW_EUR`, currency `EUR`.
- Routed to **Coinbase FX Now** (miner id 31009), in 0.4 s, for $0.01 of test funds.
- Answer: EUR as the base currency at a rate of **1.0**, plus unrelated rates (for example ADA 7.27, AED 4.03). **No US-dollar price of the euro was delivered.** Anjoman marked the job "partly done", while its trail also shows "Checked the result: Result verified".
- Shared receipt with the full signal hash: https://anjoman.ai/shared/O4CJgFdb4GakfOvGmJj1IQ (`0xebfc75ec31812b9234b8fc8edbed836ee4c1cb5f8ac80aea9a986c361c58f400`). Screenshots: [answer](live-job-fx-eur-coinbase-answer.png), [receipt](live-job-fx-eur-coinbase-receipt.png).
- **Truth source at the same time: 1.0989 US dollars per euro** (ECB rate of 17 Nov, via Frankfurter) ([screenshot](live-truth-eur-usd.png)).

This is the same 1.0 figure seen on 17 Nov ([EVIDENCE-fx.md](EVIDENCE-fx.md)).

## How Telegraph ranked that miner
On the Anjoman leaderboard for `FX_NOW_EUR`, Coinbase FX Now was **#11 (0.710) in epoch 10** and **#1 (0.990) in epoch 11**, with no change to its configuration ([history](coinbase-scoring-history.png)). The scoring detail rows show the headings "Question", "Ground truth" and "Miner answer (converted)" with nothing under them ([screenshot](coinbase-scoring-detail-empty.png)), so the score cannot be checked from the page.

## Two miners, same value, different ranks
Each miner's published manifest says what it calls. Called live at about 15:43 UTC:

| Miner (leaderboard, latest epoch at 16:34 Lagos) | What its manifest calls | Value it stores | Truth (USD per EUR) |
|---|---|---|---|
| Fx Frankfurter (#3, 1.000) | `api.frankfurter.app/latest?from=USD&to=EUR` | `rates.EUR` = 0.91174 (euros per dollar) ([screenshot](live-frankfurter-usd-eur.png)) | 1.0989 |
| Coinbase FX Now (#11 at that time, 0.710) | `api.coinbase.com/v2/exchange-rates?currency=USD` | `rates.EUR` = 0.91191 (euros per dollar) ([screenshot](live-coinbase-usd.png)) | 1.0989 |

Both store the **inverse** quantity (euros per dollar), about 17% below the asked-for value, and agree with each other to 0.02%, yet scored 1.000 and 0.710. Leaderboard: [page 1](leaderboard-fx-eur-p1a.png), [page 1 continued](leaderboard-fx-eur-p1b.png), [page 2](leaderboard-fx-eur-p2.png); raw list [leaderboard-fx-eur-2026-11-18.tsv](leaderboard-fx-eur-2026-11-18.tsv).

A miner reporting a completely different quantity, CBR FX Now (roubles per US dollar), was scored 0.000, so the ranking does catch some wrong answers.

## What this shows
- The highest-ranked `FX_NOW_EUR` miner at the time delivered no usable answer through Telegraph, and the truth source gives the right value at the same moment.
- Scores on this Intent moved sharply between epochs without a configuration change, and two miners storing the same inverted value received very different scores.

## Limits
- One live job; routing chose the miner. The Frankfurter miner's value is from its manifest's own call, not observed through Telegraph.
- How the node converts a miner's stored value before scoring is not shown on Anjoman, so the cause of the score differences is not established here.
- The leaderboard is a snapshot taken 18 Nov at about 15:34 UTC.
