# Training Domain

本文是 Numera **当前训练业务 contract** 的 canonical owner。它回答训练在业务上“是什么”，不解释 Session 如何运行，也不复制 Obsidian 中尚未实现的产品设计。

## 1. Training Families

| Family  | 当前状态                                     | 评价体系                                         |
| ------- | -------------------------------------------- | ------------------------------------------------ |
| Classic | 长期兼容并仍可训练                           | Legacy Rating                                    |
| A       | 正式底层能力训练                             | A Mastery                                        |
| B       | 方法/解析/诊断语言，不是独立训练能力命名空间 | 无独立 Mastery                                   |
| C       | C3 / C4 已正式接入；C1 / C2仍待实现          | Project analytics / project grader，非 A Mastery |

Fraction-percent Match / Memory 等是独立轻量训练体验，不属于普通 TrainingSession 的 A Mastery / Classic Rating。

## 2. Current Formal A Runtime

master 当前 canonical A registry 已收口为 10 个：

- A-ADD-01：2～3位加法
- A-SUB-01：2～3位减法
- A-COM-01：近邻小差值
- A-MUL-01：正向乘法口诀
- A-MUL-02：逆向乘法口诀
- A-MUL-03：两位数×一位数
- A-MUL-04：两位数×两位数
- A-MUL-05：百分数×百分数
- A-FRA-01：高频分数 ↔ 百分数
- A-PCT-01：基础百分比取值

Executable ID source：src/lib/canonical-a-generate.ts 的 canonicalAAbilityIds。

正式 metadata / 首页展示信息：src/lib/a-ability-metadata.ts。

AHomeTraining、Daily Plan、Mastery、History/Export 对 A ability 的识别均从 canonical registry 派生，不再维护第二份“8能力”成员清单。

A-MUL-04 只训练普通两位数乘法执行，不把近整十、特殊乘数或放缩当成能力本身。

A-MUL-05 训练百分数×百分数，结果仍用百分数表示，并按当前产品规则统一保留百分数值小数点后两位。

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

当前通用 C contract：

- CProject = C1 / C2 / C3 / C4；
- CTrainingMode；
- cPreset；
- difficultyBand；
- cMeta.grading；
- c_training / c_task；
- schemaVersion = 3。

当前正式项目：

### C3｜分数比较

- status：current；
- mode：specialty；
- formal block：20题；
- response：只提交 < / >，第一次点击直接提交；
- truth：精确比较 A×D 与 C×B，只用于标准答案；
- objective structure：S1 / S2 / S3；
- salience：strong / normal / weak；
- L1 / L2 / L3：按整组 quota 组成，不与 S 层级一一对应；
- set rules：10题 >、10题 <、无等值、不重复、整组覆盖规定外观结构；
- ratio-zone minimums：L1 至少 5 both<1 / 5 both>1 / 2 cross-1；L2 至少 6 both<1 / 6 both>1；L3 至少 8 both<1 / 8 both>1；
- objective appearance：direct 不覆盖 benchmark / scale / delta 等其他客观事实；
- S3 guard：≤2% 近值题若 scale / delta 已产生直接结构出口，仍归 S2；
- grading：exact comparison；
- analytics：difficulty / S-level / salience / ratio-zone / objective appearance / time / correctness；
- user method：不根据最终答案推断；
- A Mastery：不进入；
- PK：false。

### C4｜特殊基准数乘除转换

- status：current；
- mode：specialty；
- formal block：20题；
- L1：5 / 25 / 125 / 333 / 167 / 143 / 111；
- L2：667 / 286 / 9 / 11 / 222 / 444 / 555 / 666 / 777 / 888；
- L3：L1/L2 已有基准的数量级迁移；
- operation：multiply / divide / mixed；
- response：最终数值；
- grading：relative_error ≤ 2%；
- analytics：difficulty / anchor / operation / repeated-digit group / scale / final relative error；
- A Mastery：不进入；
- PK：false。

C1 / C2 目前只有 product target 与预留 project identity，不作为 current 功能。

新 C 不使用 A ability ID，不进入 A Mastery。历史冻结记录中的 C-* SkillId 只作兼容读取。

## 6. Grading Families

### Classic

使用 legacy Rating。标准见 classic-reference.md。

### A

使用 Mastery，不使用 legacy Rating。Mastery 只收正式 A ability 的整题记录，不把 Classic、C、结构标签或步骤反推成微能力。

### C

不使用 A Mastery，也不使用 Classic Rating。

当前通用 C runtime 支持 exact、relative_error 与 registered custom grader。custom grader 未注册时必须明确失败，不允许静默回退 legacy grader。

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
- C 按 project/mode/difficulty/structure/grading metrics 分析，不套 Rating/Mastery。

History list 与 result detail 已按 family-aware descriptor 区分 Classic / A / C。C3 / C4 已按 project + difficulty 接入 HistoryCharts。C3 保留结构层级、显著度、ratio-zone 与可叠加客观外观事实；C4 保留基准、方向、数量级与误差等可观察事实。

## 9. PK Eligibility

当前 Classic/A 普通 completed 训练已有异步 PK 使用路径。

PK eligibility 已成为 runtime contract，不能由“这是一个 TrainingSession”自动推出：

- Classic：true；
- A：true；
- C：false。

C 当前统一默认关闭 PK；C3 / C4 已按该 policy 正式运行。C1 / C2 后续若产品规则变化，必须重新明确 eligibility，不能自动继承。

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
- src/lib/c-project-registry.ts
- src/lib/c3-training.ts
- src/lib/c4-training.ts
- src/lib/fraction-percent-match.ts
