# Current Engineering State

Snapshot date: 2026-09-24.

本文只记录 Numera 的动态工程状态与关键 gap；Product / Domain / Architecture 的完整 contract 不在这里复制。

## 1. GitHub Master

当前基线：

- branch: master
- canonical docs restructure baseline: 468b4f1c69c2081e154eb3f2000d8a751a0aedea
- latest runtime-foundation code baseline: ef00c2863170bbc05b62a60f6fa3626fd30259c7
- exact current master HEAD: 运行时读取 GitHub，不在本文件硬编码

不硬编码“当前 HEAD”，因为修改 Current State 本身就会产生新的 master commit；这里只记录有语义的基线提交。

master 当前正式 A runtime 仍是8个 canonical abilities；Obsidian 第一层目标为10个。这是明确 implementation gap。

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

PR #8 当前 open，head 为 feat/a-mul-04-05，尚未合并。

已知状态：

- branch push CI 在相同 head SHA 上曾成功；
- pull_request CI run 35683869486 失败于「Check formatting of changed files」；
- 后续 typecheck / lint / tests / build 因前置失败被跳过；
- 产品审查还发现 branch 实现需要按最终 A-MUL-04 / A-MUL-05 规则校正。

因此 PR #8 保持暂停，不作为 current master capability。

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

- Product target 需要从 current 8 个 formal A 收口到最终10个；
- A-MUL-04 / A-MUL-05 未进入 master；
- AHomeTraining / SkillInsights 等仍有“8个能力”的 UI 事实副本，需要在 Phase 2 改为 canonical source 驱动。

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

Phase 0 已完成。Phase 1 Training Runtime Foundation 已完成并通过标准 CI；当前下一阶段为 Phase 2 Formal A Closure。

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
