---
name: "Numera Harness 任务"
about: "角色注册／任务路由／跨 ChatGPT 窗口交接"
title: "[Harness] "
labels: []
assignees: []
---

## 任务目标（短，避免写第二份产品规则）
- 目标：
- 允许范围：
- 禁止范围：
- 产品事实源（最新版本）：
- 相关 PR / 历史报告：

## 当前唯一机器可读任务状态
```yaml
# HARNESS_STATE_V1
schema: 1
status: intake
phase: intake
next_role: OWNER
task_revision: 1
harness_ref: master
current_work_item: NONE
allowed_operations: [read, issue_comment]
allowed_repo: JIDAIN/numera
allowed_paths: []
approval:
  source: 未授权修改
  scope: 只读
  status: pending
  merge: false
  deploy: false
  production_db_write: false
  delete: false
reports: {}
next_action: 等待明确任务与角色分配
blocked_by: []
```

## 报告索引（追加真实 URL，不复制全文）
- A：
- B：
- R：
- C：
- D：
- E：
- F：
- G：

## 注意
- 角色唯一注册表：`.agents/harness/roles.md`；状态与交接协议：`.agents/harness/handoff.md`。
- 模板用于 PR #19 合并后新建任务，`harness_ref: master` 表示读取最新正式规则；合并前若手动套用，必须改为实际试点分支和固定 HEAD SHA。历史 Issue 原有 ref/SHA 不批量改写。
- 这里的角色与范围属于协作约束，不是 GitHub 工具级授权；写入依然必须逐次符合用户授权及两库的 `AGENTS.md`。
- 未经单独明确授权，不修改正式产品知识、不删除、不合并、不部署、不写 Production DB。
