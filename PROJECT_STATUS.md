# 项目状态

> 更新时间：2026-09-15  
> 本文件只记录**当前真实工程状态**。长期产品定义见 README 与 ADR，后续计划见 `DEVELOPMENT_PLAN.md`，历史过程通过 Git / PR / Issue 追溯。

## 当前阶段

数感当前仍处于第一层“纯计算能力”建设阶段。

- A V1 已完成工程收口并投入使用；
- B 保持为数字变形参考，不建立独立 Mastery；
- 当前开发重点已经转入 C1 乘法综合，随后依次审查 C2 除法综合和 C3 分数比较；
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
- Mastery 只统计正式 A 能力整题，不从经典题、方法步骤或结构标签反向生成微能力；
- 经典历史继续按原义读取、展示、评级和导出，不批量重写为新 A 数据。

历史与成绩汇总的详细口径见 `HISTORY_REPORTING.md`。

## 异步 PK

A 冻结题组可以进入现有异步 PK 链路：

- 发起方以已完成并同步的训练作为不可变来源；
- 对手完成同题同序挑战；
- 双方个人 completed 记录继续进入长期历史；
- PK 本身不制造第三条统计训练；
- active PK 仍只存在挑战者当前浏览器；
- Fish / Cat 已完成真实账号端到端验收。

详细契约见 `PK_ASYNC.md`。

## 数据导出

登录用户可以导出本人云端已同步 completed 训练与独立的分数百分消消乐记录。当前导出同时提供 XLSX 与 JSON：

- XLSX 用于筛选和人工分析；
- JSON 保留原始云端行与规范化结构；
- 新 A 元数据可随逐题记录导出；
- 不导出配对对象数据、PK 胜负或 challenge 明细；
- 导出不是已验证可恢复的备份。

详细契约见 `DATA_EXPORT.md`。

## CI 与依赖安全

当前 CI：

- 对本次 push / PR 修改的可格式化文件执行 Prettier；
- 对整个项目执行 TypeScript typecheck、ESLint、Vitest 和 Next.js build；
- 历史格式债务不再阻断所有功能检查。

2026-09-15 已完成 npm 依赖安全修复；当前审计结果为 0 vulnerabilities。详细记录见 `SECURITY_AUDIT_2026-09-15.md`。

## Production 与部署策略

- Vercel Project：`numera`；
- Production：`https://fish-cat-speed-math.vercel.app`；
- 当前 Production 已包含 A V1 与依赖安全修复；
- 正式地址已验证可访问，部署后未发现新的 Vercel runtime error；
- `vercel.json` 默认保持 `git.deploymentEnabled: false`；
- 后续任何 Production 部署仍需重新获得明确授权。

## 当前明确未完成

- C1 乘法综合正式规则与实现；
- C2 除法综合正式规则与实现；
- C3 分数比较正式规则与实现；
- 由 C 的真实方法需求整理出的稳定 B 参考库；
- 第二层资料分析专用计算方法体系；
- 第三层资料分析实战判断与决策体系；
- active 跨设备同步、实时 PK / Realtime、正式离线 PWA、排行榜和多人体系。

## 当前文档事实源

- `README.md`：项目入口与稳定边界；
- 本文件：当前真实工程状态；
- `DEVELOPMENT_PLAN.md`：未来开发顺序；
- `docs/adr/ADR-001-student-facing-training-units.md`：第一层架构与兼容决策；
- 各专项文档：只负责自己的长期业务契约；
- `JIDAIN/lys-obsidian-note/13_Projects/数感/`：产品架构、能力设计、训练模型与开发记录的正式知识库；
- 当前 `master` 的代码与测试：最终运行时事实。

已完成的阶段计划、临时审计和旧架构方案不再保留为工作区长期事实源；需要追溯时使用 Git 历史。