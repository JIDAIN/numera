# C2 mental route calibration — first 12-case analysis / engineering consequences

> **2026-10-09. Document-only, NOT a runtime implementation, and NOT human-timed ground truth.** Product-side detailed, tentative expert review: `JIDAIN/lys-obsidian-note/13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_研究与校准/30_历史控制变量与初评/23_C2_首轮12题路线成本对照.md`. Full arithmetic fixture source remains the Obsidian 42-case note. Only math outcomes below are verified; *mental speed rankings are model-inferred and await human review*.

## 1. Same-goal numerical fixture subset

This first pass compares route **suitability under one shared approximate goal (≤3% final relative error)**. Direct **specialty** exact-two-digit (optional third) grading is a distinct contract; never use these approximate outputs to validate exact quotient digits.

| ID | Input | Numerically valid common approximation | Approx. relative error | Preliminary method interpretation, NOT an approved winner |
| --- | --- | ---: | ---: | --- |
| D01 | 867 / 371 | 2.3 | 1.580% | Direct may favor; scaling r=7.25% at B0=400 adds a real correction chain |
| D02 | 817 / 379 | 2.2 | 2.056% | Direct and 200%+20% Split share core multiply-back; avoid artificial winner |
| D09 | 872 / 397 | 2.2 | 0.161% | Scaling zero-order Q0=872/400=2.18 already passes (~0.75%); Direct 2.2 also works |
| D12 | 294 / 37 | 8 | 0.680% | Near-multiple: 8×37=296, so very quick approximate Direct reasoning, despite exact first digit 7 |
| S01 | 492 / 689 | 0.70 | 1.972% | Split 50%+20%, Direct 0.7 and Scaling B0=700 zero-order are all plausible |
| S03 | 273 / 617 | 0.45 | 1.703% | Split 50%−5% works; Scaling B0=600 zero-order 0.455 also passes (~2.83%) but has little precision margin |
| S05 | 593 / 741 | 0.80 | 0.034% | Split 100%−20%=80% and Direct 0.8 share same 592.8 multiplication; equivalence case |
| G01 | 689 / 99 | 7 | 0.581% | Scaling B0=100 Q0=6.89 also passes (1%); near-7 Direct check 7×99=693 equally short |
| G02 | 856 / 319 | 2.7 | 0.619% | Direct/near-multiple 2.7×319=861.3 competitive with full 333 Scaling correction chain |
| G03 | 917 / 137 | 6.7 | 0.098% | Direct/near-integer 7×137−0.3×137=917.9; 143 Scaling still requires r and correction |
| E01 | 911 / 131 | 7 | 0.659% | Approximation 7 passes but **exact** first significant digit is 6; 130 zero-order scaling also passes |
| E02 | 925 / 131 | 7 | 0.865% | Approximation 7 passes; **exact** first digits are 7.0 (preserve zero); 130 zero-order scaling also passes |

**Caution**: these are *samples of reasonable plans*, not proofs of global cheapest plans. The approximate estimates above were evaluated numerically. More candidates may have equal or lower cognitive cost.

## 2. New critical model requirement: route overlap and equivalent arithmetic

A common arithmetic chain can have multiple mental interpretations:
- S05: `0.8×741 = 592.8` is both first-digit Direct validation and the numerical content of 80% Split.
- D02: Direct checking `2.2×379` overlaps with a `200%+20%` construction.
- G01: `7×99=693` is Direct neighboring-multiple estimation while `÷100` provides an almost-free Scaling baseline.

Consequences:
1. **Shared action cost**: equivalent numerical multiplication/subtraction should not receive radically different arithmetic penalties because of a route label.
2. **Recognition vs execution**: distinguishing a method's *discovery* cost from shared arithmetic cost is essential. Humans may notice 'B≈100' earlier than '7B≈A', or vice versa.
3. **Tie-aware grading**: prefer `competitive` / multiple acceptable routes when executable actions overlap; do not force a unique `recommended` if evidence does not distinguish them.
4. **Model confidence**: if the evidence is insufficient or an important alternate route was not considered, return `unresolved`.
5. **No user inference**: identical arithmetic steps do not establish a user's mental method, especially for final-answer-only comprehensive.

Proposed, pending approval:
```ts
type CandidateActionEvidence = {
  normalizedOperationSignature: string; // e.g. multiplication B×0.8
  operands: number[];
  mentalRepresentation: string;         // percent, quotient digit, nearby multiple...
  recognitionCost?: number;            // needs calibration
  arithmeticExecutionCost?: number;     // shared operation under common scale
};
type RouteOverlap = {
  actionSignatureIds: string[];
  relationship: "same_core" | "shared_subchain" | "different";
  confidence: "high" | "medium" | "unknown";
};
```

`normalizedOperationSignature` must normalize harmless decimal/percent representation changes, **not** treat arbitrary mathematical identity (every quotient is a percentage) as evidence a human recognizes them equally easily.

## 3. Quotient digit correctness is not approximate-answer correctness

D12: `294÷37≈7.9459`, common approximate `8` passes, but exact first two significant digits are **`7.9`**.
E01: `911÷131≈6.9542`, common approximate `7` passes, exact first digit **6**.
E02: `925÷131≈7.0611`, common approximate `7` passes, exact first two significant digits **`7.0`**.

A production-grade digit extractor must preserve both **the digit values and place-value metadata**, including trailing zero digits. Never parse `7.0` into the number `7` and then pretend it carries two significant digits. The frozen question should carry an exact digit vector and intended depth.

## 4. Cases that specifically guard against shortcut heuristics

- **Scaling is not just 'has a baseline'**: G02 (B0=333) and G03 (B0=143) need Q0/r/correction arithmetic before 'Scaling preferred' can be justified.
- **Scaling sometimes genuinely wins at zero order**: D09 has B0=400 and directly computes 2.18 within the current 3% target. Must model stop-at-Q0 (no mandatory correction for common-approx plan).
- **A<B does not make Split a unique winner**: S01 and S03 allow additional reasonable routes; S05 is equivalent to Direct at the fundamental multiplication.
- **An integer quotient boundary does not automatically imply high difficulty**: D12, E01 and E02 have easy nearby integer multiples even though the exact floor digit can flip.

## 5. Engineering tests / approvals still required

Before implementing any classifier that drives user-facing problem selection:
- Add deterministic arithmetic fixtures from the twelve IDs with the numeric expected outputs above, plus exact-digit vectors, literal significant zeros and common-approx true relative errors.
- Add equivalent-action fixtures for S05/D02 (and possibly S01), so classification can be **multiple reasonable choices**, never a hardcoded exclusive label.
- Test explicit zero-order plan for D09 and full Q0/r/correction for G02/G03.
- Include both near-boundary members E01/E02 with different exact first digit but the same acceptable common approximation (7).
- Manually gather *first-seen route*, executable intermediate steps, estimated effort and ideally actual timed observations. No empirical speed rankings have been collected in this pass.
- Only after this calibration, assign shared action-cost weights and advantage margins, then confirm per-method specialty difficulty separately in Obsidian.
- Keep C2 `implemented=false`, keep the current PR #16 as non-user-facing foundation; no deployment or schema migration is implied by this document.

This note is a first expert **candidate/adversarial fixture report**, not a user-signed golden output set and not a license to implement unapproved `preferred` rankings.
