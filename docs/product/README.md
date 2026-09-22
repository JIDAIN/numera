# Product

本文回答：**Numera 当前对用户来说是什么、用户现在能做什么、这些能力从哪里进入。**

只记录 master 已实现的 current capability。尚未实现的训练设计留在 Obsidian「数感」；底层运行方式见 Architecture；当前开发进度见 Engineering / Current State。

## 1. Product Identity

- 中文正式名：数感
- English：Numera
- 日常称呼：算算
- GitHub：JIDAIN/numera
- Vercel Project：numera
- Production：https://fish-cat-speed-math.vercel.app

历史 slug 只作为兼容地址，不代表当前品牌。

## 2. Current Product Surface

当前应用是单页、手机优先训练工具，主要视图由 hash route 切换：

~~~text
#/                         首页
#/training                 当前训练
#/result/:sessionId        训练结果
#/history                  历史
#/history/:sessionId       历史详情
#/stats                    成长趋势 / A掌握
#/pk                       异步PK
#/pk/:challengeId          PK详情
#/memory                   分数百分记忆
#/fraction-match           分数百分消消乐
#/fraction-match/history   消消乐历史
#/fraction-match/pk        消消乐PK
~~~

当前主页面控制器仍集中在 src/app/page.tsx；这是 current implementation，不是长期 UI 架构目标。

## 3. Current Capability Map

| Capability | 当前入口 | 当前语义 | Canonical detail |
|---|---|---|---|
| A专项训练 | 首页「全部练习 / 最近专项」 | 当前正式A能力，L1/L2/L3，10/20题 | Domain |
| 我的日常 | 首页 | 用户选择当前正式A及难度后生成冻结题组 | Domain + Training Runtime |
| Classic训练 | 首页「更多 → 经典训练」 | 保留旧 QuestionType/Subtype/Rating 语义 | Domain + Classic Reference |
| History | 历史 | completed训练回顾，本人可同步/重试，配对对象只读 | Domain + Data & Sync |
| Stats / Mastery | 成长趋势 | Classic趋势 + A能力Mastery/诊断 | Domain |
| Async PK | 训练结果 / PK页 | 基于已完成冻结题组挑战固定配对对象 | Domain + Training Runtime |
| Personal Export | 数据导出入口 | 导出本人云端已同步 completed 与消消乐记录 | Data & Sync |
| Fraction Memory | 记忆入口 | 分数百分记忆体验 | Domain |
| Fraction Match | 消消乐 | 独立轻量训练与独立历史/PK | Domain |

C schema-v3 工程外壳已经存在，但 master 当前没有 C1～C4 正式 generator、用户入口或项目专属 UI，因此 Product 不把 C1～C4列为已上线能力。

## 4. A Training Entry

当前首页由 AHomeTraining 承载：

- 我的日常；
- 最近专项；
- 全部练习；
- Classic入口。

具体哪几个 A ability 属于 current runtime，以 Domain 与 canonical A registry 为准；Product 不复制 ability 清单。

## 5. History / Stats

历史只展示 completed 会话。当前用户可查看本人记录；登录并具备固定配对关系时可查看对方记录，对方记录只读。

当前 History UI 仍主要按 QuestionType/Subtype 组织，A 有专项识别与 Mastery；C family-aware history 尚未完成。这属于 Current State 中的已知 gap。

## 6. PK

当前异步 PK 使用已完成训练作为冻结来源，同题同序挑战。胜负先比较正确题数，再比较总有效用时。

PK 的训练 eligibility 目前没有统一 registry；新的 C 项目不能因为能创建 TrainingSession 就自动视为已支持 PK。后续由第一层 runtime 重构补显式 eligibility。

## 7. Data Export

登录用户可导出：

- 本人 Supabase 中已同步的 completed 训练；
- 本人的分数百分消消乐云端记录。

当前不导出 active、尚未同步的本地 completed、配对对象数据、PK challenge / 胜负明细或草稿纸。

JSON 是机器可读归档，不是已经验证可恢复的备份。

## 8. Product Boundaries

~~~text
Product entry != training business identity
UI visibility != write ownership
Classic Rating != A Mastery
A Mastery != C analytics
C shell exists != C project is product-ready
~~~

## 9. Maintenance Rules

用户可见 capability、新入口或信息架构变化时更新本文。

只改视觉 → Product / UI。只改 runtime → Architecture。纯源码目录重构 → 只更新 implementation anchors。
