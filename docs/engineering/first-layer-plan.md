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

Acceptance（2026-09-24）：代码级验收通过；10个A能力、难度生成、首页/日常、Mastery、Storage、History/Export 与全量 CI 已核验。随后已在用户明确授权下部署 Production，并验证正式首页10个A入口；完整多设备人工体验仍不视为已验收。

Exit：formal A current contract、registry、UI、Mastery、tests一致。

## Phase 3 — C4 ✅

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

完成状态（2026-09-24）：

- 正式 C4 project definition / generator / 首页入口已接入；
- L1 / L2 单基准、单方向、乘除综合、本级综合可用；
- L1 / L2 综合保证本级全部基准至少出现；
- L3 不新增基准，只做四种数量级迁移，并保留乘法 / 除法 / 乘除综合；
- 正式训练块固定20题；
- 另一操作数主体3～5位；
- final numeric answer 使用 relative error ≤ 2%；
- C4 不进入 A Mastery、不套 Classic Rating、PK=false；
- frozen preset 支持恢复与“再来一组”重新生成；
- result/history 已有基准、方向、重复数字组、数量级与最终误差复盘；
- C4 已进入 project + difficulty History trend；
- generator / grading / UI / session / restart / history targeted tests 与端到端启动测试已补齐。

Exit：C4 current contract、UI、runtime、analytics、repeat、tests一致。

## Phase 4 — C3 ✅

工程关注：

- 独立于 Classic fraction_comparison 的正式 C3 generator；
- structure/salience classifier；
- difficulty quota set validation；
- exact comparison grader；
- whole-set方向/覆盖/去重；
- family-aware History/analytics。

不能通过修改 Classic generator 把旧分数比较直接“升级”为 C3。

完成状态（2026-09-24）：

- 新建独立 C3 objective classifier 与 generator，Classic fraction_comparison 保持原义；
- S1 / S2 / S3 与 strong / normal / weak 分成两个维度；
- L1 / L2 / L3 严格按 Obsidian 当前 quota 生成20题；
- whole-set 固定10个 >、10个 <、无等值、不重复、随机顺序；
- 每档最低 appearance coverage 自动校验；
- target recipe 只负责提出候选，最终重新 classifier；
- 左右换位后重新 classifier；
- exact comparison grader 与 first-click C3 renderer 已接入；
- C3 result/history 支持 S-level / salience / objective appearance 复盘；
- C3 自动进入 project + difficulty trend；
- frozen difficulty 支持 restart/repeat 生成新的 quota-valid 题组；
- 不推断用户方法；
- classifier / quota / multi-seed stability / grading / renderer / UI / session / restart / end-to-end tests 已补齐。

Exit：C3 current contract、classifier、quota、UI、runtime、analytics、repeat、tests一致。

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

## Phase 7 — C Usage / Data Accumulation

C1～C4 都完成后，不立即凭空扩写 B。

先让 C 在真实使用中积累一段干净数据：

- 题目客观结构；
- 用户真实作答；
- 用户明确填写的过程；
- 有效耗时；
- 最终正确 / 误差；
- 可直接计算出的项目诊断。

禁止为了后续 B 提前保存“推测用户用了某方法”。

Exit：真实数据量足以看出一批稳定的错题、慢题和结构表现模式。

## Phase 8 — B Design / Explanation Integration

先回 Obsidian，根据 C 的真实用户数据完善 B 方法语言：

- 哪些方法值得正式化；
- 方法触发条件；
- 使用步骤与边界；
- 方法之间的转移关系；
- 解析模板；
- 哪些语言可以跨 C 项目复用。

产品设计确认后，再回 GitHub把 B 接入 C1～C4 的解析与错误解释。

B 仍不是独立 Mastery / ability tree。

## Phase 9 — First-layer Integration Acceptance

统一验收：

- A正式能力；
- C1～C4；
- B解析接入；
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
- B解释基于可观察事实与已经确认的产品规则；
- 不存在第二套current contract。

## Quality Gate

通用工程质量门以 Engineering README 为准。每个 Phase 还必须补对应 targeted tests / manual acceptance。

## After First Layer

第一层收口后，再回 Obsidian讨论下一阶段；当前GitHub plan不展开第二层和第三层。
