# Numera Docs

GitHub docs 同时承载 Numera 的 **Current Program Contract**、已确认的 **Engineering Plan / ADR** 与历史证据。它不替代 Obsidian「数感」的产品设计，也不替代代码、测试和 runtime 的可执行事实。

## 1. Fact Model

```text
Obsidian「数感」
= Product Target / Product Rationale

GitHub Product / Domain / Architecture
= Current Program Contract

GitHub Engineering Plan / ADR
= Approved Engineering Plan / Rationale
= 不等于已实现

Code / Tests / Schema / Runtime
= Executable Reality / Verification Evidence

History
= Past Evidence
```

如果 Obsidian target 与 GitHub current 不同，这是 implementation gap；Engineering Plan 负责描述已确认的实现路径，但不证明功能已经存在；如果 GitHub current docs 与 code/tests/runtime 冲突，应修 current docs。

## 2. Document Map

| Area                                   | 回答什么                                                              |
| -------------------------------------- | --------------------------------------------------------------------- |
| [Product](product/README.md)           | 用户现在能做什么、入口在哪里、UI应怎样稳定表现                        |
| [Domain](domain/README.md)             | 当前训练业务是什么：Classic / A / B / C、Rating / Mastery / analytics |
| [Architecture](architecture/README.md) | 程序怎样承载训练：runtime、session、data、sync、PK/export接口         |
| [Engineering](engineering/README.md)   | 怎么开发、当前做到哪、第一层怎么实施、文档怎么维护                    |
| [History](history/README.md)           | 过去怎样迁移、审计和演变，不定义现在                                  |

Engineering ADR 位于 Architecture / decisions。

## 3. Start Here

AI / 开发者默认阅读顺序：

```text
README.md
→ AGENTS.md
→ .agents/skills/numera-maintainer/SKILL.md
→ docs/README.md
→ docs/engineering/current-state.md
→ task area README
→ canonical contract
→ implementation anchor
→ code/tests/runtime
```

任务路由：

- 当前产品入口 / UI → [Product](product/README.md) / [UI](product/ui.md)
- Classic / A / B / C 业务边界 → [Domain](domain/README.md)
- Session / Renderer / Grader → [Training Runtime](architecture/training-runtime.md)
- Storage / Sync / Identity → [Data & Sync](architecture/data-and-sync.md)
- 当前状态 / 开发 / 测试 / 文档维护 → [Engineering](engineering/README.md)
- 长期工程取舍 → [Architecture Decisions](architecture/decisions/README.md)
- 过去实现 / 迁移 / 审计 → [History](history/README.md)
- 尚未实现的训练目标与产品规则 → Obsidian「数感」

## 4. Canonical Owner Rule

一个可独立变化的 current fact 只设一个 canonical owner。

MOC 可以重复：名称、一句话职责、链接、implementation pointer、task routing。

不要在多个 current docs 复制：ability 清单、schema、grading threshold、quota、Rating target、session lifecycle、sync order、ownership、PK eligibility、Production snapshot。

## 5. Current vs History

History 解释过去，不定义现在。历史文件内部出现 current / canonical 只代表当时。

不要从旧聊天、旧 ADR、旧迁移说明或 Git history 直接恢复已退役实现。

## 6. Documentation Lifecycle

```text
产品想法 / 训练规则
→ Obsidian 数感
→ 读取 GitHub current docs + code/runtime 建立 baseline
→ 实现
→ 测试 / runtime 核验
→ 更新真正改变的 GitHub canonical docs
→ 必要时 Engineering ADR / History
```

完整维护规则见 [Documentation Maintenance Guide](engineering/documentation-maintenance.md)。

## 7. Production / Main

GitHub master、Production Web 和 Supabase runtime 不是同一件事。当前差异见 [Current Engineering State](engineering/current-state.md)。

Git push / merge / CI success 不构成 Preview 或 Production 部署授权。
