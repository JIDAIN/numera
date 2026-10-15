# Numera Harness｜任务路由、领取与交接协议 V1

> 唯一任务分配与交接规范，配合 [roles.md](roles.md) 使用。适用于独立普通 ChatGPT 窗口通过同一 GitHub Issue 接力，**没有后台调度器、自动子 Agent 或独占锁服务**。

## 1. 单个 Issue 的唯一权威状态

新的任务 Issue 模板含一段 `HARNESS_STATE_V1` YAML（下例为示意字段；正式值每任务独立填写），这是**该任务当前状态**的唯一权威；历史评论/报告提供证据，不覆盖该状态。旧 Issue 如 #18，在第一次升级时将原来的自然语言 `status / phase / next_role` 标注为旧格式或替换，不能同时保留两套互相矛盾的“当前状态”。

```yaml
# HARNESS_STATE_V1
schema: 1
status: ready             # intake | ready | claimed | blocked | in_review | completed
phase: authorized_edit    # intake | independent_audit | reconcile | owner_review | authorized_edit | verify | docs_closeout | closed
next_role: E              # A/B/R/C/D/E/F/G | OWNER | NONE；多个角色任务需在 work_items 中单列
task_revision: 1          # 每次人工/Agent交接更新 +1，仅用于发现旧状态，非事务锁
harness_ref: master          # 合并后新任务默认最新 master；试点/历史任务按 Issue 标明的固定 ref@SHA
current_work_item: E-001
allowed_operations: [read, issue_comment, create_branch, propose_pr, update_allowed_files_on_branch]
allowed_repo: JIDAIN/lys-obsidian-note
allowed_paths:
  - <精确文件路径>
approval:
  source: <用户指令原话和日期；并列前置指定范围>
  scope: <只允许做什么，不允许做什么>
  status: granted         # pending | granted
  merge: false
  deploy: false
  production_db_write: false
  delete: false
reports:
  A-001: <issue-comment-url>
  B-001: <issue-comment-url>
  R-001: <issue-comment-url>
next_action: <下一角色唯一可执行动作>
blocked_by: []
```

**字段规则**：
- `allowed_operations` 和 `allowed_paths` 是该角色写入范围的**上限**，不足以取代用户原始授权或两库 AGENTS；实际权限取三者交集。
- `next_role: OWNER`、`status: blocked`、`approval.status: pending` 或找不到用户授权时，AI 只读与报告，不写文件。
- `phase` 与 `next_role` 必须一致；如 `phase: verify` 应派给 D，`phase: reconcile` 应派给 R；不符合则先报路由冲突。
- `current_work_item` 是单次工作单元；报告 ID 自增，例如 E-001、E-002，同一个角色换窗口不重号；不要将评论中的历史 `next_role` 当当前派单。
- 来源 SHA、文件路径与 PR 应分别在报告/索引中出现；验收时以**最新**分支 SHA 为准，HEAD 变化先重新对比。

## 2. 窗口启动与任务选择

1. 用户提供 Issue：直接打开该 Issue。
2. 未给 Issue：仅当能确认有唯一可接手的 open Harness Issue 时选择；否则问哪一个。
3. 读取 `HARNESS_STATE_V1`、roles.md、最新相关报告/PR 及两仓库适用 AGENTS。若只有旧格式，允许**只读说明下一阶段**，不得凭旧字符串获写权限。
4. `next_role: OWNER` 代表用户审批关口：不擅自改为 E/C；没有结构化 `approval` 的任务也不能因为 AI 提议就自动“已批准”。
5. 领取前重新读取最新 Issue 和实际目标 HEAD；若上下文、批准路径、角色或阶段不明确，标 `blocked` 并报告，而非猜测。
6. 一次只执行一个 `current_work_item`，不因 Agent 还知道其他任务就自行切换角色。

## 3. CLAIM → READ → WORK → REPORT → HANDOFF

**CLAIM**：在 Issue 追加 `[CLAIM role / work_item / task_revision]` 评论，说明本窗口领取的具体任务；紧接着重读 Issue 和最新评论。若另有同一 work item 的有效认领、状态已变或文件 HEAD 不同，停止冲突写入并反馈。**GitHub Issue 评论不是原子锁**；发现竞争只能协调，不能承诺完全阻止。

**READ**：先读当前有效 source/目标文件与 SHA；角色报告只是线索。特别是 E 对 Vault 写入前须读当前 Vault AGENTS、项目 MOC、正式 C2 Owner、目标文档。

**WORK**：只做本 work_item 授权的操作。写入首先在隔离分支，记录改动前后 diff；不要直接覆盖 `main/master`，不得合并、删除、部署或写生产 DB，除非**本次有独立明确授权**。

**REPORT**：以 `[E-001]` 形式追加评论。含版本、文件/PR 链接、证据、事实与推测、已做/未做的验证、超范围项、是否符合交付门槛。**先确认 GitHub 评论写入成功，才宣布交付完成**。

**HANDOFF**：重新读取 Issue 及相关评论。当前工作单元完成后，按该任务的实际结果、有效授权及 §4 状态转移表确定 `status`、`phase`、`next_role`、`current_work_item`、`next_action`；写入本轮真实 `reports` 链接并将 `task_revision` 加 1，**不得把示例角色或编号当作通用目标**。更改前后均核验 Issue 内容；如果别的窗口已改变状态就停止，避免覆盖。**GitHub Issue 更新不提供跨聊天的事务级 compare-and-swap，不可称严格防竞态**。

**仅供 E/G/F/C 候选 PR 完成后的示例**：可交给独立 D 复验，设为 `status: in_review`、`phase: verify`、`next_role: D`；`current_work_item` 使用本任务下一个未使用的 D 编号（首次如 `D-001`，D-001 返工后如 `D-002`）。A/B/R/D 的其他交接和 FAIL/PASS 分支以 §4 为准。

## 4. 交接状态与异常

| 事件 | 状态处理 | 谁可以下一步 |
| --- | --- | --- |
| A/B 独立报告未齐 | 保持 `independent_audit`；各自追加报告，不借用对方结论 | 未完成的 A/B |
| A+B 报告均齐 | `phase: reconcile`、`next_role: R`，索引 A/B URL | R |
| R 报告完成，有决策缺口 | `phase: owner_review`、`next_role: OWNER` | 用户 |
| 用户已经明确批准有限修改范围 | 更新 V1 `approval` 和 `allowed_paths`，`phase: authorized_edit` | 指定的 E/G/F/C |
| E/G/F/C 候选 PR 完成 | `phase: verify`、`next_role: D`；链接本轮 PR | D |
| D 发现不符 | `status: blocked`，链接 D 报告、需返工项；由下一审批决定是否退回原角色 | 指定原角色或 OWNER |
| D 验收通过 | `next_role: OWNER` 等待独立 merge / deploy 审批；如只读交付可关闭 | 用户 |
| 无法打开 Issue/报告/目标 SHA | `blocked`，写明缺失信息；**不宣称完成** | 用户或恢复访问后的原角色 |
| 发生同工作单元并行认领/文件冲突 | 停止写入，重读 Issue/HEAD，明确谁接手 | OWNER / 被重新指派角色 |

## 5. 独立性与验收

- **独立报告**：B 初审不得以 A 报告结论代替实际源码核验；R 需重看关键证据；D 不可只读 C/E 自报“测试通过”。
- **权限测试**：无授权时试图更新 Vault = 必须拒绝；`next_role: OWNER` = 不得自行进 E；只允许两文件 = 第三文件拒绝；无当前 Issue = 不猜测；审查失败 = 不合并。
- **接续测试**：新聊天仅凭 Issue 编号应识别正确 role/work_item/目标路径/审批，读取当前 HEAD 后形成一份可被下一窗口找到的报告。
- **范围限定**：协议不授予真实工具层的权限控制，不提供 GitHub branch-protection 或自动调度服务；真正技术强制隔离需独立 GitHub 身份/令牌、受保护分支等机制另行部署。
