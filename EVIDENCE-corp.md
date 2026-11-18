# Evidence: corporate registry truth sources (GLEIF)

**Intent:** `CORPORATE_REGISTRY_LOOKUP_GENERAL` (deterministic; asks `company`, `jurisdiction`; answers `legal_name`, `registration_id`, `active`, `jurisdiction`, `registered_address`, `incorporated`). Used by H2 missions Institutional Markets, Legal and Asset Management. Network: Telegraph testnet.

**Source:** the Global Legal Entity Identifier Foundation (GLEIF) API, `https://api.gleif.org/api/v1/lei-records`. Free, public, no key. GLEIF is the official global register of Legal Entity Identifiers, built from national business registers.

## What was uploaded

| File | Searches by | Uploaded | Row state on Anjoman |
|---|---|---|---|
| [gleif-corporate-registry.yaml](gleif-corporate-registry.yaml) | Legal name + country | 17 Nov 2026 | Eligible |
| [gleif-corporate-registry-by-number.yaml](gleif-corporate-registry-by-number.yaml) | National registration number + country | 17 Nov 2026 | Eligible |
| [gleif-corporate-registry-allnames.yaml](gleif-corporate-registry-allnames.yaml) | Legal name **and other registered names** + country | 18 Nov 2026 | Eligible |

Screenshot: [anjoman-corp.png](anjoman-corp.png). All three return the first GLEIF record only (`page[size]=1`) and map it to the Intent's six answer fields. If nothing matches, GLEIF returns an empty list, so the answer is missing rather than wrong.

## Test 1: does name search find the right company? (18 Nov 2026, 12:20 UTC)

20 well-known companies in 13 countries, each searched twice the way the truth source does: the short name a buyer might type ("Apple") and the full legal name ("Apple Inc."). A result counts as right only if the first record is the intended legal entity (checked by LEI). Raw results: [gleif-accuracy-2026-11-18.json](gleif-accuracy-2026-11-18.json).

| Input | Right company | Wrong company | Nothing found |
|---|---|---|---|
| Full legal name | 15 of 20 | 1 | 4 |
| Short name | 11 of 20 | **6** | 3 |

All three Nigerian companies (Dangote Cement, MTN Nigeria, Zenith Bank) were right both ways.

The wrong-company cases are the dangerous ones, because the record looks real and active:

| Typed | First GLEIF result |
|---|---|
| Apple | Apple Bank |
| Siemens | Siemens-Fonds Siemens-Rente (a pension fund) |
| BASF | BASF Stiftung (a foundation) |
| TotalEnergies | TotalEnergies Participations (a subsidiary) |
| Infosys | Capital Infosys |
| Petrobras | Petrobras Transporte S.A. (Transpetro) |
| Samsung Electronics Co., Ltd. | PK, Ltd. |

Japanese and Korean companies (Toyota, Sony, Samsung) found nothing by legal name: their legal names are stored in Japanese or Korean script.

**Why it matters for evaluation:** a reference that points at the wrong company would mark a Provider that answered correctly as wrong. A wrong reference is worse than none.

## Test 2: which GLEIF search works best? (18 Nov 2026, 12:27 UTC)

The same 40 inputs, searched three ways, keeping the top 5 results each time. Tool to rerun it: [corp-search-compare.html](corp-search-compare.html) (open in a browser, about 3 minutes; it paces itself under GLEIF's rate limit). Raw results: [gleif-method-compare-2026-11-18.json](gleif-method-compare-2026-11-18.json).

First result is the right company:

| GLEIF filter | Full legal name | Short name |
|---|---|---|
| `filter[entity.legalName]` (17 Nov source) | 15 right, 1 wrong, 4 none | 11 right, 6 wrong, 3 none |
| **`filter[entity.names]`** (18 Nov source) | **18 right, 0 wrong**, 2 none | 11 right, 9 wrong, 0 none |
| `filter[fulltext]` | 10 right, 8 wrong, 2 none | 6 right, 14 wrong, 0 none |

`entity.names` also searches the other names GLEIF stores, including the English names of companies whose legal name is in another script. That fixed Toyota (トヨタ自動車株式会社, "Toyota Motor Corporation"), Sony and Samsung. With full legal names it never returned a wrong company, so it was uploaded as the third source. Full-text search was worst and was dropped.

What no search setting fixes:
- **Short names stay ambiguous.** GLEIF holds 130 entities matching "Siemens" in Germany and has no way to know the parent company was meant. The new source's mapping instructions ask Telegraph to expand a well-known short name to the full legal name ("Siemens" to "Siemens Aktiengesellschaft"). Whether Telegraph applies that when it fills in the request has not been observed: the node does not show how a truth source's inputs were filled.
- **Two full names found nothing:** "Naspers Limited" (stored as "NASPERS") and "Petróleo Brasileiro S.A. - Petrobras" (stored without accents as "PETROLEO BRASILEIRO S A PETROBRAS").
- **Legal names in local script.** For Toyota the reference `legal_name` is "トヨタ自動車株式会社" while a Provider will likely answer "Toyota Motor Corporation". For such companies, `registration_id` (1803-01-018771) is the field to compare.

## Test 3: a live job (18 Nov 2026, 12:48 UTC)

Request: `company: Siemens`, `jurisdiction: Germany`. Routed to PREFLIGHT Infrastructure Signals, answered in 0.9 s, 85% confidence, based on GLEIF. Screenshot: [live-job-siemens-2026-11-18.png](live-job-siemens-2026-11-18.png).

| Field | Provider answer | GLEIF record for the intended company | Match |
|---|---|---|---|
| legal_name | Siemens Aktiengesellschaft | Siemens Aktiengesellschaft | yes |
| registration_id | W38RGI023J3WT1HWRP32 (labelled "LEI") | HRB 6684 (`entity.registeredAs`) | **no** |
| active | ACTIVE | ACTIVE | yes |
| registered_address | Werner-von-Siemens-Str. 1, München, 80333 | same record | yes |

Two findings:
1. **The Provider resolved "Siemens" better than the raw registry.** The 17 Nov legal-name source would have returned the Siemens pension fund, and a correct Provider would have been marked wrong. This is the case the all-names source and the full-name instruction are meant to fix.
2. **The Provider put the LEI in `registration_id`.** The Intent asks for the national register number. Reported to the miner's developer as [issue #2 on its repository](https://github.com/shreshth006/preflight-miner-config/issues/2).

## The `incorporated` field
GLEIF's `entity.creationDate` is the date the entity was created in its current legal form and jurisdiction, which is not always the founding date. Tesla's record shows 2024-06-14, the date it re-registered in Texas, not its 2003 founding ([screenshot](gleif-regnumber-tesla.png)). The live Siemens answer gave 1996-08-27; whether that is the company's founding date has not been checked. A Provider that reports a founding date can therefore disagree with this reference while being right.

## Limits
- 20 companies, mostly large and listed; small private companies not tested.
- Only entities that hold an LEI are covered.
- One run per test, one day.
- The full-name expansion instruction is untested on the node (see Test 2).
