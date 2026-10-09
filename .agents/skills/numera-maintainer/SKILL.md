---
name: numera-maintainer
description: JIDAIN/numera 项目专属维护 Skill。定义 Numera UI、generator、training runtime、data/sync、history、PK、export、测试和文档变更的安全执行流程；事实从 AGENTS、canonical docs、源码与必要 runtime 读取。
version: 2.0.0
---

# Numera Maintainer

## 定位

本 Skill 只回答：**接到 Numera 开发任务后怎样安全、可验证地执行。**

它不维护 current ability清单、C项目状态、schema枚举或Production snapshot。

## 1. Start Protocol

```text
AGENTS.md
→ docs/README.md
→ docs/engineering/current-state.md
→ task area README
→ canonical contract
→ current source/tests
→ runtime when needed
```

涉及产品目标时，先读取 Obsidian `JIDAIN/lys-obsidian-note@main/13_Projects/数感/00_数感项目MOC.md`，再读 `20_需求与设计/` 对应正式设计；C2 优先读取 `20_C2_除法综合.md` 和分类研究导航 `20_C2_研究与校准/00_C2_研究导航.md`。不要使用已废弃的 `01/02/03/91` 目录猜路径。

不要从 History 反推 current behavior。

## 1.1 Mandatory evidence lookup for training methods and problem design

When working on C1–C4 method suitability, math-route comparisons, mental-cost/difficulty, question generation, realistic 资料分析 digit truncation, or large-sample calibration, **do not stop at Obsidian `13_Projects/数感/` or the user-uploaded PDF**. Follow the verified `AGENTS.md → §3.1 Training Evidence Search Routing` first:

- 小P: `JIDAIN/lys-obsidian-note` → `13_Projects/gongkao/资料分析/02_来源吸收/小P/00_小P知识库MOC.md` → method index / topic.
- 花生十三: same Vault → `13_Projects/gongkao/资料分析/02_来源吸收/花生十三/00_花生十三知识库MOC.md` → method index / topic.
- Real problem research: `13_Projects/gongkao/资料分析/04_真题研究/00_真题研究MOC.md`; large external question data begins at **`13_Projects/gongkao/真题资源库/01_真题来源索引.md`**, not in an imagined local tens-of-thousands-question folder.
- Read `13_Projects/gongkao/资料分析/90_资料与索引/01_项目说明与研究方法.md` for source separation / completed-vs-unattempted restrictions.

**C2 reading rule (2026-10-09):** use Obsidian `20_C2_除法综合.md` for **current confirmed** training semantics, `20_C2_研究与校准/00_C2_研究导航.md` for source-backed studies, and GitHub `docs/engineering/c2/c2-stage-aware-implementation-blueprint-v1.md` for the **not-yet-implemented** phase plan. C2 now allows numerator repair by `roughQuotient × signedDelta` without mandatory numerical r, and stage-0 stopping after a user baseline estimate meets raw-quotient 3%. The default comprehensive `0.2–5` quotient range remains, with **no 0.1/0.2% Split block approval**. The old 39 proposal is historical evidence, not the product owner. No runtime code, generator rewrite, merge, launch or deployment is authorized by these documentation decisions. Historic user observations are not a request to keep collecting per-question mental timings.

Do not duplicate the source list, corpus statistics or math content in this Skill; the **canonical full path/routing list is AGENTS.md §3.1 and the live Obsidian MOCs**. During verification, report which of these sources were actually opened; never pretend unavailable external repositories were searched.

## 2. Define Change Boundary

修改前确认：

- 用户真正要求改变什么；
- 什么必须保持不变；
- current canonical owner；
- executable source在哪里；
- Product Target是否已锁定；
- success criteria；
- 是否涉及Vercel/Supabase写操作。

## 3. Classify Change

```text
future product design → Obsidian
current capability / entry → Product
stable UI / UI system → Product UI
training business identity → Domain
runtime / session / grader → Architecture
data / sync / owner → Data & Sync
current progress → Current State
active implementation sequence → First-layer Plan
long-term engineering rationale → ADR
past milestone → History
```

## 4. Generator Checklist

- 产品规则已锁定；
- 单题结构与整组quota分开；
- injected random / ID factory；
- reproducibility；
- generation version；
- impossible target显式失败；
- classifier与generator事实一致；
- 所有合法题量/边界有test；
- 不把规则复制到UI。

## 5. Runtime / Session Checklist

- frozen questions；
- Launch/restart/reproduce语义；
- active/resume/abandon；
- timer与background；
- duplicate submit；
- renderer / grader dispatch；
- historical decode；
- account switch；
- PK frozen set；
- storage/cloud/export compatibility。

未来 StructuredResponse / LaunchSpec 只有真正实现并验证后才写入current Architecture。

## 6. Data / Sync Checklist

- schema version；
- IndexedDB兼容；
- ownerAccountId；
- local/cloud dedupe；
- Supabase RLS/RPC；
- active != completed；
- partner read-only；
- export；
- PK；
- migration是否真的需要。

## 7. UI Workflow

先读 Product/UI。

```text
shared primitive/pattern
→ training renderer
→ page composition
```

检查：mobile、safe-area、keyboard、loading/empty/error、editable/read-only、active recovery、result/history、background/foreground。

视觉调整不得改变generator、grader、timer、owner、history、sync或PK语义。

## 8. History / PK / Export

修改这些模块前：

- 先确认training family / analytics boundary；
- 再读Training Runtime与Data & Sync；
- Classic Rating、A Mastery、C analytics不得混用；
- PK eligibility必须显式；
- export不为旧记录猜新语义。

## 9. Verification

代码改动通常执行：

```text
Prettier
npm run typecheck
npm run lint
npm run test
npm run build
```

再按任务补 targeted regression / manual UI / runtime check。

纯docs变更至少检查：links、paths、canonical ownership、current/future/history、implementation anchors。

## 10. Documentation Sync

代码改变current fact时，只更新真正改变的canonical owner。

完整维护SOP：docs/engineering/documentation-maintenance.md。

尚未实现设计不写入GitHub current docs。

## 11. Production Hard Stop

Git push/merge/CI success != deployment authorization。

Vercel Preview/Production每次都需要用户本次明确授权。

Supabase read-only verification != migration/data write；不能从代码授权推定Production数据写授权。

## 12. Final Self-review

- scope是否过界；
- Product Target / Current Contract / executable reality是否混淆；
- canonical owner是否唯一；
- 历史兼容是否破坏；
- UI是否偷带业务；
- C是否误进A Mastery；
- test claim是否真实；
- deployment claim是否真实。

## 13. Final Report

中文说明：做了什么、为什么、修改文件、实际验证、未运行项、兼容风险、数据/安全/部署影响、未完成项。
