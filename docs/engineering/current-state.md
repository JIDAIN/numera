# Current Engineering State

Snapshot date: 2026-09-22.

本文只记录 Numera 的动态工程状态与关键 gap；Product / Domain / Architecture 的完整 contract 不在这里复制。

## 1. GitHub Master

当前基线：

- branch: master
- commit: e5f101379b57f89e2d7578e5cf0fa5665b1aefb8
- latest baseline change: unified C-layer training shell

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

~~~text
git.deploymentEnabled = false
~~~

Git push / merge / CI success != Preview authorization != Production authorization。

本轮程序文档重构没有 Production 部署授权，也不触发部署。

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

- 缺 TrainingDefinition / project registry；
- 缺 LaunchSpec；
- 缺 first-class StructuredResponse；
- 缺 Renderer Registry；
- 缺 GraderRegistry；
- src/app/page.tsx 仍承担过多 controller / dispatch职责；
- restart/reproduce合同不足以承载未来复杂C项目。

### A

- Product target 需要从 current 8 个 formal A 收口到最终10个；
- A-ADD-02 与历史 A-COM-01 的目标冲突尚需工程迁移方案处理；
- A-MUL-04 / A-MUL-05 未进入 master。

### C

- C4未实现正式 generator/UI；
- C3未实现新 classifier/quota generator/UI；
- C1未实现 structured response / expression cost / custom grader；
- C2未实现 route evaluator / support/method/comprehensive runtime。

### Cross-cutting

- History尚未 family-aware；
- C仍可能在History Rating filter中暴露无意义选项；
- C project trend/reporting未实现；
- PK没有统一 pkEligible；
- PK participant summary仍偏 legacy Rating；
- export尚无 StructuredResponse / LaunchSpec normalization；
- export文件名仍有 speed-math 历史品牌残留；
- mastery.ts 注释仍暗示 D/S/F 是未来C接口，与“C不使用A式Mastery”的正式边界冲突。

## 6. What Is Not Active Scope

当前工程计划只收口第一层。

第二层资料分析专用计算方法、第三层实战判断与决策仍属于 Obsidian future product design，不在当前 GitHub implementation plan 展开。

## 7. Maintenance

只有以下变化更新本文：

- master基线/第一层进度发生实质变化；
- Production deployment变化；
- PR #8或其他关键阻塞状态变化；
- current architecture gap完成/新增；
- deployment protection变化。

不要把 Product规则、完整schema、generator quota 或一次性调试过程复制到本文。
