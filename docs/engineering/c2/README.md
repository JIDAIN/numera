# C2 Engineering Collection

> Working-branch engineering materials for **Numera / 数感**. This index is a **navigation entry**, not a product-design source, new runtime contract, or an approval to modify/launch C2.

## Read order (as of 2026-10-09)

1. [Current engineering state](../current-state.md) — actual master/production/branch gap; C2 remains `implemented=false`.
2. [C2 engineering implementation plan](../c2-implementation-plan.md) — implementation owner; generator/evaluator algorithm rewrite **on hold**.
3. Obsidian C2 owner: `JIDAIN/lys-obsidian-note@main / 13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_除法综合.md`.
4. Obsidian C2 categorized research index: `.../20_C2_研究与校准/00_C2_研究导航.md`, especially source practice research `.../10_老师练习与真实证据/34_C2_老师练习驱动的产品设计回归评估_V1.md` (**proposal, not confirmed Owner contract**).
5. Only consult historical fixture studies below if the task genuinely needs them.

## Current source-extraction handoff (documentation evidence only)

Obsidian `JIDAIN/lys-obsidian-note@main` → `13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_研究与校准/10_老师练习与真实证据/`:

- **`35_C2_小P花生十三练习来源台账_V1.md`**: 12 traceable evidence units from absorbed notes. Exactly five independent divisions with substantially recorded teaching actions, three partial first-step expressions, two out-of-scope composite expressions, and two denominator-only structural schematics. **Not exhaustive original slide/assignment extraction**.
- **`36_C2_老师练习到出题结构的适配矩阵_V1.md`**: separates teacher teaching actions from Numera's fixed 3% product target, tests early-stop counterexamples and candidate numerator/result repair cases, lists evidence gaps and proposed admission structures. **Research proposals, not approved generator policies or TypeScript structure tags.**

Next source gap: recover *complete* Xiao P third-lesson slides 24–25 and homework 06 plus Huasheng 13 textbook chapter 2.3 exercises from original source files, not reverse-engineer missing teacher questions. Obsidian's currently available absorbed Markdown notes only explicitly identify some examples; do not assert full question-level transcription. User is not required to serve as per-question arithmetic tester.

Engineering hold is unchanged: implementation planning only, no classifier/generator/UI edit, PR merge or deployment.

## Evidence and source provenance

- [Completed-exam gold candidate / engineering hold](evidence/c2-completed-exam-gold-calibration-v0.md). Candidate math evidence, **not** validated human winner labels.
- [Natural operands & real truncation study](evidence/c2-natural-number-truncation-v3.md). Exercises and origin/truncation distinction; not a corpus distribution estimate.

## Algorithms and archived calibration

- [Route cost model and comparison](calibration/c2-route-cost-calibration.md) — historic proposal and current engineering gaps, not an approved shared cost weight.
- [First 12 case study](calibration/c2-route-cost-first-pass.md) — archived preliminary arithmetic/cost observations.
- [42 case review](calibration/c2-route-cost-42-case-review.md) — old synthetic/controlled 42-case work; regression, not natural-number gold.
- [Reciprocal transformation V2](calibration/c2-reciprocal-transform-verification-v2.md) — mathematical/reciprocal consistency verification, not a substitute for actual mental cost.

## Source of truth and implementation gates

| Domain | Canonical owner | Do NOT interpret as |
| --- | --- | --- |
| C2 purpose, six entrances, math goals, method process, UI rules | Obsidian `20_C2_除法综合.md` | Implemented or confirmed from a research note |
| Teacher method observations | Obsidian `gongkao/资料分析/02_来源吸收/小P` and `花生十三` | Automatic product rule |
| C2 proposed refinements | Obsidian research `34_C2_...` | Owner-approved changes to forced `r` inputs / zero-order flow |
| Engineering gap and tasks | `../c2-implementation-plan.md` | Running program code |
| Dynamic code & production status | `../current-state.md` and live source/tests/deployments | Past snapshots as current truth |
| Old synthetic arithmetic/route fixtures | `calibration/` | Representative exam corpus or validated fastest route |

**Current human evidence**: first-seen cues 8/8, actual executed mental paths 2/8 (B05/B08), Owner-approved route winners 0/17. These historical counts are snapshots only; the next research focus is **extracting and classifying Xiao P/花生十三 practice examples**, not asking the Owner to keep acting as a timed arithmetic subject.

No generator/evaluator implementation work, PR merge or Vercel deployment is authorized by this documentation reorganization. `docs/engineering/` root includes light compatibility pointers at the old C2 research-document paths to preserve external links; edit their actual targets here.
