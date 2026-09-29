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
- S1 结构画像改为可叠加，不因 direct 丢失 benchmark / scale / delta；
- S3 增加 scale / delta 的直接出口判断；
- 增加 ratio-zone 最低覆盖，避免训练样本长期偏向两个比值都 >1；
- target recipe 只负责提出候选，最终重新 classifier；
- 左右换位后重新 classifier；
- exact comparison grader 与 first-click C3 renderer 已接入；
- C3 result/history 支持 S-level / salience / ratio-zone / objective appearance 复盘；
- C3 自动进入 project + difficulty trend；
- frozen difficulty 支持 restart/repeat 生成新的 quota-valid 题组；
- 不推断用户方法；
- classifier / quota / ratio-zone / multi-seed stability / grading / renderer / UI / session / restart / end-to-end tests 已补齐；
- C3 / C4 已与 A 统一进入“全部练习”，并进入“最近专项 / 再来一组”闭环。

Exit：C3/C4 current contract、classifier/generator、UI、runtime、analytics、repeat 与 tests 一致。

## Phase 5 — C1 Implementation Complete / Release Closure Reopened

工程关注：

- StructuredResponse：A′ / B′ / final；
- evaluateMultiplicationCost 单一 evaluator；
- 多解现场判定；
- direction / cost reduction / method/execution/total metrics；
- project custom grader；
- 20题正式覆盖；
- project-specific renderer。

现有 StructuredStepTraining 不自动等同于 C1 正式交互。

完成状态（2026-09-24）：

- 新建独立 C1 generator 与单一 evaluateMultiplicationCost evaluator；
- 正式作答使用 A′ / B′ / U first-class StructuredResponse，不要求填写 r；
- project custom grader 现场计算 direction / cost / method-error / execution-error / total-error；
- 推荐路线只用于出题保证和参考，不作为唯一判定答案；
- 三类误差 hard bound 均为2%，约10%大调整只作 diagnostic；
- L1 obvious、L2 10 amplitude + 10 recognition、L3 10 same-side + 10 cross-side 已落实；
- 四种方向结构每组各5题；
- generator 排除低成本原式和主要依赖 C4 特殊基准的原式，并按有效数字核心去重；
- 支持不同数量级 / 小数题面而不把位数、数量级当成难度本身；
- 专用 C1 renderer、result/history diagnostics、project trend、restart/repeat 已接入；
- IndexedDB / cloud session payload / export 均保存 first-class response 与 grading metrics；
- C1 已接入统一“全部练习 / 最近专项 / 再来一组”；
- C1 不进入 A Mastery、不使用 Classic Rating、PK=false；
- generator / multi-solution grading / structured UI / storage / session / repeat / review / end-to-end tests 已补齐。

### Release-candidate closure audit（2026-09-29）

2026-09-24 完成的是 **C1 功能实现阶段**，不再直接等同于“最终收口”。进入 C2 前，按 Obsidian 当前 Product Target 与 master executable reality 重新做 C1 release-candidate 审查。

已经确认可保留的基线：

- C1 只保留“乘法放缩”一个正式专项；
- A′ / B′ / U first-class StructuredResponse，不要求填写 r；
- 推荐路线不是唯一标准答案，custom grader 现场判断用户路线；
- 方向、方法误差、执行误差、总误差分开；
- 三类误差 hard bound 均为2%；
- 约10%大调整只作 diagnostic；
- L1/L2/L3 固定20题，L2 10+10、L3 10+10、四方向各5题；
- C1 不进入 A Mastery / Classic Rating，PK=false；
- frozen session / active recovery / repeat / History project trend 基础链路已经存在。

进入 C2 前的 **must-close**：

1. **Generator contract 对齐**：Obsidian 当前设计要求先确定训练目标与低成本放缩目标，再构造原式；master 当前主要采用随机原式 → 搜索附近路线 → 筛选。需要明确并落实最终生成 contract，不能把两种语义默认为等价。
2. **难度污染防护**：L1 obvious 必须排除跨侧或其他方向的近似竞争路线；L2/L3 的“识别 / 同侧竞争 / 跨侧竞争”也要用可验证 classifier / guard 锁定，不能只靠找到一条目标路线。
3. **Cost contract 收口**：统一“确实更好算”的正式判据。当前 generator 的推荐路线要求明显 cost reduction，而 grader 仅要求极小下降即可通过；同时复核 evaluator 是否足以表达完整乘法放缩成本，而不是只表达数字字符形态。
4. **推荐结构与用户真实路线分离**：题目 target slot / recommended route 只能作为出题事实；result/history 的用户路线统计必须从真实 A′/B′ 计算，不能把 generator 的 directionPattern 当作用户实际路线。
5. **逐题诊断闭环**：错误题要能区分方向、成本、方法误差、执行误差、总误差与大调整提示；不能只显示 A′ / B′ / U + 总体 ✓/×。
6. **百分数题面语义**：Obsidian 当前允许整数 / 小数 / 百分数作为题面外观；master 目前实际只覆盖普通数值 / 小数数量级。收口时要么实现真实百分数数值语义与输入/显示，要么回 Product Target 明确首版不包含百分数，不能维持模糊状态。
7. **C project 单一路径**：首次启动与 repeat/recreate 统一经过 C project registry / project generator contract，避免 C1 继续保留 page.tsx 直连 generator 的第二条 dispatch 路径。
8. **数据闭环专项验收**：补 C1 StructuredResponse + gradingMetrics 的 IndexedDB normalize、cloud payload、History detail、Export 专项回归，不只依赖通用 C shell 测试推断。
9. **Generator 稳定性验收**：把当前少量 deterministic seeds 扩为系统性的 multi-seed / quota / uniqueness / no-failure / difficulty-invariant 校验，并加入边界输入与多解 grader cases。
10. **Current docs 一致性**：修正仍把 C1 写成“待实现”的 current 文案；最终 closure 后再把 Current State / Phase 5 状态标记为正式收口。

进入 C2 前的 **should-close**：

- C1/C3/C4 共享的 UI / insight 样式从 c4* 命名收口为通用 C project 命名，避免 C2 继续复制历史命名债；
- 检查手机 / 平板 / PC 的三字段输入、键盘、滚动、错误态与结果页可读性；
- 完成标准质量门：Prettier → typecheck → lint → tests → build。

Exit：上述 must-close 全部完成，targeted + full quality gates 通过，且 C1 的 Product Target / current contract / executable reality / review analytics 无已知冲突。Production 部署仍需单独明确授权，不属于 C1 master 收口的自动步骤。

## Phase 6 — C2

第一层中复杂度最高，最后实现。

**Gate：Phase 5 C1 release-candidate closure 未完成前，不进入 C2 编码。**

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
