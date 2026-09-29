# C2 Engineering Implementation Plan

> Status: **engineering mapping / implementation readiness**.  
> Product Target owner: Obsidian `13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_除法综合.md`.  
> This document maps the confirmed product design onto current Numera runtime. It does **not** redefine C2 product semantics and does not prove implementation.

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
first quotient digit
→ first digit × divisor
→ remainder
→ second quotient digit
→ current two-digit estimate
→ 3% check
→ third digit only when objectively necessary
```

Direct method training always trains through the second digit, even if the first digit already happens to meet 3%. Comprehensive stops once enough.

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

The exact mapping between category and `QuestionRecord.isCorrect` is a product decision listed in section 9.

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

## 9. Product Decisions Still Missing

Current Product Target is strong on mathematical/method semantics, but it does **not** yet lock several launch/grading details required for executable code. These must be resolved in Obsidian before their implementation; GitHub must not invent them silently.

### P1. L1 / L2 / L3 contract

C-layer global design says users choose simple / difficult / complex and explicitly says frontend difficulty is not route cost.

The C2 owner describes what makes Direct difficult and says difficulty must not equal route cost, but does not define the actual L1/L2/L3 admission rules or whole-set composition for:

- single-method Direct;
- single-method Split;
- single-method Scaling;
- method-choice;
- comprehensive.

### P2. Formal question count per C2 entry

Locked today:

- method-choice default = 10;
- N×r mixed default = 10 with 7 ordinary + 3 first+second-order.

Not locked in the current owner:

- solve-r block count;
- Direct method block count;
- Split method block count;
- Scaling method block count;
- N×r ordinary-only / second-order-only block count;
- comprehensive block count.

Current Numera new-session runtime accepts 10 or 20, so no runtime expansion is required if C2 product chooses within those counts.

### P3. Method-choice category → correctness semantics

Product feedback has three categories:

- low-cost;
- usable;
- not-worthwhile.

The current owner does not state whether:

- low-cost only is “correct”;
- low-cost + usable are both mathematically accepted;
- `isCorrect` should be replaced by a different success model for this mode.

This must be explicit because History accuracy and session completion currently use `QuestionRecord.isCorrect`.

### P4. Local process tolerance for Split and Scaling

The owner defines:

- final complete C2 = 3%;
- N×r support = 5%;
- solve-r display precision = 0.1 percentage point.

It does not define numeric tolerances for method-drill intermediate submissions such as:

- Split block amount;
- Split written remainder;
- Scaling r inside the full method;
- Q0 / A1;
- first-order correction;
- Q1;
- second-order fields.

Those values cannot be graded consistently until the product contract says which are exact relationships, which allow practical approximation, and which are diagnostic-only.

### P5. Explicit final-estimate field in Direct drill

The owner requires first digit / first product / remainder / second digit and then obtains the current two-digit estimate, but it does not explicitly say whether the user must type that estimate as another field or whether the UI derives it from the submitted digits.

This matters for the response shape and step-level timing.

### P6. Per-step timing requirement

Shared design allows method-step diagnostics, and C2 review examples include step-level “where it got stuck”, but the current owner does not require a timer for every Direct / Split / Scaling field.

Implementation should not add intrusive per-field timing UX unless this is intentionally part of the product.

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

### Phase 6.0 — Product-parameter closure

Resolve P1–P6 in Obsidian.

Exit:

- every visible C2 launch option has defined difficulty/count semantics;
- each submitted field has a grading role;
- method-choice History correctness semantics are explicit.

### Phase 6.1 — C2 shell / preset / registry

- C2 preset codec;
- C2 project display subtitle;
- C2 home entry;
- frozen launch/repeat/recreate contract;
- keep `implemented=false` until at least one complete user path is acceptance-ready.

### Phase 6.2 — Core math + route evaluator foundation

- raw/core quotient helpers;
- signed error chain;
- Direct evaluator;
- Split evaluator;
- Scaling evaluator;
- versioned route-cost model;
- deterministic evaluator fixture bank.

No UI in this phase.

### Phase 6.3 — Support drills

Implement:

1. solve r;
2. N×r ordinary;
3. N×r first+second;
4. N×r mixed.

These are the smallest C2 modes and validate preset/renderer/grader/data plumbing.

### Phase 6.4 — Direct method

- targeted generator;
- direct process renderer;
- process grader/diagnostics;
- 3% stop logic;
- result/history review.

### Phase 6.5 — Split method

- 2/3-block targeted generator;
- variable-block workspace;
- signed blocks;
- independent remainder diagnostics;
- first-sufficient stop analysis;
- result/history review.

### Phase 6.6 — Compensated Scaling method

- baseline generator/evaluator;
- repair-result / repair-numerator branches;
- optional second order;
- multiple-valid-route grader;
- result/history review.

### Phase 6.7 — Method choice

- 6 targeted + 4 natural questions;
- first-click submit;
- route category grader;
- route-selection timing and analytics.

### Phase 6.8 — Comprehensive

- natural-core-first generator;
- raw long-number wrapper;
- e_core revalidation;
- final-answer-only renderer;
- final 3% grading;
- no inferred method.

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
[ ] Product P1–P6 resolved in Obsidian
[ ] all launch presets round-trip
[ ] support drills
[ ] Direct
[ ] Split
[ ] Scaling
[ ] method choice
[ ] comprehensive
[ ] 3% complete-task rule
[ ] support-specific 5% / 0.1pp rules
[ ] recommended route != user route
[ ] comprehensive does not infer method
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

Do **not** start route code yet.

First close P1–P6 in the Obsidian C2 owner. Once those visible product parameters are locked, implementation can proceed from Phase 6.1 without reopening the C1/C3/C4 runtime foundation.
