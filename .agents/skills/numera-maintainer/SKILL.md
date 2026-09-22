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

~~~text
AGENTS.md
→ docs/README.md
→ docs/engineering/current-state.md
→ task area README
→ canonical contract
→ current source/tests
→ runtime when needed
~~~

涉及产品目标时，再读取 Obsidian「数感」对应 01/02/03/91。

不要从 History 反推 current behavior。

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

~~~text
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
~~~

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

~~~text
shared primitive/pattern
→ training renderer
→ page composition
~~~

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

~~~text
Prettier
npm run typecheck
npm run lint
npm run test
npm run build
~~~

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