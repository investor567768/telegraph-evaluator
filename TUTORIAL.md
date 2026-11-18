# Tutorial: add a truth source to Telegraph in 15 minutes

This walks through how I added DexScreener as a truth source for `LIQUIDITY_DEPTH_VERIFY_GENERAL`. You can follow the same steps for any free public API and any deterministic Intent.

## What Telegraph is, and where a truth source fits

Telegraph is a marketplace for answers. A buyer asks a question, Telegraph routes it to a **Provider** (also called a Miner), and the Provider gets paid for the answer.

The hard part is knowing whether the answer was right. That's the Evaluators' job. A **truth source** is a trusted reference for one question type: Telegraph asks it the same question and compares the Provider's answer with it. Good truth sources mean accurate Providers rank higher and get more work.

```
buyer ──question──► Telegraph ──► Provider ──answer──► buyer
                        │
                        └──same question──► truth source ──► compare, then rank Providers
```

## What you need

- An Anjoman account (sign in at anjoman.ai). Uploads are free: gas is sponsored.
- A free public API that answers one Intent without a key. Find Intents with the organizers' `tb` tool or in `catalog/intents.json` in [telegraphprotocol/bounties](https://github.com/telegraphprotocol/bounties). Pick one marked deterministic (one correct answer, such as a number).
- A browser. Nothing to install.

## Step 1: check the API by hand

Open the API in your browser with a real example and find the number you need.

```
https://api.dexscreener.com/latest/dex/pairs/ethereum/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
```

The pool's USD liquidity is at `pairs` → first item → `liquidity` → `usd`. Written as a path: `pairs.0.liquidity.usd`.

Also try a wrong input (a made-up pool address). A good truth source returns nothing (`"pairs": null`) rather than a wrong number.

## Step 2: write the YAML

The truth source is one YAML file. This is the complete file I uploaded:

```yaml
version: '1'
kind: miner
id: 0
slug: truth-dexscreener-pool-liquidity
name: DexScreener pool liquidity
description: Free, public, no-key DEX data API. Returns the USD liquidity of one pool on one chain.
base_url: https://api.dexscreener.com
auth:
  type: none
endpoints:
- path: /pool-liquidity
  external_path: /latest/dex/pairs/{chain}/{pool}
  method: GET
  description: Current data for one liquidity pool. The answer is at pairs.0.liquidity.usd, in US dollars.
  intents:
  - LIQUIDITY_DEPTH_VERIFY_GENERAL
  params:
    path:
      required:
      - name: chain
        type: string
        intents: ['*']
        description: Chain slug in lower case as DexScreener names it, for example ethereum, base, bsc, arbitrum, polygon, solana.
      - name: pool
        type: string
        intents: ['*']
        description: Pool (pair) contract address on that chain, for example 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640.
intent_mapping:
  LIQUIDITY_DEPTH_VERIFY_GENERAL:
    endpoint: /pool-liquidity
    input:
      chain: { from: chain, how: lower-case DexScreener chain slug }
      pool: { from: pool, how: pool contract address }
    output:
      liquidity_usd: { path: pairs.0.liquidity.usd }
semantics:
  supported_intents:
  - LIQUIDITY_DEPTH_VERIFY_GENERAL
```

What the important parts do:

| Part | What it means |
|---|---|
| `base_url` + `external_path` | The real API address. `{chain}` and `{pool}` are filled in from the request. |
| `auth: type: none` | No API key. Truth sources must be free and keyless. |
| `intent_mapping` → `input` | How the Intent's inputs map to the API's inputs. `how` is a plain-English hint, used when inputs need translating (for example "Nigeria" to `NGA`). |
| `intent_mapping` → `output` → `path` | Where the answer sits in the API's reply. Paths can use inputs, for example `values.{indicator}.{country}.{periods}` in my IMF source. |

## Step 3: upload it

1. Go to anjoman.ai, then **Dashboard**, then **Evaluators**.
2. Tick your Intent. Check that the line "Your submissions for …" names the right Intent before uploading.
3. Choose **Truth source** and paste the YAML.
4. Click **Sign and upload this source**.

Your row appears as **Admitted** (received). After it's checked it becomes **Eligible** (valid and usable). Mine went from Admitted to Eligible within about two hours.

## Step 4: prove it's accurate

Telegraph will trust your source to judge other people, so check it against a second, independent source before anyone else relies on it.

For liquidity I compared DexScreener with GeckoTerminal on 20 pools across 5 chains: all within 2%, median gap 0.146%. For the IMF source I compared it with the World Bank for 100 to 190 countries. Details: [EVIDENCE.md](EVIDENCE.md) and [EVIDENCE-macro.md](EVIDENCE-macro.md).

## Step 5: test a real Provider with it

On Anjoman, click **New job**, then **By intent**, choose your Intent, fill in the inputs and click **Ask**. Then read your truth source at the same moment and compare.

[seller-check page](https://investor567768.github.io/telegraph-evaluator/seller-check.html) does the comparison for liquidity: open it, pick a pool, paste the Provider's answer, click **Read both sources now**.

Use **By intent**. Plain-English questions failed for me 3 times out of 3 on this Intent, while the same pool asked through **By intent** was answered every time.

## Troubleshooting

| Problem | Fix |
|---|---|
| Upload went to the wrong Intent | The page can keep the previous Intent selected. Re-tick the right one and check the "Your submissions for" line. |
| Chain names differ between APIs | Say so in the input's `how` hint. GeckoTerminal uses `eth` and `polygon_pos` where DexScreener uses `ethereum` and `polygon`. |
| API ignores filters and returns everything | Fine, as long as the output `path` selects the exact value. The IMF API does this. |
| Answer is for a year or period the source doesn't have | The path finds nothing, so the answer is missing rather than wrong. That's the safe behaviour. Write the gap in your description. |

## Costs

Uploading truth sources: free (gas sponsored). Testing a Provider: about $0.01 to $0.03 per request on testnet, paid from free credits.

## Next step

Pick a deterministic Intent that missions use and that has few truth sources, and add one. A source only starts counting once several contributors have sent one for that Intent, so every new source helps.
