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

## Original teaching PDF recovery & gap audit (2026-10-09)

Obsidian `JIDAIN/lys-obsidian-note@main/13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_研究与校准/10_老师练习与真实证据/`:

- `37_C2_讲义原页十道放缩与十二道拆分补证_V1.md`: physically viewed attached `资料分析理论讲义.pdf` PDF p30/printed p29, **10** Xiao P lesson-three bare fractions; `27花生资料分析笔记（已更完）.pdf` PDF p20/printed p15, **12** Huasheng split fractions/annotations. Original numeric exercises are verified; a full homework transcript/slides teacher solution trace is **not** recovered. Source completeness is explicit, with PDF versions kept distinct from the 38-page PPT and video.
- `38_C2_老师原题与L1L2L3_出题准入及工作台冲突审查_V1.md`: **8/10** Xiao P items have quotient above 5, **7/12** Huasheng split items below 0.2, while currently documented `QUOTIENT_BANDS` in `src/lib/c2/generator.ts` run **0.2–5**. This is teaching source coverage, **not** exam number distribution. Existing Split base blocks include 0.5% but not independent 0.1/0.2%; Scaling's `A*r` numerator branch doesn't yet model rough-quotient*delta shortcut.
- Updated status: D2 (rough-q numerator repair without mandatory r) and D3 (stage-0 stop on actual raw-quotient 3%) are **approved product semantics**. D1's V1 quotient bands stay unchanged; expanded domain is **not approved**. D4 fine 0.1/0.2% split blocks are **not approved**. All code/persistence/UI details remain unimplemented. Difficulty `L1=single`, `L2=normal practical`, `L3=compound/decision boundary` stays distinct from route cost low/medium/high.

This is an **engineering research handoff, NOT an approved implementation delta**; keep the generator/evaluator rewrite on hold.

> **Single recommended design package for Owner review**: Obsidian `20_C2_研究与校准/10_老师练习与真实证据/39_C2_出题范围与三路线交互统一修订提案_待审批_V1.md`, synthesizing D1–D4 with explicit early-stop/numerator-rough-delta/fine-split/quotient-domain regression gates. Status: original proposal partially adopted into official Obsidian owner; engineering still unimplemented; current `generator.ts`, `route-split.ts`, `route-scaling.ts`, `route-evaluator.ts` unchanged and formal rewrite on hold.

## Current design-to-engineering handoff — 2026-10-09

**Product Owner has now adopted two C2 behaviors**: (1) numerator repair may use natural `qrough×Δ` without mandatory r, and (2) the user's actual baseline estimate may stop at 0th order when it meets the raw-expression 3% goal. They are design decisions, **not yet implemented** in `route-scaling.ts`, `C2Training.tsx`, or `runtime.ts`.

**Primary implementation blueprint**: [C2 stage-aware implementation V1](c2-stage-aware-implementation-blueprint-v1.md). Formal engineering plan [here](../c2-implementation-plan.md), current dynamic state [here](../current-state.md). **No code PR, merge or deployment authorization follows from this update**.

Preserved boundaries: default V1 comprehensive `0.2–5`, Split legacy blocks including 0.5% but not 0.1/0.2%, six front-end entries, Direct accurate-digits specialty, method choice 6+4 and independent L1/L2/L3. Teacher sources are neither uniform exam number distribution nor approved fastest-route labels.

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
| Accepted C2 scaling semantics | Obsidian canonical `20_C2_除法综合.md` | Already implemented in runtime/renderer |
| Historical source-only experiments | Obsidian `34–39_C2_...` studies | Auto-approved new quotient ranges, Split fine blocks, costs/quotas |
| Engineering gap and tasks | `../c2-implementation-plan.md` | Running program code |
| Dynamic code & production status | `../current-state.md` and live source/tests/deployments | Past snapshots as current truth |
| Old synthetic arithmetic/route fixtures | `calibration/` | Representative exam corpus or validated fastest route |

**Current human evidence**: first-seen cues 8/8, actual executed mental paths 2/8 (B05/B08), Owner-approved route winners 0/17. These historical counts are snapshots only; the next research focus is **extracting and classifying Xiao P/花生十三 practice examples**, not asking the Owner to keep acting as a timed arithmetic subject.

No generator/evaluator implementation work, PR merge or Vercel deployment is authorized by this documentation reorganization. `docs/engineering/` root includes light compatibility pointers at the old C2 research-document paths to preserve external links; edit their actual targets here.
