# 数感 Numera：当前开发计划

> 更新时间：2026-09-22  
> 当前起点：A V1 已投入使用，C1～C4 产品设计已完成当前收口，统一 C 层 schema/session/grading 外壳已经建立。

本文件只维护**从当前状态向后的开发顺序与验收要求**，不记录已经完成的 PR、CI、部署、迁移和审计流水。

## P1：A-MUL-04 / A-MUL-05

先补齐已经锁定但尚未进入 runtime 的两个 A 能力：

- A-MUL-04：两位数×两位数；
- A-MUL-05：百分数×百分数。

需要接入 canonical A registry、生成器、日常训练、Mastery、历史、导出与测试，保持 A ability 单一事实源。

## P2：C4 / C3

优先实现交互和判题相对简单、可验证边界明确的两个 C 项目。

### C4 特殊基准数乘除转换

- 接入 C schema v3；
- 实现 L1/L2 锚点与 L3 量级迁移 generator；
- 固定20题训练块和本级综合覆盖；
- 2%相对误差判题；
- 不把 C4 锚点自动并入 C2 ScalingEvaluator。

### C3 分数比较

- 将经典分数比较 generator 重写为新 C3 target-first generator；
- 实现 structure vector、S1/S2/S3、salience classifier；
- 实现简单/困难/复杂三档20题硬配额；
- 接入 exact comparison grading；
- 保持方法不可观测，不写 method_used。

## P3：C1 乘法综合

实现唯一正式训练内容：乘法放缩。

重点：

- target-first 造题；
- A'/B'/最终答案交互；
- evaluateMultiplicationCost；
- 多解现场判定；
- direction / method / execution / total 误差记录；
- custom C grader；
- L1/L2/L3 20题结构覆盖。

## P4：C2 除法综合

实现当前已经收口的完整 C2 规格：

- raw / core；
- Direct / Split / Scaling evaluator；
- 求 r / N×r 支撑专项；
- 单方法训练；
- 方法选择专项；
- 100% number-first 综合训练；
- 全链路3%最终相对误差；
- 方法不可由最终答案反推。

## P5：第一层整体验收与 B 参考库

C1～C4 全部 runtime 化后统一检查：

- C schema / session / storage / cloud / export；
- 计时、恢复、重开、重复提交、账号切换；
- 训练难度、结构标签和成本字段是否仍保持分离；
- C 项目不进入 A Mastery；
- 经典历史保持原义。

随后再从真实 C 方法中整理稳定 B 参考语言，不建立独立 Mastery。

## P6：第二层资料分析专用计算方法

按真实资料分析题型拆解：

`题型 → 目标表达式 → 可选计算路径 → 第一层能力调用`

优先整理：

- 一般增长率；
- 基期量与增长量；
- 间隔增长率；
- 比值增长率 / 乘积增长率；
- 比重；
- 平均数与倍数；
- 盐水 / 十字交叉；
- 年均增长率；
- 化除为乘、415、假设分配等资料分析专用计算路径。

## P7：第三层资料分析实战判断与决策

最后进入真实材料题中的：

- 时间、对象、指标、范围和单位识别；
- 目标量与公式关系判断；
- 方法选择；
- 选项距离与计算精度决策；
- 停止计算时机；
- 错因与慢因复盘。

## 每个功能批次的质量门

至少要求：

1. 先把产品规则和数据语义写清楚；
2. 修改文件通过 Prettier；
3. `npm run typecheck`；
4. `npm run lint`；
5. `npm run test`；
6. `npm run build`；
7. 关键生成、会话、持久化和交互补自动化测试；
8. 必要时使用真实账号 / 真机做人工验收；
9. 只更新真正受影响的长期文档：当前状态进 `PROJECT_STATUS.md`，架构决策进 `docs/adr/`，功能契约进 `docs/features/`，稳定规则进 `docs/reference/`；
10. 一次性迁移或审计仅在确有追溯价值时归档到 `docs/history/` 或 `docs/audits/`；
11. 同步 Obsidian 正式知识库中对应职责的内容；
12. 未经明确授权不执行 Production 部署。

完整文档分层规则见 `docs/README.md`。

## 当前不做

- 不恢复旧 160 叶子体系；
- 不把 B 重新做成独立 Mastery 树；
- 不把 C 项目或方法步骤保存成 A ability / 微能力 ID；
- 不强行把经典历史改写为新 A/C 数据；
- 不在已收口产品边界之外继续横向扩充 C1～C4；
- 不为单次 PR、测试、部署或阶段验收新增长期文档；
- 不顺手扩展实时 PK、排行榜、多人、每日任务、active 跨设备同步或新的 PWA 能力。
