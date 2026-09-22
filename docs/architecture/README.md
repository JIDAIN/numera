# Architecture

本文回答：**Numera 当前程序怎样组成、各模块怎样连接、代码重构时哪些逻辑身份必须保持稳定。**

业务上“训练是什么”见 Domain；开发流程与当前实施状态见 Engineering。

## 1. System Flow

~~~text
Product Entry
→ Domain Training Identity
→ Training Launch
→ TrainingSession
→ Renderer
→ Grader
→ QuestionRecord
→ Local Persistence
→ Completed Sync
→ History / Stats / PK / Export
~~~

Fraction-percent Match 有独立轻量 history/cloud/PK 链路，但仍复用同一应用、身份与 Supabase 基础设施。

## 2. Runtime Layers

长期职责模型：

~~~text
Product / Page
→ Launch / Definition
→ Session Runtime
→ Renderer
→ Grader
→ Persistence / Sync
→ Reporting / PK / Export
~~~

这是逻辑层，不要求源码永久使用相同目录结构。

## 3. Current Implementation Map

| 逻辑模块 | 当前职责 | Current anchor |
|---|---|---|
| Page / routing | hash route、页面状态、跨功能controller | src/app/page.tsx |
| A home | 日常/最近专项/全部练习 | src/components/AHomeTraining.tsx |
| Classic selector | 经典训练入口 | src/components/ClassicTrainingSelector.tsx |
| A registry | canonical A ID/metadata | src/lib/canonical-a-generate.ts + a-ability-metadata.ts |
| Classic generator | legacy QuestionType/Subtype生成 | src/lib/generate.ts |
| A generator | canonical A生成 | src/lib/canonical-a-generate.ts |
| Daily plan | A日常计划与题组 | src/lib/a-training-plan.ts |
| Session | 创建冻结会话 / C shell | src/lib/session.ts |
| Training submit | 单题/step提交与判题分发 | src/lib/training.ts |
| C grading | exact / relative_error / custom gate | src/lib/c-training.ts |
| Timer | session / step有效计时 | src/lib/timer.ts |
| Storage | IndexedDB读写与兼容normalize | src/lib/storage.ts |
| Cloud | Supabase identity/sync/history/PK | src/lib/cloud.ts |
| Mastery | A能力统计与建议 | src/lib/mastery.ts |
| Statistics | Classic Rating / history metrics | src/lib/statistics.ts |
| History UI | 过滤/列表/趋势 | src/components/HistoryList.tsx + HistoryCharts.tsx |
| PK | 胜负与挑战模型 | src/lib/pk.ts + PK components |
| Export | normalizer / XLSX/JSON | src/lib/data-export*.ts |
| Match | relation/record/cloud/PK | src/lib/fraction-percent-match*.ts |

## 4. Current Architectural Debt

当前已知主要结构债：

- src/app/page.tsx 同时承担 routing、session控制、history/PK/match切换与部分训练渲染分发；
- A registry 已有 canonical source，但 AHomeTraining 仍维护一份UI展示数组；
- C shell 已存在，但没有统一 TrainingDefinition / Project registry；
- restart/reproduce 仍主要依赖 questionType/subtype/现有字段，没有完整 LaunchSpec；
- QuestionRecord.userAnswer 仍是 string，无法自然承载 C1/C2 的多字段 StructuredResponse；
- renderer 选择尚未形成 registry；
- custom C grader 只有显式失败边界，尚无 GraderRegistry；
- History / Stats / PK 的显示语义仍偏 Classic/A，未完整 family-aware。

这些属于 Engineering First-layer Plan 的实施对象，不在本文提前写成已经完成。

## 5. Refactor Rule

如果用户能力、Domain semantics、数据语义、判题、权限和外部contract都不变，可视为 implementation refactor。

此时：

- 更新本文件的 implementation anchors；
- 更新真正受影响的 Architecture 文档；
- 跑完整相关 regression；
- 不制造新的 Product/Domain规则；
- 不为了目录移动新增 ADR。

## 6. New Module Intake

新增模块前先判断：

1. 它改变 Product capability 吗？
2. 它改变 Domain contract 吗？
3. 它只是 Runtime/Storage/Reporting 的新实现吗？
4. 是否形成值得长期独立维护的 contract？

默认优先写入已有 canonical owner；不因为新增一个源码目录就新增一份 Markdown。

## 7. Related Docs

- Training runtime：training-runtime.md
- Data / sync / identity：data-and-sync.md
- Engineering decisions：decisions/README.md
- Current implementation status：../engineering/current-state.md
