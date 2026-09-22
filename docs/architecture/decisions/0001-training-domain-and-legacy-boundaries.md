# ADR-0001: Training Domain and Legacy Boundaries

- Status: Accepted
- Reconstructed: 2026-09-22
- Source history: former ADR-001-student-facing-training-units.md

## Context

Numera 曾把第一层拆成大量微叶子，并尝试让诊断粒度直接变成正式能力、入口和 Mastery。实践表明：**可诊断粒度不等于正式训练能力粒度。**

同时，仓库已经存在长期 Classic QuestionType/Subtype/Rating 历史；新 A/C 体系不能通过静默重解释破坏这些冻结记录。

原 ADR-001 还混入了当时“8个A”、daily_plan参数、C项目收口状态和 rollout 顺序。这些快速变化内容不再属于 ADR；current 状态分别由 Domain / Architecture / Engineering 维护。

## Decision

### 1. Formal A registry has one executable source

正式 A ability ID 必须由一个 canonical executable source 定义；metadata、UI、generator 和 tests 引用或校验该 source，不各自维护独立能力清单。

ADR 不冻结“永远8个或10个”这类产品数量。

### 2. B is not an independent Mastery namespace

B 可以作为方法、解析、步骤或诊断词汇，但不会因为存在一个 B 标签就自动形成正式 ability / Mastery。

### 3. C is a separate project namespace

新 C 训练使用 C project metadata，不进入 A ability / A Mastery。历史冻结数据中的 C-* SkillId 只为兼容读取。

### 4. Legacy Classic semantics stay immutable

Classic QuestionType/Subtype/Rating 记录继续按冻结语义读取、展示和导出：

- 不批量改写成新 A/C；
- 不猜历史 ability ID；
- 不用新 Mastery 反算旧 Rating；
- 如未来做 derived mapping，必须显式标记为派生解释。

### 5. Retired micro-leaf runtime must not silently return

旧160叶子 registry、叶子专项、步骤叶子 Mastery 等不再作为正式 runtime 模型。

结构标签、generator params、过程步骤可以用于诊断，但不能自动升级成新的 Mastery ID。

### 6. Unobserved method is not inferred

只有用户显式提交的方法/步骤可以作为方法事实。只看到最终答案时，不推断用户脑内采用了哪一种方法。

## Consequences

- Product 可以继续调整正式 A 的数量与边界，但需先在 Obsidian 形成 Product decision，再进入代码；
- Domain/current docs 如实描述 master 当前状态；
- Runtime/analytics 必须保持 Classic / A / C 语义分离；
- 新的统一 Training runtime 需要在不破坏历史记录的前提下演进；
- 单纯 code refactor 不得重新引入已经退出的微叶子 Mastery。

## Canonical current docs

本 ADR 只解释长期工程理由。当前实现位置和 current 状态不在 ADR 中维护：

- Training business → Domain
- Training runtime → Architecture / Training Runtime
- Data compatibility → Architecture / Data & Sync
- Product target/rationale → Obsidian「数感」
