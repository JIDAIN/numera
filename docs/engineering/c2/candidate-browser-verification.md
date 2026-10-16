# C2 候选浏览器验收手册（F-P01 / draft）

> **本文件是待执行的工程验收流程，不是浏览器测试通过报告。** 编制日期 2026-10-15。F-P01 **仅静态核查源文件、既有报告与工程约束，没有在 Windows 本地运行程序，没有操作真实浏览器，没有拍摄 PC、手机或平板截图**。以下手动测试一律初始记为 **NOT-VERIFIED**；不得以 CI/jsdom/构建结果代替真实像素和交互。
>
> **版本必须分开**：Numera `master current`、未合并 `draft candidate`（PR #22）、Production 是三个不同对象。本手册不授予合并、Vercel Preview/Production、生产 Supabase 写入、编辑 AGENTS/Skill/Harness/Obsidian 或修改 C-004 源码的权限。

## 一、来源与已核查事实（截至编制时间）

- **正式设计** — 核查锚点：[Obsidian C2 Owner](https://github.com/JIDAIN/lys-obsidian-note/blob/main/13_Projects/%E6%95%B0%E6%84%9F/20_%E9%9C%80%E6%B1%82%E4%B8%8E%E8%AE%BE%E8%AE%A1/10_%E7%AC%AC%E4%B8%80%E5%B1%82_%E7%BA%AF%E8%AE%A1%E8%83%BD%E5%8A%9B/30_C%E5%B1%82_%E7%BB%BC%E5%90%88%E4%B8%8E%E4%B8%93%E9%A1%B9/20_C2_%E9%99%A4%E6%B3%95%E7%BB%BC%E5%90%88.md) blob `234fd54d`；结论与边界：六入口设计与 R1/R2/R3 已签原则。L 机器阈值、固定配比、过程局部硬容差未获批准
- **master current** — 核查锚点：`f1f44fd19e5087d9fee9034bfdfabb846635d7c3`、[current-state](../current-state.md)；结论与边界：`C2 implemented=false`，正式首页无 C2；`src/app/c2-lab/page.tsx` 在本 master 基线不存在；不能将 PR 新功能写作 master/Production 已上线
- **draft candidate** — 核查锚点：[PR #22](https://github.com/JIDAIN/numera/pull/22)，`c2-c001-playable-support-20261015`，编制时 HEAD `5f9da4288d3d0b3d93c94b073a89d415203da449`；结论与边界：待验 `/c2-lab` 页面：Direct10、Split10、求r20、N×r一阶20、二阶10。Scaling/综合 UI 未在此候选开放，正式首页仍未挂接
- **既有源码与候选 runbook** — 核查锚点：PR #22 的 `src/app/c2-lab/page.tsx`、`src/components/C2PilotTraining.tsx`、`src/lib/c2/pilot-session.ts`、`docs/engineering/c2/c001-playable-support-runbook.md`；结论与边界：确认候选组件、入口、表单输入与内存会话机制；并不证明实际浏览器能工作
- **开发与自动测试** — 核查锚点：[C-004 Issue报告](https://github.com/JIDAIN/numera/issues/21#issuecomment-6189218424)、[CI #38714943442](https://github.com/JIDAIN/numera/actions/runs/38714943442)；结论与边界：报告对应 HEAD 的 80 test files / 410 tests、Prettier、typecheck、lint、build 成功；**F 未复跑**；[D-004独立报告](https://github.com/JIDAIN/numera/issues/21#issuecomment-6190861602) 已对 C-004 增量代码/数学/自动化给出范围限定 PASS，真实浏览器/三端视觉仍 NOT-VERIFIED

**不在本试点已实现范围**：Scaling 与综合完整工作台、正式数据持久化和刷新恢复、真实身份/历史/云同步/个人导出/PK、多设备恢复、正式自然题池及 L 分档。候选模拟数字不等于已校验真题。项目的正式产品规则由 Obsidian Owner 决定，工程手册不得新设数学阈值或训练配额。

本手册执行时如果 PR HEAD、master HEAD、Owner 或候选 UI 已变化：**重新读取实时版本，记录变化，更新本次测试用例**；不能把 2026-10-15 的 SHA 当作永远最新。

## 二、Windows 本地启动（仅拟定步骤）

### 1. 准备与安全边界

准备 Windows 10/11、PowerShell、Git for Windows、Node.js **22**、npm、桌面 Chrome/Edge（记录准确版本）；尽量准备 Android/iOS 手机、平板。Node 22 是本试点采用的执行基线，实际运行兼容性**尚未由 F 验证**。电脑本地使用干净测试目录；不导入生产 `.env`、密钥、用户历史或真实账户数据，不修改 Supabase/部署设置。候选页面的会话在 React 当前内存，刷新会丢失，不能依此验云端恢复。

### 2. 精确检出待验代码

**下面检出的是 PR #22 的程序，不是本 F 文档分支**。执行前到 PR #22 查最新 HEAD，如果不等于示例 SHA，替换变量，并记录新 SHA 与对应 CI。新目录不能有未提交的重要改动：

```powershell
git --version
node --version
npm --version
git clone https://github.com/JIDAIN/numera.git numera-c2-browser-check
Set-Location ./numera-c2-browser-check
git fetch origin c2-c001-playable-support-20261015
$candidateSha = "5f9da4288d3d0b3d93c94b073a89d415203da449"  # 执行时先核实最新HEAD
git switch --detach $candidateSha
git rev-parse HEAD
git log -1 --format="%H %cI %s"
git status --short
Test-Path ./src/app/c2-lab/page.tsx
```

**启动门槛**：当前 HEAD 必须等于目标 SHA，工作树干净且 `Test-Path` 为 True。任何一项不满足记 `BLOCKED`，先处理分支/网络/代码来源，不可宣称完成浏览器验收。对照 master 请另开目录检出，**不要在 C-004 分支直接改源码/提交，也不要将 docs PR 当待验代码**。

### 3. 安装、启动、访问

```powershell
node --version                # 记录实际版本；计划 Node 22
npm ci                        # 按现有 lockfile 安装，不要 npm install 漂移
npm run dev -- --hostname 127.0.0.1
```

让 Next 进程继续运行，在 Windows 浏览器访问 `http://127.0.0.1:3000/c2-lab`。若 3000 被占用，使用终端显示的**实际端口**；不要提前假设响应一定为 HTTP 200。保存完整启动终端、浏览器 Console/Network 证据。环境变量报错应记录 `BLOCKED`，不得拿生产密钥规避。若 `npm ci`、本地启动、浏览器访问失败，记录原始出错时间、命令、环境与日志；不以 GitHub CI 通过替代。

**物理手机/平板**：在可信私有 Wi-Fi 下，电脑重新运行 `npm run dev -- --hostname 0.0.0.0`，通过 `ipconfig` 获取电脑私有 IPv4，手机浏览器访问 `http://<电脑局域网IPv4>:3000/c2-lab`（以实际端口为准）；设备应与 PC 同网。若失败先查同网段、Windows 防火墙、VPN、代理与地址。不要开放公网端口、路由端口映射或擅自修改防火墙策略；本地访问可先退回到 DevTools 模拟，但必须标 **devtools-emulated ≠ physical-device**。

## 三、三尺寸视觉与真机操作协议

DevTools：Chrome/Edge F12 → Toggle device toolbar → Responsive → 填 CSS viewport；记录浏览器版本、DPR、zoom=100%、竖/横屏和真实/模拟设备。对物理设备记录**浏览器实际 viewport**，型号/系统版本；不要为了凑尺寸伪报机型。

**正式三尺寸基准**（均为 CSS viewport 的宽×高，而不是设备外壳像素；未实际执行前全部 `NOT-VERIFIED`）：

- **`V-PC` / 1440×900**：Windows Chrome/Edge 桌面浏览器，截图初始入口、题面与输入、错误提示、完整结果；覆盖 Split 三列。
- **`V-PAD` / 768×1024**：平板视口；明确标注 `devtools-emulated` 或 `physical-device`，记录 Split 三列视图、NxR 二阶输入、错误与结果；**768 并不覆盖双列断点**。
- **`V-MOBILE` / 390×844**：手机视口；覆盖 Split 单列、Direct 输入、错误与完整结果。仅 DevTools 修改视口并**不能证明真实手机软键盘弹出/遮挡/触摸可用**；无 Android/iOS 实机（或确能触发系统输入法的相应环境）时，单列视口截图可独立记录结果，但 `physical-device` 与 `physical_keyboard` 一律保留 `NOT-VERIFIED`。

**额外强制的 Split 双列专项：`V-SPLIT-2COL` / 720×1024**（CSS viewport），不能用 768 或 820 替代。实际候选 `src/components/C2PilotTraining.module.css` 的 `.splitRows` 定义：**宽度大于 760px 为三列，541～760px（含两端）为两列，不超过 540px 为单列**；这是对候选 CSS 的静态核对，**不代表浏览器观察 PASS**。媒体查询依据：[PR #22 Split CSS](https://github.com/JIDAIN/numera/blob/5f9da4288d3d0b3d93c94b073a89d415203da449/src/components/C2PilotTraining.module.css#L219-L270)。PR #22 HEAD 变化后先复读当前 CSS 再执行，若断点变化应记录为版本差异而非照搬旧断言。

**可选补充**：820×1180（平板较宽、Split 三列）、760×1024 / 761×1024（断点两侧）、540×844 / 541×844（单/双列交界）、360×800 窄屏及 1024×768 横屏。补充尺寸不得替代三基准和强制 720 双列检查。逐尺寸核对：无横向滚动和长数字截断、字和标签清晰、输入可定位、按钮不重叠、焦点可见、滚动区域正常、错误和结果没有被遮挡；手机还须查软键盘弹出/收起、负数小数输入、底部操作和手指可点击面积。长页面需滚动到底，分段或整页截图而不是只截首屏。每张图片保留**原始 PNG**，不得裁改合成后冒充未加工原图。

### Split 双列强制交互与截图顺序（720×1024）

以下为**拟执行用例 `T13`**，不是已取得的截图。每项均以真实 720×1024 CSS viewport 的浏览器截图及对应表单提交作为证据，当前不要求更改候选 CSS：

1. 打开候选 `/c2-lab` 并选择“拆分 Split”，保存页面、实际题面/冻结题号和宽高/DPR；检查起始单块输入、对应量/剩余量/最终累计比例输入框是否完整、无水平溢出。
2. 点击“增加下一块”直至至少有 **3 块**，核对 **两列排列**（应有第三块换行）、各比例块表单标签/输入焦点/数字显示是否可见；逐项输入自己真实使用的正负比例、对应量和余量，不可只看静态网格即判通过。
3. 点击“移除最后一块”并再次增加，核查视觉重排、原有已填值、滚动位置以及按钮点击区；滚动到最底部，验证“增加下一块”“移除最后一块”“提交本题”“重新训练”均可见且可操作、无覆盖。
4. 分别提交**缺字段/非法小数输入**并观察错误提示：检查错误不使题号推进、两列字段不被遮挡且能更正；随后按题面自行计算合法值，手动完成提交。
5. 完成所需冻结题组后打开结果页，逐项滚动到末尾，检查两轴反馈、实际块列表、长数换行、再次训练与专项切换按钮是否正常；保存“起始/三块两列/删除与滚动/错误/结果”各状态截图、Console/Network/Next 日志。
6. 与 768×1024（三列）及 390×844（单列）在**相同案例/同一执行记录**下对照，不等于使用完全相同的随机题目；无可验证相同 seed 时逐例记录题面和模式差异，禁止声称同一冻结题组。

样例截图文件名：`pc-1440x900-entry-desktop-browser.png`、`tablet-768x1024-split-q01-devtools-emulated.png`、`split-720x1024-three-blocks-2col-devtools-emulated.png`、`phone-390x844-error-devtools-emulated.png`、`phone-390x844-results-physical-device.png`。**只有现场实际产生后**才保存并引用文件；不能把示例文件名、模拟手机视口或静态 CSS 判定当作真实执行证据。

## 四、浏览器真实交互矩阵（初始全部 NOT-VERIFIED）

以下操作以 PR #22 编制时页面组件、测试和 Owner 为依据，**必须手动在实际浏览器点击、键入、提交、查看结果**。Vitest/jsdom 不是实机像素/触控。执行时每行记录设备、题号、真实值、预期/实际、截图路径、Console/Network 错误、结论；部分题目完成不能称全组通过。数学答案应由执行者依据题面**独立复算**，不能只照抄程序参考答案。

- **T00** — 操作与题数：打开本地 `/c2-lab`，点击各模式入口；验收点（待核实）：仅本试点五种模式：Direct10、Split10、求r20、N×r一阶20、N×r二阶10；无旧 `mixed/method_choice` 新训练；未挂 Scaling/综合
- **T01** — 操作与题数：**求r 完成20题**，每题手算百分比，提交→下一题→结果→“再练一组”；验收点（待核实）：题号1/20到20/20、逐题答案和结果；输入为最多1位小数的百分数，非小数比率
- **T02** — 操作与题数：求r在某一题留空、填两位小数或 `0x10`、`1e2`，提交后改合法输入；验收点（待核实）：空值的浏览器 required 提示与应用校验分别记录；非法不消费冻结题/不跳题；纠正后才推进
- **T03** — 操作与题数：**N×r一阶完成20题**，逐题手填实际 `C1=N×r`；验收点（待核实）：只有一阶输入，按每步5%独立判断，结果忠实保存本人输入，不预填二阶
- **T04** — 操作与题数：**N×r二阶完成10题**，同题先输C1再输 `C2=|本人C1|×r`；试一题故意偏离精确C1；验收点（待核实）：确认第二步依据用户实际一阶结果而不是系统精确C1；步骤分开诊断；非法值不推进
- **T05** — 操作与题数：**Direct完成10题**：首商位、首位乘回、真实余量、第二商位，按题面必要时输入第三商位；验收点（待核实）：前2位有效商位自动组成预览、非自动代填；是否第三位由题目决定，终局为准确截位不是3%近似，过程一致性独立
- **T06** — 操作与题数：Direct 负例：漏填/非法格式/错乘回及错余量；验收点（待核实）：缺少或非法过程不能提交且不耗题；合法但算式矛盾与终局正确应分别给出，不把伪过程当掌握
- **T07** — 操作与题数：**Split完成10题**：默认第1块，手填带符号比例、对应量、余量、最终手填累计百分比；验收点（待核实）：用户真实填写值，不自动算累计；终局仅按原始商相对误差≤3%，过程一致性独立
- **T08** — 操作与题数：Split增块/删块：一块或两块够用时结束；试 `+50` 再 `-5`；展开三块后移除最后一块；验收点（待核实）：“增加下一块”“移除最后一块”真实可用；第三块不强制；已删块不遗留字段；负块可填；首次足够后的继续拆只作速度建议
- **T09** — 操作与题数：Split用**合法但不一致**的块量、余量或累计值提交；另设最终值满足/不满足3%；验收点（待核实）：核查 `final_pass` 和 `process_consistency` 双轴；最终对但过程需核查可共存；不臆造局部硬阈值
- **T10** — 操作与题数：题中点“重新训练”，完成后点“再练一组”“切换专项”，另在答题中刷新浏览器；验收点（待核实）：内存试点刷新不应宣称恢复；新组/切换不应显示旧错误答案；不得以此推定 IndexedDB/云已接入
- **T11** — 操作与题数：在另一个只读本地基线验证现有A/C1/C3/C4入口至少一个代表链路；验收点（待核实）：回归页面/操作异常须实证；不得因 PR #22 的测试绿而断言正式首页已经有 C2
- **T12** — 操作与题数：用现有单测核查旧 `v1 mixed/method_choice` 解码；列出历史真实数据验证缺口；验收点（待核实）：旧记录兼容是未来独立历史/云/导出 E2E 门槛，不是这个页面“已通过生产回放”

**覆盖下限：** PC 五条完整组（20+20+10+10+10＝70道逐题提交）及关键负例；手机 390×844 至少入口、Direct 表单、Split 块增删/错误、刷新；平板 **768×1024** 至少入口、NxR 二阶字段、Split 三列/结果；**强制 720×1024 Split 双列 T13** 包含新增/删除至少三块、输入/错误/滚动/按钮/结果；三基准和720均须留入口、作答、错误、结果（720另留双列增删）阶段截图。若只执行单题，必须写 `PARTIAL / NOT-VERIFIED(full set)`。DevTools 手机只验尺寸内渲染；实体手机软键盘及触摸未经实机操作一律 `NOT-VERIFIED(physical_keyboard)`，不能用模拟截图替代。

## 五、错误日志、截图与证据保存

### 1. 目录及环境清单

每次执行新建一个唯一 `run_id`，不同 SHA/浏览器/复验不覆盖。证据放**Git工作树之外**，避免截图、HAR、身份/网络日志误提交；下面的命令在测试者 Windows PowerShell 中运行：

```powershell
$runId = Get-Date -Format "yyyyMMdd-HHmmss"
$evidenceDir = Join-Path $HOME "Documents\Numera-C2-Evidence\$runId"
New-Item -ItemType Directory -Force -Path (Join-Path $evidenceDir "screenshots") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $evidenceDir "logs") | Out-Null
git rev-parse HEAD | Out-File -Encoding utf8 (Join-Path $evidenceDir "candidate-head.txt")
git status --short | Out-File -Encoding utf8 (Join-Path $evidenceDir "working-tree.txt")
node --version | Out-File -Encoding utf8 (Join-Path $evidenceDir "node-version.txt")
npm --version | Out-File -Encoding utf8 (Join-Path $evidenceDir "npm-version.txt")
```

在 `environment.md` 写入：**候选 PR #22 实际 HEAD SHA**（不是 docs PR #23 HEAD）、对应代码分支/CI、master 对照 HEAD、**本次浏览器 `run_id`**、执行时间+时区、执行人、Windows/Node/npm/浏览器版本、DPR/zoom/viewport、设备类型/型号和是否 DevTools 模拟、实际 URL、网络环境、数据来源/无生产凭据、启动成功/失败及**评审可访问的证据位置**（不能访问则如实注明）。

**每个冻结题都必须可单独追溯**：在 `execution-matrix.md` 或 `question-records/<case>-qNN.md` 记录测试模式、冻结题组的第几题/总题数、UI显示的**原始题面**（含可见原始数/计算核心，核心不可见就标 `unavailable`）、本次实际填写并最终提交的**全部相关字段**（例如 Direct 首商/乘回/余量/次商/按需第三位；Split 每块比例/对应量/剩余量及累计比例；N×r 的 C1/C2；求r数值）、预期结果与**实际**结果、提交前后的题号与判分、截图/Console/Network/Next 日志对应路径及文件哈希；录错/重试也记录，不能由推荐答案反推用户输入。

**Seed 可获得性规则**：现有手动候选 `C2PilotTraining` 的 `nextSeed()` 依随机数创建题组，**页面没有显示 seed，也没有现成的手动 UI 导出机制**；仅手动浏览时填写 `seed=unavailable` 和原因 `UI does not expose seed`，问题 ID 若不可见也如实填 `question_id=unavailable`。**禁止**凭题号、题面、时间或 `Math.random` 猜 seed。将来 C-005 的正式 Playwright/Chromium 工具若**实际获取** seed/冻结题 ID、trace，才记录取值、采集方式、对应候选 SHA 和真实工件链接；不能把预期采集写成已采集。

**自动化 trace 规则**：若真实运行 Playwright 并生成 `trace.zip`，记录本地**真实相对/绝对路径**、是否脱敏、SHA256、上传后的评审可访问 URI；没有运行自动化或未生成 trace 时填 `trace_status=NOT-CAPTURED`、`trace_path=none`，**不要创建假 trace 路径**。按 run_id 保存至少以下内容：

```text
Numera-C2-Evidence/<run_id>/
  environment.md
  candidate-head.txt
  working-tree.txt
  node-version.txt
  npm-version.txt
  execution-matrix.md       # T00~T13；三基准+720双列；逐题实际运行状态
  question-records/         # 逐题真实题面、所有本人输入、oracle与最终结果
  defects.md                # 缺陷复现步骤与归属
  screenshots/              # 实际产生的原始PNG/设备/viewport
  logs/
    dev-server.txt          # Next启动/编译/服务端报错
    browser-console.txt     # 时间/级别/message/stack
    browser-network.txt     # 已脱敏URL/请求/状态/失败原因
  traces/                   # 仅在实际采集trace后保存真实文件；无则不造文件
  sha256.csv
```

DevTools Console 与 Network 应在页面打开前准备、必要时勾 Preserve log；记录请求状态、报错和对应用户动作。分别检查 Console/Network/Next 终端；**没有打开或保存日志不能声称“无错误”**。500、白屏、卡在提交、重复消耗题、手机溢出、触摸无效、数据错误均要给：`case / browser run_id / candidate HEAD / mode / frozen question index / 原始题面 / 所有实际输入 / 预期 vs 实际 / seed或不可取得原因 / 时间 / 环境 / 最短复现 / 截图+Console+Network+Next日志路径+SHA256 / trace文件路径或NOT-CAPTURED / 复现次数 / 评审可访问位置`，并标明程序 FAIL、环境 BLOCKED 或无法核验 NOT-VERIFIED。DNS/npm安装失败不算程序数学 FAIL。

证据收尾计算 SHA-256（不自我计算校验表）：

```powershell
Get-ChildItem $evidenceDir -File -Recurse |
  Where-Object { $_.Name -ne "sha256.csv" } |
  ForEach-Object {
    [pscustomobject]@{
      RelativePath = $_.FullName.Substring($evidenceDir.Length + 1)
      SHA256 = (Get-FileHash $_.FullName -Algorithm SHA256).Hash
    }
  } | Export-Csv (Join-Path $evidenceDir "sha256.csv") -NoTypeInformation -Encoding utf8
```

**数据保护**：截图保持未经修图的原图；HAR/Console 可能含 cookie、Authorization、token、个人信息，原始 HAR 只在本地或受控存储，公开报告**仅交脱敏版本**。供 D 验收的 Issue/PR 链接应指向评审可实际访问的工件，附文件名/哈希；如果只有本机证据且评审无法打开，明确该限制，不声称对方已完成截图复核。

### 2. 单项证据记录模板（environment + 每题 question-record）

以下模板中 `未执行`、`unavailable`、`NOT-CAPTURED` 是状态标记，不是文件或数字的占位证据；若字段未取得，保持明确状态并解释原因。

```text
# environment.md / 本次浏览器执行
- browser_run_id: NOT-RUN（执行时填写唯一run_id）
- tested_candidate: PR #22 / branch / exact candidate_HEAD=NOT-VERIFIED
- docs_reference: PR #23 / document_HEAD=记录读取版本
- candidate_CI: 未核查（执行时记录 URL、对应HEAD）
- master_current_HEAD (comparison only): 未核查
- execution_time_timezone / executor: NOT-RUN
- Windows / Git / Node / npm / browser version: NOT-RUN
- device_kind: desktop-browser | devtools-emulated | physical-device
- viewport_css / DPR / zoom / keyboard_type: NOT-RUN
- physical_mobile_keyboard: NOT-VERIFIED（无真机或OS输入法实际操作）
- URL / data_source / no_production_credentials: NOT-RUN
- evidence_root / reviewer_accessible_uri: unavailable（执行时填真实位置）

# question-records/T07-q01.md / 每题一份，勿凭程序标准答案补写
- browser_run_id / case_id / viewport / device_kind:
- candidate_HEAD / test_mode / frozen_question_index: 未取得
- frozen_question_count / question_id (actual|unavailable+reason):
- actual_prompt_shown (完整题面原样抄录): 未取得
- raw_numbers / core_numbers: visible actual values | unavailable+reason
- seed_status: unavailable
- actual_seed: unavailable (UI does not expose seed)
- seed_capture_method: none (manual UI)
- submitted_fields_all: 未提交
  # 求r：r百分数；NxR：真实C1与二阶时的真实C2
  # Direct：首商位/首乘回/余量/第二商位/条件第三位
  # Split：blockCount、各块带符号比例/对应量/余量、最终手填累计比例
- submissions_and_retries / question_index_before_after: 未执行
- independent_math_oracle / expected_final_and_process: 未计算
- observed_grade_and_process / UI_errors: 未执行
- screenshot_paths / SHA256: NOT-CAPTURED
- console_log_path / SHA256: NOT-CAPTURED
- network_log_path / SHA256: NOT-CAPTURED
- next_server_log_path / SHA256: NOT-CAPTURED
- trace_status: NOT-CAPTURED
- trace_actual_path / SHA256 / reviewer_accessible_uri: none
- evidence_root / reviewer_accessible_uri: unavailable
- status: NOT-VERIFIED

# execution-matrix.md 每行汇总，详情指向上述真实逐题记录
- case / mode / device / actual question_count / result:
- screenshot+Console+Network+Next+trace: 每项实际路径或NOT-CAPTURED
- SHA256 + accessible evidence URI: 实际数据或unavailable
- complete PC groups: NOT-VERIFIED (until actual run)
- 768 tablet / 720 dual-column / 390 mobile: NOT-VERIFIED
- physical keyboard and touch: NOT-VERIFIED (until actual device run)
- defects / next owner:
```

**禁止虚构 seed/trace**：这份手册本身没有附带真实浏览器执行产物，无法预填 `seed`、`question_id` 或 `trace.zip`；任何自动化得到的可重放信息必须注明采集方法、源 HEAD、真实路径和可访问证据，交 D 独立核验。

**判定**：`PASS`＝本项在声明的环境完整实测且有可核验工件；`FAIL`＝观测到预期不符，有复现证据；`BLOCKED`＝环境/依赖不能开展本项；`NOT-VERIFIED`＝未执行/只跑一部分/证据缺失或不可由评审核查。浏览器截图、单测、CI、真机各有独立状态，不能互相代填。

## 六、后续验收与交接

1. **F-P01** 只交独立 docs 分支、单文件 draft docs PR 与 Issue F-P01 报告；本 F 不测试/修复 C-004，不覆盖 Issue 顶部主线 `HARNESS_STATE_V1`，不合并、不部署。
2. **浏览器执行人（待 R/D 协调）** 在 Windows 独立目录锁定 PR #22 **最新** HEAD，按上述真实运行/5组逐题/3尺寸/负例记录，保留原图、Console/Network/终端、哈希；本地不能运行时报告环境阻断与下一处理者，不能编造图片。
3. **D/verifier** 按各自待验 HEAD、PR diff、正式 Owner、原始CI和可访问的浏览器证据独立判 `pass/fail/not-verified`；F 的 docs PR 应单独经过独立文档范围/链接/时态审核，不能由 F 代替 D 签字。
4. **FAIL 返工**：由 C 在授权代码分支修复、补测、新 HEAD/CI；重新执行浏览器/保留新 run_id，交 D 新一次独立复验。F docs PR 不改源代码、不是 PR #22 的分支。
5. **R 汇总 A/B/F/G 并行报告与 D 主线**，对 M2多方法/M3数据闭环/M4候选体验仍缺真实设备或全链路证据的，明确 `milestone_blocked_browser` 或实际阻断、唯一责任人和后续动作，不误报“完整C2完成”。
6. **Owner 独立决定** 正式 PR 合并、Vercel Preview/Production、生产 DB写入、重要删除；这些权限不会由文档编制、Git提交、CI成功或本地浏览器PASS自动生成。

**本 F-P01 交付验收边界**：只新增 `docs/engineering/c2/candidate-browser-verification.md`；由 master 建立独立分支，形成 draft/unmerged docs PR；核验 diff 无 C-004 源码/测试、runbook、AGENTS/Skill/Harness/Vault/配置更改；仅把**实际静态核查**标已核查，全部未执行的浏览器/真机项保持 `NOT-VERIFIED`；Issue 报告成功写回并回读后才称本 F 交接完成。
