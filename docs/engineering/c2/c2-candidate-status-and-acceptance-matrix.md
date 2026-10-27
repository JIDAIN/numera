# C2 候选功能状态与独立验收矩阵（F-P02）

> **工程交付索引 / 候选快照，非产品设计 Owner、非上线或最终验收声明。** 编制于 2026-10-27；范围为 Issue #21 的 [R-PAR-002 / F-P02](https://github.com/JIDAIN/numera/issues/21#issuecomment-6432440823)。规则以 [Obsidian 正式 C2 Owner](https://github.com/JIDAIN/lys-obsidian-note/blob/main/13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_除法综合.md)（blob `234fd54d019ae508bf11b58f1010359fb539a5e2`）为准；此文件只指向程序、测试、证据与缺口。没有合并、部署或触及生产数据的授权。

## 1. 版本与判定口径

- **master/current**：GitHub `master@f1f44fd19e5087d9fee9034bfdfabb846635d7c3`，[`c-project-registry.ts`](https://github.com/JIDAIN/numera/blob/f1f44fd19e5087d9fee9034bfdfabb846635d7c3/src/lib/c-project-registry.ts#L28-L36) 明确 **C2 `implemented=false`**，没有正式 C2 首页入口，也没有 `/c2-lab` 正式实现；已有 C2 后台数学/旧兼容基础不代表用户专项已上线。[master current-state](https://github.com/JIDAIN/numera/blob/master/docs/engineering/current-state.md) 是工程状态参考，部分 C2 研究文字属旧快照；实时标记与代码优先。Production 是另一独立部署版本，不因 master 或候选 PR 的 CI 成功自动改变。
- **当前候选（开发在途）**：[draft PR #22](https://github.com/JIDAIN/numera/pull/22) 基于上述 master，编制时**最新查到 HEAD `0565cb7ce51a9e3c3ac3c24eb1763c8506fff236`**；可见 C-007 Scaling 代码和 [CI #40442367425](https://github.com/JIDAIN/numera/actions/runs/40442367425) `completed/success`，**但未取得 C-007 完成交付报告与 D-007 独立验收**，所以 Scaling 仅为“开发中/未验收”，不能据文件、CI 或 PR 标为已交付、PASS 或现行入口。
- **最近一次已独立验收的程序固定版本**：C-006 [候选 HEAD `40677a208fe22e540e172f8606db72e47bf0a2cb`](https://github.com/JIDAIN/numera/commit/40677a208fe22e540e172f8606db72e47bf0a2cb)、[CI #39702691346](https://github.com/JIDAIN/numera/actions/runs/39702691346)、[D-006 PASS（范围限定）](https://github.com/JIDAIN/numera/issues/21#issuecomment-6331536238)。**新 HEAD 不能继承旧 D 在新增 diff 上的 PASS**。[C-006→在途 C-007 diff](https://github.com/JIDAIN/numera/compare/40677a208fe22e540e172f8606db72e47bf0a2cb...0565cb7ce51a9e3c3ac3c24eb1763c8506fff236) 实查 10 个变更文件（含 Scaling 源码、表单、测试、E2E及文档）。
- **其他独立草稿**：[PR #16](https://github.com/JIDAIN/numera/pull/16) HEAD `4d32da1f878a7d5350f3859aaf97902bd1a8e4f3`（旧 UI/方法选择等历史方案，不是获签新入口）；[PR #17](https://github.com/JIDAIN/numera/pull/17) HEAD `0f7a8ac6e00a5bbad933b8cb2020586abc22b6ad`（阶段零旧模式禁新建、10/20 门、数学 fixture/legacy）；二者仍 open/draft/unmerged，**PR #17 以 PR #16 为 base，PR #22 则直接以 master 为 base**，不可把三个 PR 简单累加视为当前主线功能。[PR #23](https://github.com/JIDAIN/numera/pull/23) HEAD `9c0b777f148a20be661eed5b10b46ee92b018399` 是 F-P01 **文档手册**，经 [D-FP01-R2 仅文档 PASS](https://github.com/JIDAIN/numera/issues/21#issuecomment-6206250241)，不是程序/浏览器 PASS；仍 Draft/unmerged。
- **状态词必须独立使用**：`PASS(scope-limited)` = D 在**固定 HEAD 与明确用例**对源码/CI/证据给出通过；`PARTIAL` = 候选仅覆盖正式目标一部分或有限模式/视口；`IN-PROGRESS / AWAITING-D` = 代码可存在、CI 可绿但该增量尚无独立 D 结论；`NOT-IMPLEMENTED` = 对应正式体验/链路没有候选闭环；`NOT-VERIFIED` = 可能存在代码或试验，但**指定环境/场景没有可信实测证据**；`BLOCKED` = 明确的环境/依赖阻断。**未实现与未验证不是同义词**。

## 2. 七种作答配置＝六个正式入口与 N×r 的两种子模式

> 以下题量、终局/过程双轴是 [正式 Owner 的 R1/R2/R3、D2/D3](https://github.com/JIDAIN/lys-obsidian-note/blob/234fd54d019ae508bf11b58f1010359fb539a5e2/13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_除法综合.md) 所定；六入口不等于七个独立一级入口。C2 组长只能 10/20，进入入口直接训练，无独立题量/难度选择器。

| 配置（正式入口） | 已签题量与验收数学要点 | master 正式状态 | 候选与 D 状态 |
| --- | --- | --- | --- |
| 直除 Direct | **10**；准确截取应取的前两位有效商位，题面需要时第三位；终局不是3%近似，用户实际首商/乘回/余量与准确数位分别诊断 | C2入口未实现 | **候选已验限定范围**：C-003/D-003；C-005/006 Chromium |
| 拆分 Split | **10**；带符号熟悉比例块、本人算出的块量/余量与累计比例；可以一块/两块足够即停，终局对**原始商≤3%**、过程独立复核 | C2入口未实现 | **候选已验限定范围**：C-004/D-004；C-006 双列/断点 |
| 补偿放缩 Scaling | **10**；零阶已够原始商3%可直接交；可修结果、`A×r`修分子、或`粗商×signed Δ`修分子（后一链不强填r/Q0）；真实必要二阶、双轴诊断 | C2入口未实现 | **C-007 IN-PROGRESS / AWAITING-D**：新代码+CI出现但未独立验收 |
| 求 r | **20**；`B` 对题面 `B0` 的百分数按严格 **0.1 个百分点**显示；名义快捷结果与严格值冲突题暂缓正式单答案题池 | C2入口未实现 | **候选已验限定范围**：C-001→D-002；C-005/006 Chromium |
| N×r（一阶） | **20**；用户只填 `C1=N×r`，本步相对本步参照 **≤5%** | C2入口未实现 | **候选已验限定范围**：C-001→D-002；C-005/006 Chromium |
| N×r（二阶） | **10**；同题先由用户填真实 C1，再填 `C2=|用户实际 C1|×r`，各步分别≤5%，系统不能用精确C1代替本人C1 | C2入口未实现 | **候选已验限定范围**：C-001→D-002；C-005/006 Chromium |
| 综合 Comprehensive | **10**；在综合题中自行选择 Direct/Split/Scaling 路线计算，终局原始商≤3%，过程与终局双轴；自然综合默认商域0.2～5 | C2入口未实现 | **NOT-IMPLEMENTED（前台全组可作答）**；旧后台 `generator.ts` 不能算完成 |

**跨配置禁区**：旧 `mixed` N×r（含7:3组）、独立 `method_choice` 模式/入口**均已正式取消新训练**，但旧 `v1` 已冻结数据仍须可读、可回放、可导出；`ordinary` / `second_order` 作为旧版本 wire 名可以保留而前台显示“一阶/二阶”。L1/L2/L3仍按专项真实额外负担/自然路线成本证据判定，**未签机器 L 数值阈值、L/细型/分支固定配比、过程局部硬容差、跨路线数值成本权重**；`difficulty.level=1` 或旧求r 的 L2 不得直接写为正式C2 L标签。以上均受唯一正式 Owner 约束，不从测试样例扩展为产品规则。

## 3. 可运行候选：源码／测试／独立 D 对照

以下“通过”严格以 **D 验收时的固定旧 HEAD** 为界；模块在 PR #22 候选分支中，不在 master C2 正式入口。共用 [页面 `src/app/c2-lab/page.tsx`](https://github.com/JIDAIN/numera/blob/40677a208fe22e540e172f8606db72e47bf0a2cb/src/app/c2-lab/page.tsx)、[`C2PilotTraining.tsx`](https://github.com/JIDAIN/numera/blob/40677a208fe22e540e172f8606db72e47bf0a2cb/src/components/C2PilotTraining.tsx)、[`pilot-session.ts`](https://github.com/JIDAIN/numera/blob/40677a208fe22e540e172f8606db72e47bf0a2cb/src/lib/c2/pilot-session.ts)、[`runtime.ts`](https://github.com/JIDAIN/numera/blob/40677a208fe22e540e172f8606db72e47bf0a2cb/src/lib/c2/runtime.ts)、[`launch-policy.ts`](https://github.com/JIDAIN/numera/blob/40677a208fe22e540e172f8606db72e47bf0a2cb/src/lib/c2/launch-policy.ts) 冻结题组、校验新训练门、保存页内存尝试并显示结果。**刷新不会恢复正式Session**，用户账号/数据库/导出未接通。

| 候选切片 | 实际代码与测试（固定候选 SHA） | 数学／自动化与 D 验收 |
| --- | --- | --- |
| 求r20 | [`support.ts`](https://github.com/JIDAIN/numera/blob/40677a208fe22e540e172f8606db72e47bf0a2cb/src/lib/c2/support.ts)、[`r-admission.ts`](https://github.com/JIDAIN/numera/blob/40677a208fe22e540e172f8606db72e47bf0a2cb/src/lib/c2/r-admission.ts)；`support.test.ts`、`r-admission`调用/运行时测试、`pilot-session.test.ts`、`C2PilotTraining.test.tsx` | [C-001](https://github.com/JIDAIN/numera/issues/21#issuecomment-6183898387) 初步交付、[D-001 FAIL](https://github.com/JIDAIN/numera/issues/21#issuecomment-6185975693) 两项共享边界问题由 [C-002](https://github.com/JIDAIN/numera/issues/21#issuecomment-6186808568) 修复后 [D-002 PASS](https://github.com/JIDAIN/numera/issues/21#issuecomment-6187076251)；C-005/006 Chromium限定通过 |
| N×r一阶20／二阶10 | [`support.ts`](https://github.com/JIDAIN/numera/blob/40677a208fe22e540e172f8606db72e47bf0a2cb/src/lib/c2/support.ts)、`decimal.ts`；`support.test.ts`、`decimal.test.ts`、`pilot-session.test.ts`、React DOM回归 | [D-001 FAIL](https://github.com/JIDAIN/numera/issues/21#issuecomment-6185975693) 检出非法非十进制输入和旧工厂门控；[D-002 PASS](https://github.com/JIDAIN/numera/issues/21#issuecomment-6187076251) 指定修复，后继D-005/006浏览器基础/视觉限定验收 |
| 直除10 | [`direct-pilot.ts`](https://github.com/JIDAIN/numera/blob/27fa07ad22284b78b7061da3dd17a466ca9747ec/src/lib/c2/direct-pilot.ts)、[`direct-pilot.test.ts`](https://github.com/JIDAIN/numera/blob/27fa07ad22284b78b7061da3dd17a466ca9747ec/src/lib/c2/direct-pilot.test.ts)，`pilot-session.ts`、React DOM | [C-003](https://github.com/JIDAIN/numera/issues/21#issuecomment-6188078718)、[D-003 PASS](https://github.com/JIDAIN/numera/issues/21#issuecomment-6188400025)：准确商位、条件第三位、输入链；当时真实浏览器NOT-VERIFIED，后由D-005/006补Linux Chromium范围 |
| 拆分10 | [`split-pilot.ts`](https://github.com/JIDAIN/numera/blob/5f9da4288d3d0b3d93c94b073a89d415203da449/src/lib/c2/split-pilot.ts)、[`split-pilot.test.ts`](https://github.com/JIDAIN/numera/blob/5f9da4288d3d0b3d93c94b073a89d415203da449/src/lib/c2/split-pilot.test.ts)、`pilot-session.test.ts`、React DOM | [C-004](https://github.com/JIDAIN/numera/issues/21#issuecomment-6189218424)、[D-004 PASS](https://github.com/JIDAIN/numera/issues/21#issuecomment-6190861602)：合法正负块、早停、原始商3%与过程双轴；真正720双列由D-006独立核验 |
| Scaling10（进行中） | 最新未验 [`scaling-pilot.ts`](https://github.com/JIDAIN/numera/blob/0565cb7ce51a9e3c3ac3c24eb1763c8506fff236/src/lib/c2/scaling-pilot.ts)、[`scaling-pilot.test.ts`](https://github.com/JIDAIN/numera/blob/0565cb7ce51a9e3c3ac3c24eb1763c8506fff236/src/lib/c2/scaling-pilot.test.ts)、[`C2ScalingFields.tsx`](https://github.com/JIDAIN/numera/blob/0565cb7ce51a9e3c3ac3c24eb1763c8506fff236/src/components/C2ScalingFields.tsx)、[`e2e/c007-scaling.spec.ts`](https://github.com/JIDAIN/numera/blob/0565cb7ce51a9e3c3ac3c24eb1763c8506fff236/e2e/c007-scaling.spec.ts)；`pilot-session.ts` / `runtime.ts` 在途增量 | **IN-PROGRESS / AWAITING-D**；[CI #40442367425](https://github.com/JIDAIN/numera/actions/runs/40442367425) 只说明该SHA自动质量门成功；未见C-007实际永久报告、D-007独立数学/Chromium/证据结论，**禁止写PASS** |
| 综合10（未实现） | master/旧分支含 [`generator.ts`](https://github.com/JIDAIN/numera/blob/f1f44fd19e5087d9fee9034bfdfabb846635d7c3/src/lib/c2/generator.ts) 后台生成基础与`contract.ts`旧兼容；**没有正式综合Pilot可交互入口+十题提交/结果链** | **NOT-IMPLEMENTED**；以后C-008、A-P02题源独立数学oracle、D增量验收另见R任务板 |

### C-001～C-006 与 D-001～D-006 顺序门

| 工作项 | 当时提交／CI锚点 | D 结论与边界 |
| --- | --- | --- |
| C-001 / D-001 | [`8f153a3`](https://github.com/JIDAIN/numera/commit/8f153a395c1924074660b9e98dbadf5f83c5ee32) · [CI #38677444446](https://github.com/JIDAIN/numera/actions/runs/38677444446)（77文件/376测） | **D-001 FAIL**：全局退役模式工厂外露、N×r非十进制非法值接受；不能以CI绿代替D |
| C-002 / D-002 | [`2f762cd`](https://github.com/JIDAIN/numera/commit/2f762cd24c61340cc54bd53bbdd33465dd855d82) · [CI #38698077049](https://github.com/JIDAIN/numera/actions/runs/38698077049) | **D-002 PASS(scope-limited)**：F1/F2修复和回归，不等于真实浏览器/历史 |
| C-003 / D-003 | [`27fa07a`](https://github.com/JIDAIN/numera/commit/27fa07ad22284b78b7061da3dd17a466ca9747ec) · [CI #38706915292](https://github.com/JIDAIN/numera/actions/runs/38706915292)（79/396） | **D-003 PASS(scope-limited)**：Direct数学与代码，真实浏览器当时NOT-VERIFIED |
| C-004 / D-004 | [`5f9da42`](https://github.com/JIDAIN/numera/commit/5f9da4288d3d0b3d93c94b073a89d415203da449) · [CI #38714943442](https://github.com/JIDAIN/numera/actions/runs/38714943442)（80/410） | **D-004 PASS(scope-limited)**：Split数学与代码，视觉当时NOT-VERIFIED |
| C-005 / D-005 | [`676de9a`](https://github.com/JIDAIN/numera/commit/676de9ae3889a0992074c284c91930df65948edd) · [CI #38838387769](https://github.com/JIDAIN/numera/actions/runs/38838387769)（80/410+9 Chromium） | **D-005 PASS(scope-limited)**：Playwright基础、固定seed真浏览器9用例；仅5张Split PNG+1 trace长期留存 |
| C-006 / D-006 | [`40677a2`](https://github.com/JIDAIN/numera/commit/40677a208fe22e540e172f8606db72e47bf0a2cb) · [CI #39702691346](https://github.com/JIDAIN/numera/actions/runs/39702691346)（80/410+14 Chromium） | **D-006 PASS(scope-limited)**：本地化UI、720双列、四断点与永久46 PNG+5 trace，**不是全六入口或真机** |

## 4. 真实浏览器与永久文件证据（设备平台分开判）

**独立永久证据仓库路径**（均在未合并的独立Git对象，不是在 master/Production）：

- **C-005**：[证据 commit `a16369f`](https://github.com/JIDAIN/numera/tree/a16369f35ee6fca318cc29a7ff33a91770c365dd/e2e/evidence/c005)、[manifest](https://github.com/JIDAIN/numera/blob/a16369f35ee6fca318cc29a7ff33a91770c365dd/e2e/evidence/c005/manifest.json)；5张原始Split PNG、1个真实Playwright `trace.zip`，源候选 `676de9a`，CI `#38838387769`，由 [D-005](https://github.com/JIDAIN/numera/issues/21#issuecomment-6206757488) 独立检查字节、截图像素、ZIP事件。不是所有模式完整PNG/trace留档。
- **C-006**：[证据 commit `679568d`](https://github.com/JIDAIN/numera/tree/679568de6a93f6c14b825fd5b30b2d4c3cd3eb69/e2e/evidence/c006/head-40677a2)、[manifest](https://github.com/JIDAIN/numera/blob/679568de6a93f6c14b825fd5b30b2d4c3cd3eb69/e2e/evidence/c006/head-40677a2/manifest.json)；源候选 `40677a2` / CI `#39702691346`，**46 PNG、5份模式代表性trace ZIP**，从真 GitHub-hosted Linux Chromium Runner归档。[D-006](https://github.com/JIDAIN/numera/issues/21#issuecomment-6331536238) 独立复算46/46 PNG 的SHA256/文件字节/尺寸和5份 ZIP SHA256/Git blob及解压事件；**人工目视只核部分代表图片，不是逐张审美全通过**。五trace代表PC五模式，非14用例各有永久trace。
- **运行方式**：[`playwright.config.ts`](https://github.com/JIDAIN/numera/blob/40677a208fe22e540e172f8606db72e47bf0a2cb/playwright.config.ts)、[`e2e/c2-pilot.spec.ts`](https://github.com/JIDAIN/numera/blob/40677a208fe22e540e172f8606db72e47bf0a2cb/e2e/c2-pilot.spec.ts)、[`e2e/c006-visual.spec.ts`](https://github.com/JIDAIN/numera/blob/40677a208fe22e540e172f8606db72e47bf0a2cb/e2e/c006-visual.spec.ts)，GitHub-hosted Ubuntu 24.04 / Node 22 / Playwright 1.56.1 / Chromium 141 / 固定测试 `Math.random=0`；真实本地 Next `127.0.0.1:3100/c2-lab`。D-005报告说明9用例共 PC五组70提交、Pad两组20、Mobile两组20，计**110次真实浏览器自动提交**；D-006新增T13的720双列、760/761与540/541边界，最终14/14。不是实体移动设备或真实Production。
- **文档执行手册**：[F-P01 draft PR #23](https://github.com/JIDAIN/numera/pull/23) 的 [Windows验收手册](https://github.com/JIDAIN/numera/blob/9c0b777f148a20be661eed5b10b46ee92b018399/docs/engineering/c2/candidate-browser-verification.md) 给出精确 checkout、五模式、三基准+720、逐题 seed/trace/SHA256/日志模板；[D-FP01-R2](https://github.com/JIDAIN/numera/issues/21#issuecomment-6206250241) 仅验手册合规，**手册没有执行 Windows/真机验证**。

| 环境或能力 | 当前真实取证 | 状态及不可外推范围 |
| --- | --- | --- |
| Linux Chromium PC CSS 1440×900 | 5组完整自动作答70题、结果/重练、负例；有代表性真实PNG和trace | **PASS(scope-limited)**，并非 Windows PC 或正式全流程 |
| Linux Chromium 平板 CSS 768×1024 | Split10、N×r二阶10，真实视口与自动点击；部分永久PNG | **PASS(scope-limited)**，不是实体平板 |
| Linux Chromium 手机 CSS 390×844 | Split10、Direct10，自动填写/错误/结果；部分永久PNG | **PASS(scope-limited)**，不是实体手机 |
| Linux Chromium Split CSS 720×1024及边界 | 真正三块双列增/删/滚动/非法与结果；760两列/761三列、540单列/541两列DOM＋PNG | **PASS(scope-limited，C-006/D-006)**；只覆盖Split响应式检查 |
| Windows 10/11 Chrome/Edge 桌面 | F-P01提供**待执行**步骤，但没有可核验的Windows实际运行记录 | **NOT-VERIFIED** |
| Android/iOS 实体手机 | 无物理手机浏览器/设备型号/截图/操作记录 | **NOT-VERIFIED** |
| 实体平板/iPad | 无物理平板全组操作/旋转/截图记录 | **NOT-VERIFIED** |
| 实体设备触摸焦点、手指点击与系统软键盘 | Playwright `.fill()` / 模拟CSS尺寸不使系统移动软键盘真实弹出；无物理输入法遮挡测试 | **NOT-VERIFIED** |
| 多seed、自然真题、长时间练习与正式账号数据 | Runner固定测试seed+合成数字；未形成正式准入题池、真实账号历史/云数据恢复 | **NOT-VERIFIED / M2、M3尚待** |

## 5. M3 数据闭环：B-P02 已审接口，不是已实现的 C2 接入

唯一详细调查以 [B-P02 接口映射与假双Owner验收合同](https://github.com/JIDAIN/numera/issues/21#issuecomment-6309927951) 为准（**design-ready / implementation-not-done**）；以下仅为下游C/D的定位索引。B的源码检查快照早于C-007，如HEAD或字段变化须以即时源码、实际测试再验。

**当前不相等的两条链**：

- PR #22候选：[`C2PilotTraining` → `createC2PilotSession` → `generateC2RuntimeSet` → `submitC2PilotAnswer`](https://github.com/JIDAIN/numera/blob/40677a208fe22e540e172f8606db72e47bf0a2cb/src/lib/c2/pilot-session.ts)，内存 `C2PilotSession` / 原始 `TrainingResponse` / `grade`，`id=c2-pilot-{seed}-{mode}`；**无owner、非UUID、刷新消失**。
- master通用正式基础：[`createCTrainingSession`](https://github.com/JIDAIN/numera/blob/f1f44fd19e5087d9fee9034bfdfabb846635d7c3/src/lib/session.ts#L301-L375) → `TrainingSession(schemaVersion:3)`、`cMeta/launchSpec`、`createSessionId=crypto.randomUUID()` → [`submitCurrentAnswer`](https://github.com/JIDAIN/numera/blob/master/src/lib/training.ts#L202-L265) → [IndexedDB `storage.ts`](https://github.com/JIDAIN/numera/blob/master/src/lib/storage.ts) → [云 `cloud.ts`](https://github.com/JIDAIN/numera/blob/master/src/lib/cloud.ts) → [History/SessionDetails](https://github.com/JIDAIN/numera/blob/master/src/components/SessionDetails.tsx) → [JSON/XLSX导出](https://github.com/JIDAIN/numera/blob/master/src/lib/data-export.ts)。这些是 **master 已供 C1/C3/C4 等使用的通用结构**，尚未接入 C2 Pilot。

| M3待派切片 | 工程模块与必须守住的事实 | D最小验收门（目前NOT-VERIFIED） |
| --- | --- | --- |
| **M3-C2-1 适配与合同 P0** | `src/lib/c2/{pilot-session,runtime}.ts` 对接 `src/lib/session.ts` / `types.ts` / `training-response.ts` / `grader-registry.ts`；新会话把旧 `ordinary` 映射一阶、`second_order`映射二阶，R2 题量及每题cMeta完全一致；正式Session必须 UUID，**seed仅复现题不作为主键**；旧Pilot ID会撞上Supabase [UUID RPC](https://github.com/JIDAIN/numera/blob/master/supabase/migrations/20260804_minimal_pair_sync.sql#L23-L39) | 假UUID固定种子下建立schema3/launchSpec、冻结题、字段与R2新建门测试；缺题/混合/方法选择新建拒绝；未批准L不伪装为L1/旧L2 |
| **M3-C2-2 IndexedDB与中断恢复 P0** | [`storage.ts`](https://github.com/JIDAIN/numera/blob/master/src/lib/storage.ts) 历史 DB 名 `speed-math-v1`、sessions store；`saveSession/readActive/readCompleted` + 页面 `pagehide`/计时恢复；候选提交字段要通过完整C2前置校验，**不能只交给通用grader消耗非法题** | 假IndexedDB按同owner恢复同Session ID/冻题/已答字段/进度，后台停计时，完成原子存储、非法提交不推进、不让迟到active覆盖completed；真Chromium刷新链可审 |
| **M3-C2-3 云与账号隔离 P0** | [`cloud.ts`](https://github.com/JIDAIN/numera/blob/master/src/lib/cloud.ts)、身份切换/历史；先保存本地completed再做 `syncCompleted` RPC，按 `ownerAccountId`／UUID幂等重试；配对人记录只读、本地读全completed由UI再按owner过滤；SQL/RLS静态规则不等于生产隔离实测 | **假双owner+访客**分别创建/切换/恢复；旧异步回包不可窜账号；模拟云失败与重试、同owner同UUID幂等、跨owner拒写；若需服务端RLS实际验，须获批隔离环境，禁止生产“试测” |
| **M3-C2-4 历史、导出、旧v1 P0** | `SessionDetails.tsx`需按真实 `response/gradingMetrics`展示C2 Direct/Split/N×r/Scaling步骤；[导出 `data-export.ts`](https://github.com/JIDAIN/numera/blob/master/src/lib/data-export.ts) 实际schema `2.2.0`、[JSON/XLSX `data-export-files.ts`](https://github.com/JIDAIN/numera/blob/master/src/lib/data-export-files.ts) 保留 `c_preset/response_json/grading_metrics_json`；旧v1 `mixed/method_choice`只读/导出不新建，旧 `userAnswer` 与一等response共存 | 本人/配对/访客假记录权限及导出过滤，old v1 frozen评分不重判、cloud JSON/IndexedDB normalize/结果/导出一致；`HistoryCharts`不被虚构L污染 |
| **M3-C2-5 repeat与全链 P1** | [`recreateTrainingSession`](https://github.com/JIDAIN/numera/blob/master/src/lib/session.ts#L377-L451)、[`c-project-registry.ts`](https://github.com/JIDAIN/numera/blob/master/src/lib/c-project-registry.ts)、通用页面；旧退役preset**历史可看但不可新造**；当前preset“再来一组”必须真生成新题，不能回退原冻结题 | 5/6候选模式完整会话、恢复/回放/刷新/账号切换/历史/导出Chrome回归与单元合同；D按原始SHA及证据独立验收、Owner另外批准正式入口/上线门 |

**B-P02关键停止线**：通用 `submitCurrentAnswer` 并不替Pilot做各模式非法字段阻断；`createCTrainingSession` 通用10/20约束也不等于每preset R2；`TrainingResponse` 要保留用户真实值和 R3 `finalPass/processConsistency` 两轴，不能由精确答案回填未进入阶段；计时/编辑次数没观察到则不可编0；旧云历史JSON未经过本地normalize的全部行为、旧 `recreate` 可能原题fallback须专项修复。初步可复用现有schema3 + JSONB 不代表已批准或无需任何DB迁移；若涉及新服务器字段、RLS、RPC或生产数据，更改停下交Owner另批。[B-P02完整矩阵](https://github.com/JIDAIN/numera/issues/21#issuecomment-6309927951) 是具体合同依据。

## 6. 后续 Agent 的最短核验流程

1. **先锁真实HEAD**：读 Issue #21 唯一顶部 `HARNESS_STATE_V1`（编制时 C-007/r17，仅主线C可变更），再读 PR #22 实时 HEAD、变更文件、对应 Actions `head_sha`；若与此快照的 `0565cb7` 不同，计算相对 **D-006 已验 `40677a2`** 的差异，先查新 D 报告，**不得继承旧PASS到新代码**。PR合成checkout SHA与源码 head SHA分开。
2. **以需求和证据双向检索**：正式数学查 Owner；现有五模式数学按 D-002/003/004；真实Chromium按 D-005/006、各固定CI和[永久PNG/trace manifest](https://github.com/JIDAIN/numera/blob/679568de6a93f6c14b825fd5b30b2d4c3cd3eb69/e2e/evidence/c006/head-40677a2/manifest.json)；手动与Windows待执行步骤查[PR #23 手册](https://github.com/JIDAIN/numera/pull/23)。真实测试必须记录模式/题号/输入/预期与实际/seed获取性/run_id/日志/文件SHA256/可访问路径；模拟尺寸不冒称实体设备。
3. **区分四层**：产品已签 ≠ 源码存在 ≠ CI通过 ≠ D验收/实体体验完成 ≠ master/Production发布。C-007 仍待正式 C 报告及 D-007，综合训练/C2数据M3仍非正式可用。R据 [R-PAR-002](https://github.com/JIDAIN/numera/issues/21#issuecomment-6432440823) 在里程碑汇总A-P02/F-P02/B-P02证据，不得把 F 文档自评作为 D-FP02 独立签字。
4. **本文件维护权限**：由后续被指派工程文档维护者按[文档SOP](https://github.com/JIDAIN/numera/blob/master/docs/engineering/documentation-maintenance.md)更新 HEAD/D报告/证据索引；不要覆盖唯一 Obsidian 产品Owner、改已签规则或从历史报告反推今日状态。此 F-P02 仅生成独立docs-only Draft PR、待独立 `D-FP02` 静态验收；**不修改 C-007/PR#22、PR#23、C1～C4、Obsidian、AGENTS/Skill/Harness/CI、生产数据；不merge/deploy**。
