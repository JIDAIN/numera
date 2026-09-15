---
name: numera-maintainer
description: JIDAIN/numera（数感 / Numera / 算算）的项目专属维护 Skill。用于题目生成、训练会话、计时、IndexedDB、Supabase 双人同步、历史、Mastery、异步 PK、数据导出、移动端训练 UI、测试和项目文档维护。
version: 1.1.0
---

# Numera Maintainer

## 启动协议

开始任务前至少读取：

1. `AGENTS.md`
2. `PROJECT_STATUS.md`
3. 当前任务相关源码与测试
4. 当前任务对应的专项文档或 ADR

`README.md` 只用于项目入口；`DEVELOPMENT_PLAN.md` 只用于未来顺序。不要从已经完成的旧阶段计划或 Git 历史快照推断当前实现。

## 当前产品边界

数感长期按三层组织：纯计算能力 → 资料分析专用计算方法 → 资料分析实战判断与决策。

当前仍在第一层：

- A：8 个 canonical 底层能力，正式建立 Mastery；
- B：数字变形参考，不建立独立 Mastery；
- C：完整纯计算任务，当前从 C1 乘法综合开始设计。

canonical A ID 必须保持单一实现事实源。不要重新引入旧 160 叶子 registry、叶子专项或步骤 Mastery。

## 训练入口与日常

当前首页使用 `AHomeTraining`：我的日常、最近专项、全部练习；经典训练保留在“更多 → 经典训练”。

新的“我的日常”使用 `daily_plan`：

- 选择 1～8 个正式 A ability；
- 每个 ability 独立 L1 / L2 / L3；
- 题量 10 / 20；
- `DailyTrainingPlan.version === 1`；
- entries 按 canonical A 顺序归一化；
- 生成后冻结进入 TrainingSession；
- 旧 `mixed:L*` 仅保留旧会话兼容。

## 数据与身份

固定 Fish / Cat 角色由 Supabase Auth 账号决定，不能由 UI 临时选择改写。

- completed：先写 IndexedDB，再尝试幂等同步 Supabase；
- active：只保留当前浏览器，不上传；
- 配对对象历史只读；
- 云端 / 本地同 ID 去重；
- 新 A 题目保存正式 `skillId / difficultyBand / structureTags / generatorParams`；
- 经典历史继续按原 QuestionType / Subtype / Rating 读取，不猜新的 ability ID。

## 计时铁律

训练只计算真实有效作答时间。

页面隐藏、失焦、锁屏、冻结、`pagehide`、浏览器返回/前进、关闭/跳转及恢复读取都必须暂停；恢复不能补计离开间隔。

任何会话、路由或 storage 修改都要检查：暂存、刷新恢复、前后台切换、重复提交、账号切换和 active 唯一性。

## 题目生成协议

题目生成逻辑只维护在正式生成器 / 规则层，不复制到 UI。

修改生成器时必须：

1. 明确能力或完整任务的产品规则；
2. 区分单题生成与整组配额；
3. 保留可注入随机源 / ID 工厂和可复现性；
4. 覆盖所有合法题量与数学边界；
5. 验证答案、结构标签、生成参数和版本字段；
6. 不用静默 fallback 掩盖不可行结构；
7. 为新的结构、配额和边界补测试。

## A、B、C 的实现纪律

- A 的 `preset / variant / structure_tags / generator_params` 不是新的 Mastery；
- B 只能作为方法步骤、解析语言、方法标签或诊断标签；
- C 方法训练显式记录真正有价值的关键步骤；
- C 综合训练只给原题和最终答案时，不推断用户脑内方法；
- C 规则未锁定前，不提前大规模实现。

## 历史、评级与 PK

- 历史统计口径以 `HISTORY_REPORTING.md` 为准；
- `RATING_STANDARDS.md` 只描述经典训练评级兼容规则，A V1 使用 Mastery；
- PK 使用冻结题组，同题同序，不因生成器升级重新解释；
- 双方个人 completed 继续进入长期历史，PK 不制造第三条统计训练；
- PK 数据、权限、分页和提醒修改先读 `PK_ASYNC.md`。

## 数据导出

导出契约以 `DATA_EXPORT.md` 与当前 `src/lib/data-export*` 为准。

导出只读取当前账号云端已同步 completed 训练和独立消消乐记录，不读取本地未同步记录、配对对象数据或 PK challenge / 胜负明细。JSON 是机器可读归档，不宣称可恢复备份。

## UI 修改协议

Numera 是手机优先训练工具。视觉改动优先保证题目可读、输入不误触、计时清楚、关键操作不被键盘或 safe-area 挡住。

UI 改动不得改变题目、判题、计时、身份、历史、Mastery、同步或 PK 语义。

## 验证

有意义的代码变更优先执行：

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

修改文件必须通过当前 Prettier。不能运行的检查要明确说明，不能写成“已验证”。

## 文档维护

- `README.md`：稳定入口与文档导航；
- `PROJECT_STATUS.md`：当前真实工程状态；
- `DEVELOPMENT_PLAN.md`：未来开发顺序；
- ADR：长期架构决策；
- 专项文档：各自长期业务契约；
- Obsidian：产品架构、能力设计、训练模型和开发时间线。

不要为每个 PR、一次审计或一次部署新增长期总结文档。完成批次的信息只放到真正承担该职责的位置；详细历史交给 Git / PR / Issue。

## 完成报告

用中文说明：做了什么、修改了哪些文件、是否影响题目/判题/计时/历史/同步/PK、实际测试结果、未运行检查及原因、兼容风险和后续事项。