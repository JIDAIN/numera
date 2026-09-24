# Current Engineering State

Snapshot date: 2026-09-24.

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

master 已有正式 C runtime，并已接入 current 项目 C1 / C3 / C4；C2 仍未实现正式 generator / 用户入口 / 项目 UI。

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

Phase 3 C4、Phase 4 C3 与 Phase 5 C1 已完成 master 实现。

C1：

- 独立正式 generator / project identity 已接入，不复用 Classic 普通乘法语义；
- 用户一次提交 A′ / B′ / U，使用 first-class StructuredResponse 保存真实过程；
- custom grader 不匹配推荐答案，而是现场计算方向、成本、方法误差、执行误差和最终总误差；
- 方向要求为一边上调、一边下调；新表达式必须低于原式的当前统一 mental-cost evaluator；
- 方法 / 执行 / 总误差分别使用 2% hard bound；
- 最大调整超过约10%只记录 large-adjustment diagnostic，不直接判错；
- L1 为 obvious；L2 固定10 amplitude + 10 recognition；L3 固定10 same-side competition + 10 cross-side competition；
- 四种方向结构每组各5题；
- 正式题目排除低成本原式与主要依赖 C4 特殊基准的原式，并按有效数字核心去重；
- 当前 generator 支持不同数量级与小数外观；整数 / 小数只作为题面外观，不决定 L1/L2/L3；
- result/history 复盘 observed challenge、direction、cost、three errors、large-adjustment 与 time；
- restart/repeat 从 frozen project / difficulty 重新生成新题；
- C1 已进入统一“全部练习 / 最近专项 / 再来一组”链路；
- 不进入 A Mastery、不使用 Classic Rating、PK=false；
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
- 新增 ratio-zone 最低覆盖，避免 L2/L3 长期高度偏向两个比值都 >1；
- 造题 recipe 只提出候选，最终必须重新经过 objective classifier 才能进入题组；
- 左右换位后重新 classifier，不机械沿用旧标签；
- first-click < / > renderer 已接入；
- exact comparison grader 已接入；
- restart/repeat 会按 frozen difficulty 重新生成一组满足 quota 的新题；
- result/history 可按 S-level / salience / ratio-zone / objective appearance 复盘；
- project + difficulty History trend 已自动接入；
- 只保存题目客观结构与真实作答，不保存推测的用户比较方法。

C4：

- 正式 project definition / generator / entry UI 已接入；
- L1 / L2 支持单基准、单方向、乘除综合与本级综合；
- L1 / L2 20题综合保证本级基准全覆盖；
- L3 只使用已学基准并覆盖 10^-2 / 10^-1 / 10^1 / 10^2 数量级迁移；
- final numeric response 使用 relative error ≤ 2%；
- result/history 可复盘 difficulty / anchor / operation / repeat-digit group / scale / final error。

C1 / C3 / C4 共享首页行为：

- 已与 A 一起进入同一个“全部练习”区域；
- “最近专项”可以识别最近完成的 A / C 正式专项；
- 完成页均可“再来一组”，保持原配置并生成新题。

C1 / C3 / C4 均：

- 不进入 A Mastery；
- 不使用 Classic Rating；
- PK=false；
- 可观察数据可用于后续真实数据积累，不记录推测的用户心算方法。

仍待实现：

- C2 route evaluator / support / method / comprehensive runtime。

### Cross-cutting

- C1 / C3 / C4 已验证 C project history / trend / repeat contract，以及统一“全部练习 / 最近专项”入口；
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

Phase 0、Phase 1、Phase 2、Phase 3 C4、Phase 4 C3 与 Phase 5 C1 已完成 master 实现；下一工程阶段为 Phase 6 C2。按最新产品原则，C1～C4 全部可用并积累一段真实用户数据后，再回 Obsidian 完善 B，再进入 B 解析接入。

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
