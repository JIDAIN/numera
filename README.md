# 数感 Numera

> 正式中文名：**数感**｜英文名：**Numera**｜日常称呼：**算算**  
> GitHub：`JIDAIN/numera`  
> Vercel Project：`numera`  
> Production：`https://fish-cat-speed-math.vercel.app`

`fish-cat-speed-math`、`speed-math-pwa` 仅作为历史名称或兼容标识保留，不代表当前品牌。

## 项目定位

数感用于训练资料分析所需的计算能力。项目长期按三层组织：

1. **第一层：纯计算能力**——建立稳定、可复用的基础算力；
2. **第二层：资料分析专用计算方法**——围绕真实资料分析表达式训练低成本计算路径；
3. **第三层：资料分析实战判断与决策**——训练对象、时间、指标、公式、方法选择与停止计算时机。

当前开发重点仍是第一层。

## 第一层当前正式边界

### A：底层自动化

当前固定为 4 个能力簇、8 个正式能力：

- `A-ADD-01`：2～3 位加法；
- `A-SUB-01`：2～3 位减法；
- `A-COM-01`：近邻小差值；
- `A-MUL-01`：正向乘法口诀；
- `A-MUL-02`：逆向乘法口诀；
- `A-MUL-03`：两位数 × 一位数；
- `A-FRA-01`：高频分数 ↔ 百分数固定映射；
- `A-PCT-01`：基础百分比取值。

正式 runtime registry 只认上述 8 个 canonical A ability ID。程序继续使用 `skill_id` 技术字段承载正式 A ability ID。

### B：数字变形参考

B 不建立永久独立 Mastery，只作为方法训练中的关键步骤、解析语言、方法标签和诊断标签。包括凑整、拆分、百分比拆分、选基准、特殊倒数转换、运算重组、误差方向与补偿等。

### C：完整纯计算任务

当前只保留 3 个候选：

1. 乘法综合；
2. 除法综合；
3. 分数比较。

C 尚未进入正式产品开发。当前原则是：**方法训练把方法显式化，综合训练把方法选择交还给用户。**

## 当前首页与训练入口

当前首页不再使用早期“六个第一层入口”的过渡设计，也不再使用旧 `TrainingTypeSelector`。

首页训练区由 `AHomeTraining` 统一承载：

- **我的日常**：用户自己选择 1～8 个 A 能力，并为每个能力单独设置 L1 / L2 / L3；每次固定 10 或 20 题；
- **最近专项**：显示最近完成的本人非 PK A 专项，可一键“再来一组”；
- **全部练习**：直接展示 8 个 canonical A 能力，每个能力进入独立专项启动弹窗；
- **经典训练**：继续保留在“更多 → 经典训练”，维持原 QuestionType / Subtype / 历史语义，不映射成新 A 能力。

旧 `mixed:L*` 自动混合模式不再有新的用户入口，仅保留后端兼容能力，用于旧冻结会话/历史逻辑安全读取或重开；新的“日常训练”事实模型只有用户配置的 `daily_plan`。

## 日常训练冻结规则

新的日常计划使用 `DailyTrainingPlan version: 1`：

- 只接受 `version === 1`；
- 能力顺序统一按 canonical A 顺序归一化；
- 重复、非法、退役能力会被过滤；
- 题组创建后以 `daily_plan` 冻结进 TrainingSession；
- IndexedDB storage 明确认可 `daily_plan` subtype，因此 active 日常训练可以正常持久化、读取和恢复；
- 重开时从冻结题目恢复计划，并再次按 canonical A 顺序重建，确保 10 题无法整除能力数时的余数分配不会因为首次 shuffle 改变；
- 每道日常题保留自己的 `skillId`、`difficultyBand`、`structureTags` 和 `generatorParams`。

## 数据、历史与 PK

- 登录账号固定映射为 Fish / Cat，训练归属由 Supabase Auth 账号决定；
- completed 训练先保存 IndexedDB，再尝试幂等同步 Supabase；
- active 训练只保留在当前浏览器，不跨设备同步；
- 历史记录支持本人和配对对象只读查看，并保留经典历史兼容；
- Mastery 只统计正式 A 能力整题，不从方法步骤、经典题或结构标签反向制造微能力；
- A 冻结题组可进入现有异步 PK 链路；
- 2026-09-14 已由 Fish / Cat 使用真实账号完成 A-PK 人工端到端验收。

## 质量门与 CI

每个功能批次至少要求：

- 修改文件通过 Prettier；
- `npm run typecheck`；
- `npm run lint`；
- `npm run test`；
- `npm run build`；
- 关键交互补自动化测试；
- 必要时做真实账号 / 真机人工验收；
- 同步仓库事实源与数感 Obsidian 正式文档。

CI 只对本次 push / PR 实际修改的可格式化文件执行 Prettier，对整个项目继续执行 typecheck、lint、test、build。全仓历史格式债务仍可单独用 `npm run format:check` 审计。

PR #4 最终收口新增了“首页 → A 专项 → 冻结 Session”和“首页 → 自定义日常 → 冻结 `daily_plan` Session”的集成测试，同时补齐日常计划版本校验、重开稳定性和 storage subtype 兼容。新增集成测试也实际暴露并修复了 `daily_plan` 已写入 IndexedDB、却会被读取边界过滤掉的问题。

2026-09-15 PR #4 最终质量门已经通过：修改文件 Prettier、TypeScript typecheck、ESLint、**46 / 46 测试文件、249 / 249 测试**以及 Next.js Production Build 全部成功。

依赖审计中已有的 2 个 moderate + 3 个 high 漏洞独立跟踪于 GitHub Issue #5，不在 PR #4 中使用 `npm audit fix --force` 做无关的破坏性升级。

## 部署策略

Production 必须人工明确授权。仓库 `vercel.json` 保持 Git 自动部署关闭：

```json
{
  "git": {
    "deploymentEnabled": false
  }
}
```

普通 Git push 不应自动触发 Preview 或 Production。需要部署时必须先获得明确授权。

## 当前事实源

- [PROJECT_STATUS.md](./PROJECT_STATUS.md)：当前工程状态；
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)：后续开发顺序；
- [docs/adr/ADR-001-student-facing-training-units.md](./docs/adr/ADR-001-student-facing-training-units.md)：第一层能力边界；
- `JIDAIN/lys-obsidian-note/13_Projects/数感/`：产品架构、能力设计、数据模型和开发记录的正式知识库。

更早的旧阶段计划、旧 160 叶子实验和旧 UI 方案仅用于追溯；与当前代码和上述事实源冲突时，不代表现行产品状态。
