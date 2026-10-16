# C-005 Chromium E2E 原始证据

这是运行 [Actions #38838387769](https://github.com/JIDAIN/numera/actions/runs/38838387769) 的真实 Linux Chromium 原始截图与 trace，绑定待验代码 HEAD `676de9ae3889a0992074c284c91930df65948edd`。请用 `manifest.json` 的每项 SHA256 独立校验实际二进制；分支专门用于保存证据，**没有合并或部署**。

- 原始截图：PC Split 结果/错误、平板 Split 结果、手机 Split 作答/结果。截图均为自动化真实浏览器像素，未做裁剪编辑；Linux Runner 已安装 CJK 中文字体，避免方框字。
- `trace.zip`：真实 Playwright 追踪文件，完整文件来自最终 CI 日志的70个 base64 分段，经Git blob存档。Playwright版本1.56.1，可用`npx playwright show-trace trace.zip`本地审查。
- 原始CI Job #116772957954 保留测试日志、错误/未发生页面异常的测试断言、trace元信息和原始内容传输。9/9 Chromium E2E、80文件410项Vitest、Prettier/typecheck/lint/build均pass。
- 三种浏览器**模拟视口**不等于真实Windows、Android或物理平板，系统键盘/物理触控依旧未核验；完整证据边界请参照C-005 Issue报告。

由于本仓库保护 `.github/workflows/**`，本C没有新增上传工件的受保护workflow，而是利用原CI日志传输真实原始二进制，并创建只含`e2e/**`证据文件的独立未合并分支。若要常态化长期存储每次CI完整的全部trace/视频，需Owner另批具体workflow artifact upload变更。
