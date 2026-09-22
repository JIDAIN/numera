# Numera Repository Rules

本文件是 JIDAIN/numera 的 AI / 自动化开发硬规则。它不维护项目百科、当前ability数量、schema枚举或Production snapshot。

项目执行 Playbook：.agents/skills/numera-maintainer/SKILL.md。

## 1. Project Identity

- 中文正式名：数感
- English：Numera
- 日常称呼：算算
- GitHub：JIDAIN/numera
- Vercel Project：numera
- Production：https://fish-cat-speed-math.vercel.app

旧名称只用于历史、迁移和兼容语境。

## 2. Start Protocol

```text
README.md
→ AGENTS.md
→ .agents/skills/numera-maintainer/SKILL.md
→ docs/README.md
→ docs/engineering/current-state.md
→ task area README
→ canonical contract
→ current source/tests
→ runtime when needed
```

不要从 History、旧聊天、旧 migration 注释或已被替代ADR直接推断 current behavior。

## 3. Fact Source Selection

- 尚未实现的产品目标 / 训练理由 → Obsidian「数感」；
- Current Program Contract → GitHub canonical docs + master；
- 实际实现 → code/tests/schema/runtime；
- Production实际版本 → Vercel deployment/runtime；
- current差异 → Engineering / Current State；
- 长期工程原因 → Engineering ADR；
- 过去实现 → History。

如果 current docs 与 code/runtime冲突，修docs；不要用旧Markdown要求代码退回旧实现。

## 4. Stable Training Boundaries

- Formal A 由 canonical executable registry 定义；不要在AI规则、UI或第二个registry复制ability清单；
- B 是方法/解析/诊断语言，不建立独立 Mastery；
- 新 C 使用 project metadata，不进入 A ability / A Mastery；
- Classic QuestionType/Subtype/Rating保持历史语义，不静默改写为A/C；
- structure tag、generator param、步骤记录不会自动升级为Mastery ID；
- 用户只提交最终答案时，不推断未显式提交的脑内方法；
- generator/classifier/grader规则维护在正式非UI层，不复制进页面组件。

## 5. Session / Data Guards

- 训练开始后使用冻结题组；
- active 与 completed 语义不得混用；
- completed 先本地持久化，再尝试云端幂等同步；
- Auth身份决定真实owner，UI切换不能改写owner；
- 配对对象数据按当前contract只读；
- 计时只算有效训练时间，离开/隐藏/锁屏不补计；
- 草稿纸不识别、不上传、不持久化成训练事实；
- 历史兼容字段不得因“看起来多余”随意删除。

## 6. Change Discipline

- 只修改用户要求和已确认方案需要的范围；
- 产品规则未锁定时不大规模编码；
- implementation refactor 不伪造 Product/Domain变化；
- 已执行 Supabase migration 不回改；
- secret/password/token 不提交Git；
- 新长期工程选择才写ADR；
- 普通PR/CI/排障不新增长期文档。

## 7. Verification

执行方式与质量门见 docs/engineering/README.md 和项目 Skill。

测试通过不等于真实手机视觉已经人工验收；无法执行的检查必须明确说明。

## 8. Documentation Governance

```text
Current capability / UI → Product
Current training business → Domain
Runtime / data / sync → Architecture
Development / current state → Engineering
Long-term engineering rationale → ADR
Past evidence → History
Future product target → Obsidian
```

一个current fact只设一个canonical owner。完整SOP见 docs/engineering/documentation-maintenance.md。

## 9. Production Hard Stop

vercel.json 必须保持 git.deploymentEnabled=false。

Git push / merge / CI success != Preview authorization != Production authorization。

任何 Preview / Production 都需要本次明确授权；Supabase Production写入也与代码修改/部署授权分开。
