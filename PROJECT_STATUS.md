# 项目状态

> 更新时间：2026-09-22  
> 本文件只记录**当前真实工程状态**。长期架构决策见 `docs/adr/`，功能契约见 `docs/features/`，未来计划见 `DEVELOPMENT_PLAN.md`。

## 当前阶段

数感当前仍处于第一层“纯计算能力”建设阶段。

- A V1 已完成工程收口并投入使用；A-MUL-04 / A-MUL-05 已完成产品规则锁定但尚未实现；
- B 保持为数字变形参考，不建立独立 Mastery；
- C1～C4 已完成产品设计当前收口；
- 本批次已经建立统一 C 层 schema/session/grading 工程外壳，但 C1～C4 的正式 generator、训练入口和项目专属 UI 仍未接入；
- 第二层资料分析专用计算方法与第三层实战判断尚未正式展开。

## 当前训练入口

首页训练区由 `AHomeTraining` 统一承载：

- **我的日常**：用户配置 1～8 个 A 能力、分别选择 L1 / L2 / L3，每次 10 或 20 题；
- **最近专项**：显示最近完成的本人非 PK A 专项，可重新生成同能力、同难度的新题组；
- **全部练习**：直接进入 8 个 canonical A 能力；
- **经典训练**：保留在“更多 → 经典训练”，继续兼容原 QuestionType / Subtype / Rating 语义。

新的日常训练使用 `daily_plan`。`DailyTrainingPlan.version` 当前固定为 `1`，计划按 canonical A 顺序归一化，生成后冻结到 TrainingSession。旧 `mixed:L*` 不再有新的用户入口，仅保留旧冻结会话兼容。

## 数据、历史与 Mastery

- `active` 会话只保留在当前浏览器，不上传；
- `completed` 会话先写 IndexedDB，再尝试幂等同步 Supabase；
- Auth 身份决定训练归属，配对对象历史只读；
- 本地与云端相同训练 ID 去重；
- 新 A 题目保存正式 `skillId / difficultyBand / structureTags / generatorParams`；
- 新 C 训练使用 schema v3 的 `cProject / cTrainingMode / cPreset / cMeta.grading`，不进入 A ability / Mastery；
- Mastery 只统计正式 A 能力整题，不从经典题、C 项目、方法步骤或结构标签反向生成微能力；
- 经典历史继续按原义读取、展示、评级和导出，不批量重写为新 A 数据。

历史与成绩的长期口径见 `docs/features/history-reporting.md`；经典 Rating 兼容规则见 `docs/reference/rating-standards.md`。

## 异步 PK

A 冻结题组可以进入现有异步 PK 链路：

- 发起方以已完成并同步的训练作为不可变来源；
- 对手完成同题同序挑战；
- 双方个人 completed 记录继续进入长期历史；
- PK 本身不制造第三条统计训练；
- active PK 仍只存在挑战者当前浏览器；
- Fish / Cat 已完成真实账号端到端验收。

详细契约见 `docs/features/pk-async.md`。

## 数据导出

登录用户可以导出本人云端已同步 completed 训练与独立的分数百分消消乐记录。当前导出同时提供 XLSX 与 JSON；不导出配对对象数据、PK 胜负或 challenge 明细，也不把 JSON 宣称为可恢复备份。

详细契约见 `docs/features/data-export.md`。

## CI 与依赖安全

当前 CI 对本次修改文件执行 Prettier，并对整个项目执行 TypeScript typecheck、ESLint、Vitest 和 Next.js build。

2026-09-15 已完成 npm 依赖安全修复；当前审计结果为 0 vulnerabilities。该次时间点审计归档于 `docs/audits/2026-09-15-dependency-security.md`。

## Production 与部署策略

- Vercel Project：`numera`；
- Production：`https://fish-cat-speed-math.vercel.app`；
- 当前 Production 已包含 A V1 与依赖安全修复；
- 正式地址已验证可访问，部署后未发现新的 Vercel runtime error；
- `vercel.json` 默认保持 `git.deploymentEnabled: false`；
- 后续任何 Production 部署仍需重新获得明确授权。

## 当前明确未完成

- A-MUL-04 两位数×两位数 runtime 实现；
- A-MUL-05 百分数×百分数 runtime 实现；
- C4 特殊基准数乘除转换 generator / UI / grading 接入；
- C3 分数比较新 generator / UI / classifier 接入；
- C1 乘法放缩 generator / custom grader / UI 实现；
- C2 除法综合 generator / evaluator / 方法训练 / 综合训练 UI 实现；
- 由 C 的真实方法需求整理出的稳定 B 参考库；
- 第二层资料分析专用计算方法体系；
- 第三层资料分析实战判断与决策体系；
- active 跨设备同步、实时 PK / Realtime、正式离线 PWA、排行榜和多人体系。

文档如何分层、哪些内容属于长期维护、哪些只能作为历史记录，以 `docs/README.md` 为准。当前 `master` 的代码、测试和数据库迁移仍是最终运行时事实源。
