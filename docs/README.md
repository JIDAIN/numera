# Numera 文档架构

本目录只维护两类内容：**长期需要持续维护的项目文档**，以及**需要保留但不应参与当前事实判断的一次性记录**。

## 1. 根目录：只放项目入口与持续维护的总控文档

根目录 Markdown 只保留：

- `README.md`：项目入口与稳定边界；
- `PROJECT_STATUS.md`：当前真实工程状态；
- `DEVELOPMENT_PLAN.md`：从当前状态向后的开发顺序；
- `AGENTS.md`：AI / 自动化开发入口；
- `CLAUDE.md`：Claude 兼容薄路由。

除工具要求的入口文件外，功能规则、参考表、审计和历史记录都不放在根目录。

## 2. `docs/adr/`：长期架构决策

只记录“为什么这样设计、哪些边界不能随意改”的长期决策。

当前：

- `ADR-001-student-facing-training-units.md`：第一层 A / B / C、Mastery、`daily_plan` 与经典历史兼容边界。

ADR 一旦 Accepted，后续只在决策发生实质变化时修订；具体实现状态不写进 ADR。

## 3. `docs/features/`：当前功能的长期业务契约

这些文档随功能长期维护，描述“功能现在应该怎样工作”，不记录某次 PR 的开发过程。

当前：

- `data-export.md`：个人训练数据导出；
- `history-reporting.md`：历史与成绩汇总口径；
- `pk-async.md`：异步 PK。

如果未来新增一个真正独立、长期存在且规则复杂的功能，再在这里增加对应契约；小功能不单独建文档。

## 4. `docs/reference/`：长期参考资料

这里放会被代码或兼容逻辑长期引用的稳定规则表、题库和参考定义，但它们不代表项目当前阶段。

当前：

- `rating-standards.md`：经典训练 Rating 兼容标准；
- `fraction-percent-question-bank.md`：经典分数百分互转与消消乐固定关系库。

## 5. `docs/history/`：一次性历史事件

这里保存已经发生、今后通常不再修改的迁移或历史事件。它们只用于追溯，不能覆盖 `PROJECT_STATUS.md` 的当前事实。

当前：

- `2026-09-numera-brand-migration.md`：品牌迁移记录。

普通 PR、部署和日常开发流水不需要在这里各建一篇；Git、PR、Issue 和 Obsidian `90_开发记录与待办` 已承担时间线职责。

## 6. `docs/audits/`：时间点审计记录

审计是某个时间点的检查结果，不是持续维护的产品契约，因此按日期归档。

当前：

- `2026-09-15-dependency-security.md`：npm 依赖安全审计与修复记录。

以后只有确实需要长期保留审计证据时才新增文件；普通 CI 通过、一次测试结果或部署成功不单独建审计文档。

## 7. 事实源优先级

判断“现在程序是什么样”时使用：

```text
用户当前明确要求
→ 当前代码 / 测试 / 数据库迁移
→ PROJECT_STATUS.md
→ Accepted ADR / 对应 docs/features 契约
→ docs/reference 稳定参考
→ README.md
→ docs/history / docs/audits / Git 历史
```

`DEVELOPMENT_PLAN.md` 只描述未来，不证明功能已经实现。

## 8. 文档维护规则

1. 当前实现变化，只更新 `PROJECT_STATUS.md` 和真正受影响的长期契约；
2. 未来优先级变化，只更新 `DEVELOPMENT_PLAN.md`；
3. 架构边界或设计理由变化，更新或新增 ADR；
4. 功能行为规则变化，更新对应 `docs/features/`；
5. 稳定规则表或题库变化，更新 `docs/reference/`；
6. 一次性迁移、审计等记录进入 `docs/history/` 或 `docs/audits/`；
7. 临时方案、阶段草稿、PR 验收总结优先留在 PR / Issue / Git 历史，不进入长期工作区；
8. 不把同一事实复制到 README、状态、计划、ADR 和功能文档中。

Obsidian `13_Projects/数感/` 负责更完整的产品知识体系；代码仓库文档只维护工程实现所需的最小长期事实。
