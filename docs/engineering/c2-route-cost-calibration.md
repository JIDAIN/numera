# C2 Route Cost Calibration — implementation contract and 42-case index

> **State (2026-10-09): product direction synchronized; calibration fixtures are arithmetic-verified but route superiority remains HUMAN-UNLABELLED. Not implemented.** Obsidian Product Target: `13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/21_C2_三路线心算成本校准_V1.md`; full 42-case step-by-step traces: sibling `22_C2_三路线校准题集_42题.md`. This engineering map does **not** amend the product contract. UI remains unlaunched (`implemented=false`).

## 1. What must the system be able to answer?

For a natural-number division A÷B, Numera aims to help users **recognize the structure at a glance, select the route with the smallest executable mental workload, and obtain a sufficiently reliable answer quickly**. The product does not reward reciting a predetermined algorithm.

The engine must provide objective, versioned evidence for these questions:

1. Which *human-recognizable* Direct / Split / Compensated Scaling paths can be executed on this numerical structure?
2. Which pass an **identical goal-specific mathematical acceptance criterion** (for common approximate training, currently ≤3% on final result)?
3. Given those feasible paths, what steps incur recognition, arithmetic, working-memory, and verification costs?
4. Does a route genuinely dominate, compete, lose, or remain unresolved (evaluator confidence too low)?
5. After admission, what is the **separate per-specialty L1/L2/L3 difficulty** (not the route cost band)?

**Do not infer the user's actually used method from final-only comprehensive answers.** The future B-layer analysis can explain reasonable routes but is not implemented.

## 2. Separate mathematical correctness from mental cost

### Evaluation goals

```ts
type C2ComparisonGoal =
  | { kind: "common_approx"; tolerance: 0.03 }       // same target for all 3 methods
  | { kind: "direct_exact_digits"; digits: 2 | 3 };   // Direct METHOD training ONLY
```

Do not compare estimated costs across different `kind` targets. Direct specialty digit grading must use correct **truncation/quotient digits**, not rounding; third digit is **set-composed**, never triggered by 3% precision. Quotient < 1, zero second digit and integer boundary comparisons need exact-position math. Do not reuse the existing near-half-integer rounding boundary to judge exact quotient digits.

When `kind=common_approx`, use reference chains demonstrably meeting the SAME approximate goal. In comprehensive, core compression error and raw final answer error must be checked separately. Searching by known exact answer offline is allowed for *validation*, but must not make an inhuman baseline or arbitrary percent block appear naturally discoverable to a user.

### Plan evidence types (proposal, not existing source code)

```ts
type C2Route = "direct" | "split" | "scaling";
type ActionKind =
  | "recognize" | "estimate_digit" | "multiply"
  | "subtract" | "percent_convert" | "remember_intermediate"
  | "apply_correction" | "verify" | "restore_scale";
type MentalBurden = "easy" | "normal" | "hard";

type MentalAction = {
  kind: ActionKind;
  operandFacts: number[];              // explicit, replayable math inputs
  output: number;
  burden: MentalBurden;
  burdenReasons: string[];             // structure-specific tags
  workingMemorySlots?: number;
  estimatedCost?: number;              // not approved until calibrated
};

type ExecutableRoutePlan = {
  planId: string;                       // deterministic with generator version
  route: C2Route;
  comparisonGoal: C2ComparisonGoal;
  naturalRecognition: "easy" | "normal" | "hard" | "unknown";
  actions: MentalAction[];
  result: number;
  referenceQuotient: number;
  relativeError: number;
  feasible: boolean;
  estimatedTotalCost?: number;         // optional before shared-weight calibration
  explanationTags: string[];
  evaluatorVersion: string;
};

type SpecialtySuitability = {
  targetRoute: C2Route;
  status: "preferred" | "competitive" | "disfavored" | "unresolved";
  planIds: string[];
  competitorPlanIds: string[];
  reasonTags: string[];
  modelVersion: string;
};

type DirectSpecialtyDifficulty = {
  difficultyBand?: "L1" | "L2" | "L3"; // undefined until criteria approved
  exactDigits: 2 | 3;
  digits: number[];                     // retain significant 0 digit!
  digitBoundaryFacts: unknown;          // exact inequalities based on multiples
  multiplyBackFacts: unknown;
  remainderFacts: unknown;
  classificationReasonTags: string[];
};
```

Do not yet turn these proposal types into persisted schema without confirming versioning/backward compatibility. Objective generation facts, generated recommended paths, actual user-entered fields and inferred analysis must remain separate.

## 3. Search responsibilities

| Route | Candidate generation | Mandatory complete-path costs | Main false-positive danger |
| --- | --- | --- | --- |
| Direct | Significant quotient digits and plausible near-multiple checks. For exact-digit specialty, record each digit, multiply-back, remainder and optionally 3rd digit; no 3% stop | digit decision; multiply-back; subtraction/borrow; place value; intermediate remainder | tiny predicted cost because legacy evaluator stops at 1 digit or rounds 2 digits |
| Split | **Primary specialty source: 0<A<B**, treat B as 100 units (“100 buns”). Search approachable ±50/25/20/10/5% plus other reasonable fractions and remainders; 2–3 blocks main target, no unique prescribed sequence | block recognition; `B×p`; remainder update; accumulated share; precision check | >100% routes (200/300/500%) are legal but should not dominate Split *specialty* just because they are easy integer tokens |
| Scaling | Search visible round tens/hundreds/thousands + 111/125/143/167/250/333 + naturally discoverable relations; both result-repair and numerator-repair | visible B0; signed Δ; r; baseline Q0; correction multiply/adjust; if relevant second order; total check | close B0 or small r used as shortcut while Q0 / r calculation / correction itself is expensive |

**Remainders and percentages must be independently replayable.** A Split 2-block path may be more expensive than an alternative 3-block path if one `B×p` is unpleasant. Scaling's best `B0` is *not* necessarily the nearest `B0`; compare the **best human-recognizable complete chain** from each branch.

Separate *generation opportunity* from *route winner*:
- `detectObjectiveStructures` records ratio band, baseline proximity, percent structure and quotient-digit facts.
- `searchExecutablePlans` returns 0..N candidate paths, with per-path actual math.
- `calibrateMentalActions` applies **shared** comparable cost units, once weights are approved.
- `assessRouteSuitability` uses both estimated total and uncertainty; until calibrated, return `unresolved` instead of faking precedence.
- `classifySpecialtyDifficulty` runs **after** suitability, with different criteria per specialty.
- `composeSet` fulfills independent structure and difficulty quotas, prevents near-duplicate scale-transformed cores, fails explicitly on insufficient accepted candidates.

## 4. Repository implementation gaps (verified against present master source)

| Current file | Observed behavior | Required before using to select specialty questions |
| --- | --- | --- |
| `src/lib/c2/route-direct.ts` | `stopStage` derived from first/rounded second/rounded third meeting 3%; `secondDigitBoundary` near half-integer is tied to approximate error goal | Independent exact-digit trace and integer-multiple boundary; stop target fixed per generated specialty question |
| `src/lib/c2/route-split.ts` | `BASE_PERCENT_BLOCKS` includes 500,400,300,200 and scores them as `easy`; beam search finds a mathematically adequate path | Distinguish broad arithmetic search from A<B **specialty** search, include recognition & realistic `pB` costs; do not overreward >100% |
| `src/lib/c2/route-scaling.ts` | Includes natural round and special baselines, repair branches and error checks | Recalibrate visibility/recognition, actual r/Q0/correction chain; multiple candidates and human-comprehensible explanation evidence |
| `src/lib/c2/route-evaluator.ts` | Direct uses `levelRank(level)*2+hardCount*.7+normalCount*.3`, but Split and Scaling expose distinct raw `totalCost` | Replace non-comparable combined scores with a **shared mental-action accounting scale** and explicit uncertainty; keep legacy evaluator version for historical question compatibility |
| `src/lib/c2/generator.ts` | Natural-core denominators 100..999, quotient bands 0.2..5; supports method_choice/comprehensive; method-choice objects currently assign placeholder difficulty level 3 | New specialty candidate samplers; A<B Split set; 3÷2/3÷3 Direct shapes; independent difficulty admission and quotas; don't label placeholder levels as approved |
| `src/lib/c2/contract.ts` | Version `c2-v1`; `method_choice` and `comprehensive` both remain legitimate backend modes | Keep historic decode/grader compatibility; display **综合训练=`comprehensive`**, `method_choice` not a visible seventh entry |

No code or tests have been changed in this documentation phase. C2 UI is not yet public.

## 5. V1 fixed fixture index (42 samples, no route winner approved)

**Source of truth for all arithmetic chains: the Obsidian 42-case note**. This index only gives the exact input pairs for fixture wiring. Every sample has a Direct first/second digit and remainder chain, a *mathematically viable* ≤3% Split chain with ≤3 standard blocks, and a nominated Scaling B0 first-order result. Do not assume this is the best chain for either route. In particular D-group is not `direct_preferred` truth, and G-group is not an automatic `scaling_preferred` label.

| ID | A | B | Research focus (tentative) |
| --- | ---: | ---: | --- |
| D01 | 867 | 371 | 直除候选：400基准的r与修正 |
| D02 | 817 | 379 | 直除候选：400基准商较复杂 |
| D03 | 947 | 361 | 直除候选：商位与乘回 |
| D04 | 748 | 293 | 路线竞争：300基准自然 |
| D05 | 963 | 347 | 路线竞争：333特殊基准 |
| D06 | 731 | 283 | 直除候选：r修正是否经济 |
| D07 | 786 | 347 | 路线竞争：负向一阶修正 |
| D08 | 927 | 361 | 直除候选：复杂余量 |
| D09 | 872 | 397 | **反例**：接近400太明显，未必适合直除 |
| D10 | 758 | 317 | 路线竞争：333特殊基准 |
| D11 | 273 | 47 | 三位÷两位：50友好基准与较大商 |
| D12 | 294 | 37 | 三位÷两位：40友好基准与较大商 |
| S01 | 492 | 689 | A<B；50%+20%包子示例 |
| S02 | 347 | 523 | A<B；百分数比例组合 |
| S03 | 273 | 617 | A<B；50%附近反减 |
| S04 | 421 | 783 | A<B；50%+少量 |
| S05 | 593 | 741 | A<B；80%附近 |
| S06 | 362 | 579 | A<B；60%附近 |
| S07 | 635 | 873 | A<B；70%附近 |
| S08 | 714 | 893 | A<B；80%附近 |
| S09 | 243 | 419 | A<B；60%附近 |
| S10 | 472 | 627 | A<B；75%附近 |
| S11 | 519 | 847 | A<B；60%附近 |
| S12 | 448 | 713 | A<B；60%附近 |
| G01 | 689 | 99 | 整百邻近99 |
| G02 | 856 | 319 | 333特殊基准 |
| G03 | 917 | 137 | 143特殊基准 |
| G04 | 875 | 125 | 125恰为基准，r=0 |
| G05 | 827 | 167 | 167恰为基准，r=0 |
| G06 | 698 | 111 | 111恰为基准，r=0 |
| G07 | 735 | 143 | 143恰为基准，r=0 |
| G08 | 641 | 249 | 250特殊基准 |
| G09 | 774 | 333 | 333恰为基准，r=0 |
| G10 | 598 | 198 | 整百邻近198 |
| E01 | 911 | 131 | 商靠近7，下界/上界判定 |
| E02 | 925 | 131 | 与E01同分母7附近，反例对照 |
| E03 | 974 | 139 | 靠近7，143基准竞争 |
| E04 | 963 | 139 | 靠近7的另一侧 |
| E05 | 721 | 351 | 第二位0/小数字检验 |
| E06 | 609 | 301 | 第二位0及整数边界 |
| E07 | 693 | 701 | 商<1，首位9的检验 |
| E08 | 710 | 701 | 商略>1，第二位0的检验 |

**Checklist for manual labelling**: sample ID; first visible route (before reading model output); independently tried alternative routes; correct digit trace; obvious percent blocks vs just mathematically discoverable path; baseline visibility; r and correction ease; shared-goal accuracy; relative perceived mental time; permitted route set; confidence; `unresolved` reason.

## 6. Regression and quality gate

- **Arithmetic**: use reproducible rational/integer-place-value digit extraction (including 0 digits/negative signed remainders only in signed Split), verify every multiply-back, remainder, percent and first/second-order compensation; no float boundary misclassification.
- **Task isolation**: `common_approx` 3%-goal route scoring never silently replaces `direct_exact_digits` grading; dedicated specialty no 3% stopping.
- **Route validity**: complete chains achieve same goal; verify post raw-wrapper error; output explanations cannot include assumed user route.
- **Special baselines**: 111,125,143,167,250,333, round baselines and human-visible relation candidate search; avoid near-only proximity biases.
- **Split core**: A<B candidate coverage, natural 100%-reference blocks, signed blocks, realistic human block costs; >100% remains general mathematical support.
- **Set integrity**: count per class/structure, frozen method rationale and evaluator version, bounded generation attempts, fail on missing quotas, seed determinism and near-duplicate numerical skeleton detection.
- **Approval**: human-approved route-cost action weights and advantage margins **before** production `preferred/competitive` decision. Need confusion matrix against manual route labels and case-by-case failure triage; do not fabricate accuracy stats.
- **Persistence**: historical `method_choice`/comprehensive records stay readable; no new frontend difficulty or question-count controls; keep C2 `implemented=false` pending full closure.

## 7. Remaining product decisions

Shared mental-action weights; natural-baseline visibility tiers; error/uncertainty margin for `preferred/competitive/disfavored`; specific difficulty thresholds for each specialty and quotas; number of two-digit vs three-digit Direct questions; whether quantitative route comparison should use measured user timing later. **None of these are approved in V1**. Keep changes to these values explicit, separately versioned, and reviewed in Obsidian before coding.
