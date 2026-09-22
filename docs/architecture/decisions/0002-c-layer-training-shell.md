# ADR-0002: C-layer Training Shell

- Status: Accepted
- Accepted: 2026-09-22
- Source history: former ADR-002-c-layer-training-shell.md

## Context

C1～C4 的产品设计在 Obsidian 中独立维护。工程层需要一个统一外壳，既能承载不同 C 项目，又不能把 C 塞进 A ability / Mastery 或为了复用 legacy QuestionType 而丢失项目语义。

## Decision

### 1. C uses project identity, not A ability ID

新 C 使用：

- cProject；
- cTrainingMode；
- cPreset；
- difficultyBand；
- structureTags / generatorParams；
- cMeta.grading。

C 不进入 A Mastery。

### 2. C uses a unified frozen session envelope

新 C 使用：

- QuestionType = c_training；
- Subtype = c_task；
- TrainingMode = c_task；
- schemaVersion = 3。

项目差异由 C metadata 承载，不靠继续扩张 QuestionType。

在正式 C generator 接入前，createCTrainingSession 只接受已经生成并冻结的问题集；通用 legacy generator 不得静默生成 C。

### 3. Grading contract travels with the question

C grading contract 支持：

- exact；
- relative_error + tolerance；
- custom + graderId。

通用 runtime 只处理已经实现的通用 grader；unsupported custom grader 必须显式失败。

grading contract 具有独立 version，并随持久化和导出保留。

### 4. Difficulty, structure and route cost remain separate

前台 difficulty、单题结构层级、route evaluator cost、表达式 cost 等不同语义不因为“都是三档”而合并为同一字段。

### 5. Persistence preserves C metadata without rewriting older families

schema-v3 C session 保留 C project/mode/preset/grading metadata；Classic 与 A 不补猜 C metadata。

active/completed、IndexedDB/Supabase、export 等沿用通用基础设施，但不因此改变各 family 的业务评价体系。

## Consequences

- 统一 C shell 只意味着工程 envelope 已就绪，不代表 C1～C4 已有正式用户功能；
- 每个 C 项目仍需自己的 generator / renderer / grader / analytics 接入；
- C custom grader 可以独立演进并版本化；
- History / PK / Export 必须逐步变成 family-aware，而不能只看 c_training/c_task。

## Canonical current docs

本 ADR 只解释 C-layer shell 的长期工程选择。当前实现位置、字段状态和实施进度分别由 Domain、Architecture 与 Engineering current docs 维护。
