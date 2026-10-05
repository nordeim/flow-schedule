The tree is restored (git clean, only the 3 new session-17 files untracked). The interrupted work: **M-2's original design survived** (injected content clipped by AppShell root's `overflow-hidden`), so I need a *real* M-2 mutation. The AppShell root is the actual top-level width-discipline seam. Let me check the playwright config and then redesign the harness.
`webServer` boots the production standalone build — confirmed: every mutation needs a rebuild (the harness already does this). Now let me update the mutation harness with the **redesigned M-2** — the original DashboardView injection *survived* because the AppShell root's `overflow-hidden` clips it; the honest mutation targets the root's own width discipline:
Now run the full mutation harness (M-1 re-evidence + redesigned M-2 + restore verification). This needs 3 production rebuilds — running with a long timeout and a log:
Both mutations went RED (9 tests: **5 passed + 4 failed** in each mutation run — the `tail -1` in my grep dropped the separate `4 failed` summary line). Let me confirm with the failure artifacts and fix the harness grep for future runs:
`.last-run.json` confirms the final restore is green. The playwright list reporter prints `4 failed` and `5 passed` as separate lines — my `tail -1` kept only the passed line (9 tests = 8 viewport pins + 1 auth-setup). For a clean, unambiguous mutation log, let me patch the harness capture and re-run:
**T-2 complete — clean mutation evidence:**
- Baseline: 9 passed (exit 0)
- **M-1** (`md:hidden`→`sm:hidden`): **4 failed** (exit 1) — the 768/1024 band-state pins + their overflow pins caught the breakpoint drop
- **M-2 redesigned** (AppShell root `w-[2000px]`): **4 failed** (exit 1) — all 4 overflow pins caught the width regression (band-state pins unaffected — surgical)
- Post-restore: 9 passed, git diff empty — tree clean

Now **T-3 (GATE)** — the full consecutive gate on the remediated tree:
Lint ✓ · typecheck ✓ · **143/143 unit** ✓ (the `[ai]` fallback lines are the pinned mocked-SDK fallback contract). Now build + e2e run 1:
Build ✓ (19 routes) · **E2E run 1: 75 passed** (67 → 75 with the 8 new pins). Consecutive run 2:
**T-3 GATE complete**: lint ✓ · tsc ✓ · 143/143 unit · build ✓ (19 routes) · **75/75 e2e ×2 consecutive**.

Now T-4/T-5 — the live dev-server verification and screenshots. Let me check the dev server state and the capture script:
Dev server is down. Let me check how prior sessions started it and the rest of the capture script:
This is the session-17 clone capture harness. Now let me start the dev server and run T-4:
T-4 live re-verified: all bands overflow 0px, md-edge contract live (desktop nav visible / mobile trigger hidden at 768), mobile menu geometry identical to the reference pins (338/14/36×36 · 182/54/192×164 · `enter`). Let me formally diff against the reference captures:
Unexpected — let me inspect the actual differences:
The diffs are the documented data-driven ones (StatusCard state, account avatar letter) plus one micro-diff worth ruling on: `body` class `antialiased` (clone) vs `""` (reference). Let me check whether prior sessions already ruled on it:
**发现一个未记录的奇偶校验微差**：参考页面渲染 `<body>` 时**没有类名**，而克隆页面则添加了 `antialiased` —— 此前从未被任何会话裁定过，也没有任何规范对其锁定。让我检查一下 e2e 规范清单以找到合适的锁定位置，然后以 TDD 方式将其修复：
The viewport-breakpoints spec is the natural home for a shell-level pin. **TDD RED phase** — add the pin (it must fail while `antialiased` is still present):
**RED 已确认** —— 该 pin 捕获了 `antialiased`。现在是 **GREEN 阶段** —— 移除该 class：
**GREEN**: 10 passed. Now verify the fix live on the dev server (HMR picks up layout changes):
**BD-1 closed live** — body class empty on both surfaces, matching the reference. Now **T-5**: extend the capture script with the two tablet captures, then re-run all:
**T-5 complete** — 22 screenshots (20 re-captured + 21/22 tablet captures). Since src/ changed (BD-1), the final full gate must re-run (the definitive session gate):
**Final gate green**: lint ✓ · tsc ✓ · 143/143 unit · build ✓ · **76/76 e2e ×2 consecutive**. Now **T-6 (DOCS)**. Let me review the current session-17 review doc and the doc structures to update:
Now let me check the doc sections that need updates (README testing counts, CLAUDE e2e table, PAD §8, SKILL version/FS ledger, AGENTS pin notes):
All doc sections located. Now updating the docs — starting with the SKILL file (version bump + FS-29 + changelog):
The FS-29 entry landed before FS-23 — let me check the FS section ordering convention:
FS-29 sits after FS-28 (the natural chronological order; FS-23 is already an end-of-list artifact). Now the SKILL changelog entry:
Now README.md:
The long row didn't match verbatim. Let me use surgical edits on exact substrings:
README done. Now CLAUDE.md and AGENTS.md:
Now AGENTS.md — update the count and add the viewport-band pin note + the reference-hygiene rule:
AGENTS.md done. Now the PAD — E2E row + verification ledger entries:
Now append the session-17 ledger entries and update the E2E row in PAD:
PAD done. Now update the session-17 review doc with the BD-1 finding and the actual remediation record:
Now the remediation plan's execution record:
Now the repo worklog — check its tail and append the session-17 entry:
`.env` has the required `DATABASE_URL="file:../db/custom.db"`, `.env.example` matches the codebase and is tracked, `db/` at repo root. Now **T-7 (PUSH)** — review the full change set first:
Clean change set: 5 docs + 14 re-captured screenshots (data-driven diffs) + the capture script + the one src change (BD-1) + worklog + 4 new files. Now commit:
Committed `024b59f` (27 files, +714/−12). Now the SSH push — let me read the wrapper skill doc:
The procedure is clear. Let me check the environment (ssh binary / shim availability from prior sessions):
The shim (`bin/ssh`) and paramiko 5.0.0 are ready from prior sessions. Following the field-tested runbook — key to a 0600 file outside the repo, fingerprint sanity check, dry-run, real push, shred:
Key parses cleanly (ed25519). Dry-run (authenticates, touches no refs):
The wrapper defaulted to its old `task-management` remote — the flow-schedule target must be passed explicitly with `--remote`:
Dry-run green — auth verified, remote at `c86d0e4` (fast-forward to `024b59f` expected). Real push:
Pushed and verified (`c86d0e4..024b59f HEAD -> main`, remote == HEAD). Final step — shred the operator key:
All green. Let me tidy up (stop the dev server) and close out the task list:
**Session 17 complete — pushed to `main` @ `024b59f`** (remote verified, key shredded, tree clean).

**What was delivered:**
- **Audit**: the multi-viewport pass at 390/768/1024/1440 on both apps live — full parity, mobile menu identical to the reference pins (no Tailwind v4 regression); one leftover probe task cleaned from the reference account
- **VP-1 fixed**: 8 new viewport-band pins — the exact md edge (768), the tablet band, and the no-horizontal-overflow invariant at every band; mutation-proven (M-1 RED 4; M-2 redesigned after the first design survived the AppShell clip — the root-width edit went RED 4, surgical)
- **BD-1 found & fixed live**: the clone's `<body class="antialiased">` vs the reference's classless body — removed, pinned, live-verified
- **Gate**: 143/143 unit · **76/76 e2e ×2 consecutive** · 22 screenshots (incl. the new tablet captures) · all docs realigned (SKILL v2.6.0, FS-29)

**Suggested next steps:** the audit frontier is closed; the session-18 candidate is the timed-interaction pass (Focus Timer sub-second countdown parity), or name any surface you'd like prioritized.
