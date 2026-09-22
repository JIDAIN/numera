# Engineering ADRs

本目录只回答：**为什么 Numera 长期采用某个工程方向。**

Current docs 负责“现在是什么”；Obsidian Product ADR 负责“产品为什么这样训练”；History 负责“过去发生了什么”。

## Accepted baseline

- 0001 — Training domain and legacy boundaries
- 0002 — C-layer training shell

后续如果长期方向变化：

- 新增 ADR refine / supersede 旧决策；
- 不回写旧 Context / Decision 让历史失真；
- current implementation 变化同步对应 Product / Domain / Architecture，而不是把 ADR 当 current status。

## When to add an ADR

适合：

- Training runtime 的长期统一模型改变；
- Source of Truth 改变；
- Session / Response / Grader 等跨模块长期 contract 改变；
- 兼容边界改变；
- Production deployment policy 改变。

不适合：

- 页面布局；
- 一个 bug fix；
- 一次 generator 调参；
- 单次 migration；
- 文件夹重命名；
- 当前 PR / CI / Production snapshot。