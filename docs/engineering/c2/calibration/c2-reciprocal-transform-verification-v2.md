# C2 Direct vs Scaling — practical reciprocal transforms and 22-case verification V2

> **2026-10-09 V2.1 correction (user feedback): Δ=(named baseline−B), then Δ×k/M is frequently the cheaper mental r calculation. kB is OPTIONAL, not mandatory. Engineering design only: no runtime evaluator/generator/tests/UI/deployment changed.** New product verification owner in `JIDAIN/lys-obsidian-note`: `13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/26_C2_直除与放缩控制变量验证_V2.md`. That document includes 22 numeric traces with per-case provisional mental comparisons. All numeric traces are arithmetic checked; human reaction times and fastest-route rankings are NOT observed or approved.

## 1. Error in existing model: rounded integer denominator is not necessarily the executed operation

Existing `src/lib/c2/route-scaling.ts`:

- `SPECIAL_BASELINES=[111,125,143,167,250,333]`.
- `baselineCandidates` tags these integers as `special/easy`, and also tags *every* neighboring rounded ten/hundred/thousand candidate as easy.
- `evaluateBranch` sets `q0=a/baseline`, `r=abs(baseline-b)/baseline`, `signedRatio=(baseline-b)/baseline`.
- `totalCost` always adds a `c2NumberMentalCost(rPercent)` charge and judges the numerical *result* of q0/correction, not the human actions that compute them. This happens even when `stopStage===0`.

This is **internally mathematically consistent** for an *exact integer B0*, but **does not model the normal mental shortcut** `A/333 ≈ A×3/1000`. In the latter case the *backend mathematical reference* effective base is the rational `1000/3`, but the *human mental path* can use the nominal integer base `333` to estimate r cheaply. For B=319: 333−319=14, 14×3=42, so mental r≈4.2%; the effective transform's exact signed t is 4.3%. Both can be recorded, and the executed 4.2% chain yields an acceptable final result; **do not reject a good mental path just because r is intentionally approximate**. Thus `B=333` has t=+0.1% rather than t=0 for the exact k=3 transform. Likewise `B=143` with k=7 has t=-0.1%; `B=167` with k=6 has t=-0.2%.

This V2 does NOT suggest floating-point `333.333333` as another arbitrarily ranked numerical baseline, nor replacing precision with unverified approximations; **store the exact transformation numerator/denominator** that generated the candidate.

## 2. A route is a mental program, not a chosen integer denominator

For genuinely recognizable reciprocal shortcuts use:

```text
scale M := 1000 (later may allow 100, 10000 when justified)
factor k := an easy integer multiplier associated with a familiar reciprocal base
effective B0 := M/k   // exact rational
numerator product pA := k*A
denominator product pB := k*B
Q0 := pA/M
t  := (M-pB)/M        // signed, r=abs(t)
Q1 := Q0*(1+t)
Q2 := Q0*(1+t+t*t)   // if needed by the common task
```

Mathematical invariants assuming exact Q0/t: `err(Q0,A/B)=|t|`, `err(Q1,A/B)=t²`, `err(Q2,A/B)=|t|³`. For a named integer cue `B_nom`, the primary shortcut may instead be **`Δ=B_nom−B; r_mental_signed≈kΔ/M`**. Example `333−319=14; 14×3=42 ⇒ r≈4.2%`, no separate `319×3` required. A `kB` then `M−kB` calculation is an **optional alternative** and only charged when actually executed. Neither route includes a generic long division just to produce r.

Candidate forms must be distinguished:
- `reciprocal_multiplier`: e.g. 111≈1000/9, 125=1000/8, 143≈1000/7, 167≈1000/6, 250=1000/4, 333≈1000/3, 500=1000/2. The displayed rounded familiar base is a *recognition cue*, not the exact effective denominator.
- `round_divide`: e.g. B0=100/200/300/400/500/900. Search actual divisions of A by that baseline using factors, multiples, place value, and shortcuts; do not universally assign easy to *every* /300 or /900, and do not force an unnatural non-integer k=1000/300 as if it were one effortless multiply.
- `relation_anchor`: qB≈A, Direct's human-discoverable quotient anchor. Do not generate it by revealing the exact quotient to the hypothetical human route search; validate the guess with exact math independently.

It may be correct to search `B0=320` for `A=800` because `800/320=2.5` is genuinely mental-friendly, whereas `856/320=2.675` may need extra divisions. **Do not reject all non-catalog baselines**, but require a replayable quick calculation and recognizable anchor.

## 3. Stage-specific cost and operation reuse

```text
recognize candidate relation
→ discover an executable q0 route (kA/M or A/B0)
→ cheap estimate/bound of r needed to decide whether Q0 already suffices
   IF Q0 satisfies shared 3% target: stop without mandatory exact r or correction
   ELSE:
     compute a sufficiently accurate mental r via (B_nom−B)×k/M when simple, OR via kB then M−kB if genuinely simpler; freeze the chosen intermediate approximation
     choose result-repair or numerator-repair
     execute N×r with easy decompositions / permitted rounding
     add correction, check overall result and stop
→ compare against Direct's discoverable q and q×B / remainder path
```

- For `reciprocal_multiplier`, **`kA` is normally needed for Q0; `kB` is NOT necessarily needed for r.** A named-base delta plus `kΔ` often costs less (319 vs333: 14×3). Compare `kΔ` and `kB` paths, record the one actually used, and score its arithmetic rather than charging both. Multipliers 7/9 may be easy due to number structure or `10×−1×`.
- For zero-order, the *proof/recognition* that `|t|≤3%` may still require kB or a bounding approximation, but the engine must not unconditionally charge exact percentage extraction plus a correction multiplication.
- For first-order, rounding Q0 and t can dramatically reduce work under a permissive 3% target. A rounding-aware plan should freeze the approximate intermediate values actually used and verify `abs(q_est*B/A−1)≤0.03`. **Do not reuse ideal t² guarantee once any intermediate was rounded.**
- Keep path action DAG/shared intermediates so no operation is double billed. Recognition costs are separate from arithmetic execution, and the same algebraic result can arise through different mental substeps.
- Cost weights, “fastest route” classification, confidence margins, and L1/L2/L3 cutoffs remain unapproved; store alternative plans or unresolved outcomes until user review.

### Proposed types — NOT implemented/approved code

```ts
type ScalingTransform =
  | { kind: "reciprocal_multiplier"; k: number; scale: number; 
      label: string; effectiveBase: { numerator: number; denominator: number } }
  | { kind: "round_divide"; baseline: number; divisorDecomposition: MentalAction[] }
  | { kind: "relation"; basisFacts: string[]; actions: MentalAction[] };

type ScalingTrace = {
  candidateTransform: ScalingTransform;
  q0Chain: MentalAction[];
  rRecognitionChain: MentalAction[];        // can be bound-only for stage 0
  rMental?: number;                      // actual approximate input to compensation
  rReferenceSigned?: number;             // (M-kB)/M strict backend reference
  rBy?: "named_delta_multiply" | "whole_denominator_multiply" | "bound_only";
  correctionStage: 0 | 1 | 2;
  correctionChain: MentalAction[];          // [] for stage 0
  reusedActionIds: string[];
  arithmeticFinalEstimate: number;
  trueRelativeError: number;
  sourceGoal: "common_approx";              // Do NOT reuse for Direct exact-digit grading
  evaluatorVersion: string;
};
```

The `MentalAction` type here refers to the proposed common action contract, not existing source code. There is no user-entered route data in final-answer-only comprehensive mode.

## 4. Exact numeric checks (selected from 22 controlled cases)

| Case | Common-goal proof / comparisons | Required route-model lesson |
| --- | --- | --- |
| A01 500/230 | k=4, kB=920, t=+8%, Q0=2, Q1=2.16, ideal first-order error0.64%; trial 2.2 error1.2% | one easy correction but Direct can compete |
| A02 683/230 | same k/r, Q0=2.732, Q1=2.95056, trial 3 error1.0249% | with same r, easy nearby integer q may beat correction |
| A03 575/230 | same k/r, trial2.5 is exact | near fraction multiple can be terminal |
| B01 250/115 / B02 1000/460 | both same r=8%, Q0=2, Q1=2.16 as A01 | different k, digit shapes, and actions despite same math |
| C01 667/307 | k3; kB=921, r7.9%, Q0=2.001 | ×3 simple, not ordinary ÷333 |
| C02 286/131 | k7; kB=917, r8.3%, Q0=2.002 | ×7 may still be easy due structure |
| C03 222/102 | k9; kB=918, r8.2%, Q0=1.998 | ×9 can be 10× minus self |
| D01 856/319 | **mental** 333−319=14; 14×3→4.2%; Q0=2.568; Q1=2.675856 (error≈0.2806%); **reference** t=4.3% | delta-first r is cheaper; compare actual mental trace vs Direct 2.7 |
| D03 917/137 | **mental** 143−137=6; 6×7→4.2%; Q0=6.419; Q1=6.688598 (error≈0.0722%); **reference** t=4.1% | delta-first r remains valid; actual correction cost and Direct anchor matter |
| D04 774/333 | k3; kB=999, r+0.1%, Q0=2.322 zero-order | integer-333 r=0 would be wrong for this actual k shortcut |
| E01 200/880 | k1; r12%, Q0=0.2, Q1=0.224, ideal error1.44% | large r + simple correction |
| E03 700/293 | k3; r12.1%, Q0=2.1, Q1=2.3541, trial 2.4 error0.457% | a good correction can still lose to a quick Direct trial |
| F01 748/293 | B0=300, r2.333%, Q0≈2.493333 | zero-order mathematically passes, yet mental ÷300 can be costly |
| F02 750/293 | same r2.333%, Q0=2.5 | same r but mental Q0 much cheaper |
| F03 714/893 | B0=900, r≈0.778%, Q0≈0.793333; direct 0.8×893=714.4 | tiny r does not establish a cheap quotient |
| F04 856/319 / F05 800/319 | B0=320, same r0.3125%; Q0=2.675 vs 2.5 | easy round baseline depends jointly on numerator and divisor |

The complete 22-case numbers are in the Obsidian V2 note; do not cherry-pick a route winner from this table. **Arithmetic assertion coverage only**, no timed human studies or fastest-route label acceptance.

## 5. Production implementation gates and historical compatibility

1. Verify the transform contract has explicit exact effective base vs familiar label; **never label `A×3/1000` as the exact division `A/333`**.
2. Verify the mathematical reference `t_ref=(M−kB)/M` matches the actual shortcut transformation `q0=kA/M`, **and separately preserve allowed approximate user r** `r_mental=k(B_nom−B)/M`. Test the final estimate and its overall relative error from the actual mental chain; do not insist mental r equals backend t_ref. Keep the small nominal-base offset in reference-only audit.
3. Zero-order stop requires cheap/sufficient evidence, not unconditional r cost. Stage 1/2 only account actions actually performed, including optional r rounding.
4. Choose between true user-recognizable qB and true practical transformation plans, not the numerical smallness of r; base from 300/900 must include actual factor division cost.
5. Joint Direct-vs-Scaling comparisons run under a **shared 3% approximate goal**; Direct specialty accurate quotient digits remain separate.
6. Add explicit regression pairs A01–A04, C01–C03, D01/D03/D04, E01/E03, F01/F02/F03/F04/F05, including negative signed t cases and nominal-rounded-label baseline regressions from 111/143/167.
7. Do not reclassify original 42 numeric arithmetic fixtures as wrong; their *integer-base mathematical calculations* are valid, but *human mental shortcut fitness* and any tentative best-route labels are **not approved** until corrected and user-reviewed.
8. Update versioned evaluator and persisted evidence **only after user has approved this V2 cost model**. No source changes in this task; no merge or deployment.

### V2.1 regression pairs for quick r (NOT a new player requirement)

- **333–319**: nominal Δ14 ×3 ⇒ 4.2%, Q0=2.568, Q1=2.675856, final relative error ≈0.2806%; exact transform t_ref=4.3%. Verify that the evaluator offers this trace without charging kB.
- **143–137**: nominal Δ6 ×7 ⇒ 4.2%, Q0=6.419, Q1=6.688598, final relative error ≈0.0722%; t_ref=4.1%.
- **111–102**: Δ9×9 ⇒8.1% vs exact-transform 8.2%. **167–160**: Δ7×6 ⇒4.2% vs exact-transform 4.0%. These offsets are small but must enter backend verification especially near a precision cutoff.
- **250–230 / 125–115**: named baseline is an exact rational shortcut, so both Δ×k and kB routes produce exactly 8%; choose the lower actual mental cost.
- Include close-to-3% stop-boundary cases and joint rounding/error accumulation. The idealized squared-error formula applies only to exact t_ref; actual mental t must be judged by final numerical output.
