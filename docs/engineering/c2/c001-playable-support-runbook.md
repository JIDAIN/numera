# C2 C-001～C-003｜候选训练运行手册

> **候选分支文档，不是 Numera master 的 current capability。**
> 正式 C2 产品 Owner 为 Obsidian 的 `20_C2_除法综合.md`；
> 本文件不新定义题量、精度、L 档或产品审批。

## 本地启动

从 PR #22 的分支检出代码，在有 Node.js 22 的开发机执行：

```bash
npm ci
npm run dev
```

在本地浏览器打开 `http://localhost:3000/c2-lab`。

页面提供直除 Direct（10 题）及三个候选支撑专项：求 r（20 题）、N×r 一阶（20 题）、
N×r 二阶（10 题）。点击专项后一次性冻结整组题；
逐题输入、提交、判分，最后查看逐题结果并再次训练。
正式首页未链接此路由，`C2 implemented=false` 未修改。

## 可复查的产品边界

- R2：新建仅允许各 preset 的**固定题量**，不是任意 10/20。
- 旧 `v1;support=nxr;variant=mixed` 与
  `v1;mode=method_choice` 继续可解码历史记录，但不允许新建题组。
- Direct 直除：真实填写首位有效商位、首位乘回、余量、第二位商；
  结构条件需要时才要求第三位商。组合商位仅由本人填的商位推导，
  终局按**准确逐位截取**核验，绝不使用综合3%的近似停算；
  乘回和余量的算式一致性单独诊断。非十进制或缺失过程不能提交、
  不消耗冻结题。此候选数字由程序模拟生成，不是已确认的真题结构比例、
  最佳路线、L档或已批准第三位配比。
- 求 r：用户填写百分数，至多一位小数；标准答案取题面精确比值
  显示到 0.1 个百分点；名义快捷舍入冲突的特殊基准数字暂缓准入。
- N×r：每一步独立 5%；二阶参照必须使用用户实际输入的 C1。
- 固定题组使用可复现的 32 位 seed；题目冻结后不随重新渲染变化。
- 用户没有提交的过程不会被系统猜测或虚构。
- 这里只使用程序生成的练习数字，不声称是真题或老师原题。
- 当前后台生成器的 L 标签不能当成经 Owner 校准的机器 L 分档或
  已批准的组内配额；页面不提供难度选择器或 L 成就判断。

## 目前明确未实现的范围

- Split、Scaling 两方法的完整过程工作台；Direct 已有独立候选过程纵切，\n  但题池准入、真实路由成本/L校准与第三位结构分布仍需验收；
- 综合训练的正式前台及经校准的出题难度；
- 登录身份归属、训练会话持久化/刷新恢复、历史回读、
  Supabase 同步、个人导出、PK 与多设备；
- 真机三端交互、正式生产题池和发布验收。

C-001～C-003 页面将本组冻结题、答案与结果**只保留在当前页面内存**。
刷新页面会丢失本轮记录；因此它是首个可玩的候选纵切，
不能当作已打通生产数据闭环。勿录入个人信息或把它当作正式存档。

## 开发验证

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

重点测试见：

- `src/lib/c2/launch-policy.test.ts`
- `src/lib/c2/runtime.test.ts`
- `src/lib/c2/math.test.ts`
- `src/lib/c2/direct-pilot.test.ts`\n- `src/lib/c2/pilot-session.test.ts`
- `src/components/C2PilotTraining.test.tsx`

测试记录以 PR #22 **最新 HEAD 对应** GitHub Actions 为准。
React Testing Library 的逐题 DOM 测试不是浏览器真实像素/移动端验收。
正式合并、Vercel Preview/Production、生产库写入均尚未授权。
