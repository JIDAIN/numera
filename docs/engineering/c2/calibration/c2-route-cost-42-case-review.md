# C2 three-route mental-cost calibration — complete 42-case review handoff

> Status 2026-10-09: **All 42 cases now have an assistant-authored, explainable route comparison, but NO human-timed route ranking or user-approved specialty-admission labels.** Documentation only; no code, grading, database schema, deployed UI, or production classifier has changed. Obsidian is product-owner context.

## Product design and review navigation

All files live in `JIDAIN/lys-obsidian-note`:

- `13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_除法综合.md` — product C2 owner.
- `21_C2_三路线心算成本校准_V1.md` — agreed method semantics, goal isolation, proposed cost model (no numeric weights).
- `22_C2_三路线校准题集_42题.md` — original 42 arithmetic reference chains, machine arithmetic checked.
- `23_C2_首轮12题路线成本对照.md` — twelve assistant expert comparisons.
- `24_C2_其余30题路线成本逐题初评.md` — all thirty remaining assistant expert comparisons.
- **`25_C2_42题路线校准总表_待用户核验.md`** — final user-facing review index, 42 provisional observations, attention flags, sign-off fields.

This engineering note and [the initial calibration specification](./c2-route-cost-calibration.md) / [12-case engineering report](./c2-route-cost-first-pass.md) serve as implementation maps, not replacements for Obsidian decisions.

## Completion ledger

| Deliverable | What is complete | What is expressly NOT complete |
| --- | --- | --- |
| D group | 12 cases have mathematical traces + route comparison | 12 are **not** all Direct-preferred |
| S group | 12 A<B cases have 100-buns/percent traces + route comparison | A<B does **not** imply Split-exclusive |
| G group | 10 baseline cases have first-order mathematical traces + special-base comparisons | r=0 does **not** imply cheapest Scaling route |
| E group | 8 boundary/zero-digit cases have both exact-digit and approximate perspectives | approximate success is **not** exact-digit correctness |
| Summary | 42 assistant analyses complete (first 12 + remaining 30), common-approx answer math verified ≤3% | 0/42 verified by actual user route preference / timed trial; **no gold winner labels** |

### Existing relevant implementation gaps

1. `route-direct.ts` uses old 3%-based stop and rounded second estimate, not accurate digit traces.
2. `route-evaluator.ts` compares Direct synthetic costs with Split/Scaling's separately weighted `totalCost`; scales are not calibrated.
3. `route-split.ts` includes 200/300/400/500% as friendly block candidates. Those may be mathematically valid but are **not** the A<B 100-buns Split specialty's central generation strategy.
4. `route-scaling.ts` can find math candidates, but true **human baseline recognition**, `Q0`, r, correction cost, both result/numerator branches, and zero-order stop need calibrated accounting.
5. `generator.ts` should use method-suitability admission **before** method-specific L1/L2/L3 difficulty; do not use route kind as difficulty or assign placeholder level 3 as approved.
6. `method_choice` remains internal-compatible; visible 综合训练 = `comprehensive`, with future objective route explanation; keep C2 `implemented=false`.

## Numeric regression targets to be written only after engine contracts are approved

These are **arithmetic truth/behavioral invariants**, *not* unapproved golden fastest-route assertions.

| Cluster | IDs | Expected guardrail |
| --- | --- | --- |
| Zero-order scaling where already enough | D04, D09, S04, S07, S08, S12, G01, G08, G10, E05, E06, E07, E08 | Under shared approximate ≤3% target, do not mandate r or 1st-order correction if truly visible baseline Q0 already passes; verify exact comparison, including S07's 3% boundary |
| Special denominator, r=0 but Q0 may cost | G04, G05, G06, G07, G09 | Avoid inference `r === 0 ⇒ cheap Scaling`; compare discoverability and quotient arithmetic |
| A<B Split primary, sometimes crowded by other routes | S01–S12 (especially S04, S08, S12) | Percent-block candidates valid and natural but do not force Split as sole recommendation |
| Method overlap / common multiplication | D02, D03, D05, D07, D11, S05, S08, S11, G04, G10 | Model path discovery separate from arithmetic execution; same mathematical output may have different operations, plus acceptable near-tie outcomes |
| Exact quotient digits vs approximation | D12, E01, E02, E03, E04, E05, E06, E07, E08 | Verify first/second significant digits incl. zeros and scale; nearby integer approximation may pass 3% but is not exact digit |
| Visible but costly correction | D01, D06, D08, D10, G02, G03 | Do not choose Scaling merely from B≈B0; include Q0/r/correction arithmetic |
| Blocks/percent type vs difficulty | S02, S06, S07, S09, S10 | 2 vs 3 blocks is not a universal L1/L2/L3 rule; validate each pB and remainder cost |

**Critical**: recognizing an equivalence in mathematical multiplication does NOT prove equal cognitive time. For example the Split plan `100%−20%` invokes subtraction after a 20%-value; a Direct `0.8 B` may mentally multiply 8B and rescale. Score the actual action chain; permit route ties or unresolved evidence.

## Next formal gate, pending user's final review

1. User reviews **Obsidian 25 total index** and disputed per-case explanations, may add more natural overlooked routes.
2. Resolve `unresolved` candidates and decide whether multiple recommended/acceptable routes are allowed in each category (the product principle says multiple reasonable routes must remain possible).
3. Calibrate human-recognizable actions and shared cost weight units on approved examples, then define quantitative preferred/competitive/disfavored margins **with uncertainty**; version the model.
4. Approve Direct method L1/L2/L3 numeric rules/quotas separately, followed by Split, Scaling, r, N×r and Comprehensive.
5. Only then implement/test new evaluator, admission classifier and specialty generators, preserving legacy preset/grading and keeping C2 closed until acceptance.

**Never write the assistant's provisional route labels into production tests as gold labels before user sign-off.** The arithmetic digit/percent/correction facts are usable as test inputs; cognitive winner rankings are not.
