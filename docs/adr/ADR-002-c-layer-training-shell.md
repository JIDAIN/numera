# ADR-002：C1～C4统一训练外壳与非 Mastery 边界

- **状态**：Accepted（2026-09-22）
- **范围**：第一层 C 项目的 runtime 标识、冻结会话、判题契约、持久化与兼容边界
- **产品事实源**：`JIDAIN/lys-obsidian-note/13_Projects/数感/`

## 背景

C1～C4 的产品设计已经分别完成当前收口，但代码仍只有经典题型与 A V1 的正式 runtime 外壳。

C 层需要进入工程实现，同时必须避免两个旧问题：

1. 把 C 项目误塞进 A ability / Mastery；
2. 为了复用旧 QuestionType / Subtype 而丢失项目、训练模式、判题版本等语义。

因此先建立统一 C 层工程外壳，再分别接入 C4、C3、C1、C2 的生成器和 UI。

## 决策 1：C 项目不使用 A ability ID

新 C 训练使用：

- `cProject = C1 / C2 / C3 / C4`
- `cTrainingMode`
- `cPreset`
- `difficultyBand`
- `structureTags`
- `generatorParams`
- `cMeta.grading`

C 项目不进入 A Mastery。

历史冻结记录里曾出现的 `C-*` skill ID 继续只读兼容；新 C 训练不得再用它们表示正式能力。

## 决策 2：统一使用 c_training / c_task 冻结题组

新 C 题目使用：

- `QuestionType = c_training`
- `Subtype = c_task`
- `TrainingMode = c_task`

项目差异不再靠 QuestionType 分裂，而由 `cMeta` 保存。

C 会话使用 schema v3。A 与经典会话继续保持原 schema 语义。

在具体 C generator 接入前，`createCTrainingSession` 只接受已经生成并冻结的问题集；禁止从通用 legacy generator 静默生成 C 题。

## 决策 3：C grading 由题目自己携带合同

`cMeta.grading` 当前支持：

- `exact`
- `relative_error + tolerance`
- `custom + graderId`

通用 runtime 只处理 exact 和 relative_error。

需要项目专属过程判定的 C1 等训练使用 custom grader；未实现的 custom grader 必须明确报错，不能退回 legacy 判题。

判题合同带独立 `version`，会话同步和导出保存该版本。

## 决策 4：难度、结构与路线成本继续分离

- `difficultyBand=L1/L2/L3`：前台训练难度；
- C3 `structureBand=S1/S2/S3`：单题结构层级；
- C2 evaluator `low/medium/high`：路线成本；
- C1 cost band：乘法表达式成本。

这些语义不得为了省字段合并。

## 决策 5：持久化与导出兼容

schema-v3 C 会话：

- active 仍只保留当前浏览器；
- completed 仍先 IndexedDB，再幂等同步 Supabase；
- `session_data` 原样保留 C metadata；
- 数据导出新增 C 项目、模式、preset、grading contract 与 grading metrics；
- 经典历史与 A V1 不补猜 C metadata。

## 后果

本 ADR 只建立 C 层工程外壳，不代表 C1～C4 已完成 runtime 功能。

接下来按产品依赖逐步接入：

1. A-MUL-04 / A-MUL-05；
2. C4 / C3；
3. C1；
4. C2；
5. 第一层整体验收。

Production 仍保持 Git 自动部署关闭；任何 Production 部署继续需要用户明确授权。
