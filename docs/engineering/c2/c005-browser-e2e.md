# C-005｜C2候选真实浏览器 E2E（隔离PR，未合并）

> **工程候选测试说明，不是master/Production当前功能。** 仅验证PR #22的本地`/c2-lab`页面：Direct10、Split10、求r20、N×r一阶20和二阶10。不会打开正式C2首页入口，也不接Supabase、账户、历史或生产数据。正式数学及训练合同始终由Obsidian数感C2 Owner决定。

## 目的与权威版本

Issue #21 C-005来自R-M1、B-P01、F-P01。此前真实浏览器验证长期阻断并非没有Node或Chromium，而是C/D运行容器没有完整Numera工作树且GitHub DNS解析失败。本轮通过**既有**GitHub Actions`npm run test`节点安装锁定Playwright、下载Chromium、运行本地Next服务与真实浏览器，不需编辑受保护`.github/workflows/**`或申请Preview部署。

- 证据锚点：GitHub PR #22最新HEAD、Actions对应`head_sha`、E2E运行中的`GITHUB_EVENT_PATH.pull_request.head.sha`；`GITHUB_SHA`可能是PR合成merge SHA，**不可混写成代码HEAD**。
- `@playwright/test`、Playwright和Chromium运行版本均由`package-lock.json`与测试引擎明确记录（锁定Playwright 1.56.1）。
- 本地使用Node22，`git checkout <待验HEAD>`、`npm ci`、`npm run test:e2e`。此命令自动运行`pretest:e2e`以安装Playwright Chromium；Linux CI runner若无中文字体，仅在临时Runner用apt安装`fonts-noto-cjk`，以免汉字在真实截图中全变方框；不会将字体二进制加入仓库。
- 也可单跑`npm run test:unit`（80文件410条）或`npm run test`（既有Vitest + 新Playwright）。已有受保护CI的Prettier/typecheck/lint/npm run test/Next build不变；不修改任何GitHub workflow。
- 配置`playwright.config.ts`自动在127.0.0.1:3100启动Next dev，禁用复用服务（CI），固定Chromium项目、串行单worker，避免占用生产或任意外部URL；真实浏览器测试不是对线上Production验证。

## 实际自动场景

`e2e/c2-pilot.spec.ts`使用测试页面`Math.random=0`固定题组seed（**仅浏览器测试上下文**），独立由题面数学算式计算答案，绝不从应用冻结题/测试答案/grade反推用户步骤。

- PC 1440×900：五种模式各自完整10/10/20/20/10 = 70道逐题输入、提交、10/20评分页、真实结果列表、再练与重开；覆盖负例（hex/exponent/不批准0.2%块等），非法提交不推进；Split先加/删第三块；输入过程中不自动填用户过程。
- 平板768×1024：Split10、N×r二阶10完整输入；负例、错误与结果页面。
- 手机390×844：Split10、Direct10完整输入；Direct需要时的第三位与拆分的早停。
- 三视口保留入口、真实填写、错误和全部结果的fullPage原始PNG，检查横向滚动溢出；监测`pageerror`与浏览器Console error。Playwright viewport/浏览器触摸模拟 **不等于物理手机/平板**，系统软键盘实际弹出也不在此测试证据范围。
- 每次`trace=on`，失败自动带视频、screenshot，reporter另有HTML报告。默认原始目录`test-results/c005-evidence`、`test-results/c005-traces`、`test-results/c005-html`（CI的临时工作目录，不自动保证永久归档）。

## CI取证与独立复验

`e2e/evidence-reporter.ts`按sha256记录原始PNG、trace大小与摘要，另外在GitHub Runner标准job日志上用`C005_BROWSER_EXECUTION`、`C005_EVIDENCE_META`、`C005_EVIDENCE_B64`打印小于1.5MB的原始文件字节（base64），供具有权限的下一角色恢复到**独立证据分支**并查看真实像素；不从模拟CSS/JS代码合成截图。读取元数据`name/bytes/sha256`、从base64恢复原始文件并复算SHA256，确保和`head_sha`对齐。过大的trace只给`C005_EVIDENCE_TOO_LARGE`提示，此时必须通过本机输出或额外经Owner批准的workflow工件上传方案取得原文件，不能冒称已永久保存。

候选任务仅允许`src/**`、`e2e/**`、`tests/e2e/**`、`playwright.config.ts`、`package.json`、`package-lock.json`、`docs/engineering/c2/**`范围改动。保留C2 `implemented=false`，不创建新Scaling/综合、old mixed/method_choice模式，不合并PR #22/#16/#17或PR #23，不编辑AGENTS/Skill/Harness/CI配置，不写生产数据、不部署。

## 环境与风险

- **原C/D容器（已实测）**：Node22与Chromium可用，但无`/mnt/data/numera/package.json`，`git ls-remote https://github.com/JIDAIN/numera.git HEAD`失败`Could not resolve host: github.com`。它本身不能拿来启动Next；CI runner checkout成功是实际可运行替代路径。
- **CI浏览器与真机的区别**：Playwright Chromium在GitHub-hosted Linux Runner是真实浏览器和真实像素，三个CSS视口仍是模拟设备尺寸；真实Windows Chrome/Edge、真实Android/平板键盘/触摸及不同字体引擎仍需F-P01手册中的物理端验收。
- **证据可访问性**：若仅保留在CI工作目录，不是永久交付。C Agent需从本次原始job log恢复对应真实二进制并提交到授权的独立证据分支、指明被测代码HEAD、PNG与trace SHA256；D Agent从GitHub独立打开并核对后才能给像素`PASS`。
- **调试不代表生产资格**：题组仅为程序模拟，pilot仍在React内存，刷新不能恢复；没有账号、History、云同步、导出、PK或6入口正式实现。不能把自动E2E绿色扩大为正式考公真题适配与产品上线。
