# C-006｜Chromium 视觉修复与永久证据

这是 **Numera Issue #21 / C-006** 的**独立未合并证据分支**，不属于Production或可部署源代码。与被验代码的 GitHub commit 分开保存，避免大体积截图/trace污染 PR #22 的工程diff。

- 实际被测 [PR #22 code HEAD `40677a208fe22e540e172f8606db72e47bf0a2cb`](https://github.com/JIDAIN/numera/commit/40677a208fe22e540e172f8606db72e47bf0a2cb)
- 成功 [Actions Run #39702691346](https://github.com/JIDAIN/numera/actions/runs/39702691346)，Job #119575862497；`checkoutSha=98ae6ce705ff153ea7175a3c564688534dfffd41` 是 PR 合成checkout SHA，不是代码HEAD。
- [完整机器可查 manifest.json](manifest.json) 每项列出 Git Blob SHA1、原 CI runner SHA256、原始字节数、PNG/ZIP、模式、状态、真实 Chromium viewport 和**固定快照 Git commit**访问 URL；[关键真实日志摘录](runner-excerpt.log) 提供 14 场Chromium、四断点几何、字体/操作系统以及一次旧失败的 DNS 证据。D 应自行下载所关心的原始文件核对 SHA256；此次开发者仅对 Runner META 与 Git blob size 做完整1:1校对，不声称已独立重算51份SHA256。
- 当前快照 **46张真实PNG + 5份代表性完整 ZIP trace**，一律来源于GitHub Runner Playwright真实浏览器（不是手绘截图）。五个PC候选模式各自包含入口、作答、非法输入、结果、再练及一份完整trace；另有720双列完整10题、720三块增删/焦点/无横溢/中文错误、760/761和540/541两侧实际grid列数及截图、768平板与390手机截屏。部分入口/再练截图由于训练流程状态一致，可能是**相同像素字节**，保留各自角色名不强称独立不同内容。
- Runner: Ubuntu 24.04、Node 22.23.3、Playwright 1.56.1、Chromium 141.0.7390.37（build 1194）、Noto Serif CJK JP；测试上下文 Math.random=0，本地模拟题；CSS viewport 模拟**不是物理平板或手机软键盘/真实Windows触控**。
- 成功的最终CI：Prettier、TypeScript、ESLint(0 errors/7 existing warnings)、80 Vitest files/410 cases、14 Chromium E2E、Next Build。历史失败Push Run #39558808122为 Playwright 浏览器下载域名 DNS ENOTFOUND/ETIMEDOUT，不能拿它当同代码的数学错误；最终 Run 的 push/PR均已绿。
- 本分支本身不可直接用于正式 app 运行，不合并、无Production部署。尚未验证正式生产六入口/登录/历史/同步/导出/PK，也不能因本轮屏幕截图而宣布正式UI跨物理设备通过。

## 代表性固定快照文件
- [720×1024 三块两列实际作答](720-three-blocks-2col.png)、[中文输入错误](720-invalid-chinese.png)、[结果](720-results.png)
- [760两列](breakpoint-760-3blocks.png)、[761三列](breakpoint-761-3blocks.png)、[540单列](breakpoint-540-3blocks.png)、[541两列](breakpoint-541-3blocks.png)
- [PC Split](pc-split-result.png)、[PC Direct](pc-direct-result.png)、[求r](pc-r-result.png)、[NxR一阶](pc-nxr_first-result.png)、[NxR二阶](pc-nxr_second-result.png)
- [Split trace](pc-split-trace.zip)、[Direct trace](pc-direct-trace.zip)、[求r trace](pc-r-trace.zip)、[NxR一阶 trace](pc-nxr_first-trace.zip)、[NxR二阶 trace](pc-nxr_second-trace.zip)

**提示**：这些相对链接指向本目录、固定快照的实际文件。请在GitHub将链接固定到 `444504af54ec12fbf099e257b0dd8403b2d0b77c` 来避免未来分支漂移。完整绝对不可变链接在manifest。
