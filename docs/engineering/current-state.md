# Current Engineering State

Program / Production verification baseline: 2026-09-29. C2 documentation routing and research status last reviewed: 2026-10-09 (docs-only; this is **not** a re-verification of deployment or master runtime).

本文只记录 Numera 的动态工程状态与关键 gap；Product / Domain / Architecture 的完整 contract 不在这里复制。

## 1. GitHub Master

当前基线：

- branch: master
- canonical docs restructure baseline: 468b4f1c69c2081e154eb3f2000d8a751a0aedea
- latest runtime-foundation code baseline: ef00c2863170bbc05b62a60f6fa3626fd30259c7
- latest formal-A semantic baseline: 5086b579b0192112d3f69d421004fe8acb35628c
- exact current master HEAD: 运行时读取 GitHub，不在本文件硬编码

不硬编码“当前 HEAD”，因为修改 Current State 本身就会产生新的 master commit；这里只记录有语义的基线提交。

master 当前正式 A runtime 已与 Obsidian 第一层目标对齐为10个 canonical abilities。

master 已有正式 C runtime，并已接入 current 项目 C1 / C3 / C4。C2 runtime foundation 已合入 master：preset contract、raw/core math、Direct/Split/Scaling evaluator、support grader、method-choice/comprehensive backend generator 已建立。PR #16 正继续补 dedicated C2 renderer 的非用户可见基础；C2 仍保持 `implemented=false`，尚无正式首页入口。

## 2. Production Web

最近一次明确授权并完成的 Production deployment：

- deployment: dpl_Gegym3Ft2tnHTqCJsETatY7rarLf
- state: READY
- target: production
- source commit: ad62b81b50ac7a36ddac7548ee3372eb0bbca625
- Production URL: https://fish-cat-speed-math.vercel.app
- verified HTTP status: 200
- verified home UI: 10个正式 A 入口已上线，包括“两个×两个”和“百分数×百分数”
- post-deploy runtime errors: 最近30分钟未发现新的 runtime error

该 deployment 已包含 Phase 1 Training Runtime Foundation、Phase 2 Formal A Closure 与 A层代码级验收之前的全部产品代码。

当前 master 已在该 Production deployment 之后继续开发 C1 / C3 / C4，因此 **master 当前产品代码领先于 Production**。Production 目前仍只包含已验收并部署的 A 层版本；C1 / C3 / C4 尚未获得新的部署授权。

## 3. Deployment Protection

vercel.json 当前要求：

```text
git.deploymentEnabled = false
```

Git push / merge / CI success != Preview authorization != Production authorization。

2026-09-24 已在用户明确授权下完成一次 Production 部署。部署完成后已恢复 `git.deploymentEnabled = false`；后续仍必须重新获得明确授权才能再次部署。

## 4. PR #8 — A-MUL-04 / A-MUL-05

PR #8 已于 2026-09-24 关闭，未直接 merge。

原因：

- 旧分支基于 Phase 1 之前的 runtime；
- Phase 2 已在 master 重新吸收其有效 generator / metadata / test 内容；
- 同时按当前正式设计补齐 canonical UI source、Daily、Mastery、integration regression。

因此 PR #8 仅保留为历史证据，不再代表待合并能力。

## 5. First-layer Current Gaps

### Runtime foundation

Phase 1 已完成当前收口：

- 已建立 Classic / A / C TrainingDefinition family registry；
- 新 Session 冻结 LaunchSpec；
- 已建立 first-class TrainingResponse，保留旧 userAnswer:string 兼容投影；
- 已建立 Renderer Registry 并由 page.tsx 使用；
- 已建立统一 Grader Registry，支持 Classic / A / C exact / relative_error / registered custom grader；
- restart/reproduce 已改为读取 frozen launch contract；
- History list/result/PK 已接入 family-aware display descriptor；
- PK eligibility 已进入 runtime contract，C 当前默认 false；
- export 已包含 training family / launch spec / first-class response；
- IndexedDB normalize 保持旧记录兼容。

仍保留的结构债：

- src/app/page.tsx 仍承担较多 routing / controller 职责；
- C1 / C3 / C4 已完成 project generator、再来一组与 project trend；C2 后续复用同一 runtime contract。

### A

Phase 2 Formal A Closure 已完成：

- canonical A 已从8个收口为10个；
- A-MUL-04 两位数×两位数已进入 master；
- A-MUL-05 百分数×百分数已进入 master；
- canonical registry / metadata / AHomeTraining / Daily / Mastery / History / Export 已使用同一正式 A 成员事实源；
- A-MUL-04 / A-MUL-05 已补 generator、registry、daily、Mastery、UI 和 end-to-end regression；
- 旧“8个正式A能力”文案与成员副本已退出 current code。

A层代码级验收（2026-09-24）：**通过**。

验收覆盖：

- 10个 canonical A ID 与 Obsidian 正式 A 设计一致；
- 10个能力均可在 L1/L2/L3 生成正式题目；
- 4个反应型能力使用 choice，6个计算型能力使用 number input；
- AHomeTraining、Daily Plan、recent repeat 使用 canonical source；
- A-MUL-04 / A-MUL-05 已进入 Mastery、Storage、History 与 Export；
- Classic 历史语义未被改写，C 不进入 A Mastery；
- 最终标准 CI Run 35950710887 的 formatting / typecheck / lint / tests / build 全部通过。

本次 A 层代码级验收已经随后部署到 Production；已验证正式域名返回 HTTP 200 且首页显示10个正式 A 入口。由于未进行完整人工设备交互测试，仍不把手机/平板/PC 的视觉与手势体验标记为完整实机验收。

### C

Phase 3 C4、Phase 4 C3 与 Phase 5 C1 已完成正式工程实现。2026-09-29 的 C1 release-candidate closure audit 已全部通过；C2 已开始 Phase 6 runtime foundation，但仍未开放用户入口。

C1：

- 独立正式 generator / project identity 已接入，不复用 Classic 普通乘法语义；
- 用户一次提交 A′ / B′ / U，使用 first-class StructuredResponse 保存真实过程；
- custom grader 不匹配推荐答案，而是现场计算方向、成本、方法误差、执行误差和最终总误差；
- 当前 generator 使用 target-first：先确定 challenge / direction 与低成本目标，再反推原式；数量级缩放后重新验证结构；
- 方向要求为一边上调、一边下调；当前 cost evaluator 比较完整放缩路线，包含调整后乘法与通用调整开销，并要求有意义的成本下降；
- 方法 / 执行 / 总误差分别使用 2% hard bound；
- 最大调整超过约10%只记录 large-adjustment diagnostic，不直接判错；
- L1 为 obvious；L2 固定10 amplitude + 10 recognition；L3 固定10 same-side competition + 10 cross-side competition；
- 四种方向结构每组各5题；
- 正式题目排除低成本原式与主要依赖 C4 特殊基准的原式，并按有效数字核心去重；
- 当前 generator 支持普通数值 / 小数 / 百分数题面外观；百分数具有真实数值语义但不成为新的难度维度，每组20题固定4题含一个百分数因子（左2/右2）；
- 当前新题使用 C1 v3 grader：百分数因子按题面百分数单位输入并归一化为真实数值参与方向、成本和三类误差；v2 / v1 grader 继续注册，只用于兼容此前 frozen session；
- grader 从用户真实 A′ / B′ 重新计算 observed primary side / direction；generator target direction 不再被当成用户实际路线；
- result/history 复盘 challenge、observed direction、cost、three errors、large-adjustment 与 time；每道 C1 题在结果页和历史详情中都有项目专用逐项诊断卡，可直接区分方向、成本、方法误差、执行误差、总误差，并把 >10% 大调整作为非判错提示；系统推荐 A′ / B′ 只作为参考路线展示；
- 首次启动、结果页 repeat 与 recreate/restart 已统一通过 C project registry / project generator contract；
- C1 已进入统一“全部练习 / 最近专项 / 再来一组”链路；
- 不进入 A Mastery、不使用 Classic Rating、PK=false；
- StructuredResponse、题面 presentation facts 与 gradingMetrics 已有 IndexedDB、cloud payload、History detail、Export 的 C1 专项回归；
- 只记录用户真实填写与直接可计算事实，不推断未提交的心算方法。

C3：

- 独立于 Classic fraction_comparison，未改写 legacy generator / history；
- 正式 objective classifier 已实现 S1 / S2 / S3 与 strong / normal / weak；
- 当前校准阈值按 Obsidian 产品设计实现，后续允许依据真实训练数据重新校准；
- L1 / L2 / L3 都固定20题并严格满足各自 quota；
- 每组固定10题 >、10题 <、0等值、不重复、顺序随机；
- 每档最低覆盖 direct / benchmark / scale / delta / ordinary two-axis / very-close 中规定项目；
- S1 的 direct 与 benchmark / scale / delta 改为可叠加记录，不再提前 return 丢失客观结构事实；
- S3 classifier 已补 scale / delta 的直接出口判断，近值但已可直接定方向的题回落 S2；
- 新增 ratio-zone 最低覆盖，避免 L2/L3 长期高度偏向两个比值都 >1；如果一边比值恰好等于1，则客观位置单独记录为 `touch_1`，不再误并入 both-above-1；
- 造题 recipe 只提出候选，最终必须重新经过 objective classifier 才能进入题组；
- 左右换位后重新 classifier，不机械沿用旧标签；
- first-click < / > renderer 已接入；
- exact comparison grader 已接入；
- restart/repeat 会按 frozen difficulty 重新生成一组满足 quota 的新题；
- result/history 可按 S-level / salience / ratio-zone / objective appearance 复盘；C3 已补更广 multi-seed 稳定性回归和 IndexedDB / cloud / Export 专项数据闭环；
- project + difficulty History trend 已自动接入；
- 只保存题目客观结构与真实作答，不保存推测的用户比较方法。

C4：

- 正式 project definition / generator / entry UI 已接入；
- L1 / L2 支持单基准、单方向、乘除综合与本级综合；
- L1 / L2 20题综合保证本级基准全覆盖；
- L3 只使用已学基准并覆盖 10^-2 / 10^-1 / 10^1 / 10^2 数量级迁移；
- final numeric response 使用 relative error ≤ 2%；
- result/history 可复盘 difficulty / anchor / operation / repeat-digit group / scale / final error；C4 已补更广 multi-seed generator、registry dispatch 与 IndexedDB / cloud / Export 专项回归。

C1 / C3 / C4 共享首页行为：

- 已与 A 一起进入同一个“全部练习”区域；
- “最近专项”可以识别最近完成的 A / C 正式专项；
- 完成页均可“再来一组”，保持原配置并生成新题。

C1 / C3 / C4 均：

- 不进入 A Mastery；
- 不使用 Classic Rating；
- PK=false；
- 可观察数据可用于后续真实数据积累，不记录推测的用户心算方法。

C2 产品决策同步（2026-10-08，**设计确认；未实现/未上线**）：前台点击 C2 分类展开 **直除 / 拆分 / 补偿放缩 / 求 r / N×r / 综合训练** 六入口，选中专项直接练，不额外让用户选难度/题量/配额。**综合训练对应 `comprehensive` 原始数完整计算 + 最终数值作答**；未来解析应从 `method_choice` 共享的客观路线评估角度比较路线并给出计算过程，但解析仍待实现。独立 `method_choice` 后台能力保留用于兼容/复用，**不是可见第七入口**。Direct/Split/Scaling 是并列路线，`low/medium/high` 是每条路线的计算成本，不能对应 L1/L2/L3；六个专项的难度准入与题组配额必须逐项确认，目前未完成。

C2 三路线专项准入新决策（2026-10-09；**文档目标已确认、工程尚未实现**）：数感训练第一眼识别结构、比较**完整可执行心算链**、选择低成本算法。直除主体面向放缩 r/修正与拆分均不占明显成本优势的候选；拆分主体是 **A<B，将分母看成100个包子，用熟悉比例块求分子占比**；放缩须搜索整百及特殊自然基准并评估 r、Q0、修结果/修分子的全部成本，不能因有基准就淘汰直除。专项准入（preferred/competitive/disfavored/unresolved）先于各自 L1/L2/L3 分类；两套判据及各方法权重不能混淆。直除专项已确认**准确求前两位有效商为主、少量第三位，不按3%判停、不四舍五入冒充商位**；综合训练仍使用3%最终误差。必须补跨路线同目标成本归一校准、可解释路径搜索、数位/边界验算和出题组配额/审计测试。当前 `route-direct.ts` 与 `route-evaluator.ts` 尚不满足这些新要求，**不能直接用于正式直除专项筛题**。详见 Obsidian C2 owner 与本分支 `docs/engineering/c2-implementation-plan.md` 的实施映射。

**C2 当前产品设计—工程映射状态（2026-10-09；文档变更）**：Obsidian正式Owner`20_C2_除法综合.md`已经明确支持**修分子粗商×Δ不必先填r**与**零阶实际结果满足原式3%可停算**，不新增前台入口；综合0.2～5、现行Split基本比例块（0.5%存在，0.1/0.2%未放行）、方法选择6:4及L1L2L3原则保持不变。来源包括小P课件讲义10道与花生整理练习12道；产品不能从这22道样例估计真题商分布。原39号是历史提案，D1扩域、D4细块、专项配额、统一成本权重仍未获授权。

**已审核的实际代码差距**：`src/lib/c2/route-scaling.ts`仍只按`A×r`修分子，0阶成本仍计r；`C2Training.tsx`完整方法只有占位，`src/lib/c2/runtime.ts`不给Direct/Split/Scaling完整方法生成。因此**产品语义已确认≠功能已实现**。后续工程顺序与冻结/测试/兼容闸门写在 [C2阶段化工程蓝图](./c2/c2-stage-aware-implementation-blueprint-v1.md)；工程主计划仍是 [C2 implementation plan](./c2-implementation-plan.md)。本轮保持`implemented=false`，C2正式generator/evaluator/UI改造、PR合并和Vercel部署均未执行。

**研究档案**：老师来源、历史42题与用户实算数据分层存于Obsidian `20_C2_研究与校准/00_C2_研究导航.md`；历史旧统计如“0/8实际计算”不再用于当前状态。相关时间顺序记录可查 [C2 archive](./c2/history/2026-10-09-calibration-log.md)。

**C2三主专项的出题与难度设计研究进展（2026-10-09，仍未定稿）**：Obsidian新增`40_C2_三主专项出题准入与L1L2L3细则_研究稿_V1.md`、`41_C2_三主专项样题准入与难度候选审计_V1.md`、`42_C2_跨路线动作成本与难度校准规程_研究稿_V1.md`，分别研究直除准确商位/拆分真实余量/放缩0阶及结果与两条分子修正的准入证据、15条方法×原式数学候选和可复核成本账本。**尚未确定各专项的机器难度阈值、路线优势权重/距离、L档配额、局部过程容差/正式题量**；不能宣称C2出题设计结束，也不能将旧四舍五入Direct evaluator用于准确两位商位题。生成器、工作台、数据库/CI、生产部署均未改动；`implemented=false`且正式算法重构保持暂停。

**C2产品出题与难度研究更新（2026-10-10，仅文档）**：Obsidian `43_C2_同骨架对照题与难度边界校准_V1.md` 新增4对来源基线+明确标注控制变量的同骨架试题，对照直除准确第二位边界、拆分指定路线2/3块首次达标、放缩两组0阶/一阶条件；`44_C2_求r_N乘r_方法选择_综合出题与难度规则_研究稿_V1.md` 将“求r、N×r、方法选择（后台preset，非第七入口）、综合”补成出题准入与独立L档证据画像。**890÷371准确前两位商2.3，但作为近似输出误差4.12360%，不应由3%近似门槛否决Direct专项准确商位。**保留已确认的r 0.1pp、N×r逐步5%／混合7:3、方法选择6:4＋多合理解、综合100%自然数字。另发现`B=125,B0=167`时名义×6快捷近似25.2%与严格42/167→25.1%不同；**处理方式仍需产品裁决**。四对数字/课堂证据**并非已签认正式L1L2L3、最快路线或真实考试频率**。机器L档分界、跨路成本、正式配额、局部容差尚未锁定，故正式出题算法重构继续暂停；`implemented=false`，未运行新代码或部署。

**C2统一出题准入审查进展（2026-10-10，仅产品研究与工程文档）**：Obsidian新增 `45_C2_统一出题准入与L难度审查台账_V1.md`，将32条“题×训练目标”候选拆分为Direct 4、Split 9、Scaling 8、求r 3、N×r 3、方法选择 2、综合3；逐条按各自合同验证数学参考，**并没有32条已批L档题或已校准跨路线winner**。新增明确四个独立事实层：数学正确、当前操作支持、专项准入、前台L及发布可用性。已识别一块或零阶足够只宜热身、0.1/0.2%块尚未获批、严格r与名义快捷显示不一致、方法选择无统一优势标尺等阻塞；R1–R3与正式样题/配额仍需Owner裁决。C2 `implemented=false`，本轮无代码、schema、合并、部署或运行程序测试。

**C2题量取值已获产品Owner确认（2026-10-10；运行代码未实现）**：正式Obsidian Owner明确**C2每一组只能是10题或20题**，覆盖六个前台入口及N×r内部子模式、后台方法选择；不允许原研究V0建议的6、8、12题，不要求其它C项目同组长，也不新增前台题量选择器。Obsidian `45_C2_统一出题准入与L难度审查台账_V1.md` §七V1按此重新给出**待审批的具体分配**：直除10、拆分10、放缩10、求r20、N×r普通20／连续10／混合10、综合10，内部方法选择仍10；10题组L候选3/5/2、20题组L候选6/10/4。**已批准的是允许组长{10,20}，不是各入口实际选择、L配比、题型占比或R3局部容差**。保留既有N×r混合10题7:3和方法选择10题6:4；未来题池不满足需要报告`quota_unfillable`，不可返回更短组。当前`implemented=false`，未更改运行代码、没有CI测试、合并或部署。

C2 当前 foundation：

- Obsidian 已从 2026-09-09～09-22 历史版本恢复仍然有效的 route evaluator、前台难度总原则、方法选择多解正确性、Direct 自动组合两位估商、后台关键阶段计时与详细 observability contract；
- 前台难度继续使用 L1单结构 / L2标准实战 / L3复合结构，严格与 route `low/medium/high` 分离；
- Direct / Split / Scaling objective evaluator 已建立，并真实校验3%可行性；
- NumberFirst core、method-choice 6:4、comprehensive raw-wrapper backend 已建立；
- solve-r 与 N×r ordinary / first+second / mixed generator+grader 已建立，二阶严格沿用户自己的一阶结果继续；
- method-choice grader 已按恢复的历史决策实现：recommended / acceptable 均正确，inefficient 错误；
- C2 runtime foundation 已通过 PR #15 合入 master；PR #16 当前已有 solve-r / N×r / method_choice / comprehensive 的 dedicated renderer 基础（其中 method_choice 不作为新六入口） 与 safe runtime dispatcher；C2 仍 `implemented=false`，不暴露半成品入口。

C2 仍待实现 / 收口：

- Direct / Split / Scaling 各自 method generator、专用工作台与过程 grader；
- Direct / Split / Scaling 完整方法工作台；C2 首页入口与完整 shared registry generation dispatch；
- 各训练形态具体 L1/L2/L3 admission / 题组配额；
- 尚未锁定入口的正式题量；
- Split / Scaling 完整方法中间字段的局部诊断容差；
- C2 persistence/cloud/export/history 专项验收与最终 multi-seed closure。

C1 release closure 已完成：target-first generator、难度竞争 guard、完整 route-cost contract、observed user route、逐题诊断、百分数真实语义、统一 C project 启动链路、专项数据闭环与 multi-seed / compatibility regression 均已收口。

### Cross-cutting

- C1 / C3 / C4 已验证 C project history / trend / repeat contract，以及统一“全部练习 / 最近专项”入口；首次启动与 repeat/recreate 均经统一 project registry；
- C1/C3/C4 insight 样式已从历史 C4 专名收敛为通用 C project 命名；C3/C4 启动设置样式也已从 `c4*` 历史命名收敛为通用 C project 命名；
- export文件名仍有 speed-math 历史品牌残留；
- src/app/page.tsx 仍有较多 controller / composition 职责；
- C2 尚无正式入口。

## 6. Documentation Phase 0

程序文档迁移已完成，并在迁移后最终审查中验证以下目标：

- UI重构有 Product/UI 入口与稳定交互边界；
- 代码模块重构/新增有 Architecture implementation map、refactor rule 与 new module intake；
- AI / 代码维护者有统一 Start Protocol 与 task router；
- Obsidian「数感」与 GitHub current docs 的职责边界已明确；
- Documentation Maintenance Guide 已建立并作为后续文档同步手册；
- 旧 PROJECT_STATUS / DEVELOPMENT_PLAN / features / reference / audits / ADR current source 已移除。

Phase 0、Phase 1、Phase 2、Phase 3 C4、Phase 4 C3 与 Phase 5 C1 已完成。2026-09-29 的 Pre-C2 C-layer closure 也已完成。Phase 6 C2 已从工程映射进入 runtime foundation：历史 Product Target 恢复与 evaluator/support/choice/comprehensive backend foundation 已完成首批实现；下一步在不暴露半成品入口的前提下，继续收口剩余三类产品参数并实现 dedicated C2 renderer / method runtime。按最新产品原则，C1～C4 全部可用并积累一段真实用户数据后，再回 Obsidian 完善 B，再进入 B 解析接入。

## 7. What Is Not Active Scope

当前工程计划只收口第一层。

第二层资料分析专用计算方法、第三层实战判断与决策仍属于 Obsidian future product design，不在当前 GitHub implementation plan 展开。

## 8. Maintenance

只有以下变化更新本文：

- master基线/第一层进度发生实质变化；
- Production deployment变化；
- PR #8或其他关键阻塞状态变化；
- current architecture gap完成/新增；
- deployment protection变化。

不要把 Product规则、完整schema、generator quota 或一次性调试过程复制到本文。
