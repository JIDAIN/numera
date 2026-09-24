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

master 已有 C schema-v3 / session / grading / storage/export shell，但没有 C1～C4正式 generator、用户入口和项目专属 UI。

## 2. Production Web

最近一次通过 Vercel 只读核验的 Production deployment：

- deployment: dpl_Aq2WpJpPrsTL7XMNZLzjQMaH4jDi
- state: READY
- target: production
- created: 2026-09-15T03:37:37.969Z
- source commit: 30b8610257acd2f7529838899afc65dd7c73e8fb

Production 因此落后于当前 master。后续判断某项是否已上线，必须核 deployment source，而不能把 master current contract 自动当成线上版本。

## 3. Deployment Protection

vercel.json 当前要求：

```text
git.deploymentEnabled = false
```

Git push / merge / CI success != Preview authorization != Production authorization。

程序文档重构未执行 Preview / Production 部署；Production 仍停留在上节记录的 deployment。

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
- C 尚无正式 project generator，因此普通 C “再来一组”目前不能生成新题；此项随首个 C 项目实现接入；
- HistoryCharts 尚无按 C project analyticsKey 分轨的趋势图。

### A

Phase 2 Formal A Closure 已完成：

- canonical A 已从8个收口为10个；
- A-MUL-04 两位数×两位数已进入 master；
- A-MUL-05 百分数×百分数已进入 master；
- canonical registry / metadata / AHomeTraining / Daily / Mastery / History / Export 已使用同一正式 A 成员事实源；
- A-MUL-04 / A-MUL-05 已补 generator、registry、daily、Mastery、UI 和 end-to-end regression；
- 旧“8个正式A能力”文案与成员副本已退出 current code。

### C

- C4未实现正式 generator/UI；
- C3未实现新 classifier/quota generator/UI；
- C1未实现 structured response / expression cost / custom grader；
- C2未实现 route evaluator / support/method/comprehensive runtime。

### Cross-cutting

- History list / result 已 family-aware，但 C project trend/reporting 尚未实现；
- export文件名仍有 speed-math 历史品牌残留；
- mastery.ts 注释仍需审查 D/S/F 与“C不使用A式Mastery”的正式边界；
- Product UI 当前没有 C1～C4 正式入口。

## 6. Documentation Phase 0

程序文档迁移已完成，并在迁移后最终审查中验证以下目标：

- UI重构有 Product/UI 入口与稳定交互边界；
- 代码模块重构/新增有 Architecture implementation map、refactor rule 与 new module intake；
- AI / 代码维护者有统一 Start Protocol 与 task router；
- Obsidian「数感」与 GitHub current docs 的职责边界已明确；
- Documentation Maintenance Guide 已建立并作为后续文档同步手册；
- 旧 PROJECT_STATUS / DEVELOPMENT_PLAN / features / reference / audits / ADR current source 已移除。

Phase 0、Phase 1 与 Phase 2 已完成；当前下一阶段为 Phase 3 C4。

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
