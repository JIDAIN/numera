# Numera｜Harness 总入口（普通 ChatGPT 跨窗口协作）

> 作用：负责**从 Issue 领取工作、交接报告、按审批范围执行**。它不是自动运行的多模型编排器，也不定义 Numera 的任何产品/数学/工程事实。**来源切换**：PR #19 未合并时，试点任务按 Issue 明示的 `harness/c2-pilot-20261014` 与固定 HEAD SHA 读取，不能假定 `master` 已有这些文件；合并后**新任务**默认读取 `master` 最新 Harness 规则；历史 Issue 保留原有 ref/SHA，不批量重写。

**唯一职责位置**
- [roles.md](roles.md)：**唯一角色注册表**（A/B/R/C/D/E/F/G 的职责、交付物及禁止操作）。
- [handoff.md](handoff.md)：**唯一任务路由、Issue 状态与交接协议**（结构化状态、认领、冲突、审批、异常）。
- [Numera AGENTS](../../AGENTS.md) → [numera-maintainer Skill](../skills/numera-maintainer/SKILL.md)：仓库规则及开发执行规则。
- Vault 的 `AGENTS.md`、数感 MOC 和 C2 正式 Owner：Obsidian 项目的**最高产品事实源**；本 Harness 不覆盖它们。

## 新聊天的启动步骤

1. 从用户给的 Issue 编号领取；没有编号时，仅在 Numera 的 open Issue 中**唯一一条**可识别的 Harness 待办时自动使用，否则先请用户指明，禁止猜测。
2. 先读 Numera 实时 `AGENTS.md` 及本入口、`roles.md` 和 `handoff.md`；再读 Issue 的 **`HARNESS_STATE_V1`**、全部相关角色评论、目标 PR / HEAD SHA、最新授权。
3. 由 `next_role` 选择角色；若为 `OWNER`、`NONE`、未知角色或 `blocked`，只读报告，不自称拥有写入授权。若含多角色并行任务，按 Issue 中明确的独立分工执行，首轮彼此不借用结论。
4. 核对自己的 `allowed_operations`、`allowed_paths`、用户明确授权和当前实际分支；**权限判定取最窄交集**。涉及 Vault 必须再读 Vault 实时 `AGENTS.md`、项目 MOC、目标文件最新版本。
5. 用 [handoff.md](handoff.md) 规定的 **CLAIM → READ → WORK → REPORT → HANDOFF** 流程完成一段工作。报告成功写入 Issue 后才可称“已交接”。
6. 最后输出下一角色、关联报告/PR、是否需要用户手动启动新聊天。**普通 Plus 聊天无法自动唤醒独立 ChatGPT 窗口**。

## 任务事实与授权不可混淆

`JIDAIN/numera` Issue 是跨窗口记忆及调度中心；角色报告放评论，候选修改放 PR，HEAD SHA 锚定版本。**Issue/AI 报告不是新的产品权威**。

- 用户的“允许审计”不等于允许文件写入；允许文件修改不等于允许删除、合并、Vercel Preview/Production 或生产 DB 写入。
- 角色协议只是提示层限制，**不是 GitHub 账号级权限隔离**。当前同一连接可能拥有写权限；风险靠最小分支差异、PR 和独立验收控制，除非真实配置了分支保护，不能声称 GitHub 强制阻断。
- 重要 AI 推论必须有证据；禁止用历史提案、旧评论、未合并 PR 覆盖已批准的 C2 正式 Owner。
- 实际截图验收必须读到真实图片像素，CI 全绿不等于视觉/业务完成。

## C2 试点路线

试点从 [Numera Issue #18](https://github.com/JIDAIN/numera/issues/18) 开始。A-001、B-001、R-001、A-002 已有独立评论与证据；C2 产品设计和工程事实以**每次实际打开的最新原始文件**为准，不能仅重复旧报告。A/B/R 审计报告不会自动授予 E/G/C 修改权。

**交接门槛**：E 修改仅限 Issue 精确允许的 Vault 文件和状态文字，优先隔离分支/PR，D 独立验收后才考虑合并；数感程序的 C2 PR #16/#17 与任何部署仍属独立授权范围。
