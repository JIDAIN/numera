# History

History 解释 Numera 怎样走到今天，但不定义 current behavior。

## 1. Purpose

这里保存值得长期追溯的一次性迁移、审计和重要历史证据。

~~~text
History explains the past.
History never overrides current docs/code/runtime.
~~~

历史文件内部出现 current / canonical 只代表写作当时。

## 2. Current Files

- 2026-09-numera-brand-migration.md：品牌迁移；
- 2026-09-15-dependency-security.md：2026-09-15依赖安全修复与当次审计。

## 3. Authority

判断现在：

- Current Product / Domain / Architecture → canonical docs + master；
- Executable reality → code/tests/schema/runtime；
- Production → deployment/runtime；
- History只提供背景。

## 4. When to Add History

适合：

- 正式品牌/产品阶段迁移；
- 大型工程迁移；
- 一次性重要审计；
- 被替代但仍有追溯价值的实现。

不需要：

- 普通CSS微调；
- 无行为变化的refactor；
- 每次CI；
- 每个PR/commit；
- 临时排障。

## 5. Historical Terminology

fish-cat-speed-math、speed-math-pwa 等历史名称可以在历史/兼容语境保留，不代表当前正式品牌。