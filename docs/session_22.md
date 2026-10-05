我将继续在 `flow-schedule` 仓库上进行 `session-20/21` 周期任务。让我先制定一个任务计划，并检查 `workspace` 的状态。
The workspace exists. Let me check git status and pull the latest changes.
The pull brought in `docs/session_21.md`. Now let me read the project docs. First, let me check the docs folder structure.
All files exist. Now let me read the main project docs (step 2).
CLAUDE.md 已读取。AGENTS.md 很大 —— 让我读取已持久化的输出。
Let me read AGENTS.md in chunks directly from the source file.
Now let me read README.md and the cycle documents (session_20-review.md, remediation-plan-session20.md, worklog.md, session_21.md).
现在让我阅读周期文档：session_20-review.md、remediation-plan-session20.md、worklog.md 以及 session_21.md。
Now the worklog (recent entries) and session_21.md.
I now have full context on session-20 state. This is the session-21 cycle. Let me check the workspace state (.env, db/, test configs) and the skills catalog.
`.env`、`db/` 位置以及 vitest/playwright 已经配置完毕（延续自上一个会话）。让我验证一下测试 `configs` 并阅读 `skills catalog`。
我已获取技能清单。现在让我审计 session-20 的补救提交 (a19516a) 并检查关键技能。首先，提交的 diff 统计数据：
`session-20` 的 commit 在源码层面很整洁。现在让我运行标准基础检查，以验证延续下来的工作空间状态。首先进行 lint、类型检查和单元测试：
Lint ✓ · tsc ✓ · 159/159 unit。现在是生产构建：
Build ✓ (19 routes, standalone assembled). Now the e2e suite:
**Base gate fully green**: lint ✓ · tsc ✓ · 159/159 unit · build ✓ (19 routes) · 89/89 e2e (2.9m)。日志中的 429 错误是文档中记录的 LLM 回退行为（不是事件）。

现在进行引用账号卫生重列（session START，verify-don't-trust 规则）。让我检查一下延续下来的 harness 脚本：
All harness scripts survived. Let me run the reference hygiene re-list:
参考账号清洁度：**9 个对等任务 + 3 条笔记，0 个遗留** —— 维持既定状态。

现在进行 session-21 审计。session_20-review §5 建议的目标：**(a)** 全页栅格 diff 作为兜底，**(b)** 规划深度达多周。让我先检查一下克隆的 Planning 页面状态：
The Planning page has week navigation (`← Previous Week` / `Next Week →`). The session-21 target (b) probes this at multi-week depth. Let me check the reference bundle for its exact form:
The reference bundle shows the same week-nav form (`← Previous Week` / `Next Week →`, `Week of MMM d, yyyy`, `rounded-2xl border-slate-200`). Let me dig into the reference's day-card logic and the date filter to compare at multi-week depth:
The reference's Planning component (`eSe`) is decompiled: tasks load once on mount, day filter is `isSameDay(new Date(start_time), day)`. Let me check how the reference's TaskDialog save interacts with the Planning task list (the refresh seam):
**Critical discovery**: the reference's Planning `Add Task` button shows NO onClick in the decompiled bundle — but the clone's opens a TaskDialog. Let me verify against the e2e spec and the live reference:
Only ONE "Add Task" in the reference bundle with no onClick. Let me check the git history of this decision and verify LIVE on the reference:
Session-2 assumed the reference's Add Task button opens the dialog — but the decompile shows no onClick. This needs live verification. Let me write the session-21 probe script for the Planning multi-week depth + Add Task behavior:
The waitForURL regex doesn't match the full URL. Let me check the surviving login pattern from previous sessions:
**重大发现**：参考站点的规划（Planning）“Add Task”按钮是一个**空操作（no-op）**——没有打开任何对话框（`dialogs: []`，bodyChildren 未改变），这证实了反编译的结果（`eSe` 组件中没有对话框状态）。而克隆版本的 Planning 挂载了一个 TaskDialog。此外，确认了跨月边界渲染（“Thu 1”）、周标签以及选中日期的持久性均符合 `date-fns` 逻辑。

让我先验证一下参考站点的 URL 没有发生变化，然后检查 `e2e` webserver 是如何启动的，以便在克隆版本上运行相同的探测：
Clone standalone is up. Now the clone-side probe (same sequence, demo login):
让我排查一下哪里出错了：
The diagnostic works. Let me check what line 87 of the probe actually is:
第 87 行位于“添加任务”点击之后——克隆版本的对话框已打开并处于阻塞状态，这证实了差异的存在。该探针本身就是证据。我来修复它，使其在捕获后关闭对话框：
**在两个应用上实时确认了功能差异**：点击“添加任务”（Add Task）后，参考应用（reference）的响应是无操作（`dialogs: []`），而克隆版（clone）则会打开完整的 `TaskDialog`。多周导航本身在字节层面是完全一致的（周标签、日期卡、月边界“Thu 1”、选中日期的持久化）。

让我检查一下参考应用的 `TaskDialog` 集成，以了解对话的触发机制（Dashboard 与 Planning 的对比）：
The reference's `Xne` TaskDialog is mounted ONLY inside `lre` (the Dashboard calendar) — never in Planning. Three evidence levels confirm S21-F1. Let me check the clone's TaskDialog mount sites and the existing planning spec:
“Add Task dialog”规范固定了对话框的 REQUEST contract (W-3/W-4) —— 这很有价值，必须予以保留。让我检查一下 `dashboard.spec` 是如何打开 `TaskDialog` 的（即参考站点的实际入口路径）：
The dashboard spec opens the dialog via calendar-cell buttons (the reference's actual entry path). Let me read the rest of planning.spec.ts and check docs for any documented ruling on this divergence:
我来检查一下 dashboard.spec 是否已经固定了 dialog create-flow 的 request body（以了解什么必须迁移）：
审计已经有了第一个主要发现。现在让我完成其余的审计项：移动端菜单重新测量（既有优先级）以及栅格差异（raster diff）全能校验（目标 a）。首先，导出参考站点的完整任务实体，以进行匹配状态比较：
已捕获完整的实体数据。现在是移动端菜单重新测量（固定优先级——用户强调的表面）：
Reference mobile menu measured ✓ (items + `animName: enter`). The script failed on the clone side because it expects the dev server on :3000. Let me run the clone measurement against the standalone on :3100:
Trigger matches the pins (338/14/36×36, right 374). Now the menu measurement:
There's a stale dev server from the previous session (10:45) eating ~1GB, and memory is tight — likely causing the page crashes. Let me free it (I'll restart when needed for screenshots):
The click works but the evaluate after opening the menu crashes. Let me check how session-20's successful script handled this:
Menu geometry matches the pins (182/54/192×164, right 374). Let me capture items + animation name to complete the mobile-menu verification:
Items match. Let me check how the e2e spec pins the animation name (my `firstElementChild` read may be wrong):
The e2e pins read `[role="menu"]`'s own animations (green in base gate). Let me complete the mobile-menu verification with the correct element:
**Mobile menu: byte-identical on both apps** (trigger 338/14/36×36 right 374, menu 182/54/192×164 right 374, items [Profile, Settings, Logout], `animation-name: enter`) — no Tailwind v4 regression. ✓

Now the raster diff (target a). Let me check Python/PIL for the pixel comparison:
PIL + numpy available. Let me check the reference's full task fields, then build the matched-state clone:
The clone's avatar initial comes from the email — I'll register a matching user. Let me check the POST /api/tasks accepted fields first:
The dashboard's drifting blobs would confound a raster diff. Let me check the blob animation mechanism to see if I can phase-align the captures:
The blobs are framer-motion loops with deterministic phases. Let me test whether they're WAAAPI-driven (visible to getAnimations) for phase-aligned captures:
Only the "pulse" indicators are WAAPI — blobs are main-thread. Let me test whether `prefers-reduced-motion` freezes the blobs on both apps (the cleanest phase-alignment):
Neither app freezes blobs under reduced-motion. **Decision**: run the raster diff with the blob layer hidden identically on both pages (the blob layer is already pinned by session-19's motion family — the raster catch-all covers the CONTENT layer), and phase-align the WAAPI pulse indicators via getAnimations. Let me build the capture script:
The manual cookie header overrode Playwright's automatic context cookies (and my `headersArray` filter was wrong for set-cookie). Let me fix — just drop the manual header:
All captures done (9/9 matched tasks). Now the pixel diff with regional breakdown:
**Planning: 0.057% diff — essentially identical.** Dashboard diffs concentrate in the top-right sidebar (r3c9–r4c11). Let me confirm those regions are exactly the LLM-content cards (DailyFocus/AISummary):
The hot region (y 337–562, x 1080–1440) is **exactly the Daily Focus card** (x 1082, y 290, 326×318) — the LLM quote content. AI Summary shows no hot cells (both render deterministic content). Let me verify the text difference:
**Raster diff verdict (target a)**: Planning 0.057% (noise-level), Dashboard 0.737% — ALL inside the Daily Focus card, which is the LLM-content difference (ref: Stephen King quote from its InvokeLLM; clone: Mark Twain fallback after a z-ai 429 — the documented deterministic-fallback behavior). **No residual sub-visual divergence anywhere else.**

Now let me check the remaining dependencies before writing the remediation plan:
所有依赖项已映射。审计已完成。现在我来编写 session-21 的审查文档：
Now the remediation plan:
计划已保存。现在是 **T-1 RED** —— 先落实 pins。在 planning.spec.ts 中替换掉不同的 spec：
Also update the spec file's header comment to reflect the new ruling:
Now the relocated W-3/W-4 request-contract spec in dashboard.spec.ts (after the calendar-cell dialog spec):
The Refresh test declaration got consumed by the edit. Let me restore it:
Now verify **T-1 RED** — run the new specs against the base build (the running standalone IS the base build):
RED 已确认。让我验证一下失败的具体原因（必须是弹窗打开）：
RED verified: dialog count 0 expected, 1 received. Now verify the relocated dashboard spec is GREEN at base:
**T-1 complete**: no-op pin RED at base, relocated W-3/W-4 pin GREEN. Now the fix — mirror the reference's `eSe` (no dialog, no handler):
The MultiEdit was atomic (all rolled back), then I removed the mount separately. Now let me apply the remaining edits:
All edits are applied (the MultiEdit applied 5 of 6; the mount removal completed after). The Planning page now mirrors `eSe`. Let me verify with lint + typecheck:
现在重新构建并运行 GREEN 检查。首先终止旧的 `standalone`：
规划系列 GREEN (16/16)。现在也处理 dashboard 系列：
Dashboard family GREEN (31/31, incl. the relocated spec). Now **T-2 MUTATION**. Let me check the TaskDialog's submit body first:
Now the T-2 mutation harness (outside the repo, canonical backup, rebuild per mutation):
**T-2 已完成 —— 所有三个变动均已被精准捕获 (RED)**，恢复校验和已验证，两个探针均恢复为绿色。现在执行 **T-3 GATE** —— 连续进行两次完整的 e2e 测试：
**90 passed** (89 → 90: planning swapped the dialog spec for the no-op spec — net 0; dashboard +1 for the relocated W-3/W-4 pin). Run 2:
**T-3 GATE 绿色 ×2** (90/90 连续)。现在 **T-4 直播** — 针对修复后的独立版本重新探测 `clone`：
**T-4 LIVE GREEN** — the clone's Add Task click now byte-matches the reference (`dialogs: []`, no navigation, identical button classes). Session-END hygiene re-list + e2e.db cleanup:
Hygiene complete. Now **T-5 SCREENSHOTS** — the 22-capture family. Let me check the capture script and start the dev server:
All 22 captures fresh. Now **T-6 DOCS**. Let me check the SKILL.md structure first:
Now let me apply the SKILL.md updates (version, FS-33, counts, changelog):
Now add FS-33 after FS-32:
Now the session-21 changelog entry in Appendix C:
The §3 command table has stale counts. Let me fix them:
SKILL.md done. Now README.md:
Still need the e2e count updates in README:
README 已完成。现在处理 CLAUDE.md：
CLAUDE.md 已完成。现在处理 AGENTS.md：
Now add the session-21 reference to AGENTS.md's Reference section:
Now the PAD — session-21 ledger rows and §8 counts:
Let me append the session-21 pins to the end of the E2E row:
Now append the execution record to the remediation plan (and fix the count error):
现在 `worklog` 条目（先 `repo` `worklog`）：
Now verify `.env.example` matches the codebase (the standing requirement):
`.env.example` matches the codebase contract. Final pre-commit verification:
变更集已完成。让我更新我的测试工具工作日志，然后检查 SSH wrapper 运行手册：
我来更新我的 harness 工作日志并提交：
已提交。现在执行 **T-7 PUSH** —— 准备 SSH 密钥并运行 wrapper：
Dry-run ✓. Now the real push:
**Push verified** — remote `main @ fb1d29c == local HEAD`. Now shred the operator key:
Session-21 complete. Final cleanup of the running servers:
**Session 21 complete — pushed to `main @ fb1d29c`** (remote verified, key shredded, tree clean, reference account at its 9-task + 3-note standing state).

**What was delivered:**
- **S21-F1 found & fixed**: the clone's Planning "Add Task" button opened a dialog the reference doesn't have — the reference's button is a **no-op** (decompile: no dialog state/no onClick in `eSe`; live trusted-click verified on both apps). A session-2 inference retired; the divergent-behavior e2e spec replaced by a no-op pin, and the dialog's W-3/W-4 request-contract pin relocated to the Dashboard calendar-cell entry (the reference's true path).
- **The raster diff catch-all closed**: matched-data pixel compare — /Planning 0.057% (noise), /Dashboard 0.737% entirely inside the Daily Focus LLM card. Zero residual divergence elsewhere.
- **Multi-week Planning navigation + mobile menu**: both re-verified byte-identical live (no Tailwind v4 regression).
- Gate: **159/159 unit · 90/90 e2e ×2**, mutations M-1–M-3 all surgically caught.

**Suggested next steps**: session-22 candidates from the review — (a) the /Profile + /Settings raster diff, (b) the login-page populated-state raster diff, or (c) any surface you'd like prioritized in the next prompt.
