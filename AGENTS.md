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
- Current Program Contract → GitHub Product / Domain / Architecture + master；
- 已确认但尚未实现的工程路径 → Engineering Plan / ADR，不能当成 current capability；
- 实际实现 → code/tests/schema/runtime；
- Production实际版本 → Vercel deployment/runtime；
- current差异 → Engineering / Current State；
- 长期工程原因 → Engineering ADR；
- 过去实现 → History。

如果 current docs 与 code/runtime冲突，修docs；不要用旧Markdown要求代码退回旧实现。

## 3.1. Training Evidence Search Routing (mandatory for method / question work)

**Numera product design is NOT the whole study-source library.** Before designing C1–C4 training tasks, choosing numeric distributions, generating/curating examples, setting approximate-error boundaries, comparing Direct/Split/Scaling methods, or asserting that a number shape resembles real 资料分析 questions, read the **existing Obsidian knowledge and problem-source indexes**. Do not default to the PDFs in the current chat merely because they are easy to access.

Obsidian repository: `JIDAIN/lys-obsidian-note` (`main`). Exact **repository-relative paths** (verify current content; the following are discovery pointers, not duplicated source truth):

| Need | Read this exact Obsidian path first |
| --- | --- |
| Numera product design owner | `13_Projects/数感/00_数感项目MOC.md`, then `13_Projects/数感/20_需求与设计/` and the relevant C1–C4 design |
| 资料分析 overall study map | `13_Projects/gongkao/资料分析/00_资料分析总MOC.md` |
| 小P original teaching and method boundaries | `13_Projects/gongkao/资料分析/02_来源吸收/小P/00_小P知识库MOC.md`, then `小P_方法总索引.md` (within that directory); for 放缩/截位 especially `03_放缩运算_完整源吸收.md`, `04_快速估算_完整源吸收.md` |
| 花生十三 original teaching and mental arithmetic | `13_Projects/gongkao/资料分析/02_来源吸收/花生十三/00_花生十三知识库MOC.md`, then `花生十三_方法总索引.md` (within that directory); for 速算 especially `02_实用速算技巧_完整知识库.md`; course order/details are in `课程吸收/` |
| Cross-source comparison / evidence constraints | `13_Projects/gongkao/资料分析/03_专题研究/00_三套体系隔离与融合规则.md`, `13_Projects/gongkao/资料分析/90_资料与索引/01_项目说明与研究方法.md` |
| Verified personal / already studied questions | `13_Projects/gongkao/资料分析/04_真题研究/00_真题研究MOC.md` and `逐题分析规范.md` within that directory |
| Speed-calculation study and program bridge | `13_Projects/gongkao/资料分析/06_速算体系/00_速算体系MOC.md`, `13_Projects/gongkao/资料分析/06_速算体系/程序开发衔接/00_程序开发MOC.md` |
| Large external exam/question pools (tens of thousands of records across modules; NOT stored in Vault) | `13_Projects/gongkao/真题资源库/00_真题资源库MOC.md` → **`13_Projects/gongkao/真题资源库/01_真题来源索引.md`**. Follow its links to the external repositories *at query time*, including `ERRRC/xingcezhenti` for original-question discovery and `ERRRC/kaogongzhentizhengliu` as processed AI research clues only |

**C2 design and evidence route (current 2026-10-09):** read the authoritative Obsidian `13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_除法综合.md` and classified index `13_Projects/数感/20_需求与设计/10_第一层_纯计算能力/30_C层_综合与专项/20_C2_研究与校准/00_C2_研究导航.md` first; examine Xiao P and 花生十三 absorption notes/verified originals only when task needs source facts. **Official product behavior now includes** `Scaling/repair_numerator` via `rough_quotient×(B0−B)` without a mandatory numerical r, **and** stage-0 stop when the user's actual baseline estimate is within 3% of the raw exact quotient. This has **NOT been implemented** in existing C2 UI/runtime/route-scaling code. **Do not enlarge** V1 comprehensive quotient bands `0.2–5` or add separate Split 0.1/0.2% blocks: experimental source samples are not approval. The archived 39 proposal is not the current product owner. For implementation, consult branch `c2-training-ui-foundation`'s `docs/engineering/c2/c2-stage-aware-implementation-blueprint-v1.md`, `docs/engineering/c2-implementation-plan.md`, and `docs/engineering/current-state.md`. The official generator/evaluator/UI rewrite stays on hold; no `implemented=true`, merge or deploy can be inferred.

**C2 group-size decision (Owner 2026-10-10):** Every C2 training group must contain **10 or 20 questions**, never 6/8/12; this is C2-only and adds no frontend length selector. Existing method choice stays 10 (6 directed + 4 natural); N×r mixed stays 10 (7 ordinary + 3 continuous). Proposed allocation Direct10 / Split10 / Scaling10 / solve-r20 / N×r ordinary20, continuous10, mixed10 / comprehensive10 / internal method choice10 **is not yet approved by mode**. Only the allowed size set `{10,20}` is confirmed; L quotas, method coverage and local tolerances still await Owner review (Obsidian C2 design and ledger 45 §七). This documentation change is not runtime, merge or deployment authorization.

**Required search sequence for math-method decisions / representative problem generation:**

1. Read Numera's corresponding design owner, then the relevant 小P / 花生十三 method index and actual source-absorption notes; preserve whose method it is.
2. For claims about real test number shape, truncation, quotient ranges, choice of fastest route, or typical difficulty, consult `04_真题研究/` and/or the **external question-source index**; fetch current external data, retain problem provenance and original-to-truncated numeric pairs where possible. Do not reverse-engineer neat numerators merely to make a favored algorithm look good.
3. Apply the study vault's **未做题保护**: consult completion-status rules, do not expose answers or analyses of protected unattempted papers; de-duplicate external multi-paper question records, distinguish platform/AI answers from verified original facts, and obey licensing/usage limits.
4. Source layers stay separate: `小P / 花生十三 原始观点` ≠ `个人真题与复盘` ≠ `外部大题库/AI标注` ≠ `Numera 产品规则`. Put cross-source judgments into research/design, not back into source authors' notes.
5. If an external source is unavailable, explicitly state what could and could not be checked; **do not substitute fabricated “real-exam” data**. If the user explicitly asks to work from an attached PDF, use that PDF for that task, and use the above sources additionally only where appropriate.

This routing is a **task-specific evidence-read requirement**, not a new storage location, a change to current runtime facts, or a license to auto-write the study vault.

---

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
