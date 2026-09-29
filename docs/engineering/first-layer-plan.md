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

## Phase 5 — C1 Release Closure ✅

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

1. ✅ **Generator contract 对齐**：当前 generator 已改为先确定 challenge / direction 与低成本目标，再反推原式；数量级缩放后必须重新通过 landscape validation，不成立时回到已验证的 target-first 基础题。
2. ✅ **难度污染防护**：L1 / L2 已加入竞争路线 guard；L3 same-side 与 cross-side 分别要求对应竞争结构，cross-side 必须存在真实另一侧可行路线。
3. ✅ **Cost contract 收口**：当前判定使用完整 C1 route cost，不再只看调整后乘法表达式；generator 与 grader 共用“有意义的成本下降”下限，同时推荐路线保留更高的出题门槛。旧 v1 frozen active session 继续按原 grader contract 可读可答。
4. ✅ **推荐结构与用户真实路线分离**：generator target direction 只作为题目事实；用户提交 A′ / B′ 后重新计算 observed primary side / direction，result/history 的方向统计读取真实作答诊断。
5. ✅ **逐题诊断闭环**：结果页 / 历史详情的 C1 每题都展开独立诊断，区分方向、完整路线成本、方法误差、执行误差、总误差与 >10% 大调整提示；同时显示系统参考 A′ / B′，并明确它只是参考路线而不是唯一答案。旧记录若缺少逐项 metrics，则明确提示“无完整逐项诊断数据”，不反推历史事实。
6. ✅ **百分数题面语义**：Obsidian 与 runtime 已统一为“百分数是题面表现但具有真实数值语义”。当前每组20题固定4题含一个百分数因子（左2/右2）；用户按题面百分数单位填写 A′ / B′，例如 42%→40% 输入40，v3 grader 按0.40参与方向/成本/误差计算，U仍是原式实际乘积。v2/v1 grader 继续保留给历史 frozen session。
7. ✅ **C project 单一路径**：首次启动、结果页“再来一组”与 recreate/restart 均通过 `c-project-registry` 的 project generator contract；page.tsx 不再直接调用 C1 / C3 / C4 generator。
8. ✅ **数据闭环专项验收**：已补 C1 专项回归，验证 StructuredResponse、百分数 presentation facts 与 gradingMetrics 经 IndexedDB normalize、Supabase sync payload、History detail / per-question review 与 Export 保持原事实，不补猜用户过程。
9. ✅ **Generator 稳定性验收**：已扩展 deterministic multi-seed matrix，并继续校验20题、四方向配额、L2/L3组成、题面唯一性与推荐路线可通过；grader 补充 cross-side 多解、同向拒绝、完整成本、大调整 diagnostic 与 v1 frozen grader 兼容用例。
10. ✅ **Current docs 一致性**：Domain / Product / UI / Architecture / Training Runtime / Current State / First-layer Plan 已按最终 executable reality 同步，Phase 5 正式标记为收口完成。

Batch 1（2026-09-29）已经完成上面的 1 / 2 / 3 / 4 / 9；本批只收 Generator / Difficulty / Cost / observed-route contract。

Batch 2（2026-09-29）已经完成上面的 5：C1 逐题复盘改为项目专用诊断卡，直接读取已保存的 gradingMetrics，展示真实路线方向、成本判定、三类误差和大调整提示；系统推荐路线只作为参考，不参与用户路线认定。

Batch 3（2026-09-29）完成 6 / 7 / 8：补齐真实百分数题面语义并升级为 v3 grader；首次启动、repeat、recreate 收敛到统一 C project registry；新增 IndexedDB / cloud / History review / Export 的 C1 专项数据闭环回归。

Batch 4（2026-09-29）完成 10 与共享工程收尾：C1/C3/C4 insight 样式从历史 `c4*` 命名收敛为通用 C project 命名，current docs 对齐，标准质量门全量通过。

进入 C2 前的 **should-close**：

- ✅ C1/C3/C4 共享的 UI / insight 样式已从历史 `c4*` 命名收口为通用 C project 命名，避免 C2 继续复制历史命名债；
- ✅ C1 三字段输入、百分数后缀、逐题诊断与窄屏复盘已有响应式布局和组件级回归；完整手机/平板/PC 实机视觉验收保留到后续 release/manual acceptance，不作为本次 master 工程收口的伪造证据；
- ✅ 标准质量门：Prettier → typecheck → lint → tests → build 全部通过。

Exit（2026-09-29）：上述 must-close 已全部完成；targeted regression 与 full quality gates 通过；C1 的 Obsidian Product Target、GitHub current contract、executable reality、persistence/export 与 review analytics 已无已知冲突。Production 部署仍需单独明确授权，不属于 C1 master 收口的自动步骤。

## Pre-C2 C-layer Closure ✅

2026-09-29 在正式进入 C2 编码前，对已实现的 C1 / C3 / C4 与 shared C runtime 再做一次横向复核。

完成项：

- C3：修正 decisive exit contract。有效 scale / delta 线索只要已经可以直接定方向，就退出 S3；不再把“必须 strong”当成额外条件；
- C3：明确 ratio=1 边界。任一比值恰好等于1时记录为 `touch_1`，同时作为 S1 direct outlet；不再错误归入 both-above-1；
- C3：generator multi-seed matrix 扩展，classifier / ratio-zone / review regression 同步补齐；
- C3 Product Target：Obsidian 已同步 decisive-exit 与 `touch_1` 语义，并清理旧“30%”阈值残留；
- C4：补更广 deterministic multi-seed generator regression；
- Shared registry：补 C4 project dispatch / subtitle 回归，确保 C1/C3/C4 都有直接 registry 证据；
- C3/C4：补 IndexedDB normalize、Supabase cloud payload 与 Export 的专项数据闭环测试；
- Shared UI：C3/C4 启动设置样式从历史 `c4Setting*` / `c4AnchorGrid` 命名收敛为通用 C project 命名；
- 修复 C1 integration test 对百分数首题的随机依赖，使 shared full CI 不再因首题 presentation 随机而产生假失败；
- full quality gates：Prettier / typecheck / lint / full tests / build 通过。

Exit：当前已实现的 C1 / C3 / C4 在 Product Target、generator/classifier、shared registry、persistence/cloud/export 与 review contract 上无已知阻断项。Production 部署仍需单独明确授权。

## Phase 6 — C2

第一层中复杂度最高，最后实现。

**Gate：Phase 5 C1 release closure 与 Pre-C2 C-layer closure 均已通过。Phase 6 可以开始；此前收口没有提前实现任何 C2 业务代码。**

详细工程映射：[`c2-implementation-plan.md`](c2-implementation-plan.md)。

当前 Phase 6 状态：

- 6.0 implementation-readiness audit 已完成；
- 已确认现有 C runtime 可以承载 support / method / method_choice / comprehensive、first-class structured response、custom grader、frozen repeat/recreate、History/Export；
- 已确认 C2 不应强塞进 generic step runtime，复杂 method UI 需要 C2 project renderer；
- 已确认 Product Target 仍缺少若干可见产品参数：C2 L1/L2/L3 规则、部分模式题量、方法选择三档反馈与 isCorrect 语义、Split/Scaling 中间字段容差、Direct 是否显式填写最终估商、是否要求逐字段计时；
- 在这些 Product 参数进入 Obsidian 正式 owner 之前，不开始 route/generator 业务编码。

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
