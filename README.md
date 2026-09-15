# 数感 Numera

> 正式中文名：**数感**｜英文名：**Numera**｜日常称呼：**算算**  
> GitHub：`JIDAIN/numera`  
> Vercel Project：`numera`  
> Production：`https://fish-cat-speed-math.vercel.app`

`fish-cat-speed-math`、`speed-math-pwa` 仅作为历史名称或兼容标识保留，不代表当前品牌。

## 项目定位

数感用于训练资料分析所需的计算能力。长期按三层组织：

1. **第一层：纯计算能力**；
2. **第二层：资料分析专用计算方法**；
3. **第三层：资料分析实战判断与决策**。

当前实现状态与下一步分别以 `PROJECT_STATUS.md` 和 `DEVELOPMENT_PLAN.md` 为准；第一层 A / B / C 的长期架构决策见 `docs/adr/ADR-001-student-facing-training-units.md`。

## 文档入口

仓库文档不再按“每次开发任务一个 Markdown”增长，而按职责维护：

- `PROJECT_STATUS.md`：当前真实工程状态；
- `DEVELOPMENT_PLAN.md`：从当前状态向后的开发顺序；
- `docs/README.md`：完整文档架构与维护规则；
- `docs/adr/`：长期架构决策；
- `docs/features/`：当前功能的长期业务契约；
- `docs/reference/`：长期稳定的规则表、题库和兼容参考；
- `docs/history/`、`docs/audits/`：一次性历史记录和时间点审计，不作为当前状态事实源。

产品架构、能力设计、训练模型和开发时间线的正式知识库位于 `JIDAIN/lys-obsidian-note/13_Projects/数感/`。

## 工程与部署边界

当前技术栈以 `package.json` 为准。代码与测试是运行时最终事实源。

Production 必须获得明确授权后执行。仓库 `vercel.json` 默认保持：

```json
{
  "git": {
    "deploymentEnabled": false
  }
}
```

因此普通 Git push 不应自动触发 Preview 或 Production。
