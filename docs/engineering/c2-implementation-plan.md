# C2 Engineering Implementation Plan

> Status: **runtime foundation merged; dedicated non-user-facing renderer foundation in progress on PR #16**.  
> Product Target owner: Obsidian `13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_除法综合.md`.  
> This document maps the confirmed product design onto current Numera runtime. It does **not** redefine C2 product semantics and does not prove implementation.

## Product decision 2026-10-08 — six entries and comprehensive analysis

The Obsidian C2 owner is authoritative. **Confirmed target; not an assertion of completed UI.**

- C2 category click expands **Direct / Split / Compensated Scaling / solve-r / N×r / 综合训练**; category click does not start a session. Selecting one of the six directly starts its training. No front-end L1/L2/L3, question-count, route-level or quota selector.
- Visible **综合训练** maps to backend **`comprehensive`**, **not** `method_choice`. Show raw division (no displayed core or prechosen route), accept numeric final answer, check final relative error against the raw exact quotient (≤3%).
- The **future explanation module** (not yet implemented) should expose sensible calculation cores, compare the objective Direct / Split / Scaling route landscape, recommend reasonable routes and show executable calculation chains. Reuse shared objective evaluation behind `method_choice` where valid; **do not** impose the click-to-select-method interaction on comprehensive training and do not infer user-selected method from a numeric answer.
- Keep `method_choice` backend mode, grader and legacy frozen preset compatibility; it is not a seventh visible C2 entry. Existing renderer support is infrastructure, not a product-launch decision.
- **Route kind** (Direct / Split / Scaling), **route cost** (`low/medium/high` per route per core), and **training difficulty** (L1/L2/L3 within each of the six specialties) are separate concepts. Never map the three methods to difficulty or claim a per-mode classifier is confirmed. Design and approve each specialty's concrete admission rules, numeric fixtures, composition and quotas **one by one before implementation**; generation orchestration is pending.
- Preserve `implemented=false` and no C2 production exposure until the complete entry/generation/diagnostic contract is fulfilled.

Historical four backend mode identities below remain valid as engineering identities, **not four separate frontend entry categories**.

---

> **Detailed route-cost engineering calibration, interfaces, gap assessment and indexed 42 arithmetic cases**: [C2 Route Cost Calibration](./c2-route-cost-calibration.md). **Complete provisional 42-case comparison (12+30; waiting for user review)**: [42-Case Review](./c2-route-cost-42-case-review.md), with [First Pass](./c2-route-cost-first-pass.md) kept as detailed initial examples; these are not observed fastest-route ground truth. Product owner remains the Obsidian C2 files `20_C2_除法综合.md`, `21_C2_三路线心算成本校准_V1.md` and `22_C2_三路线校准题集_42题.md`. Sample route labels, numerical cost weights and admission thresholds are **not yet approved**.

> C2 mental-r shortcut revision (2026-10-09): when a known special named baseline is used, check nominal delta times its shortcut multiplier, e.g. 333 - 319 = 14 and 14 x 3 -> r about 4.2%. Do not force the alternate 319 x 3 route; preserve approximate mental r and separately validate actual final error. See [V2.1 control verification](./c2-reciprocal-transform-verification-v2.md). No code implementation implied.

> **Numeric authenticity correction V3 (2026-10-09):** [Realistic Numerators/Truncation](./c2-natural-number-truncation-v3.md) supersedes the **representativeness** of control-variate examples such as 500/230 (not their math utility). The new 20-case audit separates 16 source lecture exercises from four explicitly constructed truncated raw-data ratios. Generate natural candidate numbers first; do not choose numerator values merely to make reciprocal Q0 an integer.

## 0.1 C2 method suitability and fast-route selection — design synchronization (2026-10-09)

**Status: product principles confirmed in the Obsidian C2 owner; engineering details below are a proposed implementable mapping, not working code, and no empirical cost weights or specialty-level difficulty quotas have been approved.**

### Objective and two different task contracts

Numera is training rapid **number-structure recognition → identification of a low-mental-cost method → reliable fast execution**, not forcing users to apply the same algorithm to every expression. Route choice is based on **complete executable mental-calculation chains**, not route names or single structural tags.

Keep these scenarios separate:

| Goal | Used by | Acceptance / stop |
| --- | --- | --- |
| `common_approx` | Comprehensive and objective cross-route suitability comparison | Same raw/core task target, currently final 3% relative error; all three paths compared under the *same* target |
| `direct_exact_digits` | Direct **specialty** question generation, process grading and L1/L2/L3 | Truncate accurately to first **two significant quotient digits** normally, optional third by set composition; *no* 3% stop, no rounding the next digit into the target digits |

Comparing a Direct three-exact-digit process against a Scaling 3%-accurate approximate result as if they completed the same task is invalid. In comprehensive, candidate-core compression must still be revalidated against the raw expression and no inferred user route should be persisted.

### Five-stage generation pipeline

```text
1. generateCandidateCore(shapeBucket, quotientBand, seed)
2. detectObjectiveStructures(A,B)
3. searchExecutablePlans(A,B,goal)  // Direct, Split, Scaling; may yield alternatives
4. assessSpecialtySuitability(plans, method) // preferred / competitive / disfavored / unresolved
5. classifyMethodDifficulty(candidate, method, methodSpecificCriteria)
6. composeSet(quotaPolicy, uniquenessPolicy) + verifyAnswers + freezeAuditEvidence
```

Stages 4 and 5 are separate classifiers; neither route identity nor `route.level` is difficulty. Shapes/quotient bands are candidate-generation controls, **not** direct difficulty labels. For a specialty, favor its realistic objective structure without post-hoc mutating A/B to manufacture a route. Failing a candidate constraint should lead to another candidate; bounded attempts and explicit failure diagnostics, never silent suitability relaxation.

### Route plan exploration / mental-cost evidence

Every scored plan must carry enough information to *show why this route should be faster*:

| Route | Search / required cost elements |
| --- | --- |
| Direct | Initial significant quotient-digit selection; neighboring-multiple/boundary checks; multiply-back; subtraction/remainder; second quotient digit; subsequent stages under the specified goal |
| Split | **B as 100 units (“100 buns”)**; identify A as its fraction, especially `0 < A < B`; seek friendly 50/25/20/10/5% and signed combinations; cost of each percentage, `p×B`, remainder update, percentage accumulation and final check |
| Scaling | Candidate `B0` visibility (tens/hundreds/thousands, 111/125/143/167/250/333 and naturally discoverable relation baseline), signed delta, `r`, `A/B0`, both result-repair/numerator-repair chains, first order / second order when actually required, final adjustment and check |

Split specialty should primarily sample **`A<B`**: the training abstraction is “B = 100 buns; how many buns does A represent?”. The user need not literally divide to find one bun. `A>=B` remains mathematically eligible but is a *secondary* specialty structure; the existing search treating `200%/300%/500%` as trivially cheap must not by itself imply superior split suitability.

Scaling is applicable to a broad range of denominators. Mere proximity to `B0`, or small `r`, is not evidence it is fast: include the *cost of calculating r and actual corrections*. Conversely, large-ish `r` is not an automatic disqualifier. Search multiple **human-visible** baselines, both repair branches, and choose the least-cost *executable* chain, not the nearest denominator.

Direct is a reliable fallback, not automatically easy, and not a prescribed inferior route. Direct specialty should prioritize candidates where full Direct cost beats plausible Split/Scaling routes, permit a smaller share where costs are comparable, and reject clear disfavored cases. Do not exclude all candidates simply because some Scaling baseline exists.

### Proposed engineering interfaces (not finalized source contract)

```ts
type ComparisonGoal =
  | { kind: "common_approx"; relativeTolerance: 0.03 }
  | { kind: "direct_exact_digits"; significantDigits: 2 | 3 };

type MentalAction = {
  kind: "recognize" | "estimate" | "multiply" | "subtract" | "percent" | "correct" | "check";
  operands: number[];
  estimatedCost: number; // calibrated internal estimate, not observed user time
  burden: "easy" | "normal" | "hard";
  explanationTag: string;
};

type ExecutablePlan = {
  route: "direct" | "split" | "scaling";
  goal: ComparisonGoal;
  steps: MentalAction[];
  feasibility: "feasible" | "unfeasible" | "unknown";
  totalEstimatedCost: number | null;
  calculatedValue: number;
  objectiveValidation: Record<string, number | string | boolean>;
  evaluatorVersion: string;
};

type SpecialtyAdmission = {
  method: "direct" | "split" | "scaling";
  status: "preferred" | "competitive" | "disfavored" | "unresolved";
  competitorPlanIds: string[];
  reasonTags: string[];
  // L1/L2/L3 belongs in an independent, per-specialty classifier.
};
```

The data structures above are **documentation sketches**, not assertions that types/modules already exist. In particular, replace / calibrate `route-evaluator.ts`'s mixed scalar scoring before using it to filter production sets: current Direct cost is built from levelRank+normal/hard counts; Split/Scaling use independent `totalCost`; direct's `stopStage` is 3%-driven; and `secondEstimate` is rounded rather than an accurate truncated quotient digit. These are **migration gaps**, not acceptable V1 method-specialty classification.

Separate `predicted mental cost`, `objective problem facts`, `observed user events`, and `difficultyBand` in persistence. A route can be `recommended` or `acceptable` without being unique; never store a guessed `userMethod` for final-answer-only comprehensive questions.

### Specialty admission, difficulty and calibration

- `preferred`: the specialty route has a demonstrable mental-cost advantage over the best viable competitor **under a shared goal**.
- `competitive`: the specialty is reasonably close to best and pedagogically useful; do not pretend it uniquely wins.
- `disfavored`: other routes have a clear advantage; reject from the specialty's regular set.
- `unresolved`: near-ambiguous evidence, incomplete search, poor cost-model confidence, or missing natural/executable route; do not silently claim optimality.

**Numeric advantage margins, normalized mental-action weights, and admission quotas remain OPEN.** A provisional ratio threshold such as 0.85/1.15 must not be hardcoded as product truth without fixtures and calibration.

Once admitted, a **separate Direct difficulty classifier** considers digit magnitudes, multiplier difficulty, carry/borrow, accurate integer quotient-digit boundary distance (`k×B` versus `A` at the relevant place), second-digit burden, optionally third-digit chain. Direct L1 = friendly complete chain; L2 = one ordinary meaningful burden; L3 = combined meaningful burdens or genuine quotient-digit boundary. These are *qualitative* confirmed directions; numeric boundaries and full L1/L2/L3 composition require further user review. Digit count / presence of third digit alone cannot imply L3.

Direct candidate arithmetic profiles: principally three-digit÷two-digit and three-digit÷three-digit, with limited four-digit÷three-digit; exact two significant quotient digits normally, some third. Preserve 0 quotient digits and correct significant-digit scale even when Q<1. User is not asked to choose digits or difficulty; composition is internal.

### Fixture and acceptance requirements before generator wiring

Calibration fixtures should include at least:

- `492/689`: canonical `A<B` split, 50%+20% of B leaves small remainder.
- `689/99`: visible round baseline, low-cost correction; never label as a typical Direct-superiority fixture.
- `856/319`, `917/137`: 333/143 special baselines must be searched; **no blind exclusion by proximity**.
- `867/371`: Direct candidate with tangible multiply/remainder chain, but `400` baseline `r=7.25%`; judge correction *cost* rather than mere numerical applicability.
- `973/187`: >100% blocks are valid arithmetic but do **not** constitute the split specialty's central `A<B` pattern.
- `A/B≈6.9` and `≈7.1` with nontrivial denominators: boundary checks must examine adjacent integer multiples; do not substitute old near-half-integer precision heuristic.
- Cases with zero second digit, exact integer quotient, quotient < 1, two exact significant digits vs rounded result, optional third digit, and competitor-route ties.

Acceptance: compare scored plans with human-written chains; verify arithmetic and common-goal precision; count rejects by reason; test seeded reproducibility, near-duplicate calculation skeletons, quota feasibility, fallback/exhaustion behavior, score versioning, persistence/backward compatibility, and no spurious method inference. Gate `implemented=false` until specialty rules and UI are validated. This chapter does **not** mean the product owner has approved numeric thresholds or the code has been implemented.

---

## 1. Goal

Implement C2 as the first-layer division project:

```text
raw A ÷ B
→ calculation core
→ inspect objective numeric structure
→ compare Direct / Split / Compensated Scaling
→ execute a low-cost route
→ stop once the final relative error is within 3%
```

C2 remains pure numeric training. It does not absorb second-layer / third-layer data-analysis formula recognition, option-distance strategy, 415, 假设分配, 化除为乘, or other real-question strategy.

## 2. Confirmed Product Contract

The following facts are already locked by the current Obsidian owner and can be implemented without product invention.

### 2.1 Core arithmetic model

- original/raw expression and calculation core are separate facts;
- compression is significant-information reduction, not method-specific number changing;
- core error is evaluated on the quotient:
  `e_core = Q_core / Q_raw - 1`;
- complete C2 uses final relative error `<= 3%`;
- the 3% target is a first-layer training target, not a universal data-analysis rule;
- no fixed stage-error budget is imposed;
- total signed error obeys:
  `1 + e_total = (1 + e_core)(1 + e_method)(1 + e_output)`.

### 2.2 Complete routes

Exactly three complete routes are current:

1. Direct division;
2. Split;
3. Compensated Scaling.

Objective numeric structure may make one or several routes attractive. It must not be treated as the user's method unless the user explicitly chooses a method or fills method-specific process fields.

### 2.3 Training modes

Current C runtime already contains all product-level mode identities required by C2:

- `support`;
- `method`;
- `method_choice`;
- `comprehensive`.

C2 does not need a new top-level `CTrainingMode`.

Support drills currently are:

- solve `r = |B0-B|/B0`;
- `N×r` ordinary / first+second-order / mixed.

Method drills currently are:

- Direct;
- Split;
- Compensated Scaling.

Method-choice:

- shows calculation core only;
- first valid click submits;
- compares Direct / Split / Scaling;
- allows multiple reasonable routes;
- feedback vocabulary is low-cost / usable / not-worthwhile.

Comprehensive:

- shows raw long-number division;
- does not preselect a method;
- does not require the user to submit a core or method;
- must not infer a user method from the final answer;
- uses natural-number-first generation, then raw wrapping and revalidation.

### 2.4 Direct method

Method drill process must expose the meaningful chain:

```text
first significant quotient digit (accurate, not rounded)
→ first digit × divisor
→ remainder
→ second significant quotient digit (accurate)
→ current two-digit estimate (derived automatically)
→ optional third digit when this question's predefined training depth is 3
```

Direct method training always checks the **accurate** first two significant quotient digits and optionally the third as specified in the frozen question target; it **never** uses 3% error to decide whether to continue or stop. Comprehensive remains a separate raw-number approximate-result goal (currently 3%).

### 2.5 Split method

- default workspace starts with three blocks;
- each block records signed percent, corresponding amount, and new remainder;
- two blocks may be enough; third may remain empty;
- additional blocks may be added when needed;
- the system must not auto-fill the user's block amount, remainder, or accumulated percent;
- signed blocks unify additive and subtractive splitting;
- stop criterion is `|P×B-A|/|A| <= 3%`;
- continuing after the first sufficient point is a speed diagnostic, not automatically a math error;
- the user's written remainder is graded independently and cannot be used as the authority for the stop criterion;
- the generator only needs to guarantee at least one stable low-cost 2–3-block route; it must not force a unique block combination.

### 2.6 Compensated Scaling

Common fields:

- `B0`;
- signed `Δ = B0-B`;
- non-negative `r = |Δ|/B0`;
- branch: repair result / repair numerator.

Repair-result chain:

```text
Q0 = A/B0
C1 = sgn(Δ) × Q0 × r
Q1 = Q0 + C1
```

Repair-numerator chain:

```text
C1 = sgn(Δ) × A × r
A1 = A + C1
Q1 = A1/B0
```

Second order is collapsed by default and expanded only when needed. The second-order correction is positive.

Candidate baseline families:

- round tens / hundreds / thousands;
- 111 / 125 / 143 / 167 / 250 / 333;
- relation-derived `B0 = A/q0`.

The closest denominator is not automatically the best baseline; whole-route mental cost matters.

### 2.7 Support grading already locked

Solve-r:

- output is percent;
- display/answer precision is 0.1 percentage point.

N×r:

- each submitted step uses relative error `<= 5%`;
- second-order target must be based on the user's first-order value, not a hidden corrected first-order value.

### 2.8 Generation strategy already locked

Method-choice default 10-question set:

- 6 targeted questions;
- 4 natural-number questions.

Comprehensive:

- 100% natural calculation core first;
- then wrap into raw long numbers;
- re-check quotient compression error and complete-route stability;
- a natural candidate may only be retained or rejected; it cannot be mutated after classification merely to force a method label.

## 3. Current Runtime Readiness

The current master already provides most infrastructure C2 needs.

| Need                     | Current runtime                                                | C2 action                                            |
| ------------------------ | -------------------------------------------------------------- | ---------------------------------------------------- |
| C project identity       | `CProject` already includes C2                                 | enable only after all launchable C2 modes are valid  |
| training modes           | support / method / method_choice / comprehensive already exist | reuse                                                |
| frozen launch            | `TrainingLaunchSpec` + `cPreset`                               | define versioned C2 preset codec                     |
| first-class response     | single / nested structured response                            | reuse                                                |
| custom grading           | registered custom C graders                                    | add versioned C2 graders                             |
| base grading             | exact / relative error                                         | reuse where semantics exactly match                  |
| restart/repeat           | shared C project registry                                      | add C2 generation dispatch                           |
| C PK policy              | family C => false                                              | unchanged                                            |
| persistence/cloud/export | generic frozen session payload                                 | add C2-specific regression evidence                  |
| History trend            | C project + difficulty capable                                 | add C2 display/analytics contract                    |
| renderer registry        | project/input-kind dispatch                                    | add one C2 renderer entry; route inside C2 component |
| project result review    | project-specific insight components                            | add C2 session + per-question diagnostics            |

No Supabase schema migration is expected for the initial C2 implementation because frozen C question/response/metrics already travel inside the current session JSON contract. A migration is required only if implementation discovers a queryable server-side fact that cannot remain in the frozen session payload.

## 4. Important Runtime Gaps

### 4.1 Generic step runtime is not sufficient for the whole C2 project

`StructuredStepTraining` is useful for a fixed scalar step sequence, but C2 contains:

- Split with a variable number of blocks;
- Scaling with branch-specific fields and optional second-order expansion;
- N×r second order whose correct target depends on the user's own first-order submission;
- method-choice categories rather than one unique expected choice.

Therefore C2 must not be forced into the generic step UI merely because `QuestionStepSpec` exists.

Engineering direction:

- use one dedicated `C2Training` renderer at the page/renderer-registry boundary;
- dispatch internally by a frozen `c2TaskKind`;
- keep first-class `TrainingResponse`;
- use existing `QuestionRecord.steps` only where it truly improves observable process/timing and does not invent a second response contract.

### 4.2 C2 responses need richer structured fields

Expected response shapes:

```text
support_r:
  rPercent

support_nxr:
  firstCorrection
  secondCorrection?

direct:
  firstDigit
  firstProduct
  remainder
  secondDigit
  currentEstimate
  thirdDigit? / finalEstimate?

split:
  blocks[]:
    percent
    amount
    remainder
  finalPercent

scaling:
  branch
  B0
  delta
  rPercent
  Q0? / A1?
  correction1
  Q1
  correction2?
  Q2? / A2?

method_choice:
  selectedRoute

comprehensive:
  finalAnswer
```

Nested user responses are already supported by `StructuredResponseValue`.

For diagnostics, current `gradingMetrics` is intentionally flatter. C2 should store stable scalar/parallel-array facts there instead of duplicating the entire response. If block-level boolean arrays are needed, extend the metrics value type in one backward-compatible place rather than serializing opaque JSON strings.

### 4.3 Renderer dispatch should remain one page-level C2 identity

Do not add six new page.tsx branches.

Preferred architecture:

```text
training-renderer
→ c2
→ C2Training
   ├─ SupportR
   ├─ SupportNxr
   ├─ Direct
   ├─ Split
   ├─ Scaling
   ├─ MethodChoice
   └─ Comprehensive
```

The frozen question must carry enough objective metadata to restore the exact renderer state after refresh.

## 5. C2 Preset Contract

`CTrainingMode` identifies the large training mode. `cPreset` should carry only the mode-specific launch configuration.

Recommended versioned logical contract:

```text
support:
  support=r
  support=nxr;variant=ordinary
  support=nxr;variant=second_order
  support=nxr;variant=mixed

method:
  route=direct
  route=split
  route=scaling

method_choice:
  no route preset

comprehensive:
  no route preset
```

The codec belongs in C2 engineering code, not in UI string concatenation. Unknown / malformed presets must fail explicitly and must never silently downgrade to another mode.

## 6. Generator Architecture

C2 is large enough that one monolithic `c2-training.ts` would create unnecessary coupling.

Recommended logical modules:

```text
src/lib/c2/
  contract / preset
  core-compression
  route-direct
  route-split
  route-scaling
  route-evaluator
  generate-support
  generate-method
  generate-choice
  generate-comprehensive
  grading
  analytics
  index
```

Exact filenames may change during implementation; the stable rule is separation of concerns:

- raw/core math;
- route validity;
- route cost;
- generation;
- grading;
- reporting.

### 6.1 Core-compression layer

Responsibilities:

- raw quotient;
- proposed core quotient;
- signed `e_core`;
- raw-wrapper validation;
- significant-digit helpers.

It must not contain method-specific baseline/split transformations.

### 6.2 Route evaluators

Each route evaluator returns objective facts, not user behavior:

```text
valid
stableTo3Percent
cost
diagnostic facts
reference route, when useful
```

The evaluator cost is versioned engineering calibration. It must not be written into Product Target as mathematical truth.

### 6.3 Method-choice grading

The question may have several acceptable routes.

The grader must evaluate the selected route against all three objective route evaluations and return a category rather than comparing with one answer string.

The restored historical Product Target now makes the mapping explicit: `recommended` and `acceptable` are both valid choices (`isCorrect=true`), while `inefficient` is not. Recommended-rate remains a separate quality metric.

### 6.4 Comprehensive generation

Required sequence:

```text
natural calculation core
→ classify/evaluate all routes
→ retain only stable useful candidates
→ wrap into raw number presentation
→ compute e_core
→ re-evaluate complete final error capability
→ freeze raw + core objective facts
```

The frozen recommended/reference route is allowed for quality assurance and review. It must never be written as the user's route when only the final answer was submitted.

## 7. Grading / Diagnostics Mapping

### Support r

Use a dedicated grader because the product target is in percentage points, not generic relative error.

Persist:

- target r;
- submitted r;
- signed point error;
- pass/fail.

### Support N×r

Custom grader:

- first-order 5% relative-error check;
- if second-order exists, target = `abs(userFirstOrder) × r`;
- preserve first-order and second-order error separately.

### Direct

Diagnostics should independently expose:

- first quotient digit;
- first product;
- remainder;
- second quotient digit;
- current estimate;
- whether two digits are objectively sufficient;
- optional third-digit continuation;
- final relative error.

The method drill must not collapse everything into final 3% correctness because the product explicitly trains the process.

### Split

For each actually entered block, diagnose:

- signed percent;
- corresponding amount;
- remainder transition;
- accumulated percent;
- whether this was the first point to meet 3%;
- whether the user continued after sufficiency.

Final mathematical pass remains based on the real `A/B`, not the user's written remainder.

### Scaling

Diagnose:

- baseline validity;
- signed delta;
- r;
- branch;
- branch-specific first-order chain;
- whether first order is enough;
- second order only when expanded;
- final 3%.

A different valid branch/baseline must not be rejected merely for differing from the generator reference route.

### Comprehensive

Only observable facts:

- final answer;
- final relative error;
- total time;
- frozen objective raw/core/route landscape.

Do not create:

- user core;
- user route;
- user method step diagnostics.

## 8. Reporting / Data Contract

C2 session analytics should separate:

1. question objective facts;
2. observed user response;
3. directly computed diagnostics.

Suggested stable dimensions:

- mode;
- support kind / route kind when explicit;
- raw/core quotient scale;
- core compression error;
- objective route-cost profile;
- final relative error;
- explicit method-step diagnostics;
- stop diagnostics for Split / Scaling;
- timing.

Do not create A Mastery or Classic Rating fields.

C2 remains PK-ineligible.

## 9. Product Parameters Still Missing After Historical Recovery

A second pass over the 2026-09-09 through 2026-09-22 Obsidian history recovered several decisions that had disappeared during the 2026-09-23 product-document rewrite. The current C2 owner now again records:

- frontend difficulty semantics: L1 = single-structure, L2 = standard real-use load, L3 = compound structure / real decision boundary;
- frontend `difficulty_band` remains separate from route `low / medium / high`;
- method-choice `recommended` and `acceptable` are both correct; `inefficient` is not;
- Direct current two-digit estimate is derived from the four meaningful user inputs and is not re-entered;
- method-process timing is passive observability with stage/field timestamps and edit counts, not additional user timer controls;
- detailed Direct / Split / Scaling route-evaluator and C2 observability semantics.

Only three product-parameter groups remain genuinely unresolved.

### R1. Per-mode L1 / L2 / L3 admission and set composition

The global meaning of the three bands is restored, but history does not contain a final per-mode admission/quota matrix for:

- Direct;
- Split;
- Scaling;
- method choice;
- comprehensive.

Implementation must not manufacture L3 by increasing digit count, Split block count, or compensation order.

### R2. Formal question count for the remaining entry points

Locked:

- method choice = 10;
- N×r mixed = 10 with 7 ordinary + 3 first+second-order.

Still not found as final historical decisions:

- solve-r;
- N×r ordinary-only;
- N×r first+second-order-only;
- Direct;
- Split;
- Scaling;
- comprehensive.

### R3. Local diagnostic tolerance for full-method Split / Scaling process fields

Locked:

- complete C2 final result = 3%;
- solve-r output = 0.1 percentage point;
- N×r support steps = 5%.

Still not locked numerically for full-method fields such as Split block amount/remainder and Scaling r/Q0/A1/C1/Q1/second-order fields.

These local thresholds are process diagnostics. They must not be turned into a fixed allocation of the final 3% error budget.

## 10. Engineering Decisions That Do Not Need Product Re-design

The following can be decided inside GitHub implementation as long as visible semantics stay unchanged:

- exact source-file/module split;
- evaluator implementation details and version identifiers;
- retry limits and deterministic seed test matrix;
- internal cost score scale;
- flat metric key names;
- custom renderer component boundaries;
- backward-compatible metric type widening;
- preset codec syntax;
- implementation-specific rejection guards used only to guarantee the locked Product Target.

## 11. Implementation Sequence

### Phase 6.0 — Product-parameter recovery / closure 🟡

Historical recovery is complete for the decisions that actually existed. The current Obsidian owner now restores the old difficulty principle, route evaluator, method-choice correctness, Direct derived-estimate behavior, timing semantics and detailed observability fields.

Remaining product work is only R1–R3 above.

Exit before full user-facing C2 enablement:

- every visible C2 launch option has defined difficulty/count semantics;
- every full-method submitted field has a defined grading/diagnostic role;
- no unresolved parameter is silently invented by engineering.

### Phase 6.1 — C2 shell / preset / registry 🟡

Merged in PR #15:

- versioned C2 preset codec with strict decode/fail behavior;
- C2 project display subtitle decoding;
- C2 task-kind contract.

Added on PR #16 as a non-user-facing foundation:

- dedicated `c2` renderer identity in the shared renderer registry;
- a safe C2 runtime-set dispatcher that only generates already-locked modes;
- no silent fallback from unresolved full-method presets.

Still pending:

- C2 home entry;
- full shared project generation dispatch after visible mode/count rules are closed;
- frozen repeat/recreate acceptance for every launchable C2 preset.

C2 deliberately remains `implemented=false`; no partial user-facing launch is exposed.

### Phase 6.2 — Core math + route evaluator foundation ✅

Implemented on PR #15:

- raw/core quotient and signed-error helpers;
- engineering-only mental-cost calibration kept separate from frontend difficulty;
- Direct evaluator including historical 0.20 / 0.08 second-digit boundary semantics and boundary relevance;
- Split signed-block search with historical low/medium/high route-cost semantics;
- Scaling round/special/relation baselines, result/numerator branches and 0/1/2-order evaluation;
- combined objective route landscape with recommended / acceptable / inefficient classes;
- deterministic evaluator fixtures.

No UI is exposed by this phase.

### Phase 6.3 — Support drills 🟡

Backend question/grading foundation is implemented on PR #15:

1. solve r;
2. N×r ordinary;
3. N×r first+second;
4. N×r mixed with the locked 7+3 distribution.

The second-order grader explicitly uses the user's submitted first-order value.

PR #16 adds the dedicated support renderer/UI for solve-r and N×r without exposing a home entry.

Still pending before launch:

- final question-count decisions for non-mixed support entries;
- persistence/cloud/export acceptance.

### Phase 6.4 — Direct method

- targeted generator gated by full Direct-vs-Split-vs-Scaling suitability and method-specific difficulty; use the [42-case calibration evidence](./c2-route-cost-calibration.md) before applying any cross-route cost cutoffs;
- direct process renderer;
- process grader/diagnostics for **accurate 2 significant quotient digits by default, optional accurate 3rd by set composition**, with correct zero-digit and boundary handling;
- **no 3% stop inside Direct specialty**; retain 3% only for comprehensive/shared approximate goals;
- result/history review.

### Phase 6.5 — Split method

- 2/3-block targeted generator with primary A<B / B-as-100%-units structure, not dominant >100% integer-multiple block targets;
- variable-block workspace;
- signed blocks;
- independent remainder diagnostics;
- first-sufficient stop analysis;
- result/history review.

### Phase 6.6 — Compensated Scaling method

- baseline generator/evaluator exploring human-visible round/special/relation baselines and full r + correction costs;
- repair-result / repair-numerator branches;
- optional second order;
- multiple-valid-route grader;
- result/history review.

### Phase 6.7 — Method choice 🟡

Backend foundation already exists on PR #15:

- locked 6 targeted + 4 number-first set shape;
- frozen recommended / acceptable / inefficient route classes;
- custom grader where recommended + acceptable are correct and inefficient is not.

PR #16 adds the first-click method-choice renderer while preserving first-class structured response.

Still pending:

- route-selection timing persistence/analytics;
- final frontend difficulty admission matrix.

### Phase 6.8 — Comprehensive 🟡

Backend foundation already exists on PR #15:

- natural-core-first generator;
- four quotient bands over three-digit core denominators;
- objective three-route evaluation;
- raw long-number wrapper;
- raw/core e_core revalidation;
- final 3% grading.

PR #16 adds the final-answer-only C2 renderer and deliberately stores no inferred user method.

Still pending:

- frontend difficulty admission;
- integration/observability acceptance.

The implementation stores objective route facts only and does not infer a user method from a final answer.

### Phase 6.9 — C2 integration closure

- History trend / project review;
- IndexedDB normalize;
- cloud payload;
- Export;
- active recovery;
- repeat/recreate;
- account/owner boundary;
- old frozen C compatibility;
- multi-seed generator validation;
- targeted tests;
- full CI;
- current docs update.

Production deployment remains a separate explicit-authorization step.

## 12. Acceptance Matrix

Before C2 is marked implemented:

```text
[ ] remaining Product R1–R3 resolved in Obsidian
[x] all launch presets round-trip
[~] support drills backend generator/grader
[ ] Direct
[ ] Split
[ ] Scaling
[~] method choice backend generator/grader
[~] comprehensive backend generator/grader
[x] 3% complete-task foundation
[x] support-specific 5% / 0.1pp rules
[x] recommended route != user route in backend facts
[x] comprehensive generator does not infer method
[ ] repeat/recreate frozen config
[ ] IndexedDB
[ ] cloud payload
[ ] History/result diagnostics
[ ] Export
[ ] C stays out of A Mastery
[ ] PK=false
[ ] multi-seed generator tests
[ ] formatting
[ ] typecheck
[ ] lint
[ ] full tests
[ ] build
[ ] manual mobile/tablet/desktop acceptance
[ ] deploy only after explicit authorization
```

## 13. Immediate Next Step

Continue from the now-tested runtime foundation without exposing C2 prematurely:

1. keep C2 `implemented=false` and keep PR #16 non-user-facing until its quality gates pass;
2. close R1–R3 in Product Target while using evaluator fixtures to validate that the rules stay faithful to real data-analysis arithmetic;
3. implement Direct / Split / Scaling method workspaces only after the relevant visible product parameters are fixed;
4. then enable full registry dispatch, persistence/cloud/export/history acceptance and final multi-seed closure.

Production deployment remains a separate explicit-authorization step.
