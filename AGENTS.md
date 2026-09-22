# Numera AI 项目规则

本文件是 `JIDAIN/numera` 的 AI / 自动化开发入口。项目专属执行工作流正文位于：

`.agents/skills/numera-maintainer/SKILL.md`

开始任何代码、UI、数据或文档修改前，必须先阅读本文件、该 Skill 与当前任务相关事实源。

## 1. 事实源优先级

```text
用户当前明确要求
→ 当前代码 / 测试 / 数据库迁移
→ PROJECT_STATUS.md
→ Accepted ADR / 对应 docs/features 契约
→ docs/reference 稳定参考
→ README.md
→ docs/history / docs/audits / Git 历史
```

`DEVELOPMENT_PLAN.md` 只描述未来，不是“已经实现”的证据。完整文档分层见 `docs/README.md`。

## 2. 项目身份

- 正式中文名：数感；
- 英文名：Numera；
- 日常称呼：算算；
- GitHub：`JIDAIN/numera`；
- Vercel Project：`numera`；
- Production：`https://fish-cat-speed-math.vercel.app`。

旧名称只允许出现在历史、迁移和兼容语境。

## 3. 必须保护的核心语义

- A 层运行时当前只认 8 个 canonical ability；A-MUL-04 / A-MUL-05 已锁定但尚未进入 registry，ID 清单必须保持单一实现事实源；
- B 只作为方法 / 解析 / 诊断参考，不建立独立 Mastery；
- C 按 C1～C4 完整纯计算项目组织，产品设计均已收口；新 C 训练使用 cProject/cMeta，不进入 A ability / Mastery；
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
- 文档按职责维护，不复制同一事实，不为单次 PR / 测试 / 部署新增长期文档。

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
- 文档结构总览：`docs/README.md`
- 第一层架构与兼容边界：`docs/adr/ADR-001-student-facing-training-units.md`
- 长期功能契约：`docs/features/`
- 长期参考规则：`docs/reference/`
- 一次性历史记录：`docs/history/`
- 时间点审计：`docs/audits/`
- 产品架构与能力知识库：`JIDAIN/lys-obsidian-note/13_Projects/数感/`

具体任务的完整执行协议以 `.agents/skills/numera-maintainer/SKILL.md` 为准。
