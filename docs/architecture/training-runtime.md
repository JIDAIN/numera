# Training Runtime

本文维护 Numera **当前训练执行 runtime**。它回答一个 Training 怎样启动、冻结、作答、判题、计时、完成和复现。

训练业务身份见 Domain；尚未实现的第一层目标见 Engineering / First-layer Plan。

## 1. Current Runtime Identity

当前普通 TrainingSession 已正式区分三个训练 family：

- Classic：legacy QuestionType / Subtype；
- A：questionType=skill_drill，正式 skillId + difficultyBand；
- C：questionType=c_training，subtype=c_task，schemaVersion=3，cProject / cTrainingMode / cPreset。

family 的 current policy 由 src/lib/training-definition.ts 统一维护。

当前：

- Classic 使用 legacy Rating；
- A 使用 A Mastery；
- C 使用 project analytics，不进入 A Mastery；
- Classic / A 当前 PK eligible；
- C 当前默认 PK disabled。

daily_plan 是 A 的组合训练入口，生成后仍冻结为普通 TrainingSession。

## 2. Launch / Session Creation

src/lib/session.ts 当前负责：

- 新训练题量校验；
- A / Classic 生成；
- frozen questions 接入；
- PK 冻结题组不再生成；
- C 训练接入已生成并冻结的问题集；
- 从冻结问题校验 difficulty / C metadata；
- 建立 active TrainingSession；
- 冻结 TrainingLaunchSpec。

TrainingLaunchSpec 当前保存：

- family；
- questionType / subtype；
- questionCount；
- trainingMode；
- primarySkillId / difficultyBand；
- cProject / cTrainingMode / cPreset；
- pkEligible；
- daily plan（适用时）。

因此 restart / reproduce 不再依赖页面当前选择器反推训练身份。

## 3. Frozen Questions

训练一旦创建，questions 作为冻结题组进入 Session。

冻结题组保护：

- 历史不会因 generator 升级重新出题；
- PK challenger / opponent 使用同一冻结题组和顺序；
- result / history detail 读取原始冻结问题；
- Classic frozen question 不事后补猜 A / C 身份。

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

当前 runtime 已有一等公民 TrainingResponse：

- single：普通单答案；
- structured：多字段结构化作答。

QuestionRecord 同时保留：

- response：新的一等公民作答；
- userAnswer:string：旧 UI / cloud / history / export 的兼容投影。

这样可以继续读取和显示旧记录，同时允许未来 C1 / C2 保存多字段作答，而不需要把结构硬拼进一个字符串。

StructuredStepTraining 的 step records 继续保留自己的逐步诊断语义；它与 TrainingResponse 不互相替代。

## 6. Renderer

src/lib/training-renderer.ts 维护 renderer resolution registry。

当前可区分：

- structured_steps；
- structured_single；
- fraction_comparison；
- fraction_conversion；
- default。

src/app/page.tsx 已改为先解析 renderer id，再选择具体 React 组件。

当前 page 仍承担实际组件组合与较多 controller 职责，因此未来 UI/runtime 重构仍可以继续拆分，但“如何判断使用哪类 renderer”已有单一入口。

## 7. Grading

src/lib/grader-registry.ts 是当前统一训练判题入口。

### Classic

继续调用 legacy grading。

### A

继续调用正式 A skill grading。

### C

支持：

- exact；
- exact + comparison normalization；
- relative_error + tolerance；
- registered custom grader。

custom C grader 通过 graderId 显式注册；未注册时抛 UnsupportedCGraderError，不允许静默回退 legacy grading。

这为未来 C1 / C2 多字段 custom grading 留出了正式接口。

## 8. Timer

src/lib/timer.ts 维护 session 与 step 有效计时。

稳定边界：

- paused/background 时间不计入有效用时；
- 恢复不补计离开间隔；
- 未验证的旧 running segment 可被 suspend；
- step timer 可标记 timingInterrupted；
- speed calibration 可以据此排除不可靠样本。

任何 session/router/storage 重构都必须回归 visibility、pagehide、refresh/recover、重复提交和账号切换。

## 9. Completion

完成训练后：

1. Session 进入 completed；
2. 适用时冻结 Classic Rating；
3. 先写本地 IndexedDB；
4. 登录且有 owner 时尝试幂等同步 Supabase；
5. PK responder 在个人 completed 同步成功后再提交 challenge result。

具体数据流见 data-and-sync.md。

## 10. History / Stats Integration

History list 与 result detail 当前已经通过 family-aware display descriptor 区分 Classic / A / C：

- Classic 显示 legacy 题型与 Rating；
- A 显示正式 ability / difficulty，不套旧 Rating；
- C 显示 project / mode / preset / difficulty，不进入 A Mastery，也不套旧 Rating。

C4 已作为第一个正式 C project 接入 HistoryCharts：按 project + difficulty 独立形成总用时 / 正确率趋势。后续 C1～C3 复用同一 project trend contract，并按各自产品设计补充项目内结构复盘。

## 11. PK Integration

PKChallenge 保存 challenger 的 frozenSession；opponent 完成同题同序 Session。

胜负：

1. 正确题数更多；
2. 相同则总有效用时更短；
3. 再相同为平局。

PK eligibility 现在是 runtime contract：

- Classic：true；
- A：true；
- C：false。

普通结果页与 session creation 都检查该 policy，不能只靠 UI 隐藏按钮。

PK participant summary / page / detail 已改用 family-aware display descriptor，不再假定所有训练都有 legacy Rating。

## 12. Export Integration

normalized export 当前已经保留：

- schema / training mode；
- training family；
- pk eligibility；
- LaunchSpec JSON；
- A skill / difficulty；
- C project / mode / preset / grading contract；
- structure / generator facts；
- step records；
- first-class response JSON；
- legacy user_answer compatibility projection；
- grading metrics。

旧记录没有这些新字段时保持空值或旧字段语义，不反推不存在的过程。

## 13. Restart / Reproduce

当前：

- frozen Session 可恢复；
- frozen PK 不重新生成；
- Classic / A / daily restart 读取 frozen LaunchSpec 再生成新题；
- C4 restart 读取 frozen project / difficulty / preset，并通过正式 C project generator 生成新题；
- 未实现的 C project 不伪造 generator；
- 旧 Session 没有 LaunchSpec 时，使用兼容路径从已有字段建立 launch contract。

## 14. Persistence Compatibility

IndexedDB normalization 当前支持：

- 旧 scalar answer；
- 新 TrainingResponse；
- 旧 Session 无 LaunchSpec；
- 新 LaunchSpec；
- schema-v2 A / Classic；
- schema-v3 C metadata。

兼容原则：

> 新 runtime 可以增加信息，但不能为了新模型重写或猜测历史训练事实。

## 15. Current Limitations

Phase 1 Runtime Foundation 已完成。

当前剩余限制属于后续业务阶段：

- formal A 已收口为10个 canonical abilities；
- AHomeTraining、Daily、Mastery、History / Export 对 A 成员身份均从 canonical registry 派生；
- C4 已接入正式 generator / UI / result / history / trend / restart；
- C1～C3 正式 generator / UI 尚未接入；
- src/app/page.tsx 仍承担较多 controller / component composition。

## 16. Current Anchors

- src/lib/types.ts
- src/lib/training-definition.ts
- src/lib/training-response.ts
- src/lib/training-renderer.ts
- src/lib/grader-registry.ts
- src/lib/session.ts
- src/lib/training.ts
- src/lib/timer.ts
- src/lib/c-training.ts
- src/lib/c-project-registry.ts
- src/lib/c4-training.ts
- src/lib/storage.ts
- src/lib/data-export.ts
- src/lib/generate.ts
- src/lib/canonical-a-generate.ts
- src/components/StructuredSingleAnswerTraining.tsx
- src/components/StructuredStepTraining.tsx
- src/app/page.tsx
