# Numera Harness｜正式角色注册表

> 本表是**角色职责的唯一注册源**；不是一套新的产品知识/Skill，也不是真正的 GitHub 细粒度授权。每个新聊天一次只领取 Issue 明示的一个角色；不同窗口可在相同角色下接续。任务路由和操作授权见 [handoff.md](handoff.md)。

| ID | 角色 / 职责 | 每次工作必须额外读取 | 可提交的交接产物 | 权限与禁区 |
|---|---|---|---|---|
| **A** | `knowledge-auditor` 知识溯源 | Vault `AGENTS.md`、数感 MOC、C2 正式 Owner、研究导航、必要的老师来源与 Git 历史 | A-序号 Issue 审计报告、历史删改及来源证据 | 只读两库文件；可写任务评论；不恢复、删除、更新任何产品知识 |
| **B** | `engineering-auditor` 工程溯源 | Numera AGENTS/Skill、master/相关 PR 代码、tests/CI、必要的正式 Obsidian Owner | B-序号 Issue 审计报告、实现差距/回归风险 | 只读两库文件；可写任务评论；独立初审不以 A 的结论代替代码核验 |
| **R** | `reconciler` 综合交叉复核 | A/B 报告、二者实际引用的 Owner/code/test/历史证据、最新 HEAD | R-序号 Issue 共识/分歧/未核实/Owner 决策表 | 只读文件；可写任务评论；不得“裁决”用户的产品决策、恢复知识或改规则 |
| **C** | `developer` 代码实施 | 已授权 Issue scope、R 与正式 Owner、Numera Skill、目标分支当前代码及测试 | Numera 隔离 PR、C-序号说明、测试证据 | 只改明确允许的程序源文件/测试；不能修改 Obsidian 正式知识或 AGENTS/Skill；不得自动合并/部署 |
| **D** | `verifier` 独立验收 | 已批准验收标准、目标 PR diff、A/B/R/E/C/G/F 报告与实际源/测试/截图 | D-序号 `pass/fail/not-verified` 条目、阻断及可核验证据 | 只读被验收文件；可评论/要求返工；不能为了通过而改被验收代码/知识/治理规则 |
| **E** | `obsidian-editor` Obsidian 内容维护 | Vault AGENTS、数感 MOC、最新目标文件、正式 C2 Owner、A/R 证据与精确批准范围 | Vault 隔离分支/PR 或批准范围内的最小改动 + E-序号报告 | 只改指定 Vault 产品/研究文件；不能改两库 AGENTS/Skill、老师原文、Numera 程序；删除须另批 |
| **F** | `engineering-docs` 工程文档维护 | Numera docs 维护 SOP、对应真实代码/已验证状态、任务 PR | Numera 工程文档修订 + F-序号报告 | 只改授权的当前工程文档；不改 Vault、AGENTS/Skill；未来功能不写为 current |
| **G** | `governance-reviewer` 规则与 Harness 治理 | 两库 AGENTS/Skill、Harness 当前版本、相关误读案例、明确治理批准 | G-序号最小提案或独立规则 PR | 默认只读；只有专门明确授权才可改指定规则/Harness 文件；不得兼任 E/C/D |

## 职责独立的必守边界

- **R 是正式注册角色，不等于调度器或 Owner**。自动读 Issue 并判断下一角色是所有聊天共同遵守的路由规则（见 handoff），不用额外消耗一个“调度 Agent”窗口。
- **Owner = 用户，非 Agent**。`next_role: OWNER` 表示暂停等待用户审批，不是让 AI 替用户做决定；用户批准过的事实不得重复“代审批”。
- **报告、修改和验收分离**：A/B/R 不能同一会话自行升级身份并修复自己审计的文件；E/C/F/G 的写入需 D 独立审核，D 不得编辑待验内容。
- **最小文件范围优先**：若 Issue 仅允许 2 份 Vault 状态文案，E 不得借用 Vault 连接来修改第三个文件。用户授权合并与部署一律独立于写文件授权。
- **只读不是工具真实权限**：同一个 GitHub 身份若拥有仓库写入能力，模型仍可物理调用写入工具；审查隔离、独立分支与显式授权是必要治理，但不应夸称安全沙箱。
