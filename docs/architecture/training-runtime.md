# Training Runtime

本文维护 Numera **当前训练执行 runtime**。它回答一个 Training 怎样启动、冻结、作答、判题、计时、完成和复现。

训练业务身份见 Domain；尚未实现的第一层目标见 Engineering / First-layer Plan。

## 1. Current Runtime Identity

TrainingSession 当前仍以 questionType / subtype 为基础，同时逐步携带新的 trainingMode、primarySkillId、difficultyBand 以及 C metadata。

当前主要 family 映射：

- Classic：legacy QuestionType/Subtype；
- A：questionType=skill_drill，正式 skillId + difficultyBand；
- C：questionType=c_training，subtype=c_task，schemaVersion=3，cProject/cTrainingMode/cPreset；
- daily_plan：显式A计划生成后仍冻结为普通 TrainingSession。

## 2. Launch / Session Creation

src/lib/session.ts 当前负责：

- 新训练题量校验；
- A/Classic生成；
- frozen questions接入；
- PK冻结题组不再生成；
- C训练只接受已经生成并冻结的问题集；
- 从冻结问题推断一致的 difficulty / C metadata；
- 建立 active TrainingSession。

当前没有独立 LaunchSpec。重开/复现仍依赖现有 session字段和页面侧重建逻辑，这是第一层重构 gap。

## 3. Frozen Questions

训练一旦创建，questions 作为冻结题组进入 Session。

冻结题组保护：

- 历史不会因 generator升级重新出题；
- PK challenger/opponent 使用同一冻结题组和顺序；
- result/history detail 读取原始冻结问题；
- Classic frozen question 不事后补猜 A/C身份。

## 4. Question Model

GeneratedQuestion 当前可携带：

- type / subtype / prompt / answer；
- difficulty / primaryStructure / secondaryTags；
- generationRuleVersion；
- skillId / difficultyBand；
- structureTags / generatorParams；
- targetPrecision / acceptedRange / allowedAnswerSet；
- masteryProfile / inputKind；
- stepSpecs；
- cMeta。

精确字段以 src/lib/types.ts 为 executable source；本文只维护语义边界，不复制 TypeScript interface。

## 5. Response Model

QuestionRecord 当前核心仍是：

- userAnswer: string；
- isCorrect / accuracyLevel；
- timeUsedMs；
- restart / scratchpad / submit/edit等诊断；
- optional steps；
- optional relativeError / gradingMetrics。

StructuredStepTraining 可以记录 step records，但当前没有一等公民 StructuredResponse。

因此未来 C1 的 A′ / B′ / final 等多字段输入、C2方法训练的结构化响应不能靠字符串拼接长期承载。

## 6. Renderer

当前 renderer 分发主要由 src/app/page.tsx 和已有组件共同承担：

- NumberPad；
- StructuredSingleAnswerTraining；
- StructuredStepTraining；
- fraction comparison / conversion 专项UI；
- Match独立组件。

尚无统一 Renderer Registry。UI重构时必须把判题/生成业务留在非UI层。

## 7. Grading

### Classic

由 legacy generate/training grading路径处理。

### A

按正式问题答案/允许集合/acceptedRange等合同判题；Mastery独立在 completed 记录上统计。

### C

src/lib/c-training.ts 当前支持：

- exact；
- exact + comparison normalization；
- relative_error + tolerance；
- custom + graderId metadata。

custom grader 尚未实现时抛 UnsupportedCGraderError，不能静默退回 legacy grading。

未来 C1/C2 需要项目 grader registry 和更丰富的 grading metrics。

## 8. Timer

src/lib/timer.ts 维护 session 与 step 有效计时。

稳定边界：

- paused/background时间不计入有效用时；
- 恢复不补计离开间隔；
- 未验证的旧 running segment 可被 suspend；
- step timer可标记 timingInterrupted；
- speed calibration 可以据此排除不可靠样本。

任何 session/router/storage 重构都必须回归 visibility、pagehide、refresh/recover、重复提交和账号切换。

## 9. Completion

完成训练后：

1. Session进入 completed；
2. 适用时冻结 Classic Rating；
3. 先写本地 IndexedDB；
4. 登录且有owner时尝试幂等同步 Supabase；
5. PK responder在个人 completed 同步成功后再提交 challenge result。

具体数据流见 data-and-sync.md。

## 10. History / Stats Integration

当前 History 主要按 questionType/subtype 筛选；A专项另外根据 skillId/difficulty识别。

当前 known gaps：

- C只会粗粒度显示为 c_training/c_task；
- HistoryList 只对 skill_drill 自动取消 Rating filter，C尚未同等处理；
- HistoryCharts 生成 legacy tracks + A skill tracks，不生成 C project tracks；
- SkillInsights 文案当前硬编码“8个正式A能力”。

这些是第一层 family-aware reporting 重构的一部分。

## 11. PK Integration

PKChallenge 保存 challenger 的 frozenSession；opponent完成同题同序 Session。

胜负：

1. 正确题数更多；
2. 相同则总有效用时更短；
3. 再相同为平局。

当前 pkParticipantSummary 仍假设可取得 legacy Rating，这对 A/C 并不完整。新的 C 默认不视为 PK-ready；未来需要显式 pkEligible 和 family-aware summary/review。

## 12. Export Integration

当前 export 已能保留：

- schema/training mode；
- A skill/difficulty；
- C project/mode/preset/grading contract；
- structure/generator facts；
- step records；
- grading metrics。

但 normalized question export 仍使用 user_answer:string。未来 StructuredResponse / LaunchSpec 实现后，需要重新设计 serialization，而不是把新结构塞进旧字符串。

## 13. Restart / Reproduce

当前：

- frozen Session可恢复；
- frozen PK不重新生成；
- daily plan可从冻结问题恢复部分计划语义；
- Classic/skill重开主要依赖现有 type/subtype/skill/difficulty。

未来目标是引入明确 LaunchSpec，但当前尚未实现。

## 14. Current Limitations

- no TrainingDefinition registry；
- no LaunchSpec；
- no first-class StructuredResponse；
- no Renderer Registry；
- no GraderRegistry；
- C1～C4正式 generator/UI未接入；
- family-aware history/PK/display descriptor未完成。

这些限制属于 Engineering current-state / first-layer-plan，不应在代码尚未实现前改写成 current capability。

## 15. Current Anchors

- src/lib/types.ts
- src/lib/session.ts
- src/lib/training.ts
- src/lib/timer.ts
- src/lib/c-training.ts
- src/lib/generate.ts
- src/lib/canonical-a-generate.ts
- src/components/StructuredSingleAnswerTraining.tsx
- src/components/StructuredStepTraining.tsx
- src/app/page.tsx
