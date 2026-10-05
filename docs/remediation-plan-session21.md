# Remediation Plan — Session 21 (2026-10-05)

Session-21 review of the FlowSchedule clone (base commit `9258cde` — the
session-20 remediation `a19516a` plus the operator's `docs/session_21.md`
narrative commit; the carried-forward workspace re-verified per
`docs/session_21-review.md` §4). The `skills/` folder is excluded from
code checking, testing and compilation per the operating instructions
(eslint ignores `skills`, tsconfig excludes `skills`, vitest includes
only `src/` + `tests/` — re-verified via the green base gate).

Skills used this session: `agent-browser` (the reference login + live
driving pattern — the probe harness), `clone-app-pat-pro` (measured
facts — the live trusted-click probe and the matched-data raster diff
are the ground truth), `tdd` / `tdd-workflow` (red → green → mutation
evidence), `code-review-and-audit` (the tiered review pipeline), and
`tailwind-patterns` (the @theme pin discipline re-checked for the
non-findings).

## 1. Audit scope and method

Session-20's closing suggestion set this session's primary targets —
(a) the full-page raster diff and (b) the Planning multi-week depth —
plus the standing discipline (the base gate at the carried-forward
workspace, the session-20 remediation audit, the reference-account
hygiene re-list, the mobile-menu live re-measure).

| Surface | Method | Result |
|---|---|---|
| Workspace (carried forward) | Full base gate | ✅ lint ✓ · typecheck ✓ · 159/159 unit · build ✓ (19 routes) · **89/89 e2e** (2.9 m) |
| The session-20 remediation commit (`a19516a`) | Source-level audit (the @theme pins + the 2 pin families) | ✅ clean |
| **The Planning multi-week depth (the §5 target (b))** | Live probe on BOTH apps across the month boundary (week label, day cards, chips, selected-day section) | ✅ byte-identical; ❌ **S21-F1 surfaced** via the Add Task click |
| **The raster diff (the §5 target (a))** | Matched-data full-page pixel compare (the reference's 9 task bodies recreated on the clone; blobs hidden identically; pulse phase-aligned) | ✅ /Planning 0.057% (noise); /Dashboard 0.737% ALL inside the Daily Focus LLM card |
| The mobile menu (standing priority) | Live re-measure on BOTH apps at 390×844 | ✅ byte-identical (trigger 338/14/36×36 right 374; menu 182/54/192×164 right 374; items [Profile, Settings, Logout]; `animation-name: enter`) |
| The reference-account hygiene | Full entity re-list at session START (full bodies captured) | ✅ 9 parity tasks + 3 notes, 0 leftovers |
| The Planning per-day filter + store seam | Decompile (`eSe`'s `d(y)` + mount-fetch) vs the clone's store read | ✅ identical filter; the seam is the documented same-evidence-class ruling |

## 2. Issues, bugs and gaps found

ONE functional defect (S21-F1). Zero visual/theme defects (the raster
catch-all closed at noise level outside the documented LLM region). Zero
Tailwind v4 regressions (the mobile menu byte-identical).

### S21-F1 (High): the Planning Add Task button must be the reference's no-op

Evidence (three levels, this session):
1. **Decompile** — the reference's `eSe` (Planning) has NO dialog state
   and NO onClick on the Add Task button; its `Xne` TaskDialog mounts
   ONLY inside `lre` (the Dashboard calendar).
2. **Live trusted click on the reference** — no dialog, no DOM change, no
   navigation (the decorative-Filter evidence class).
3. **Live trusted click on the clone** — the full TaskDialog opens.

The session-2 remediation plan's "the reference opens it from the Add
Task button" was an unverified inference; the e2e spec "Add Task dialog
creates a scheduled task" has pinned the divergence since session 2.

**The fix** (`src/app/(app)/Planning/page.tsx`):
- remove the `<TaskDialog>` mount, the `dialogOpen`/`initialForm` state,
  the `openCreate` handler, the button's `onClick`, and the now-unused
  `TaskDialog`/`emptyTaskForm` imports;
- update the page's header comment (the decompile note: the button is
  decorative like the Filter button — no handler in `eSe`);
- `TaskDialog`/`emptyTaskForm` stay exported and used by
  `DashboardView.tsx` (the reference's one true mount site).

## 3. The remediation — TDD execution plan

### T-1 RED: the pins land FIRST (must fail at base)

**`tests/e2e/planning.spec.ts`** — REPLACE "Add Task dialog creates a
scheduled task" with **"Add Task button is decorative (the reference's
no-op, S21-F1)"**:
- click the Add Task button (trusted Playwright click);
- assert `[role="dialog"]` count stays 0 (the closed-Radix contract —
  same assertion shape as the "chip clicks… never open the edit dialog"
  spec);
- assert NO POST to `/api/tasks` fires (a `page.on("request")` listener
  window around the click);
- assert the seeded chips survive (the page didn't reset);
- assert the button keeps its label + the P-5/P-6 class contract (the
  existing "header buttons" spec already pins the classes — the new spec
  cites the decompile + the live probe in comments).
RED at base: the clone opens the dialog (count 1 ≠ 0).

**`tests/e2e/dashboard.spec.ts`** — ADD **"task dialog create-flow
submits the client-computed end_time + verbatim description (W-3/W-4)"**
(the RELOCATED request-contract pin, at the reference's actual entry
path):
- open the dialog via the calendar cell button
  (`Add task on {day} at {hour}` — the same entry the
  "calendar cell click opens the task dialog prefilled" spec uses);
- fill title + start_time + duration (description deliberately EMPTY);
- intercept the POST body (the `page.route` interception pattern from
  the retired planning spec);
- assert `end_time === start + duration*60000` (W-3) and
  `description === ""` (W-4 verbatim), the submit label "Create Task"
  with the Save icon, and the created task's calendar block renders.
GREEN at base (documented: it's a RELOCATION of a green pin, not a new
behavior — its role is to keep the session-12 wire contract guarded when
the planning spec flips).

### The fix (GREEN)

`src/app/(app)/Planning/page.tsx` — the S21-F1 removal above. No other
source file changes.

### T-2 MUTATION (the sensitivity evidence; harness outside the repo at
`/home/z/my-project/scripts/mutate-planning-noop.mjs`, ONE canonical
backup, production rebuild per mutation, the pin suite re-run after the
harness proves the tree restored):
- **M-1** (the fix reverted: re-add the onClick + the dialog mount) →
  RED the planning no-op pin (surgical — the dialog count 0 fails);
- **M-2** (the TaskDialog drops its client-computed `end_time` from the
  submit body) → RED the relocated dashboard W-3 pin;
- **M-3** (the TaskDialog sends `description: undefined` instead of the
  verbatim `""`) → RED the relocated dashboard W-4 pin.

### T-3 GATE: the full consecutive gate

lint · typecheck · unit (159 — unchanged; the remediation touches no
unit-pinned seam) · build (19 routes) · e2e ×2 consecutive (90 —
planning swaps the dialog spec for the no-op spec, dashboard gains the
relocated W-3/W-4 pin).

### T-4 LIVE: the re-probe on the remediated clone

The `clone-planning-multiweek.mjs` probe re-run against the rebuilt
standalone: the Add Task click produces `dialogs: []`, bodyChildren
unchanged, URL unchanged — byte-matching the reference's captured
behavior. The reference-account hygiene re-list at session END.

### T-5 SCREENSHOTS: the 22-capture family re-run on the remediated
codebase (the dev server; `scripts/capture-screens.mjs`) — the Planning
captures shift only if the dialog was open in any frame (it never was in
the family); re-captured fresh regardless per the standing discipline.

### T-6 DOCS: SKILL v2.10.0 (FS-33 — the handler-parity ruling: the
bundle's missing onClick IS the contract, the live trusted click is the
probe; a pin on divergent behavior is worse than no pin), README (the
Planning feature row + the test-pyramid rows), CLAUDE (the Planning
dialog ruling + the counts), AGENTS (the Planning bullet + the counts +
the pin family), PAD (the session-21 ledger rows + §8 counts), the
session_21-review.md, this plan's execution record, the worklog.

### T-7 PUSH: commit on main (only main, no new branches) + the SSH
wrapper push (`docs/ssh_git_wrapper_v3.py --remote
git@github.com:nordeim/flow-schedule.git` per
`docs/how-to-git-push-using-ssh-wrapper_SKILL.md`) + the operator key
shredded after.

## 4. Validation of this plan against the codebase

- The `eSe` decompile verified in the reference bundle
  (`ref-bundle-index-BNgAatKl.js`): `function eSe(){const[e,t]=
  O.useState([]),[n,r]=O.useState(Ka(new Date,{weekStartsOn:1})),[i,o]=
  O.useState(null),[a,l]=O.useState(!0);O.useEffect(()=>{c()},[]),…}` —
  no dialog state; the Add Task button props
  `{className:"rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600"}`
  carry no onClick; `Xne` mounts once, inside `lre`.
- The live probes verified on BOTH apps this session (the trusted-click
  evidence in `docs/session_21-review.md` §2).
- The clone's mount sites verified: `rg TaskDialog src/` —
  `DashboardView.tsx` (stays) + `Planning/page.tsx` (the removal);
  `emptyTaskForm` used by both (the export stays for DashboardView).
- The spec surface verified: the ONLY e2e consumer of the Planning dialog
  is the "Add Task dialog creates a scheduled task" spec; the
  "new-task-first store semantics" and the dialog-form pins live in
  dashboard.spec already; no unit test pins the Planning page source
  (`rg "Planning/page" tests/*.test.ts` — zero hits).
- The closed-Radix contract verified: the idle Planning page renders
  `[role=dialog]` count 0 today (the "chip clicks" spec's assertion
  passes at base with the dialog mounted-but-closed — removing the mount
  changes nothing for that spec).
- The W-3/W-4 relocation surface verified: the dashboard's calendar-cell
  dialog entry (`Add task on Tue … at 10:00`) is the reference's own
  entry path (`y=(E,C)=>{…}` in `lre` → `c(L)` → the dialog opens), and
  the interception pattern (`page.route` + `postDataJSON`) is portable.
- The rate-limiter constraint verified: the new specs perform ZERO
  real logins (the storageState pattern; the no-op pin clicks a button
  on an authenticated page).

## 5. Execution record (2026-10-05, appended after T-7 prep)

Every step of §3 executed and verified:

- **The audit** (§1–§2): the session-20 §5 targets executed — the
  multi-week depth probe (byte-identical on both apps across the month
  boundary: week labels, day cards, the "Thu 1" month-boundary form, the
  selected-day persistence, the completed-task chips) and the
  matched-data raster diff (the reference's 9 task bodies recreated on
  a scratch clone user; blobs hidden identically on both pages; the
  pulse indicators phase-aligned via `currentTime % 2000 < 120`):
  **/Planning 0.057% of pixels differ (739 px at the >8 threshold, no
  hot cells) — /Dashboard 0.737%, every hot cell inside the Daily Focus
  card** (the reference's live InvokeLLM quote vs the clone's Mark
  Twain fallback after a z-ai 429 — the documented never-hard-fail
  contract). The mobile menu re-measured live on BOTH apps at
  390×844: byte-identical (trigger 338/14/36×36 right 374, menu
  182/54/192×164 right 374, items [Profile, Settings, Logout],
  `animation-name: enter`) — no Tailwind v4 regression. **S21-F1
  found** at three evidence levels (the `eSe` decompile — no dialog
  state, no onClick; the live trusted click on the reference — no
  dialog, no DOM change, no navigation; the live trusted click on the
  clone — the full TaskDialog).
- **T-1 RED**: `tests/e2e/planning.spec.ts`'s "Add Task dialog creates
  a scheduled task" (the divergent-behavior pin since session 2)
  REPLACED by "Add Task button is decorative (the reference's no-op,
  S21-F1)" — RED at base exactly as predicted (`getByRole('dialog')`
  Expected 0, Received 1). The relocated
  `tests/e2e/dashboard.spec.ts` W-3/W-4 spec ("task dialog create-flow
  submits the client-computed end_time + verbatim description") landed
  GREEN at base at the calendar-cell entry path (the reference's one
  true dialog mount) — documented as a relocation, not a new behavior.
- **The fix (GREEN)**: `src/app/(app)/Planning/page.tsx` — the
  `<TaskDialog>` mount, the `dialogOpen`/`initialForm` state, the
  `openCreate` handler, the button's `onClick`, and the now-unused
  imports removed (the page mirrors `eSe`: state is
  [tasks, weekStart, selectedDay] + the store's loading; the header
  comment documents the ruling). `TaskDialog`/`emptyTaskForm` stay
  exported for `DashboardView.tsx` (the reference's one mount site).
  Unit GREEN 159/159; the planning family GREEN 16/16; the dashboard
  family GREEN 31/31.
- **T-2 MUTATION** (harness outside the repo at
  `/home/z/my-project/scripts/mutate-planning-noop.mjs`, ONE canonical
  backup per file, production rebuild per mutation):
  - M-1 (the fix reverted — the dialog re-added): RED 1 (the no-op
    pin) — surgical;
  - M-2 (the TaskDialog drops its client-computed end_time): RED 1
    (the relocated W-3 pin) — surgical;
  - M-3 (the description ships null instead of the verbatim ""): RED 1
    (the W-4 leg) — surgical;
  - restore verification: checksums identical + rebuild + both pin
    families green (2/2 + 2/2).
- **T-3 GATE**: the full consecutive gate — lint ✓ · typecheck ✓ ·
  **159/159 unit** (unchanged) · build (19 routes) · **90/90 e2e × 2
  consecutive** (3.0 m + 2.9 m; 89 → 90).
- **T-4 LIVE**: the probe re-run on the rebuilt standalone — the Add
  Task click produces `dialogs: []`, no POST, URL unchanged,
  byte-matching the reference's captured behavior. The
  reference-account hygiene re-list at session END: 9 parity tasks +
  3 notes, 0 leftovers. The raster-diff scratch user's tasks deleted
  from `db/e2e.db` (converging cleanup).
- **T-5 SCREENSHOTS**: all 22 captures re-run on the remediated
  codebase (the dev server; `scripts/capture-screens.mjs`) — the
  task-dialog capture now documents the calendar-cell entry (the
  reference's true path).
- **T-6 DOCS**: SKILL v2.10.0 (FS-33 + the session-21 changelog + the
  counts — plus the stale §3 command-table counts fixed: 44/34/25 →
  159/90/30), README (the Planning feature row, the Task-lifecycle row,
  both pyramid rows + the counts), CLAUDE (the counts + the family),
  AGENTS (the Planning bullet's S21-F1 ruling + the counts + the
  session-21 reference), PAD (the six session-21 ledger rows + the §8
  E2E row + the planning/dashboard spec mentions), the
  session_21-review.md, this execution record, the worklog.
- **T-7 PUSH**: commit on main + the SSH wrapper push.

Reference-account state at session end: 9 parity tasks + 3 notes (the
hygiene re-list ran at session START and END — 9 tasks + 3 notes,
0 leftovers both times; this session's probes created no entities).
