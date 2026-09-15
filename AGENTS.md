# Numera AI 项目规则

本文件是 `JIDAIN/numera` 的 AI / 自动化开发入口。项目专属执行工作流正文位于：

`.agents/skills/numera-maintainer/SKILL.md`

开始任何代码、UI、数据或文档修改前，必须先阅读本文件、该 Skill 与当前任务相关事实源。

## 1. 事实源优先级

```text
用户当前明确要求
→ 当前代码 / 测试 / 数据库迁移
→ PROJECT_STATUS.md
→ docs/adr 与当前专项文档
→ README.md
→ Git 历史 / 已完成阶段记录
```

`README.md` 是入口，不承担完整工程状态；`DEVELOPMENT_PLAN.md` 只维护未来开发顺序，不应被当作“已实现”证据。

## 2. 项目身份

- 正式中文名：数感；
- 英文名：Numera；
- 日常称呼：算算；
- GitHub：`JIDAIN/numera`；
- Vercel Project：`numera`；
- Production：`https://fish-cat-speed-math.vercel.app`。

旧名称只允许出现在历史、迁移和兼容语境。

## 3. 必须保护的核心语义

- A 层正式能力只认 8 个 canonical ability，ID 清单必须保持单一实现事实源；
- B 只作为方法 / 解析 / 诊断参考，不建立独立 Mastery；
- C 按完整纯计算任务组织，当前从 C1 乘法综合开始；
- completed 训练先写 IndexedDB，再尝试幂等同步；active 只留当前浏览器；
- Auth 身份决定训练归属，配对对象历史只读；
- 计时只算真实有效训练时间，离开、隐藏、锁屏和恢复不补计；
- 题目生成、结构配额和判题逻辑只在正式规则层维护，不复制进 UI；
- 经典 QuestionType / Subtype / Rating 历史保持原义，不强行映射新 A/C；
- 草稿纸不识别、不上传、不持久化；
- Production 必须获得用户明确授权，普通 Git push 不得打开自动部署。

## 4. 修改纪律

- 只修改用户要求所必需的范围；
- 不顺手重构无关生成器、会话、storage 或迁移；
- 旧兼容逻辑不得仅因“看起来多余”就删除；
- 产品规则先于实现，规则未锁定时不大规模编码；
- UI 优化不得改变题目、判题、计时、数据归属、统计、同步或 PK 语义；
- 文档按职责维护，不把同一批次的工程历史复制到 README、状态、计划和专项文档中。

## 5. 验证

有意义的代码变更应尽量执行：

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

修改文件还必须通过当前 Prettier。无法运行的检查必须明确说明；测试通过不等于手机视觉已经人工验收。

## 6. 文档入口

- 项目入口：`README.md`
- 当前工程状态：`PROJECT_STATUS.md`
- 后续开发顺序：`DEVELOPMENT_PLAN.md`
- 第一层架构与兼容边界：`docs/adr/ADR-001-student-facing-training-units.md`
- 数据导出：`DATA_EXPORT.md`
- 历史与成绩：`HISTORY_REPORTING.md`
- 异步 PK：`PK_ASYNC.md`
- 经典评级：`RATING_STANDARDS.md`
- 经典分百固定关系与消消乐：`FRACTION_PERCENT_QUESTION_BANK.md`
- 品牌迁移：`docs/MIGRATION.md`
- 依赖安全审计：`SECURITY_AUDIT_2026-09-15.md`
- 产品架构与能力知识库：`JIDAIN/lys-obsidian-note/13_Projects/数感/`

已完成的阶段计划、临时审计、旧 160 叶子方案和过渡 UI 方案只通过 Git 历史追溯，不再作为当前工作区事实源。

具体任务的完整执行协议以 `.agents/skills/numera-maintainer/SKILL.md` 为准。