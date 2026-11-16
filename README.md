# Telegraph Evaluator: liquidity and macro truth sources

**Track:** Evaluators · **Event:** Telegraph Hackathon Season II · **Network:** Telegraph testnet (nothing here is a mainnet or production claim)

**Judges: start with the five-minute guide → [JUDGES.md](JUDGES.md)**

Free, no-key public truth sources that give Telegraph a trusted reference answer for two mission-critical Intents, so the network can tell a Provider that answers correctly from one that does not. Each source comes with an independent baseline check and tested failure cases.

| Intent | Used by H2 missions | Truth sources | Row state on Anjoman | Baseline check |
|---|---|---|---|---|
| `LIQUIDITY_DEPTH_VERIFY_GENERAL` | 5: Exchange, Stablecoin, Institutional Markets, Asset Management, Web3 Native & DeFi | DexScreener, GeckoTerminal | Eligible, Eligible | 20 pools, 5 chains: median gap 0.146%, 20 of 20 within 2% |
| `MACRO_ECONOMIC_INDICATOR_GENERAL` | 5: Institutional Markets, Conflict Intelligence, Commodities, Mining & Power, Asset Management | IMF DataMapper | Admitted | Inflation, 175 countries vs World Bank: median gap 0.04 pp. Unemployment, 102 countries: median gap 0.13 pp |

## Why this matters
A ranking is only as good as its reference answer. Without one, the network cannot separate a Provider that reports a pool's real liquidity, or a country's real inflation, from one that reports a stale or invented figure, and the apps in these ten mission slots cannot trust what they pay for.

## Who this serves
- **Telegraph's ranking itself:** both Intents are marked mandatory, and a reference only counts once three independent contributors supply one.
- **Apps on the missions above** that buy liquidity or macro answers and need the best-ranked Provider to actually be right.
- **Named user:** _to be added: a real person or team, and what a wrong liquidity or inflation figure costs them today._

## Evidence
| File | What it is |
|---|---|
| [EVIDENCE.md](EVIDENCE.md) | Liquidity: what was uploaded, the 20-pool check, error cases, limits |
| [EVIDENCE-macro.md](EVIDENCE-macro.md) | Macro: what was uploaded, the 175-country check, disagreements explained, error case, limits |
| [dexscreener-liquidity.yaml](dexscreener-liquidity.yaml), [geckoterminal-liquidity.yaml](geckoterminal-liquidity.yaml), [imf-macro-indicator.yaml](imf-macro-indicator.yaml) | The truth sources exactly as uploaded |
| [liquidity-check-2026-11-15.tsv](liquidity-check-2026-11-15.tsv), [imf-vs-worldbank-inflation-2023.tsv](imf-vs-worldbank-inflation-2023.tsv), [imf-vs-worldbank-unemployment-2023.tsv](imf-vs-worldbank-unemployment-2023.tsv) | Raw comparison rows |
| [liquidity-compare.html](liquidity-compare.html), [macro-compare.py](macro-compare.py) | Tools that reproduce each check |
| [CRITERIA.md](CRITERIA.md) | The official judging criteria this entry answers |

## Accounts and records
- Anjoman account wallet: `0xd020A889542a55540D13a8A4ed199cD8CF318484` (gas sponsored by Anjoman; no fees paid for uploads).
- Evaluation uploads are listed on Anjoman under the signing address shown as `0x5726…365C`.
- Coordination thread: [bounties issue #202, Web3 Native & DeFi](https://github.com/telegraphprotocol/bounties/issues/202) (claimed 15 Nov 2026).

## Honest limits
- Rows are Eligible or Admitted; none is yet confirmed as frozen into a snapshot or used in a ranking.
- Liquidity sources return total pool liquidity in USD, not depth at a trade size: the Intent takes no trade-size input. The organizers confirmed total liquidity is welcome.
- The IMF source covers annual inflation, unemployment and real GDP growth for a named year. It has no monthly prints and no policy rates, and recent years are IMF projections.
- Each check is one run on one day.
