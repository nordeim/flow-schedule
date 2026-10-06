我将从上次中断的地方继续执行这个多阶段任务。让我先检查工作区的当前状态。
The workspace has an existing flow-schedule repo and a completed S22 worklog. This session (S23) continues the work. Let me set up my task plan and start with refreshing the workspace.
`git pull` 成功 —— 远程仓库有包含 `docs/session_23.md` 的新提交。让我检查一下更新了什么内容并阅读所有关键文档。
`docs/session_23.md` 是之前 S22 对话（space-y 引擎一致性修复，已推送至 a484a9d）的对话记录。当前会话为 **S23**。现在让我仔细查看所有核心文档。
让我分批直接读取 `AGENTS.md` 以避免输出截断。
AGENTS.md read completely. Now CLAUDE.md and README.md.
Now the session-22 review and remediation plan.
现在是工作日志（最近的条目在末尾）以及关键会话文档。
Now let me review the PAD and SKILL.md key sections (the trap table, ledger, and latest FS entries).
文档审查已完成。现在让我对照代码库验证我的理解——环境引导状态、配置、S22 修复以及测试套件。
环境配置已验证。现在检查 globals.css 中的 S22 修复、技能排除以及测试套件文件。
S22 修复已验证，相关配置也已确认无误。现在让我查看一下 `skills` 目录，然后运行 `base gate`。
我已吸收了 skills 目录。现在正在运行基准门禁（既定准则：lint → typecheck → unit → build → e2e），以验证代码库是否符合其记录的状态。
基础测试中有一个 e2e 失败 —— panel-animation 时序规范。让我来排查一下这是偶发故障（不稳定的测试）还是真正的问题。
在隔离环境下通过。让我重新运行完整的 e2e 测试套件，以确定基准的 flakiness 特征。
Base gate 已通过 (94/94 第二次运行；第一次运行在 panel-animation 时序测试规范中有一个时序 flake)。让我检查一下这个 flaky 测试规范——对于基准部分（base）而言，an e2e-infra 的鲁棒性问题是一个值得记录的审计发现。
上次运行的痕迹已被清理。在冷启动负载下，测试规范的时间窗口出现了一次抖动（flake）—— 已记录为 S23 候选发现。现在让我从源代码层面审核 S22 的提交。
S22 commit audit clean. Now let me check the persisted harness scripts and the login page source for the S23 audit targets.
Now I'll begin the S23 audit. First, start the clone's production standalone on :3100, then run the reference-app hygiene re-list + mobile menu re-measure.
模块解析问题 —— 脚本的位置无法访问仓库的 `node_modules`。我来修改 `import` 以使用绝对路径。
流量捕获未成功触发（这是 S22 中已知的一个问题），且移动端登录超时。让我检查一下会话 22 中 `entity-dump` 脚本中可用的模式。
快速操作按钮位于仪表板上，而非规划中。正在修正顺序。
Entity hygiene re-list confirmed: 9 parity tasks + 3 notes, 0 leftovers ✓. The mobile trigger needs DOM queries (the reference's trigger has no aria-label — the S22 lesson). Fixing.
移动端菜单已重新验证，字节级完全一致（trigger 338/14/36×36，menu 182/54/192×164，items，动画）—— 无 Tailwind v4 回归。现在开始 S23 审计目标。我先检查一下克隆程序的注册错误状态代码。
The clone has a client-side mismatch check. Now let me write the S23 discovery probe: sign-up error-state geometry + mobile login/dialog geometry, on BOTH apps.
注册错误状态：**在两个应用上字节完全一致**（卡片 y180 h540，警告 y566 h54，文本+类名完全相同，间距 [10,10,10]）——会话 22 目标 (a) 已验证为非发现项（但未固定）。参考上的移动端对话框探测失败了——让我调试一下移动端仪表板的网格结构。
日历比 390px 的视口更宽（1040px 带有水平滚动）—— 我探测到的点击落在了屏幕外。让我查看一下捕获的屏幕截图，以便规划一个可视的点击坐标。
关键发现：在 390px 下，参考日历是**转置**的——将天作为行，将小时作为列（水平滚动）。让我检查一下克隆的移动端日历是否与此匹配。
克隆的日历与参考的结构相匹配（天数行 × 小时列，1040px 最小宽度，水平滚动）—— “转置”外观是实际结构，在两个应用上是完全一致的。现在让我修复移动端对话框探针，以点击一个可见的单元格。
移动端几何结构在两个应用程序上也是**字节一致的**——第 22 天目标 (a) 和 (b) 均已验证为非发现项（尚未固定）。现在让我复现面板动画不稳定问题（它与冷启动服务器相关）以捕获实际的失败模式。
独立运行已通过——该不稳定问题（flake）与全套测试的累积负载有关。让我再进行一次冷完整运行，以尝试捕获故障详情。
发现了一个遗留的失败产物——之前的一次运行在“Focus Timer panel counts down”中*也*出现了不稳定（flake）。让我检查一下那个 trace。
运行记录会被每次新运行清理——上一次运行的残留目录证实了在不同时序规范中出现了一次失败。目前已有两个不同的时序规范出现间歇性失败（flake）（约 6 次运行中出现 2 次）。让我来查看一下 Focus Timer 的倒计时规范。
Focus Timer 规范存在几个依赖时序的等待。让我压力测试 dashboard spec 以重现该不稳定现象（flake）并捕获实际的失败详情。
Dashboard 规范在隔离状态下通过了 4 次压力测试。Focus-Timer 不稳定测试（flake）与完整测试套件的累积负载相关。现在让我针对当前的 HEAD 重新验证 space-y 完整性扫描（确保没有未锁定的引擎陷阱变体）。
完整排查清理完毕。让我快速验证一下 `scandihaven` 的引用模式（用户要求的 tech-stack 参考），然后编写审查和修复计划文档。
Scandihaven 模式已确认（相同的 Next.js 16 + Tailwind v4 CSS-first + Vitest/Playwright 规范）。现在让我检查一下 raster harness，将 mobile（390px）下的审计前沿作为 raster catch-all 的一部分。
现在，我将把 raster catch-all 扩展至移动端视口（390×844）—— 本次的审计边界建议。正在编写移动端 raster 捕获。
`:3100` 上的 standalone 停止了（在我进行压力测试后）。正在重启它。
旧的 diff 脚本对比的是桌面表面。我来写一下移动端版本。
桌面级结果适用于顶部/规划/登录。但滚动捕获结果（25.3%）看起来像是 `harness` 的 `scroll-position` 不匹配。让我检查一下页面高度，并检查这两张有噪声的图像。
98px 高度差异（ref 2242 vs clone 2144）。让我将此差异归因于移动端堆栈（mobile stack）中的特定卡片。
**发现一个真实的差异候选项**：SkillsMap 在移动端的高度为 330（参考）对比 280（克隆）—— 50px，并非处于 LLM 区域。桌面端栅格可能遗漏了这一点（SkillsMap 在 1440×900 下位于首屏下方）。让我也在桌面端测量一下 SkillsMap 的内部结构。
我的清理步骤破坏了匹配状态——参考数据的今日（10月6日）现在包含“Log Activity Parity C”（一天已翻转），而克隆的临时用户被清空了。220行以下的测量是无效的。让我重新植入数据，并在匹配数据的情况下重新测量。
匹配数据：移动端堆栈完全一致，除了两个 LLM 文本卡片（已记录的类， 24px+24px）。早先的 98px 包含了一个 50px 的数据残留。现在让我完成移动端栅格（raster）审计：在元素锚定处重新捕获滚动（以 SkillsMap 为锚点）。
2.869% 全部位于底部区域 (y647-843) ——即 `DailyFocus` LLM 引用文本（已记录区域）。其上方的所有内容在字节层面完全一致。现在让我来视觉检查一下另外两张有噪点的图像 (`dashboard-top 0.481%`, `login-error 0.427%`)。
VLM 已达到限流上限。让我改为进行精确的像素级归因。
Diff run 看起来像字形（glyph）形状，但在 y199 处，有一个像素显示为蓝色，而另一个为白色。让我测量一下两个应用上日历头部区域的 DOM 几何结构——这样更精确。
头部几何结构字节完全一致。让我检查一下 “Full Planning” 链接（一个 `<a>`，被我的按钮查询遗漏了）—— 那个颜色异常的像素就在那里。
**REAL FINDING (S23-F2)**: the Full Planning link's border computes as `rgba(186, 230, 253, 0.9)` on the reference (v3 hex #bae6fd) but `lab(88.7362 -10.9393 -16.133 / 0.9)` on the clone — **sky-200 is unpinned and rendering from v4's oklch default**. The session-20 completeness invariant missed it. Let me verify the pin set and find the invariant's blind spot.
`sky-200` 已固定 —— 因此 `lab(...)` 序列化源自 v4 的 `color-mix(in oklab, ...)` Alpha 修饰符编译，而非未固定的 token。让我验证一下渲染出的像素是否实际匹配（完整覆盖的边框样本）。
完全覆盖的边框像素完全一致 (193,232,253) —— 颜色渲染结果相同，只有序列化方式不同。3% 的按钮像素差异是抗锯齿边缘导致的。让我测试一下偏移容差假设，并比较可见的文本内容。
没有位置偏移——差异是局部的，且呈字形形状。让我提取这两个导航按钮条带的放大裁剪区域，以便直接进行检查。
VLM 仍然受到速率限制。改用像素取证——逐个字形进行直接比较。
字形相同，边缘抗锯齿不同 —— 这是典型的分数文本居中问题。克隆源的按钮带有 `{" "}` 空格包装器。让我比较一下原始 `textContent` 和文本框几何尺寸。
Text rects identical to 2 decimals — yet AA differs. Let me check the computed font-family and compare a large clean text region (the h2).
字体完全一致，DPR 相同。让我测试一下零假设——将参考内容与自身进行两次 diff（非确定性合成检查）。
Reference 与自身对比：0.000% —— 完全确定性。因此，克隆版本（clone）的差异确实存在。让我检查一下边缘像素的 RGB 通道——可能是 LCD 子像素抗锯齿（subpixel-AA）与灰度抗锯齿（grayscale-AA）合成的差异。
**Root cause found**: the clone renders text with **LCD subpixel AA** (channel spread maxRB=15) while the reference renders **grayscale AA** (maxRB=0) — a compositing-layer difference. Glyph shapes/metrics are identical. Let me check if this signature exists in the desktop captures too.
让我核对一下桌面端 y100-300 差异像素上的 AA 特征（按通道）。
AA 类在两个视口上都存在。让我找一下促进图层转换的属性差异 —— 探测该按钮祖先链的结构。
图层链相同。让我测量一下实际计算出的按钮文本颜色，以排除颜色差异。
**已找到单一根本原因**：按钮文本颜色不同 —— reference `rgb(10,10,10)` 对比 clone `rgb(2,8,23)`（之前提到的“LCD fringing”实际上是文本颜色色调混合到了 AA 边缘）。h2 的 slate-700 是相同的。让我检查一下每个应用的 `--foreground` 是从哪里获取的。
**已找到真正的根本原因 (S23-F2)**：克隆的 `--foreground: hsl(222.2 84% 4.9%)` = rgb(2,8,23)（shadcn slate 主题），而参考（基准）渲染的是 rgb(10,10,10) = **neutral-950**——这正是该克隆的 AA-edge 光栅残差的原因。让我全面梳理参考的语义前景色系列。
范围已确认 —— 语义 `--foreground` 在所有地方都出现了偏差（body、dialog labels/inputs/triggers）。现在让我映射其余的语义 token 系列（card/popover/muted foregrounds）在 reference 上与 clone 的对比。
卡片标题已确认：参考还使用了 `--card-foreground` 的 `neutral-950`。正在修复菜单探测（隐藏的移动端触发器）。
`--foreground` 和 `--card-foreground` 均存在偏差。让我探测其余的 token 表面（菜单的“我的账号”标签 —— 可能是 `muted-foreground`，以及一个 Planning 芯片）。
核心发现已确立。让我检查一下 session-20 的 badge pins 断言了什么（看看 `secondary-foreground` 是否已被覆盖）。
Session-20 的 badge pins 涵盖了明确的 utility 颜色 —— semantic-foreground 系列从未被 diff。让我从 reference 自身的样式表中提取真实值（即 session-20 方法）。
提取的 token 显示为 `zinc` 系列（240 色相），但测量值为 `rgb(10,10,10)` —— 接近但不完全等于 `zinc-950` `rgb(9,9,11)`。让我获取每个 token 块周围的选择器上下文，并找到实际生效的 `body` 颜色规则。
参考的 `:root` 是 shadcn **zinc** 主题（`--foreground: 240 10% 3.9%` = rgb(9,9,11)），但在仪表盘上测得的 rgb(10,10,10) 与登录页面上的 rgb(9,9,11) 不同。让我仔细重新测量一下这两种状态。
仪表盘上的参考主体颜色为 `rgb(10,10,10)`，但在登录页面上为 `rgb(9,9,11)` —— 在仪表盘上一定加载了额外的样式表或规则。让我列举一下所有样式表，并查找在 `dashboard` 状态下设置 `body` 颜色的规则。
只有一条 body 规则存在 —— 然而仪表盘渲染出的结果却不同。一定是有东西在运行时重写了该变量。正在检查仪表盘上 `:root` 的内联样式和实时 token。
**已找到解决机制**：平台在登录页面提供 `zinc-themed` CSS（`static/index-CFog93pb.css`），但在仪表盘上提供 `app` 的样式表（`assets/index-CcElM1Qx.css`），其中定义了 `:root { --foreground: 0 0% 3.9% }`。让我从 `app` 的样式表中提取完整的语义 `token` 块。
**已获取完整事实数据（Ground Truth）**：参考应用使用了 shadcn 的 **DEFAULT neutral** 主题（`--foreground: 0 0% 3.9%` 等）。现在让我对比一下克隆程序的完整 token 块。
**重大发现**：整个语义主题不一致——克隆版本发布的是 shadcn **slate** 主题，而参考应用的样式表则是 shadcn **默认（中性）** 主题，包括 `--radius: .5rem` 与克隆版本的 `0.625rem`。让我验证一下渲染中圆角和边框的差异。
确认半径发散（8px vs 10px）以及前景色。在修复之前，让我检查一下参考的对话框输入是使用了显式的 `border-slate-200` 还是 `--input` token，并查看 `theme-palette` 规范当前的断言。
对话输入使用了单纯的 `border` —— 然而两者在 `slate-200` 上却渲染出相同的 `border`（参考是通过一条通用规则实现的；而克隆版本中对应的 `token` 本身就是 `slate-200`）。让我验证一下通用规则并测量占位符颜色（`--muted-foreground` 区域）。
参考文档的预检（preflight）默认边框颜色是 `gray-200` (`#e5e7eb`)，而克隆版本的通用规则使用的是 `--border` (`slate-200`) —— 单位差异在 1-3 之间（低于阈值）。让我检查一下克隆版本的基础层规则以及占位符 (`muted-foreground`) 的表面区域。
让我来测量两个不同的表面：`Planning Card` 的裸边框，以及两者上的对话框标题占位符颜色。
**完整情况已获取**。对话占位符也出现了偏差（`rgb(115,115,115)` 中性对比 `rgb(100,116,139)` 石灰色）。让我检查现有的 `theme-palette` spec 结构，以规划 pin 的添加。
The audit is complete — all findings established. Now let me write the session-23 review document.
现在让我探查一下实时克隆中 `panel-body` 的 WAAPI 时序——这是用于重写 `flake` 规范的确定性 pin 表面。
已测量确定性时序：300ms 延迟，200ms 延迟，circOut 贝塞尔曲线，两者均填充。现在让我验证没有现有的 `pin` 会因 `token` 的变更而损坏。
没有需要破坏的现有语义颜色 pin。让我验证一下 /login 是否不会在已认证时发生重定向（这是 storageState 上下文中移动端登录测试所必需的）。
`/login` 在认证状态下不会重定向——很干净。计划：移动端登录 `pin` 将放入 `auth.spec`（通过 `describe` 作用域的 `test.use` 实现登出状态 + 390 视口），移动端对话框 `pin` 将放入 `dashboard.spec`。我来看看 `auth.spec` 中的 `geometry` 系列，以规划插入点。
现在正在编写包含完整 TDD 执行计划的整改方案文档。
Plan saved. Now executing **T-1 RED** — the pins first. Starting with the theme-palette semantic token family.
Now the source pins in tailwind-theme-pins.test.ts.
让我清理一下该追加内容中一行复杂的代码。
Now the auth.spec additions: the sign-up error-state pin + the mobile-band login geometry family.
现在进行 `dashboard.spec` 移动端对话框的添加。让我先找到 S22 对话框的 geometry spec。
Now the panel-animation spec #2 rewrite (the S23-F1 flake fix).
Typecheck 通过，4 个 specs 完整。现在验证 T-1 RED —— 针对 base build（仍在运行）运行新的 pin families。
RED 确认已完全按预期用于所有 4 个语义引脚。现在进行源引脚和 GREEN-at-base 锁定的检查。
所有锁定项均通过了 base 测试，重写的 spec 也已通过。现在开始处理移动端 dialog spec。
T-1 验证完毕：4+3 个 RED (S23-F2)，所有锁定项为 GREEN (S23-P1)。现在进行 **修复** ——重写 `:root` token 块。
单元测试通过。现在重新构建（先 pkill —— S22 的教训）并验证 e2e 测试是否通过（GREEN）。
Theme-palette 完全变绿。现在进行 **T-2 MUTATION** —— 构建敏感性测试套件。我来检查一下 S22 变异测试套件的结构。
发现了两个问题：M-4 的正则表达式未匹配（`delay: 0.2 }` 没有尾随逗号 —— 无操作突变），且失败标题解析未匹配行报告器格式。让我检查一下 QuickActions 的运动配置。
M-4 的正则表达式需要 `circOut` 上下文（第 56 行是 panel body 的配置；第 192 行是按钮视图）。让我再检查一下 pin family 失败时的原始输出格式，以修复解析。
格式很清晰 —— 失败情况出现在 `N failed` 摘要块中。正在恢复文件并修复测试框架的解析和 M-4 正则表达式。
**T-2 完成 —— 所有 5 个变异均精准变红（RED），恢复校验和已验证。** 现在执行 **T-3 GATE** —— 连续两次完整门控。
**T-3 GATE GREEN ×2: 169/169 unit · 103/103 e2e consecutive.** Now **T-4 LIVE** — re-probe the remediated clone against the reference.
在所有六个表面上实现了字节匹配。现在是移动端栅格重跑 —— 残余部分应该会崩塌。
规划 (Planning) 和登录错误 (login-error) 现在 **0.000% 完美匹配**；仪表盘顶部 (dashboard-top) 减半至 0.241%（`day-label` 列中的单元格）。我来检查一下那个残留。
剩余的像素呈深色，在参考对象（`day-label` 文本）上显示，而在克隆对象上显示为白色——标签可能发生了偏移。让我对比一下两个 `day-label` 区域。
日期标签文本在克隆版本上呈现向下偏移 1-2px 的渲染。让我测量一下线上两个应用中的标签 DOM geometry。
**新发现的引擎差异**：日期行的 `text-[10px]` 行高 — 参考值 16px（v3 继承自 `text-xs` 父元素），克隆值 13.33px（v4 会计算任意尺寸的行高）。让我检查一下构建后的 CSS 和使用位置。
该工具类不包含 `line-height` —— 继承的值必然有所不同。让我检查一下两个应用上父级 `label` div 的计算 `line-height`。
类名相同，父级 line-heights 也相同，但克隆版本上的日期 line-height 为 13.33px。让我去构建出的 CSS 中找一下导致该问题的规则。
**根本原因已找到**：v4 的 `text-xs` 发送了一个**无单位的行高**（`calc(1/.75)` = 1.3333 比率），该行高被较小字体的子元素重新缩放（10px → 13.33px），而 v3 发送的是**长度**（`1rem`）并保持固定。让我验证一下参考样式表中的 v3 格式，并列举出所使用的 `text-*` 工具类。
**S23-F3 已确认**：参考样式的 v3 LENGTH 行高对比克隆样式的 v4 unitless 比例。按照 TDD —— 先固定，在当前树上设为 RED。正在添加 e2e pin。
现在 `@theme` 中的源 pin 以及 S23-F3 修复。首先是 pin（在当前树上为 RED 状态）：
收到，确认。现在执行 S23-F3 修复 —— 即 @theme 文本比例 line-height 固定值。
S23-F3 已修复，状态为 GREEN。现在进行移动端 raster 的最终重新运行——标签残差应该会塌陷。
**移动端栅格已关闭：在所有三个有效表面上均为 0.000%。** 现在将 M-6（S23-F3 突变）添加到测试套件并运行它。
所有 6 个 mutations 均呈红色，呈精准定位。现在进行桌面端 raster 重新运行，以关闭桌面端。
桌面端捕获失败（import 解析问题——S22 脚本的相关问题）。正在使用绝对导入路径进行修复。
桌面端 Planning/Profile/Settings/login-error 的比例均降至 **0.000%**，但 dashboard 数值上升了（3.947%）。让我检查一下它现在的分布位置。
桌面端也闭合了：y388 以上像素完全一致；所有剩余区域都在 LLM-content 区域内（当前实时文本长度 —— 已记录的类）。Planning/Profile/Settings/login-error 桌面端：**0.000%**。现在进行最后一次 T-3 门控检查 ×2（包含 S23-F3）。
103 个测试已通过但 exit code 为 1 —— 让我调查一下。
上一次运行：104/104 全部通过。但之前的运行显示为 103 并带有 exit 1（失败的行被截断了）。让我再运行一次并捕获任何失败的情况。
重写后的规范仍然不稳定 —— 这次痕迹保留了下来。趁着还没被清除，我立刻读取一下失败详情。
失败出现在 `(b)` 部分（挂载帧读取的 y=18.37 —— 一个约 200ms 的主线程卡顿）。确定性的 WAAPI 定时 pin 测试通过了。修复方法：用确定性的关键帧元数据替换掉不稳定的实时读取。让我来探查一下 `getKeyframes`。
Keyframes 只包含 opacity (transform 是主线程驱动的 —— 即竞态条件)。最终重写：固定确定性的 Keyframes 元数据，删除实时的 transient read。
重写后的 spec 已变为全确定性。现在开始最后一道关卡（gate）×2，并额外进行一次置信度测试（confidence run）。
**最终关卡：104/104 e2e × 3 连续** —— flake 已被消除。现在进行最终的清理重新检查，然后是 T-5 截图。
END 环境清理：9 个任务 + 3 条笔记 ✓。现在进行 T-5 —— 在开发服务器上重新捕获 22 个截图系列。
已捕获全部 22 张截图。对新渲染的界面进行快速视觉抽检。
VLM 仍处于限流状态 —— 客观的 pin 证据（104/104 ×3 + 0.000% rasters）比视觉检查更强有力。现在进行 **T-6 文档** —— 首先根据 S23-F3 的发现及其闭合数值更新审查文档。
Now the remediation plan's execution record.
现在进行 SKILL.md 更新 —— v2.12.0 附带 FS-35。
现在是 FS-35 章节以及描述中的 session 计数。
SKILL 已完成。接下来处理 README、CLAUDE 和 AGENTS 的更新。
现在进行 PAD 更更新 —— §5.2、§5.4、§8、§12。
现在处理 worklog 条目（仓库 + 工作区）。
现在进行 T-7 —— 最终变更集检查、提交以及 SSH wrapper 推送。让我查阅一下推送操作手册。
已理解 runbook。让我检查 S22 会话中的 shim 设置，然后进行 commit。
Shim 和 wrapper 已就绪。正在 main 上提交变更集。
已提交 `1e070ef`。现在开始进行 SSH wrapper 推送 —— 正在根据 runbook 写入 operator key（在仓库外部，0600）。
**已推送并验证：远程 `main @ 1e070ef` == 本地 HEAD。** 密钥已销毁。最终验证：
工作区状态干净，远程仓库已同步。我的本地密钥副本仍然需要销毁（wrapper 只销毁其自身的临时副本）：
## Session 23 Complete — pushed to `main @ 1e070ef`

**What I found & fixed (TDD, all mutations surgical):**

1. **S23-F2 — the real "Tailwind v4 bug" this session**: the clone shipped the shadcn **slate** semantic theme; the reference's own app stylesheet ships the **neutral** variant — `--foreground`, `--muted-foreground`, `--radius` and 11 more tokens drifted (dialog placeholder was 24 color-units off; every corner radius 2px too wide). The whole `:root` family is now pinned to the reference's extracted values.
2. **S23-F3 (found mid-verification)**: v4's unitless line-height ratios re-scale on inheritance — pinned v3's length forms.
3. **S23-F1**: the flaky timing spec now pins WAAPI metadata (deterministic) instead of live transient reads.

**Result**: mobile + desktop rasters closed at **0.000%** on every non-LLM surface; the mobile menu re-verified byte-identical; **170/170 unit · 104/104 e2e ×3**; 22 screenshots re-captured; docs updated (FS-35); reference account clean.

**Suggested next steps**: (a) review `docs/session_23-review.md` §5 for the session-24 candidates (mobile Profile/Settings pins, focus-ring probes), or (b) run `bun run dev` and eyeball the calendar labels/dialog — they should now match the reference pixel-for-pixel.
