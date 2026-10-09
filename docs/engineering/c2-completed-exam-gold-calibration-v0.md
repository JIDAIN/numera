# C2 Completed-Exam Calibration Gate V0 (2026-10-09)

> **Implementation HOLD** for any further formal C2 generation/route-cost classifier rewrite. This is documentation only, not a change to runtime, PR merge, or production deployment. The current C2 engineering foundation may remain intact. No Vercel deployment without explicit user permission.

## 1. Authoritative design and data

Product design owner in Obsidian repository `JIDAIN/lys-obsidian-note@main`:
- `13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_除法综合.md`
- `.../28_C2_已做真题三路线金标准候选_V0.md` — **17 provenance-backed candidate numeric pairs**, maths audited; **human approved: 0/17**, not gold labels.
- `.../29_C2_三路线金标准审查规程_V0.md` — label, audit, blind-then-compare protocol.
- Existing `.../21_C2_三路线心算成本校准_V1.md`; `22–27` documents remain **controlled tests, lecture-derived exercises and historic provisional route reviews**, not a real-exam distribution estimate.

Data source: Obsidian completed question research `13_Projects/gongkao/资料分析/04_真题研究/`. These question records were already studied; avoid opening unattempted paper solutions. Teacher source notes `02_来源吸收/小P/`, `02_来源吸收/花生十三/` are separate primary pedagogical references. External `ERRRC/xingcezhenti` is only a subsequent evidence source and currently **not an approved or deduplicated source for this 17-case Gold candidate set**.

The product's algorithm identities remain **Direct | Split | Scaling**. Scaling has **two independently evaluated executable variants**: result repair and numerator repair. These **are not 4 algorithms**.

## 2. Input examples: case identity and provenance

The 17 initial candidates are:
```text
R01 359/402           600题01-03套复盘 (广东2021)
R02 50.6/96           600题01-03套复盘 (云南2024)
R03 14.2/548          600题01-03套复盘 (事业联考2018)
R04 171/818           2014年国考 125 (derived numerator)
R05 240/880           2014年国考 132
R06 896.45/1292.5     2016年国考 122
R07 419/4064          2017年国考 122 (both numbers can be approximate)
R08 26352.1/32161.9  2018年国考: first ratio of compound ratio
R09 2254.7/6946.7    2018年国考: second ratio of compound ratio
R10 58.4/41.6         2019年国考: derived percent shares
R11 324/16213         2013年国考 131 (derived denominator)
R12 855500/3117       2016年国考 120
R13 697/358           2012上半年联考, previously done single question (ratio A)
R14 218/117           2012上半年联考, same previous question (ratio B)
R15 384/43876         2015年国考 126 (derived denominator)
R16 1460/992.8        2016年国考 114
R17 3575.86/1.758     2019年国考: derived baseline of growth calculation
```

Provenance kind must not be flattened: `completed_exam_raw_data` vs `completed_exam_derived_expression` vs `teacher_exercise` vs `synthetic_control` vs `external_unverified`. Some source reviewed calculations are already approximate; do not claim their original scanned precision is preserved when it isn't.

The Obsidian candidate document includes three-significant-digit **truncation examples** with a scale factor, and checks errors against *original* `rawA/rawB`. For these 17, the candidate intermediate 1st-order scaling calculations, as written there, pass the common 3% task; 6 are already adequate at zero order. This does NOT prove either scaling strategy is the easiest to discover nor that its exact-looking intermediate decimals are practical mental output.

## 3. Four traces under three named methods

1. `direct`: human-discoverable q anchor -> actual q×B -> remainder/adjustment -> stop when task requires; specialty exact quotient digits is a **separate goal**.
2. `split`: genuine friendly percentage/fraction blocks -> B×p -> running remainder and total percent. Current code's fixed percent-block vocabulary is not silently extended to 0.1% just to make a route fit.
3. `scaling/repair_result`: find a base that actually simplifies quotient -> compute Q0 with real actions -> if needed r via `B_nom−B` and shortcut multiplier -> correction `Q0×r` -> adjusted result. Zero order exits without a compulsory correction.
4. `scaling/repair_numerator`: same base but a distinct executable path; **search two subplans**: `A'≈A+q_rough×(B_nom−B)` from a visible rough quotient (e.g. 小P `645/122 ≈ 660/125`) and `A'≈A(1+r)`. Then cheap `A'/B0`, including easy `×k/1000` where appropriate. **Each path's approximated output is separately verified against the original quotient**.

In particular, `A+q_rough×Δ` and `A(1+r)` are not guaranteed identical. The existing `route-scaling.ts` `repair_numerator` branch implements the *mathematical* `A(1+r)` style; it does NOT yet account for the shortcut `q_rough×Δ`, source-derived example-inspired visible steps, or a realistic operation-cost trace. Do not remove or replace the existing branch without Owner signoff.

## 4. Review status, not invented gold winners

```ts
// PROPOSED schema sketch only. No runtime additions have been made.
type SourceKind =
  | "completed_exam_raw_data"
  | "completed_exam_derived_expression"
  | "teacher_exercise"
  | "synthetic_control"
  | "external_unverified";
type PlanKind = "direct" | "split" | "scaling_result" | "scaling_numerator";
type HumanReview = "unreviewed" | "observed" | "owner_confirmed" | "disputed";
type RelativeAdvantage = "preferred" | "competitive" | "disfavored" | "unresolved";
type CalibCase = {
  id: string;
  source: { repository: string; path: string; examContext: string; kind: SourceKind };
  raw: { a: number; b: number };
  normalized?: { coreA: number; coreB: number; scale: number; truncationMode: string; rawCoreError: number };
  commonPrecision: { kind: "relative_error"; max: 0.03 };
  plans: Array<{
    kind: PlanKind;
    recognitionEvidence?: string;
    mentalActions: unknown[];  // implement real typed operator DAG when approved
    executedEstimate?: number; // actual rounded mental intermediate final
    rawRelativeError?: number;
    independentCostEvidence?: unknown; // no made-up seconds or weights
    humanReview: HumanReview;
    advantage: RelativeAdvantage;
    trainingValue?: "yes" | "no" | "unresolved";
    difficultyBand?: "L1" | "L2" | "L3" | "unapproved";
  }>;
  goldStatus: "candidate_gold_v0" | "owner_approved_gold_v1";
};
```

**Do not infer actual user-selected method from the final numeric answer** of comprehensive training.

## 5. Evidence-driven gates before resuming engineering

| Gate | Current status | Acceptance |
| --- | --- | --- |
| Source provenance | Complete for first 17 | Every case links to completed research and raw/derived status; no hidden original/solution exposure |
| Raw/core & one-stage mathematical assertions | Checked for 17 | Scale correct; both result repair and numerator repair algebra and executed rounding independently verified |
| Realistic mental arithmetic | NOT validated | User can review “first seen” anchor before suggested routes are shown; actual intermediate rounding trace |
| Branch contrast | NOT validated | Result repair, numerator rough-q adjustment and A×r adjustment compared as actual actions; zero-order exits |
| Cross-method cost calibration | NOT validated | Shared mental-action vocabulary, intermediate reuse; allow tie / unresolved |
| Specialty method value and L1–L3 | NOT finalized | Distinct from which route is globally fastest; product approval |
| Main generator/route evaluator rewrite | **PAUSED** | Only after previous owner signoffs and regression plan reviewed |
| User-facing C2 launch, PR merge, Vercel deploy | **NOT AUTHORIZED** | Explicit user consent required |

Important adversarial regression: **R07 (419/4064)**: q=10% is around 3.007% relative error when judged as a standalone number, which **does not pass C2's strict 3%** even though the completed exam study correctly selected a 10% option. This is not grounds to change the fixed pure-number training goal; preserve original item context separately.

## 6. Files to update on resume (no code in this phase)

- `src/lib/c2/route-direct.ts`: exact digits vs common approximate q anchor;
- `src/lib/c2/route-split.ts`: friendly block execution and 3/4/5-digit denominator handling;
- `src/lib/c2/route-scaling.ts`: actual rational shortcut, quick r, zero-order exit, result vs numerator rough-q paths, action reuse and true approximate intermediates;
- `src/lib/c2/route-evaluator.ts`: replace disparate proxy scores with validated shared action costs; unresolved route support;
- `src/lib/c2/generator.ts`: natural raw material source/realistic digit-distribution study before labeling a route.
- `docs/engineering/c2-route-cost-calibration.md` and `docs/engineering/c2-implementation-plan.md` map the work only after Product Owner review.

Only after accepted user review, design agreement and source-backed test assertions should a scoped engineering PR be changed. **No code, test suite, merge or deployment was executed in creating this plan.**
