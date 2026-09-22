# Engineering

本文回答：**怎样安全开发 Numera、修改某类模块时先读什么、如何验证，以及部署边界是什么。**

动态状态见 current-state.md；当前第一层实施见 first-layer-plan.md；文档维护SOP见 documentation-maintenance.md。

## 1. Standard Change Workflow

```text
classify change
→ read current canonical docs
→ verify code/tests/runtime
→ compare with Obsidian target when product change is involved
→ define scope / non-goal
→ implement
→ targeted regression
→ full quality gates as required
→ update changed canonical docs
→ ADR only for long-term engineering decision
→ History only for milestone-worthy past evidence
→ deploy only after explicit authorization
```

## 2. Task Router

| Task                        | First read                                          |
| --------------------------- | --------------------------------------------------- |
| 单页UI调整                  | Product / UI                                        |
| 全站UI重构                  | Product / UI + Architecture                         |
| 新A / 修改A                 | Obsidian Product Target + Domain + Training Runtime |
| 新C项目                     | Obsidian Product Target + Domain + Runtime + Data   |
| Session/Renderer/Grader重构 | Architecture / Training Runtime                     |
| IndexedDB/Supabase/owner    | Data & Sync                                         |
| History/Stats               | Domain + Runtime + Data                             |
| PK                          | Domain + Runtime + Data                             |
| Export                      | Domain + Runtime + Data                             |
| 文档架构/维护               | Documentation Maintenance                           |

## 3. Implementation Principles

- 优先 canonical service/runtime layer，不复制业务逻辑；
- UI不拥有 generator/grader；
- 权限与owner不靠UI保证；
- 历史冻结记录不因新模型批量重写；
- 新C不复用A Mastery；
- unsupported custom grader显式失败；
- 已执行 Supabase migration 不回改；
- secret/password/token 不提交Git。

## 4. Generator Workflow

修改 generator 时检查：

- 产品规则是否已在Obsidian锁定；
- 单题结构 vs 整组quota；
- 可注入 random / ID factory；
- reproducibility；
- version；
- impossible target是否显式失败；
- classifier/generator是否共用同一事实定义；
- 所有合法题量和边界tests。

## 5. Runtime / Session Workflow

检查：

- frozen question；
- active/resume/restart；
- timer；
- duplicate submit；
- account switch；
- historical decode；
- renderer/grader dispatch；
- PK frozen set；
- storage/cloud/export compatibility。

## 6. UI Workflow

可见UI修改：

- 先读 Product/UI；
- 判定是视觉变化还是交互contract变化；
- 不在page/component复制判题；
- mobile、safe-area、keyboard；
- loading/empty/error/read-only；
- recovery/result/history/PK回归。

## 7. Data / Sync Workflow

检查：

- schema version；
- IndexedDB old records；
- ownerAccountId；
- local/cloud dedupe；
- Supabase RLS/RPC；
- export；
- PK；
- migration necessity。

## 8. Quality Gates

仓库标准顺序：

```text
Prettier
→ npm run typecheck
→ npm run lint
→ npm run test
→ npm run build
```

CI 当前先检查 changed files formatting；前置失败时后续门会跳过。

纯文档变更不为了形式运行完整 build，但必须检查 links、paths、canonical owner、current/future/history边界。

## 9. Change Recipe Matrix

| Task        | Must update when fact changed           | Regression                       |
| ----------- | --------------------------------------- | -------------------------------- |
| 单页视觉    | UI（仅稳定pattern变化）                 | visual                           |
| 全站UI      | Product/UI + Architecture anchors       | mobile/full UI                   |
| 新A         | Product + Domain + Runtime + State      | generator/mastery/history/export |
| 新C         | Product + Domain + Runtime/Data + State | project/history/export           |
| Session重构 | Architecture                            | full training regression         |
| PK          | affected Domain/Runtime/Data            | PK + history                     |
| Export      | Runtime/Data                            | export tests                     |
| 纯目录重构  | implementation anchors only             | full relevant regression         |

## 10. Production Boundary

Vercel project：numera。Production URL 保留历史兼容地址。

仓库保持 vercel.json → git.deploymentEnabled=false。

规则：

- Git push/merge/docs commit != deployment authorization；
- Preview与Production都需要用户针对该次明确授权；
- 一次授权不视为永久授权；
- Supabase Production写入与Vercel部署是两个独立动作。

## 11. Refactor-only Rule

如果用户能力、Domain semantics、data semantics、grader、ownership、external contract均不变，可判定为 implementation refactor。

此时更新 Architecture anchors并跑回归，不伪造Product/Domain/ADR变化。

## 12. Completion Checklist

```text
[ ] scope / non-goal 清楚
[ ] Product Target 与 Current Contract 已区分
[ ] canonical owner 唯一
[ ] historical compatibility 未破坏
[ ] timer / recovery / owner 已检查（如相关）
[ ] targeted tests
[ ] required quality gates
[ ] manual UI acceptance（如相关）
[ ] docs impact
[ ] ADR 是否真的必要
[ ] Production 未越权部署
```

## 13. Final Report

用中文说明：做了什么、为什么、修改范围、实际验证、未运行项、兼容风险、数据/部署影响、未完成项。
