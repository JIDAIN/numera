# First-layer Implementation Plan

本文只维护 Numera **第一层** 从 current master 到正式工程收口的实施顺序、依赖和验收。具体训练产品规则以 Obsidian「数感」当前正式 owner 为准：第一层总体、A、B、C总体、C1～C4、第一层共享设计与关键设计决策；本文不复制完整 quota / anchor / grading 产品规格。

## Phase 0 — Documentation / Architecture Closure ✅

目标：先让工程事实源、runtime边界和实施依赖清楚，再继续业务编码。

Scope：

- 完成新的 canonical docs；
- 删除旧第二事实源；
- 形成 current Product / Domain / Architecture / Engineering 基线；
- 把第一层 runtime gap 写清；
- 保持 PR #8 暂停。

Exit：

- docs links/anchors一致；
- Obsidian target / GitHub current / code reality / History边界清楚；
- 无旧 docs/features/reference/status/plan 继续承担 current owner。

## Phase 1 — Training Runtime Foundation ✅

这是业务功能之前的必要工程重构。

目标结构：

```text
TrainingDefinition / Project Definition
→ LaunchSpec
→ Session
→ Renderer
→ Grader
→ Record / Analytics
```

核心工作：

- 建 TrainingDefinitionRegistry 或等价单一入口；
- session持久化 LaunchSpec；
- 引入 StructuredResponse，保持旧 string answer兼容；
- renderer dispatch从 page.tsx 拆出；
- grader registry统一 exact / relative_error / project custom；
- gradingMetrics明确边界；
- restart/reproduce基于 frozen launch contract；
- family-aware display / analytics descriptor；
- pkEligible 明确化，C默认false；
- History/PK/Export接入新contract但保持旧冻结数据可读。

Non-goal：不在本阶段实现 C1～C4 产品 generator。

完成状态（2026-09-24）：

- TrainingDefinition family registry 已建立；
- LaunchSpec 已冻结进入新 Session；
- first-class TrainingResponse 已建立并保留 string answer 兼容；
- Renderer Registry / Grader Registry 已接入；
- custom C grader 支持显式注册；
- restart/reproduce 已使用 frozen launch contract；
- History list/result/PK 已 family-aware；
- C 默认 PK disabled；
- Export / IndexedDB normalize 已接入 LaunchSpec / Response；
- 专门 runtime-foundation tests 已补齐；
- 标准 CI：Prettier / typecheck / lint / tests / build 通过。

保留到后续项目阶段的内容：

- C project-specific generator/UI；
- C project trend chart；
- 普通 C“再来一组”的项目 generator 接入。

Regression：Classic、A、daily、timer、active recover、history、PK、export、Match。

## Phase 2 — Formal A Closure ✅

目标：使 master formal A 与已经收口的第一层 Product Target 一致。

必须先解决：

- A-MUL-04最终 generator规则；
- A-MUL-05最终 generator规则；
- canonical registry / metadata / home / daily / Mastery / History / Export 单一事实源。

完成状态（2026-09-24）：

- canonical A 从8项扩展并收口为正式10项；
- A-MUL-04 / A-MUL-05 generator 与 metadata 已进入 master；
- AHomeTraining 不再维护独立 ability 成员数组，改由 canonical definitions 驱动；
- Daily Plan 自动支持新增能力；
- Mastery 自动接入两个新增正式 A；
- History / Export 通过 canonical registry 识别新增能力；
- targeted generator / registry / daily / Mastery / UI / integration tests 已补齐；
- PR #8 已关闭为 superseded，没有直接 merge 旧 runtime 分支。

Acceptance（2026-09-24）：代码级验收通过；10个A能力、难度生成、首页/日常、Mastery、Storage、History/Export 与全量 CI 已核验。Production 未部署，不包含线上视觉/设备验收。

Exit：formal A current contract、registry、UI、Mastery、tests一致。

## Phase 3 — C4

优先实现交互简单、只提交最终答案的 C4。

工程关注：

- C project definition；
- L1/L2/L3 generator；
- current Product Target规定的20题综合覆盖；
- relative-error grader；
- History/Export project identity；
- C不进入A Mastery；
- PK默认关闭。

产品 anchor/配额以 Obsidian为准。

## Phase 4 — C3

工程关注：

- 独立于 Classic fraction_comparison 的正式 C3 generator；
- structure/salience classifier；
- difficulty quota set validation；
- exact comparison grader；
- whole-set方向/覆盖/去重；
- family-aware History/analytics。

不能通过修改 Classic generator 把旧分数比较直接“升级”为 C3。

## Phase 5 — C1

工程关注：

- StructuredResponse：A′ / B′ / final；
- evaluateMultiplicationCost 单一 evaluator；
- 多解现场判定；
- direction / cost reduction / method/execution/total metrics；
- project custom grader；
- 20题正式覆盖；
- project-specific renderer。

现有 StructuredStepTraining 不自动等同于 C1 正式交互。

## Phase 6 — C2

第一层中复杂度最高，最后实现。

工程关注：

- raw → core；
- Direct / Split / Scaling route evaluator；
- support/method/method-choice/comprehensive modes；
- number-first comprehensive；
- local support grading + complete final grading；
- route cost与frontend difficulty严格分离；
- structured response / grader / analytics。

## Phase 7 — First-layer Integration Acceptance

统一验收：

- A正式能力；
- C1～C4；
- Classic兼容；
- Session / timer / recovery / restart；
- IndexedDB / Supabase / owner；
- History / Stats；
- PK eligibility；
- Export；
- mobile UI；
- documentation closeout。

确认：

- C不进入A Mastery；
- Classic不被重写；
- 用户未提交的方法不推断；
- difficulty / structure / evaluator cost不混字段；
- 不存在第二套current contract。

## Quality Gate

通用工程质量门以 Engineering README 为准。每个 Phase 还必须补对应 targeted tests / manual acceptance。

## After First Layer

第一层收口后，再回 Obsidian讨论下一阶段；当前GitHub plan不展开第二层和第三层。
