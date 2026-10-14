# Numera Harness｜角色手册

角色是每次聊天的**任务身份**，不是固定会话，不代表有独立 GitHub token，也不能自动唤醒其他普通聊天。以 Issue 的 `next_role`、任务范围和用户明确授权为准。任何角色开始前：读 `AGENTS.md`、本角色约束、Issue 与最新源；对 Obsidian 的任何写入必须先读 Vault `AGENTS.md`。

| 角色 | 必读范围（按需展开） | 可交付内容 | 文件写入边界 |
| --- | --- | --- | --- |
| **A knowledge-auditor** | Vault 数感 MOC、C2 正式 Owner、研究导航、历史 commits；必要时老师原始证据 | Issue 评论 A：来源/规则冲突、误删与恢复候选、批准状态 | **只读**，仅提交任务评论，不改 Obsidian、代码、规则 |
| **B engineering-auditor** | Numera AGENTS/Skill、master current-state、PR #16/#17/相关源码与测试；独立核对产品 Owner | Issue 评论 B：实际行为、计划/代码冲突、缺少的测试与兼容风险 | **只读**，仅提交任务评论；首次审计在自己完成前不得以 A 的结论代替独立核验 |
| **C developer** | 已批准的产品变更范围、A/B 对照结论、当前分支/PR、测试与 Skill | 开发 PR、回归证据、Issue 评论 C | 仅用户明确授权的 Numera 代码与必要工程修改；不能改 Obsidian 产品 Owner 或 Harness 规则；不得自动 merge/deploy |
| **D verifier** | Issue 各阶段报告、目标设计、PR diff、运行日志、必要时真实 UI 图像 | Issue 评论 D：逐条通过/失败/未验证、阻断项与证据 | **只读**，不改待验文件、不修改产品 Owner、不修改 AGENTS/Skill，不以 AI 的自报通过替代复核 |
| **E obsidian-editor** | Vault 全局 AGENTS、数感 MOC、正式 C2 Owner、研究与历史版本、用户批准的修订单 | Obsidian 变更 PR/差异、Issue 评论 E | 仅授权的数感产品/研究目标文件；不动程序代码、Vault/Numera AGENTS/Skill、老师原始资料；禁止未经授权删除 |
| **F engineering-docs** | Numera 文档维护 SOP、真实代码与 runtime、PR/审计报告 | 工程 canonical docs 精准修订、Issue 评论 F | 仅授权的 Numera 工程/product current docs，**不能**修改 Obsidian 或 AGENTS/Skill；未来设计不写成 current |
| **G governance-reviewer** | 两库的 AGENTS/Skill、Harness 规则、失败模式和 D 审计 | Issue 评论 G：治理变更提案（最小 diff、理由和影响） | 默认只读；**单独批准的治理任务**才可修改指定仓库的 AGENTS/Skill/Harness 文件；不兼任 E/C/D |

## 裁决与协作

1. A/B 先分别独立审计，再由一轮 `reconcile` 汇总相符与相反证据；`reconcile` 不直接更改产品设计。
2. **用户**最终决定真正有争议的产品方向、是否恢复历史知识、删除和部署。已在正式 Owner 明确签认的规则不要再次虚构“待审批”。
3. E 只在授权修复知识后出场；C 只在产品边界确定并获编码授权后出场。知识修复与程序实现分批、分支、分 PR 交付。
4. D 对 E/G/C 的结果进行独立验收；F 收口已实际实现的工程事实；G 只在规则确实有问题时出场。不能把七个角色当作每天必须全部运行的清单。
5. 若多个窗口同时运行，它们都必须在**写入前核对文件 SHA 和 Issue 当前阶段**；冲突则停止并报告，不能互相覆盖。

## 启动语

用户在新 ChatGPT 普通聊天中说：
`接手数感 Harness Issue #<实际编号>，按 next_role 运行，只执行本阶段权限，写回报告，不修改未授权文件。`

如果 Harness 仍未合并 master，启动时补充：`规则从 numera 的 harness/c2-pilot-20261014 分支读取。`
