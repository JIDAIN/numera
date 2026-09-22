# Training Domain

本文是 Numera **当前训练业务 contract** 的 canonical owner。它回答训练在业务上“是什么”，不解释 Session 如何运行，也不复制 Obsidian 中尚未实现的产品设计。

## 1. Training Families

| Family  | 当前状态                                                            | 评价体系                                         |
| ------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| Classic | 长期兼容并仍可训练                                                  | Legacy Rating                                    |
| A       | 正式底层能力训练                                                    | A Mastery                                        |
| B       | 方法/解析/诊断语言，不是独立训练能力命名空间                        | 无独立 Mastery                                   |
| C       | schema-v3 工程 shell 已存在；C1～C4正式项目尚未接入 master 产品入口 | Project analytics / project grader，非 A Mastery |

Fraction-percent Match / Memory 等是独立轻量训练体验，不属于普通 TrainingSession 的 A Mastery / Classic Rating。

## 2. Current Formal A Runtime

master 当前 canonical A registry 有 8 个：

- A-ADD-01：2～3位加法
- A-SUB-01：2～3位减法
- A-COM-01：近邻小差值
- A-MUL-01：正向乘法口诀
- A-MUL-02：逆向乘法口诀
- A-MUL-03：两位数×一位数
- A-FRA-01：高频分数 ↔ 百分数
- A-PCT-01：基础百分比取值

Executable source：src/lib/canonical-a-generate.ts 的 canonicalAAbilityIds。Metadata：src/lib/a-ability-metadata.ts。

Obsidian 的第一层目标已经调整为10个正式A；该目标与 master 当前8个是 implementation gap，不把未来10项提前写成 current。

## 3. A Difficulty / Daily Plan

正式 A 使用 L1 / L2 / L3。

当前 daily_plan：

- plan version = 1；
- 至少选择一个 current canonical A；
- 每项独立 difficultyBand；
- 新训练题量为10或20；
- 计划按 canonical A 顺序归一化；
- 生成后题目冻结进入 TrainingSession。

旧 mixed:L* 只作历史兼容，不作为当前新的主要用户配置入口。

## 4. B

B 不建立独立 ability ID 或 Mastery。

它只用于方法步骤、解析语言、方法标签或诊断标签。如果未来产品设计调整，先回 Obsidian Product ADR，再进入工程实现。

## 5. C

当前 types/runtime 已建立：

- CProject = C1 / C2 / C3 / C4；
- CTrainingMode；
- cPreset；
- difficultyBand；
- cMeta.grading；
- c_training / c_task；
- schemaVersion = 3。

但 master 当前没有 C1～C4 正式 generator、入口和项目 UI，因此：

> C shell current != C project product-ready。

新 C 不使用 A ability ID，不进入 A Mastery。历史冻结记录中的 C-* SkillId 只作兼容读取。

## 6. Grading Families

### Classic

使用 legacy Rating。标准见 classic-reference.md。

### A

使用 Mastery，不使用 legacy Rating。Mastery 只收正式 A ability 的整题记录，不把 Classic、C、结构标签或步骤反推成微能力。

### C

不使用 A Mastery，也不使用 Classic Rating。

当前通用 C shell 支持 exact、relative_error 和 custom contract metadata。未实现 custom grader 时必须明确失败，不允许静默回退 legacy grader。

## 7. Fraction-percent Match / Memory

Match 使用 Classic 固定分数百分关系库的子集，但它是独立训练体验：

- 不进入普通 TrainingSession history；
- 不进入 A Mastery；
- 不进入 Classic Rating；
- 有独立 history / cloud / PK 数据结构。

Memory 是独立记忆体验；其 UI 与题库复用不改变普通 TrainingSession 语义。

## 8. History / Analytics

当前业务边界：

- completed 才进入普通长期历史；
- Classic 可展示 Rating；
- A 专项可进入 Mastery/diagnostics；
- C 项目未来应按 project/mode/difficulty/structure/grading metrics 分析，不套 Rating/Mastery。

当前 History UI 尚未完整 family-aware：C 会被 c_training/c_task 粗粒度折叠，Rating filter 对 C 也未完全隔离。此项属于第一层工程 gap。

## 9. PK Eligibility

当前 Classic/A 普通 completed 训练已有异步 PK 使用路径。

长期规则应是：**PK eligibility 必须显式定义，不能由“这是一个 TrainingSession”自动推出。**

C1～C4 的 PK 产品规则尚未设计，因此新 C 默认不应自动开放 PK；现有通用结果页入口需要在 runtime 重构中收紧。

## 10. Export Scope

普通训练导出的业务范围是本人已同步 completed；PK应战产生的个人 completed 仍是一条个人训练记录。PK challenge 本身不重复进入个人训练导出。

Match 使用独立导出结构。

## 11. Classic Compatibility

Classic QuestionType/Subtype/Rating 保持历史原义：

- 不批量改写成 A/C；
- 不猜历史 ability ID；
- 不用新 Mastery 反算旧 Rating。

固定表见 classic-reference.md。

## 12. New Training Intake

```text
family
→ product identity
→ difficulty/mode/preset
→ generator
→ response kind
→ grader
→ history/analytics
→ PK eligibility
→ export
→ persistence compatibility
```

产品规则先来自 Obsidian；实现完成并验证后，本 Domain 才收为 current。

## 13. Current Anchors

- src/lib/canonical-a-generate.ts
- src/lib/a-abilities.ts
- src/lib/a-ability-metadata.ts
- src/lib/a-training-plan.ts
- src/lib/mastery.ts
- src/lib/statistics.ts
- src/lib/c-training.ts
- src/lib/fraction-percent-match.ts
