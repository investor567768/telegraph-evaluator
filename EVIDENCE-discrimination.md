# Discrimination test: can each checker tell right, wrong and incomplete answers apart?

Run on 2026-11-22 against https://telegraph-evaluator.vercel.app. Script: [discrimination.js](discrimination.js) (Node 18+, no key, no install).

**Scoring rules (ours, stated so they can be challenged):** CVE: correct only if equal to the reference to one decimal. Weather: correct if the maximum temperature is within 1.0 degC of the reference. Airport: correct only if the disrupted flag matches the reference. A missing answer is incomplete. When the reference has no answer, it must say so instead of guessing.

**Scope:** the submitted answers are written by us to probe the reference (right, slightly off, far off, missing). They are not answers from real miners. Real-miner evidence is in [EVIDENCE-fx-ranking.md](EVIDENCE-fx-ranking.md) and [EVIDENCE-corp.md](EVIDENCE-corp.md). The airport checker reads a live feed, so its reference changes with the day.

**Result: 31 of 31 cases behaved as expected.**

| Checker | Case | Submitted | Reference | Verdict | Expected | |
|---|---|---|---|---|---|---|
| CVE | Log4Shell: reference matches the published NIST score | 10 | 10 | correct | correct | pass |
| CVE | Log4Shell: right answer | 10 | 10 | correct | correct | pass |
| CVE | Log4Shell: off by 0.1 | 9.9 | 10 | wrong | wrong | pass |
| CVE | Log4Shell: off by 2.5 | 7.5 | 10 | wrong | wrong | pass |
| CVE | Log4Shell: no score given | null | 10 | incomplete | incomplete | pass |
| CVE | Heartbleed: reference matches the published NIST score | 7.5 | 7.5 | correct | correct | pass |
| CVE | Heartbleed: right answer | 7.5 | 7.5 | correct | correct | pass |
| CVE | Heartbleed: off by 0.1 | 7.4 | 7.5 | wrong | wrong | pass |
| CVE | Heartbleed: off by 2.5 | 5 | 7.5 | wrong | wrong | pass |
| CVE | Heartbleed: no score given | null | 7.5 | incomplete | incomplete | pass |
| CVE | EternalBlue: reference matches the published NIST score | 8.8 | 8.8 | correct | correct | pass |
| CVE | EternalBlue: right answer | 8.8 | 8.8 | correct | correct | pass |
| CVE | EternalBlue: off by 0.1 | 8.7 | 8.8 | wrong | wrong | pass |
| CVE | EternalBlue: off by 2.5 | 6.3 | 8.8 | wrong | wrong | pass |
| CVE | EternalBlue: no score given | null | 8.8 | incomplete | incomplete | pass |
| CVE | Made-up CVE: reference refuses to guess | - | 404 error | no answer | no answer | pass |
| Weather | Lagos 2024-06-15: right answer | 28 | 28 | correct | correct | pass |
| Weather | Within 1.0 degC (+0.5) | 28.5 | 28 | correct | correct | pass |
| Weather | Off by 3 degC | 31 | 28 | wrong | wrong | pass |
| Weather | No temperature given | null | 28 | incomplete | incomplete | pass |
| Weather | Same name, two places: "Lagos" vs "Lagos, Portugal" | Lagos, Nigeria | Lagos, Faro District, Portugal | - | told apart | told apart | pass |
| Weather | Future day: reference refuses to guess | - | 400 | no answer | no answer | pass |
| Airport | ATL right answer (disrupted now) | true | true | correct | correct | pass |
| Airport | ATL opposite answer | false | true | wrong | wrong | pass |
| Airport | ATL no answer given | null | true | incomplete | incomplete | pass |
| Airport | JFK right answer (no disruption now) | false | false | correct | correct | pass |
| Airport | JFK opposite answer | true | false | wrong | wrong | pass |
| Airport | JFK no answer given | null | false | incomplete | incomplete | pass |
| Airport | LOS (non-US airport): reference refuses to guess | - | 400 | no answer | no answer | pass |
| Airport | ZZZ (unknown code): reference refuses to guess | - | 400 | no answer | no answer | pass |
| Airport | DL404 (flight number only): reference refuses to guess | - | 400 | no answer | no answer | pass |
