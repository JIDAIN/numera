# 数感 Numera

> 正式中文名：**数感**｜英文名：**Numera**｜日常称呼：**算算**  
> GitHub：JIDAIN/numera  
> Vercel Project：numera  
> Production：https://fish-cat-speed-math.vercel.app

fish-cat-speed-math、speed-math-pwa 等只作为历史名称或兼容标识保留。

## 项目定位

Numera 用于训练资料分析所需的数感与计算能力。

产品目标、训练方法、A/B/C设计与尚未实现方案维护在 Obsidian「数感」；本仓库 docs 只维护当前已经实现并经过代码/runtime核验的程序 contract。

## 文档入口

~~~text
README
→ AGENTS
→ .agents/skills/numera-maintainer/SKILL.md
→ docs/README.md
→ docs/engineering/current-state.md
→ task area
~~~

主要区域：

- docs/product/：当前用户能力与UI；
- docs/domain/：当前训练业务；
- docs/architecture/：runtime、session、data、sync与Engineering ADR；
- docs/engineering/：当前状态、第一层实施、开发和文档维护；
- docs/history/：历史迁移与审计。

Obsidian「数感」：JIDAIN/lys-obsidian-note/13_Projects/数感/。

## Fact Model

~~~text
Obsidian = Product Target / Product Rationale
GitHub canonical docs = Current Program Contract
Code / Tests / Schema / Runtime = Executable Reality
History = Past Evidence
~~~

完整规则见 docs/README.md。

## Engineering / Deployment Boundary

技术栈与依赖以 package.json 为准。

仓库 vercel.json 保持 Git 自动部署关闭。Git push / merge / CI success 不构成 Preview 或 Production 授权；每次部署都需要用户针对该次明确授权。
