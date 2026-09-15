# 数感 Numera

> 正式中文名：**数感**｜英文名：**Numera**｜日常称呼：**算算**  
> GitHub：`JIDAIN/numera`  
> Vercel Project：`numera`  
> Production：`https://fish-cat-speed-math.vercel.app`

`fish-cat-speed-math`、`speed-math-pwa` 仅作为历史名称或兼容标识保留，不代表当前品牌。

## 项目定位

数感用于训练资料分析所需的计算能力。长期按三层组织：

1. **第一层：纯计算能力**——建立稳定、可复用的基础算力；
2. **第二层：资料分析专用计算方法**——围绕真实资料分析表达式训练低成本计算路径；
3. **第三层：资料分析实战判断与决策**——训练对象、时间、指标、公式、方法选择与停止计算时机。

当前开发重点仍是第一层。

## 第一层当前结构

第一层使用 A / B / C 组织：

- **A：底层自动化**——正式建立 Mastery；
- **B：数字变形参考**——只作为方法步骤、解析语言、方法标签和诊断标签，不建立独立 Mastery；
- **C：完整纯计算任务**——当前按 C1 乘法综合、C2 除法综合、C3 分数比较推进。

A V1 已固定为 8 个 canonical ability：

- `A-ADD-01`：2～3 位加法；
- `A-SUB-01`：2～3 位减法；
- `A-COM-01`：近邻小差值；
- `A-MUL-01`：正向乘法口诀；
- `A-MUL-02`：逆向乘法口诀；
- `A-MUL-03`：两位数 × 一位数；
- `A-FRA-01`：高频分数 ↔ 百分数固定映射；
- `A-PCT-01`：基础百分比取值。

旧 160 叶子架构已经退出正式运行时能力体系。进位、借位、特殊锚点、具体百分比、方法步骤等按 `preset / variant / structure_tags / generator_params` 或方法步骤记录，不重新制造微能力 Mastery。

## 当前可用功能

首页训练区由 `AHomeTraining` 承载：

- **我的日常**：用户选择 1～8 个 A 能力，并分别设置 L1 / L2 / L3；每次 10 或 20 题；
- **最近专项**：最近完成的本人非 PK A 专项可以直接再来一组；
- **全部练习**：直接进入 8 个正式 A 能力专项；
- **经典训练**：保留在“更多 → 经典训练”，继续读取真实经典历史，不强行改写为新 A 数据。

训练记录支持本地保存、历史查看、A Mastery、数据导出和异步 PK。Fish / Cat 登录身份由 Supabase Auth 决定，配对对象历史只读。

## 数据与兼容边界

- `active` 会话只保留在当前浏览器，不上传云端；
- `completed` 会话先写 IndexedDB，再尝试幂等同步 Supabase；
- 新 A 训练保存正式 `skillId / difficultyBand / structureTags / generatorParams`；
- 新的“我的日常”使用 `daily_plan`，旧 `mixed:L*` 仅保留历史兼容；
- 经典 `QuestionType / Subtype / Rating` 继续按原义读取、展示和导出；
- 不为经典历史猜测新的 A ability ID；
- A 冻结题组可以进入现有异步 PK 链路，并保持同题同序。

## 工程与部署

当前技术栈以 `package.json` 为准，核心包括 Next.js、React、TypeScript、IndexedDB、Supabase 与 Vitest。

CI 对本次修改文件执行格式检查，并对整个项目执行 typecheck、lint、test 和 build。

Production 必须获得明确授权后执行。仓库 `vercel.json` 默认保持：

```json
{
  "git": {
    "deploymentEnabled": false
  }
}
```

因此普通 Git push 不应自动触发 Preview 或 Production。

## 文档结构

长期文档按职责维护，避免把同一事实复制到多份文件：

- `README.md`：项目入口、稳定产品边界和文档导航；
- `PROJECT_STATUS.md`：当前真实工程状态、已上线能力和已知限制；
- `DEVELOPMENT_PLAN.md`：从当前状态向后的开发顺序，不记录已完成批次的流水账；
- `docs/adr/ADR-001-student-facing-training-units.md`：第一层长期架构与兼容决策；
- `DATA_EXPORT.md`：个人训练数据导出契约；
- `HISTORY_REPORTING.md`：历史与成绩汇总口径；
- `PK_ASYNC.md`：异步 PK 契约；
- `RATING_STANDARDS.md`：经典训练评级兼容规则；
- `FRACTION_PERCENT_QUESTION_BANK.md`：经典分数百分互转与消消乐固定关系库；
- `docs/MIGRATION.md`：Numera 品牌迁移与旧名称兼容说明；
- `SECURITY_AUDIT_2026-09-15.md`：2026-09-15 依赖安全审计记录；
- `JIDAIN/lys-obsidian-note/13_Projects/数感/`：产品架构、能力设计、训练模型与开发记录的正式知识库。

已经完成的阶段计划、临时审计、旧 160 叶子方案和过渡 UI 方案不再作为工作区长期事实源；需要追溯时使用 Git 历史。