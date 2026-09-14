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

## 当前正式状态（2026-09-14）

第一层 A 已完成架构收口并投入使用。此前的“160 个正式叶子能力”属于已经废弃的中间设计，不再作为运行时能力体系，也不再作为兼容约束。

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

A 专项已经具备生成、作答、难度、结构标签、训练记录、Mastery、历史趋势和冻结题组基础能力。

### B：数字变形参考

B 不建立永久独立 Mastery，只作为方法训练中的关键步骤、解析语言、方法标签和诊断标签。包括凑整、拆分、百分比拆分、选基准、特殊倒数转换、运算重组、误差方向与补偿等。

### C：完整纯计算任务

当前只保留 3 个候选：

1. 乘法综合；
2. 除法综合；
3. 分数比较。

C 尚未进入正式产品开发。当前原则是：**方法训练把方法显式化，综合训练把方法选择交还给用户。**

## 数据、历史与 PK

- 登录账号固定映射为 Fish / Cat，训练归属由 Supabase Auth 账号决定；
- completed 训练先保存 IndexedDB，再尝试幂等同步 Supabase；
- active 训练只保留在当前浏览器，不跨设备同步；
- 历史记录支持本人和配对对象只读查看，并保留经典历史兼容；
- A 正式 `skill_id`、`difficultyBand`、`structureTags`、`generatorParams` 随冻结题目保存；
- Mastery 只统计正式 A 能力整题，不从方法步骤、经典题或结构标签反向制造微能力；
- A 冻结题组可进入现有异步 PK 链路。

2026-09-14 已由 Fish / Cat 使用真实账号完成 A-PK 人工端到端验收，发起挑战、对方完成和双方结果查看均正常。

## 当前用户侧训练入口

专项训练保持 6 个第一层入口：

- 邻近倍数反应：暂未开放，等待除法方法一起收口；
- 百化分反应：已开放；
- 加减法：已开放；
- 乘法：已开放；
- 除法：暂未开放，等待 C 层设计；
- 分数比较：暂未开放，等待 C 层设计。

经典训练、历史、成绩、数据导出、异步 PK 等既有工程能力继续保留，不强制迁移为新 A 能力。

## 当前边界

当前明确未完成：

- C1 乘法综合、C2 除法综合、C3 分数比较的新架构产品设计与实现；
- B 独立训练能力；
- 第二层资料分析专用计算方法体系；
- 第三层实战判断与决策体系；
- active 跨设备同步、实时订阅和正式 PWA 离线能力。

旧 160 叶子、旧实验性微能力和旧方法步骤能力 ID 不再恢复。

## 质量门与 CI

2026-09-12 A 层清理后的专项回归结果：

- TypeScript typecheck：通过；
- ESLint：通过；
- Vitest：44 / 44 测试文件、237 / 237 测试通过；
- Next.js Production Build：通过。

仓库存在历史 Prettier 基线债务。CI 从 2026-09-14 起改为：**只对本次提交或 PR 实际修改的可格式化文件执行 Prettier 检查**，同时继续对整个项目执行 typecheck、lint、test、build。这样旧格式债务不会让所有 CI 永久红灯，但任何以后被修改的文件都必须满足当前格式规范。

完整全仓格式债务仍可使用 `npm run format:check` 检查；如需一次性治理，应单独开格式化批次，不与功能开发混在一起。

## 部署策略

Production 必须人工明确授权。仓库 `vercel.json` 当前保持：

```json
{
  "git": {
    "deploymentEnabled": false
  }
}
```

因此普通 Git push 不应自动触发 Preview 或 Production。需要部署时先获得明确授权，再临时执行部署并恢复关闭状态。

## 本地验证

```powershell
npm.cmd install --include=dev --no-audit --no-fund
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

如需检查整个仓库的历史格式债务：

```powershell
npm.cmd run format:check
```

## 当前事实源

- [PROJECT_STATUS.md](./PROJECT_STATUS.md)：当前工程状态与最近验收；
- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)：当前后续开发顺序；
- [docs/adr/ADR-001-student-facing-training-units.md](./docs/adr/ADR-001-student-facing-training-units.md)：第一层用户侧训练单元架构决策；
- `JIDAIN/lys-obsidian-note/13_Projects/数感/`：产品架构、能力设计、训练数据模型与开发记录的正式知识库。

`PROJECT_LOGIC_AUDIT.md`、旧阶段状态文档及历史开发记录中的旧题型/旧叶子描述仅用于追溯；与本 README、当前代码或数感 Obsidian 正式文档冲突时，不代表当前产品事实。
