# 项目状态与变更记录

## 当前正式状态（2026-09-15）

### 项目身份

- 正式中文名：**数感**；
- 英文名：**Numera**；
- 日常称呼：**算算**；
- GitHub：`JIDAIN/numera`；
- Vercel Project：`numera`；
- Production：`https://fish-cat-speed-math.vercel.app`。

`fish-cat-speed-math`、`speed-math-pwa` 仅作为历史名称或兼容标识保留。

### 当前产品阶段

数感长期按三层组织：

1. 第一层：纯计算能力；
2. 第二层：资料分析专用计算方法；
3. 第三层：资料分析实战判断与决策。

当前仍只开发第一层。

第一层内部采用 A / B / C：

- **A：底层自动化**——正式建立 Mastery；
- **B：数字变形参考**——只作为方法步骤、解析语言和诊断标签，不建独立 Mastery；
- **C：完整纯计算任务**——当前只保留乘法综合、除法综合、分数比较三个候选。

旧 160 叶子架构已经正式废弃，不再构成当前运行时能力体系或产品兼容约束。

### A 层正式能力

A 层固定为 4 个能力簇、8 个正式能力：

- `A-ADD-01`：2～3 位加法；
- `A-SUB-01`：2～3 位减法；
- `A-COM-01`：近邻小差值；
- `A-MUL-01`：正向乘法口诀；
- `A-MUL-02`：逆向乘法口诀；
- `A-MUL-03`：两位数 × 一位数；
- `A-FRA-01`：高频分数 ↔ 百分数固定映射；
- `A-PCT-01`：基础百分比取值。

正式 runtime registry 只认上述 8 个 canonical A ability ID。Canonical ID 清单由单一实现源导出，公开能力定义和 runtime registry 都以同一清单校验，避免两套能力列表静默分叉。

### 当前首页

首页训练区已收口到 `AHomeTraining`：

- **我的日常**：用户手动选择 A 能力并分别设置 L1 / L2 / L3，固定 10 / 20 题；
- **最近专项**：显示最近完成的本人非 PK A 专项，可直接再来一组；
- **全部练习**：直接展示 8 个 canonical A 能力；
- **经典训练**：移动到“更多 → 经典训练”，继续保持旧 QuestionType / Subtype / Rating 语义。

此前“六个第一层入口”的过渡 UI 已不再是当前产品事实。旧 `TrainingTypeSelector` / `SkillDrillSelector` 已从当前用户路径退役。

### 日常训练模型

当前唯一的新日常训练模型是用户配置的 `daily_plan`：

- `DailyTrainingPlan` 当前仅支持 `version: 1`；
- 持久化计划会过滤非法/重复条目并按 canonical A 顺序归一化；
- 每个能力可以有独立难度；
- 题组生成后冻结到 TrainingSession；
- IndexedDB storage 明确认可 `daily_plan` subtype，active 日常训练能够正常持久化、读取和恢复；
- 重开时从冻结题目恢复计划，并按 canonical A 顺序重建，保持余数题量分配稳定；
- 日常题继续保存各自正式 `skillId / difficultyBand / structureTags / generatorParams`。

旧 `mixed:L*` 自动混合模式不再有新的用户入口，仅保留后端兼容用途，避免旧冻结会话读取/重开被破坏。

### 记录、云同步与 PK

- completed 训练先写入 IndexedDB，再尝试幂等同步 Supabase；
- active 训练只保留在当前浏览器，不上传；
- Fish / Cat 身份由 Supabase Auth 固定映射；
- 历史支持本人和配对对象只读查看，经典历史继续按原 QuestionType / Subtype / Rating 兼容；
- Mastery 只统计正式 A 能力整题，不从经典题、方法步骤或结构标签反向生成微能力；
- A 冻结题组进入 PK 时保持同一题组，不重新生成；
- 2026-09-14 Fish / Cat 已使用真实账号完成 A-PK 人工端到端验收。

### A V1 最终验收与合并

PR #4 已在 2026-09-15 完成最终验收、结束 Draft，并 Squash Merge 到 `master`。最终收口包括：

- 当前首页和仓库事实源同步；
- canonical A 能力 ID 改为单一实现源并增加一致性测试；
- 退役旧用户侧 `TrainingTypeSelector` / `SkillDrillSelector`；
- `daily_plan` 严格校验 `version === 1`；
- 日常计划按 canonical A 顺序归一化；
- 修复日常训练重开后可能改变 10 题余数分配的问题；
- 增加首页到冻结 TrainingSession 的 A 专项 / 日常训练集成测试；
- 新增集成测试实际发现并修复 storage 漏掉 `daily_plan` subtype 的持久化读取缺口；
- 删除无业务意义的根目录 `.gitkeep`。

A V1 与当前安全依赖合并后的 `master` 已重新执行 CI：修改文件 Prettier、TypeScript typecheck、ESLint、Vitest 和 Next.js Production Build 均通过。

### 依赖安全状态

Issue #5 / PR #6 已完成并合并到 `master`，此前 npm audit 报告的 moderate / high 依赖漏洞已清零：

- `sharp` override：`0.35.3 → 0.35.4`；
- Vitest：升级到 `5.0.0`；
- Vitest / Vite JSX transform 已迁移到 Vite 8 的 `oxc` 配置；
- `brace-expansion`、`js-yaml` 等间接依赖通过非强制 `npm audit fix` 刷新；
- `npm ci`：**found 0 vulnerabilities**；
- `npm audit --audit-level=moderate`：0；
- `npm audit --omit=dev --audit-level=moderate`：0。

详细记录见 `SECURITY_AUDIT_2026-09-15.md`。

### CI 与格式基线

CI 当前策略：

- Prettier 只检查本次 push / PR 实际修改的可格式化文件；
- typecheck、lint、test、build 对整个项目执行；
- 旧格式债务不再永久阻塞 CI；
- 以后任何被修改的旧文件都必须通过当前 Prettier；
- `npm run format:check` 仍保留为全仓历史格式债务检查命令。

### Production 与后端

- Vercel 正式项目为 `numera`；
- Production 兼容域名继续使用 `https://fish-cat-speed-math.vercel.app`；
- Supabase 项目 `fish-cat-speed-math` 当前作为数感后端；
- 2026-09-15 已在明确授权下完成本轮 Production 部署，Vercel deployment `dpl_Aq2WpJpPrsTL7XMNZLzjQMaH4jDi` 状态为 `READY`；
- 正式域名已验证返回 HTTP 200，首页展示新的 `AHomeTraining` 结构（“我的日常”“全部练习”等）；
- 部署后未发现新的 Vercel runtime error；
- `vercel.json` 已恢复 `git.deploymentEnabled: false`，Git 自动部署继续关闭；
- 后续 Production 仍必须重新获得明确授权后手动进行。

## 当前明确未完成

- C1 乘法综合正式产品设计与实现；
- C2 除法综合正式产品设计与实现；
- C3 分数比较正式产品设计与实现；
- 由 C 自然整理出的 B 参考库；
- 第二层资料分析专用计算方法体系；
- 第三层资料分析实战判断与决策体系；
- 正式 PWA 离线能力、active 跨设备同步和实时订阅。

## 下一步顺序

1. A V1 工程收口已经完成并进入 `master`；
2. 依赖安全债务已经清零；
3. 回到 C1 乘法综合继续方法审查与产品设计；
4. 审查 C2 除法综合的方法训练与综合训练；
5. 审查 C3 分数比较；
6. 由 C 的真实方法需求整理 B 参考库；
7. 再系统拆解第二层“资料分析题型 → 计算模型 → 第一层能力调用”。

## 文档事实源说明

当前以以下内容为准：

- `README.md`：项目入口与当前边界；
- `PROJECT_STATUS.md`：当前工程状态；
- `DEVELOPMENT_PLAN.md`：当前后续开发顺序；
- `SECURITY_AUDIT_2026-09-15.md`：本轮依赖安全审计与修复记录；
- `JIDAIN/lys-obsidian-note/13_Projects/数感/`：产品架构、能力设计和开发记录的正式知识库。

更早的阶段文档、旧 `PROJECT_LOGIC_AUDIT.md` 和旧 160 叶子实验记录仅用于追溯；与上述事实源或当前代码冲突时，不代表现行产品状态。
