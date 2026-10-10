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

## Three-method product specification research — IN PROGRESS, NOT IMPLEMENTED (2026-10-09)

Canonical Obsidian `13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_研究与校准/20_方法与成本分析/`:

- `40_C2_三主专项出题准入与L1L2L3细则_研究稿_V1.md`: per-method Direct/Split/Scaling **math feasibility → specialty training suitability → independent L1/L2/L3 evidence**. Direct exact two significant quotient digits **cannot** reuse rounded-quotient approximation evaluator; Split support vocabulary and first-sufficient-block stopping matter; Scaling zero-order, repair-result, rough-q numerator repair, A×r each have different costs.
- `41_C2_三主专项样题准入与难度候选审计_V1.md`: 15 **method×source-expression** arithmetic-audited candidate entries (3 Direct / 6 Split / 6 Scaling), including rejections and unresolved route/difficulty labels. This is **not** 15 owner-approved gold questions.
- `42_C2_跨路线动作成本与难度校准规程_研究稿_V1.md`: observable atomic mental-actions ledger, same-task route comparison, no unsupported global cost weights, pairwise source examples and source-level review requirements.

**Status:** meaningful design research exists but C2 per-specialty L1/L2/L3 machine thresholds, each mode's quota, method dominance weights, local process tolerances and full generator acceptance **are NOT finalized**. Do not treat research fields as production structure-tag enums, grade cutoffs, or user method telemetry. In particular, `route-direct.ts` currently produces its second candidate by rounding the exact quotient under a 3% task, **not** a user's precise two-digit long-division action chain. C2 implementation and merge/deploy hold remain unchanged.

## 2026-10-10 design research checkpoint — math verified, difficulty NOT calibrated

Obsidian `JIDAIN/lys-obsidian-note@main/13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_研究与校准/20_方法与成本分析/` now has:

- `43_C2_同骨架对照题与难度边界校准_V1.md` — **four controlled same-skeleton pairs (eight expressions)**, including Direct second exact-digit boundary, Split first-sufficient two vs three blocks under a *specific* route, Scaling zero-order vs required correction, and 333 nominal shortcut. Half the expressions are clearly labeled constructed controls, not real teacher or exam originals. This is **mathematical comparison, not L1/L2/L3 labels**.
- `44_C2_求r_N乘r_方法选择_综合出题与难度规则_研究稿_V1.md` — explicit admission/L-evidence rules for r, N×r, method-choice backend mode, comprehensive. Existing Owner defaults remain: r output 0.1 percentage points; N×r each-step 5%, mixed 10 questions 7+3; method choice 10 questions 6 targeted +4 natural and multiple acceptable method choices; comprehensive 100% natural, raw-expression 3% goal. **Method choice is not a seventh front-end entry**.
- Newly identified r display counterexample, research-only: **B=125, B0=167** yields strict `42/167≈25.1497%` → 25.1%, but shorthand `42×6/1000=25.2%` → 25.2%. Keep r precision interpretation/acceptance **unresolved** until tested and approved; do not silently fail classroom shortcut nor broadly relax accuracy.

**Open design gate**: further source-backed paired cases, executable-route completeness, method-choice allowed-answer support, specialty L machine cutoffs, cost calibration, full question quotas, Split/Scaling local diagnostics. Therefore **PR-C2-0 may be outlined as a fixture plan, but the formal generator/evaluator/UI rewrite is still on hold**. No code, merge, CI, or deploy resulted from these design notes.

## Unified C2 admission audit (2026-10-10, 32 math-checked candidates)

Obsidian `JIDAIN/lys-obsidian-note@main/13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_研究与校准/20_方法与成本分析/45_C2_统一出题准入与L难度审查台账_V1.md` is now the **primary case-level research intake**. It audits **32 expression × objective rows** across Direct 4, Split 9, Scaling 8, r 3, N×r 3, method choice 2 and comprehensive 3. The independent arithmetic oracle passes each **for its own task** (Direct exact truncated two digits, r 0.1pp, N×r each step 5%, common approximate raw quotient 3%). This does **NOT** mean 32 production-ready questions.

Required split concerns remain separate: `math_status` vs `supported_steps` vs `method_admission` vs `difficulty_candidate` vs `release_eligibility`. Examples include 0-order/one-block early-stop **warmups only**, unsupported 0.1/0.2% Split chunks, a strict-versus-nominal r rounding conflict, and method-choice routes with no reliable winner label. `R` and `N×r` are **not division expressions** despite compact tabular operands. No L1/L2/L3 gold or cross-route cost weights/quota decisions were approved.

**Next design gate**: finish R1–R3 and method-choice allowed-answer review against this ledger and paired adversarial examples, then map accepted rules into the product Owner. C2 official generator/evaluator/UI code remains unchanged; PR-C2-0 can be documented as a future fixture step but is not a green light for generator refactor.

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

**Current human evidence**: first-seen cues 8/8, actual executed mental paths 2/8 (B05/B08), Owner-approved route winners 0/17. These historical counts are snapshots only. Source-backed teacher examples have since been extracted to Obsidian `35–39_C2_...`; active 2026-10-10 design work is `40–44_C2_...` specialty admissions, controlled difficulty pairs, exact-direct versus common-3% task separation, and remaining-mode grading boundaries. The Owner is not being asked to act as a mandatory timed arithmetic subject.

No generator/evaluator implementation work, PR merge or Vercel deployment is authorized by this documentation reorganization. `docs/engineering/` root includes light compatibility pointers at the old C2 research-document paths to preserve external links; edit their actual targets here.
