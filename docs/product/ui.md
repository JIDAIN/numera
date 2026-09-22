# UI & Interaction

本文维护 Numera 的**稳定 UI / 交互 contract、当前 UI 分层与全站 UI 重构规则**。训练业务语义由 Domain 负责；Session / grader / data 由 Architecture 负责。

## 1. Principles

- 手机优先；
- 题目可读、输入低误触、计时信息清楚；
- 键盘和 safe-area 不遮挡关键操作；
- loading / empty / error / read-only 必须可区分；
- UI 不复制 generator、classifier 或 grader；
- UI 不根据最终答案猜用户没有显式提交的方法；
- 权限和 owner 不能只靠隐藏按钮保证。

## 2. Current UI Layer

长期职责模型：

~~~text
Design Tokens
→ Shared Primitive / Adapter
→ Shared Pattern
→ Training Renderer / Feature Component
→ Page Composition
~~~

这是职责模型，不是永久源码目录。

当前实现仍有大量状态、路由和训练分发集中在 src/app/page.tsx。StructuredSingleAnswerTraining、StructuredStepTraining、NumberPad、SessionDetails、History、PK、Match 等已经是可复用组件，但尚未形成统一 renderer registry。

## 3. Training Interaction

- 训练开始后使用冻结题组；
- 当前作答与计时状态允许本地暂存和恢复；
- 页面隐藏、失焦、锁屏、pagehide 等不能把离开时间计入有效训练；
- 恢复时不能补计离开间隔；
- 重复提交不得制造重复记录；
- 结果页与历史详情读取冻结记录，不重新生成题目；
- Classic、A、C 的输入表现可以不同，但 UI 不自行定义判题标准。

## 4. Answer Inputs

当前代码支持数字输入、choice、分数/比较符号专项输入、structured single answer、structured step flow 和草稿纸。

草稿纸当前只作为本地视觉辅助：不识别、不上传、不持久化成训练事实。

未来 C1/C2 需要的 structured response 不能通过把多个输入拼成一个字符串来绕过正式 Response contract。

## 5. Loading / Empty / Error / Recovery

- storage 失败必须给用户可理解状态；
- 有可恢复 active session 时提供继续/放弃选择；
- 历史无数据与加载失败不能混同；
- 同步失败不删除本地 completed；
- 不能因为云端失败清空已有本地训练结果。

## 6. Read-only / Ownership

登录身份决定真实 owner。Fish/Cat 展示与切换不能改变授权身份。

对方历史是只读视图；任何可写能力都必须由数据/服务层再次校验，而不是依赖 UI。

## 7. Result / Review

结果页可展示正确数/题量、有效用时、当前训练适用的 Rating / Mastery / diagnostics、原题与用户作答复盘，以及满足 eligibility 时的后续动作。

不同 training family 不应强行共享同一套评分展示。例如 C 不应因为结果页有 Rating 组件就套 legacy Rating。

## 8. UI Refactor Matrix

| 变化 | 主要 owner | 是否通常改变业务 contract |
|---|---|---|
| 色彩/圆角/间距 | UI | 否 |
| Shared Button/Input/Dialog | UI | 否 |
| 页面重新排版 | UI/Page | 否 |
| 功能移动入口 | Product | 否 |
| 作答输入语义 | UI + Domain/Runtime | 是 |
| 提交/恢复行为 | UI + Runtime | 是 |
| Rating/Mastery显示逻辑 | UI + Domain | 是 |
| owner/read-only行为 | UI + Data & Sync | 是 |
| generator/grader规则 | 非UI | 是 |

## 9. Full-site UI Refactor Procedure

~~~text
1. 核当前 Product / Domain
2. 定 UI tokens / shared primitives
3. 收敛 shared patterns
4. 收敛 Training Renderer
5. 迁 page composition
6. 清理 page.tsx 过载职责
7. mobile / keyboard / safe-area 验收
8. History / Result / PK / recovery 回归
~~~

UI重构不得顺手改变训练规则、计时、历史、同步或PK语义。

## 10. Manual Acceptance

可见 UI 修改至少检查：窄屏手机、desktop、safe-area、软键盘、loading/empty/error、active recovery、本人/对方只读、结果与历史详情、长文本/边界数字、页面隐藏再恢复、destructive/abandon flow。

自动测试不能替代真实视觉验收。

## 11. Current Anchors

- src/app/page.tsx
- src/app/globals.css
- src/components/AHomeTraining.tsx
- src/components/ClassicTrainingSelector.tsx
- src/components/StructuredSingleAnswerTraining.tsx
- src/components/StructuredStepTraining.tsx
- src/components/NumberPad.tsx
- src/components/SessionDetails.tsx
- src/components/HistoryList.tsx
- src/components/HistoryCharts.tsx
- src/components/SkillInsights.tsx
- src/components/PKPage.tsx
- src/components/PKDetails.tsx
- src/components/PersonalDataExport.tsx
- src/components/FractionPercentMatch*.tsx

## 12. Maintenance

只有稳定交互、UI layer ownership 或全站视觉架构变化时更新本文。单页像素微调通常不需要修改长期 contract。