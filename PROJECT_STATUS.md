# 项目状态与变更记录

## 当前正式状态（2026-09-14）

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

此前 160 叶子架构已经正式废弃。旧叶子注册表、旧叶子生成器、旧专项入口、步骤微能力和相关实验元数据不再构成当前运行时能力体系。

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

正式 runtime registry 只认上述 8 个 canonical A ability ID。程序继续使用 `skill_id` 技术字段承载正式 A ability ID。

A 专项当前已经具备：

- 题目生成；
- L1 / L2 / L3 难度；
- 作答与判题；
- `structureTags` 与 `generatorParams`；
- TrainingSession / QuestionRecord / completed 记录链；
- Mastery；
- 历史与趋势；
- 冻结题组；
- 现有异步 PK 基础能力。

### 记录、云同步与 PK

- completed 训练先写入 IndexedDB，再尝试幂等同步 Supabase；
- active 训练只保留在当前浏览器，不上传；
- Fish / Cat 身份由 Supabase Auth 固定映射；
- 历史支持本人和配对对象只读查看，经典历史继续按原 QuestionType / Subtype / Rating 兼容；
- Mastery 只统计正式 A 能力整题，不从经典题、方法步骤或结构标签反向生成微能力；
- A 冻结题组进入 PK 时保持同一题组，不重新生成。

**2026-09-14 人工验收：Fish / Cat 已使用真实账号完整验证 A-PK，发起挑战、对方完成和双方结果查看均正常。** 因此此前“真实线上双账号 A-PK 尚待端到端验收”的待办正式关闭。

### 最近代码回归

2026-09-12 旧 160 叶子清理与 A 层收口后的专用验证：

- runtime 旧叶子审计：通过，扫描 48 个生产源码文件；
- TypeScript typecheck：通过；
- ESLint：通过；
- Vitest：44 / 44 测试文件、237 / 237 测试通过；
- Next.js Production Build：通过。

本轮验证证明 A 代码、本地记录、Mastery、历史、经典冻结题组、A 冻结题组和 PK 基础逻辑可用；2026-09-14 的真人双账号 PK 验收进一步补齐线上端到端验证。

### Production 与后端

- Vercel 正式项目为 `numera`；
- 当前 Production 已处于 READY；
- 正式兼容域名继续使用 `https://fish-cat-speed-math.vercel.app`；
- Supabase 项目 `fish-cat-speed-math` 当前作为数感后端；
- Git 自动部署保持关闭，Production 必须在获得明确授权后手动进行。

### CI 与格式基线

此前 GitHub Actions 会直接运行全仓 `npm run format:check`，由于 43 个历史文件尚未统一 Prettier，CI 会在格式检查阶段失败并跳过后续 typecheck、lint、test、build。

2026-09-14 已调整 CI 策略：

- Prettier 只检查本次 push / PR 实际修改的可格式化文件；
- typecheck、lint、test、build 仍然对整个项目执行；
- 旧格式债务不再永久阻塞 CI；
- 任何以后被修改的文件都必须通过当前 Prettier；
- `npm run format:check` 仍保留为全仓历史格式债务检查命令。

如需彻底消除 43 个历史文件的格式差异，应单独做一次纯格式化批次，避免与功能修改混在同一提交中。

### 当前用户侧专项入口

六个第一层入口保持稳定：

- 邻近倍数反应：暂未开放；
- 百化分反应：已开放；
- 加减法：已开放；
- 乘法：已开放；
- 除法：暂未开放；
- 分数比较：暂未开放。

未开放项目不是缺失旧功能，而是等待 C 层产品设计完成后再按新架构接入。

## 当前明确未完成

- C1 乘法综合正式产品设计与实现；
- C2 除法综合正式产品设计与实现；
- C3 分数比较正式产品设计与实现；
- 由 C 自然整理出的 B 参考库；
- 第二层资料分析专用计算方法体系；
- 第三层资料分析实战判断与决策体系；
- 正式 PWA 离线能力、active 跨设备同步和实时订阅。

## 下一步顺序

1. 回到 C1 乘法综合继续方法审查与产品设计；
2. 审查 C2 除法综合的方法训练与综合训练；
3. 审查 C3 分数比较；
4. 由 C 的真实方法需求整理 B 参考库；
5. 再系统拆解第二层“资料分析题型 → 计算模型 → 第一层能力调用”。

## 文档事实源说明

从 2026-09-14 起：

- `README.md`：项目入口与当前边界；
- `PROJECT_STATUS.md`：当前工程状态；
- `DEVELOPMENT_PLAN.md`：当前后续开发顺序；
- `JIDAIN/lys-obsidian-note/13_Projects/数感/`：产品架构、能力设计和开发记录的正式知识库。

仓库中更早的阶段文档、旧 `PROJECT_LOGIC_AUDIT.md` 内容和历史开发记录可以用于追溯，但与上述事实源、当前代码或数感 Obsidian 文档冲突时，不代表当前正式产品状态。
