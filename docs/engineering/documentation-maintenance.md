# Documentation Maintenance Guide

本文只回答：**每次需求、开发、重构、部署后，怎样判断哪些文档需要更新，以及怎样避免重新产生第二事实源。**

## 1. Documentation Lifecycle

```text
产品想法 / 训练规则
→ Obsidian「数感」
→ 读取 GitHub current docs + code/runtime 建立 baseline
→ 实现
→ 测试 / runtime核验
→ 更新真正改变的 GitHub canonical docs
→ 必要时 Engineering ADR / History
```

Obsidian保留 Product Target / rationale /项目过程，不长期复制 current TS schema、file path 或 runtime contract。

## 2. First Decide: Did a Current Fact Change?

开发结束先问：

- 用户能做的事情变了吗？
- 当前入口变了吗？
- 稳定UI/交互变了吗？
- Training Domain identity / grading family变了吗？
- runtime/session/response/grader变了吗？
- data/sync/ownership变了吗？
- 当前实施状态变了吗？
- 长期工程选择变了吗？
- 是否产生值得长期保留的历史事件？

如果都没有，通常不需要为了形式修改大量文档。

## 3. Change → Canonical Owner

| 变化                                    | Canonical owner      |
| --------------------------------------- | -------------------- |
| 用户能力 / 入口                         | Product README       |
| 稳定UI / shared UI layer                | Product UI           |
| Classic/A/B/C current business identity | Domain README        |
| Classic查表                             | Classic Reference    |
| 跨模块系统结构                          | Architecture README  |
| Session / Response / Renderer / Grader  | Training Runtime     |
| schema / storage / sync / identity      | Data & Sync          |
| 当前动态状态                            | Current State        |
| 第一层实施顺序                          | First-layer Plan     |
| 开发 / 测试 / 部署流程                  | Engineering README   |
| 文档治理                                | 本文                 |
| 长期工程取舍                            | Engineering ADR      |
| 产品训练理由 / future target            | Obsidian Product ADR |
| 重大历史迁移/审计                       | History              |

## 4. When Not to Update a Canonical Contract

### Pure implementation refactor

如果业务/data/grader/permission不变：更新 Architecture implementation anchors；不新增Product/Domain/ADR规则。

### Pure visual adjustment

单页间距、颜色、字体微调通常不改 Product contract；只有 shared UI / stable interaction变化才更新 Product UI。

### Test / CI repair

业务没变时不修改Domain；只有测试结构/流程变化才更新 Engineering。

### Future idea only

留在 Obsidian，不提前写成 GitHub current capability。

### Main changed but not deployed

current master contract可以更新，但 Current State必须继续区分master与Production。

## 5. New Documentation File Rule

```text
已有 canonical owner？
→ yes：优先写入已有文件
→ no：是否形成独立长期 contract？
   → yes：考虑拆文档
   → no：继续放现有 owner
```

不要因为新增页面、源码目录、单个A、单个简单C、bug fix、一次migration、一次UI微调或一次CI修复就新建长期Markdown。

## 6. MOC Rules

MOC只导航，可重复：名称、一句话职责、链接、implementation pointer、task routing。

MOC不复制：enum、threshold、quota、permission、lifecycle、schema field catalog、Production snapshot。

## 6.1 Guarded Repetition

极少数安全硬规则允许在入口文档中**简短重复**，例如：

- Production / Preview 必须逐次明确授权；
- secret 不得提交 Git；
- UI 不是权限边界。

这类重复只用于防误操作，不建立第二套细节来源。详细流程仍由唯一 canonical owner 维护；入口文档应尽量保持同义、短句和指向关系。

## 7. Fact Source Selection

| 问题               | 首要事实源                        |
| ------------------ | --------------------------------- |
| 尚未实现的产品目标 | Obsidian「数感」                  |
| 当前程序contract   | GitHub canonical docs + master    |
| 实际运行实现       | code/tests/schema/runtime         |
| Production实际版本 | Vercel deployment/runtime         |
| DB当前事实         | Supabase runtime + repo migration |
| 当前差异           | Current State                     |
| 长期工程原因       | Engineering ADR                   |
| 过去实现           | History                           |

current docs与 executable reality冲突时修docs；不要用旧Markdown要求代码退回旧实现。

## 8. Implementation Anchors

Canonical doc可以维护源码入口，但 anchor只是 current map。

源码移动后：

- 更新anchor；
- 删除dead path；
- 不因path变化改Domain contract。

## 9. ADR Rules

ADR只记录长期工程选择及原因。Accepted后方向改变时新增refine/supersede，不把旧Decision改造成今天的current。

页面布局、bug fix、一次migration、目录重命名、Production snapshot不写ADR。

## 10. History Rules

History解释过去，不定义现在。

适合：正式品牌迁移、大型工程迁移、重要一次性审计、里程碑。

不需要：每次CSS、普通refactor、普通CI、每个commit。

## 11. Current State Rules

Current State保持短，只记录master/Production差异、第一层当前进度、关键gap、阻塞PR、deployment protection和outstanding verification。

不要复制完整Product/Domain/schema。

## 12. Documentation Closeout

```text
[ ] 这次真的改变 current fact 吗？
[ ] canonical owner 唯一吗？
[ ] Obsidian future 是否误写 current？
[ ] GitHub current 是否复制回 Obsidian？
[ ] implementation anchors 存在吗？
[ ] 是否新建了不必要文档？
[ ] Current State 是否需要更新？
[ ] 是否需要 ADR？
[ ] 是否真的值得 History？
[ ] master / Production 是否区分？
[ ] deployment claim 是否真实？
```

## 13. Docs-only Verification

纯文档修改至少检查：relative links、dead paths、canonical ownership、future/current/history边界、implementation anchors。

纯docs不为形式强制执行完整应用build。

## 14. Maintenance of This Guide

只有“文档怎么维护”的流程变化时更新本文。具体业务事实回到各自 canonical owner。
