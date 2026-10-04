# Remediation Plan — Session 10 (2026-10-04/05)

Session-10 review of the FlowSchedule clone (base commit `be137a4` — the
session-9 remediation `7c26edd` plus the operator's docs/session_10.md
prompt commit; the working tree was `git pull`ed, not reset). The `skills/`
folder is excluded from code checking, testing and compilation per the
operating instructions (eslint ignores `skills`, tsconfig excludes
`skills`, vitest includes only `src/` + `tests/` — all three re-verified
green this session).

Skills used this session: `agent-browser` (login + live state-matched
diffing on BOTH apps — the Focus Timer's running/paused states, the
POPULATED Log Activity history, the mobile + desktop menu re-pins, the
attribute-inventory diff, the completion-alert live probe),
`clone-app-pat-pro` (the parity method: measured facts, not preferences),
`tdd`/`tdd-workflow` (red → green), and
`verification-and-review-protocol` (executed evidence only).

## 1. Audit scope and method

Session 9's closing suggestion set this session's two never-diffed
targets — the Focus Timer's RUNNING-state visuals and a populated Log
Activity history — plus the standing per-session re-pins.

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull` (main `7c26edd` → `be137a4`, docs/session_10.md only); dev server verified healthy on the repo's own seeded `db/custom.db` (F-1 session-9 acceptance re-verified: login + CRUD green, parent `db/` absent) | ✅ clean tree, main @ be137a4 |
| Docs ↔ code alignment | The five root docs + session_9-review.md + remediation-plan-session9.md + worklog.md + session_10.md re-read; full gates re-executed at base | ✅ aligned — lint ✓ · typecheck ✓ · **88/88 unit** · build ✓ (19 routes) · **64/64 e2e** |
| Session-9 remediation (`7c26edd`) | Code spot-check: `chooseEnvSource`/`repoEnvDatabaseUrl` in db-path.ts, `scripts/prisma-cli.ts` + package.json db scripts, the Planning day-card plain div | ✅ all in place; the 64 e2e pins (incl. the day-card div shape) held |
| **Focus Timer (RUNNING state — session 9's suggestion)** | Start the timer on BOTH apps (25:00 → running), full class-tree dump of the `div.space-y-4.text-center` panel in running AND paused states; pause-snap semantics; the W1e decompile re-read from the reference's live bundle; the completion alert LIVE-probed (alert hooked pre-run, minutes=1, watched 01:00 → 00:00 → alert) | ✅ **byte-identical class trees** in both states (pause `bg-orange-500 … px-8 rounded-full w-20 h-20`, reset outline form, Close ghost `mt-2`); minutes input hidden while running on both; **pause → "25:00" snap-back on both** (the reference's idle effect `a||o(n*60)` = the clone's derived display); `alert("Focus session complete!")` fired live at 0 on the reference (display snapped back to "01:00") — the clone mirrors it (decompile: `i===0&&a&&(l(!1),alert(...))`) |
| **Log Activity (POPULATED history — session 9's suggestion)** | Created 3 tasks on the reference via its own dialog (2 past-todo "Ended" + 1 future-start completed via Mark Complete → "Completed") and the same 3 instants on the clone; opened the panel on both; full class-tree + text dump; the H1e decompile re-read from the bundle | ⚠️ structure **byte-identical** (panel `p-4 space-y-3 rounded-2xl bg-purple-50/90 max-h-80 …`, items `p-2.5 bg-white/70 rounded-lg shadow-sm border border-slate-200/70`, meta `text-xs text-slate-500`, "Recently Completed / Past", Close ghost, top-5 slice, Completed-or-Ended labels, end_time-desc order incl. the completed-future-end case sorting first) — but **F-2: the relative-time words differ** (below) |
| Mobile menu (highest regression risk) | Live re-measurement on BOTH apps at 390×844 (trusted clicks, animation settled) + navigation round-trip (Profile → /Profile → back) | ✅ trigger 338/14/36×36 both; menu 182/54/192×164, right 374; items [Profile, Settings, Logout]; computed `animation-name: enter` on both — **no Tailwind v4 regression** |
| Desktop avatar menu | Live re-measurement on BOTH apps at 1440×900 | ✅ trigger 1252/14/76×36, menu 1136/54/192, right 1328, `enter` — identical (session-7/9 measurements hold) |
| **Attribute-inventory diff (new method this session)** | Full `attributes[].name` inventory of both apps' DOM (idle dashboard + open TaskDialog + open menu states) | ⚠️ **F-1: `data-slot`** (below). The clone's other extras are the DOCUMENTED a11y floor (calendar cells' invisible role/tabindex/aria-label, icon-button aria-labels, the decorative blobs' aria-hidden) and dev-mode artifacts (`data-nextjs-dev-overlay`, script `async`/`src`/`hidden` — absent from the production standalone) — accepted deviations, no action. The reference's inventory has zero `data-slot` in every state (idle, dialog open, menus open). |
| Reference bundle re-decompile | Fetched the live bundle (`assets/index-BNgAatKl.js`); extracted W1e (timer), H1e (log activity), the enUS locale object, and the KJ formatter (the strict token table) | ✅ evidence for F-2 + the timer parity record |
| Env contract | `.env` = `DATABASE_URL="file:../db/custom.db"` (present, unchanged); `db/` at the repo root (custom.db + e2e.db); `.env.example` contract test green | ✅ held from session 9 |
| Test configs (vitest + playwright) | Configs re-read + full runs; compared against the scandihaven family patterns (its apps/web vitest.config.ts + playwright.config.ts) | ✅ vitest: node env + `@` alias + `*.test.ts` only; playwright: production standalone on an isolated port with its own seeded DB — the family shape with the local auth-rate-limit adaptation (storageState, 1 worker) |

## 2. Issues, bugs and gaps found

### F-2 (High — user-visible text parity): Log Activity's relative times use the NON-strict date-fns formatter; the reference uses `formatDistanceToNowStrict`

The populated-history diff (this session's target) caught real wording
divergence in the item meta line:

- REFERENCE (live, for end_times 3h04m / 1d16.8h / 4d2h in the past):
  "Ended **3 hours ago**" · "Completed **in 2 days**" · "Ended 4 days ago".
- CLONE (same instants): "Ended **about 3 hours ago**" · "Completed
  **in 1 day**" · "Ended 4 days ago".

Root cause, decompile-verified from the live bundle: the reference's
meta paragraph calls `GJ(Wc(a.end_time), {addSuffix: true})` where `GJ →
KJ` is date-fns' **formatDistanceToNowStrict** — its token table picks
`xHours`/`xDays` (plain, "3 hours", "2 days") and `Math.round`, while the
clone's `formatDistanceToNow` (non-strict) picks `aboutXHours` ("about 3
hours") for hour distances ≥ 90 minutes and rounds day distances down
(1.7 days → "1 day" vs the reference's "2 days"). Both apps bundle the
same v3/v4 enUS locale object (found in the reference's bundle), so the
fix is a one-line call-site change: `formatDistanceToNow` →
`formatDistanceToNowStrict` in
`src/components/dashboard/QuickActions.tsx` (the import + the single
call site — the only `formatDistanceToNow` usage in the repo, and the
reference's `GJ` is likewise called exactly once, from H1e).

Reproduced as a unit-level table (executed with the repo's date-fns
4.4.0, `now = 2026-10-04T18:14:00Z`):

| end_time distance | clone (formatDistanceToNow) | reference (Strict) |
|---|---|---|
| 3h04m past | "about 3 hours ago" | "3 hours ago" |
| 1d16.8h future | "in 1 day" | "in 2 days" |
| 4d2h past | "4 days ago" | "4 days ago" |

### F-1 (Medium — DOM attribute parity): the clone's ui primitives emit `data-slot` attributes the reference never renders

The attribute-inventory diff (new method — the class-tree diffs of
sessions 6–9 extract only `class`, so this attribute was invisible to
them): 9 of the clone's shadcn-style primitives (`accordion, button,
card, dialog, dropdown-menu, input, label, select, textarea` — the badge
is already the session-7 classic form and carries none) stamp
`data-slot="<name>"` on their roots — **24 attribute sites in total**
(1 each in button/input/label/textarea, 4 in card, 5 in dialog, 4 in
dropdown-menu, 4 in select, 3 in accordion) — while the reference
renders ZERO `data-slot` attributes in ANY state —
verified on its idle dashboard, its OPEN TaskDialog (24 such elements on
the clone's dialog), and its open menus. Measured counts on the clone:
6 (`data-slot="button"`) on the idle dashboard, 24 across the open
TaskDialog (button 8, dialog-overlay/content/header/title, label 6,
input 3, textarea, select-trigger 2), more inside the open Select.

Nothing depends on them: no CSS selector in `globals.css`, no locator in
the e2e suite, no script (`rg data-slot` outside `src/components/ui`
returns nothing) — they are inert leftovers from the modern shadcn
generator, in the same evidence class as the session-7/8 "classic form"
conversions (the reference predates the data-slot convention). Fix:
remove the `data-slot={…}` props from all 10 primitives. The clone's
OTHER extra attributes stay — they are the documented a11y floor
(invisible role/tabindex/aria-label on the calendar cells; aria-label on
icon-only buttons; aria-hidden on the decorative blobs), not stray
framework markers.

### F-3 (Low — DOM attribute parity, found during F-1's verification): the TaskDialog's title input carries `maxLength={300}` the reference's input does not

While re-diffing the open TaskDialog's attribute inventory post-F-1, the
clone's `#title` input still showed a `maxlength` the reference's title
input does not carry (live-verified on the reference's open dialog:
`class, id, placeholder, required, value` — no maxlength; its textarea
likewise). The attribute is also a behavioral cap the reference's typing
UX does not have (a >300-char paste is silently truncated on the clone,
accepted on the reference).

Remediation: remove the client `maxLength={300}` from
`src/components/planning/TaskDialog.tsx` (the reference's input behavior
is the parity surface — pinned by a `not.toHaveAttribute("maxlength")`
assertion added to the F-1 spec). **Keep the server-side 300-char write
guard** (`src/app/api/tasks/route.ts` + `[id]/route.ts` — the clone's
self-hosted write validation per AGENTS.md "server-side validation of
every write", the same evidence class as the login rate limiter:
invisible to the reference-parity surface, protects data integrity; a
>300-char submit surfaces the envelope's validation error, never a raw
500). No test pinned the 300-cap client behavior (repo-wide search).

### P-1 (observed, no action): the reference's Log Activity fetches its own server-sorted list

The reference's H1e calls `fn.Task.list("-end_time")` (its own fetch,
its own loading state) and slices the top 5 off the server-sorted list;
the clone re-reads the store's createdAt-desc list and client-sorts by
end_time desc. Behaviorally equivalent for every reachable state
(completed tasks always carry an end_time on both apps — the StatusCard
only offers Mark Complete for scheduled upcoming tasks, and the
client-sort reproduces the server order for the filtered set); the
clone's list is unpaginated while base44's default list window could
truncate at scale. Not remediated — an architectural refactor with
regression risk and no reachable behavioral difference. Documented here
as the standing explanation for the implementation difference.

## 3. Remediation (TDD: red → green)

Both fixes are pinned by NEW e2e specs first (RED on the current build),
then implemented (GREEN), then the full gate re-run.

### F-2 — the strict relative-time formatter

- RED: extend `tests/e2e/dashboard.spec.ts` with a spec that seeds a
  task whose `end_time` is exactly 3 hours in the past
  (`start_time = now - 182 min`, `duration_minutes = 2`), opens the Log
  Activity panel, and asserts the item meta reads `Ended 3 hours ago`
  (and that no "about " prefix exists in the panel). Pre-fix the meta
  renders "Ended about 3 hours ago" — the assertion fails.
- GREEN: `import { formatDistanceToNowStrict } from "date-fns"` and the
  one call site in `QuickActions.tsx`'s LogActivityPanel.
- The 3-hour distance is drift-stable for both formatters (±seconds of
  test-time cannot leave the "about X hours"/"X hours" band), and
  date-fns 4.4.0 is already a dependency — no version change.

### F-1 — the data-slot removal

- RED: extend `tests/e2e/dashboard.spec.ts` with a spec asserting
  `[data-slot]` count 0 on the idle dashboard AND on the open TaskDialog
  (the heaviest surface). Pre-fix: 6 and 24 → fails.
- GREEN: delete the `data-slot={…}` prop from the 9 primitives'
  elements (24 attribute sites total — verified by repo-wide search:
  1 each in button/input/label/textarea, 4 card, 5 dialog, 4
  dropdown-menu, 4 select, 3 accordion; badge already clean).
- No code depends on the attributes (verified by repo-wide search) and
  Radix itself never reads them — the shadcn convention only.

### Gate after (in the polluted shell, on purpose)

`bun run lint && bun run typecheck && bun run test && bun run build &&
bun run test:e2e` — expected 88/88 unit and 66/66 e2e (64 + the 2 new
specs), plus a second consecutive full e2e run for determinism.

### Live parity re-verification (both fixes)

- F-2: re-create the 3-instant task set on both apps and re-diff the
  Log Activity panel — the meta lines must now read identically
  ("3 hours ago" / "in 2 days" / "4 days ago").
- F-1: re-run the attribute inventory on the clone — `data-slot` count
  0 in every probed state (idle, dialog open).
- The mobile + desktop menu re-pins re-run once more post-fix (the
  dialog/menu primitives changed).

## 4. Deliverables

- `docs/remediation-plan-session10.md` (this file) + execution record.
- `docs/session_10-review.md` (the session review).
- Screenshots re-captured (dev server, 1440×900 + 390×844 set) into
  `docs/screenshots/`.
- Docs realigned: README, AGENTS.md, CLAUDE.md, PAD §12 ledger +
  history, flow-schedule_SKILL.md (v1.9.0 — the data-slot convention +
  the strict-formatter rule), worklog.md (Task ID 26).
- `.env.example` — unchanged this session (its contract test stays
  green); re-verified to match the codebase.
- Commit on `main` + push via `docs/ssh_git_wrapper_v3.py`.

## 5. Execution record (2026-10-04/05)

Executed exactly as planned, with one addition (F-3, found by F-1's
own verification method and remediated with its own RED/GREEN cycle).

| Step | Result |
|---|---|
| RED: the strict-wording e2e spec | ✅ failed on the base build ("Ended about 3 hours ago" ≠ "Ended 3 hours ago") |
| RED: the data-slot e2e spec | ✅ failed on the base build (6 idle / 24 dialog ≠ 0) |
| GREEN: `formatDistanceToNowStrict` | ✅ one import + one call site in `QuickActions.tsx` |
| GREEN: the 24 data-slot deletions | ✅ 9 primitives (badge already classic); perl bulk edit + repo-wide verify (no selectors anywhere) |
| F-3 found mid-verification | ✅ the reference's title input carries no maxlength; RED pin added (`not.toHaveAttribute`), failed, fix applied, GREEN |
| Full gate | ✅ lint · tsc · 88/88 unit · build (19 routes) · **66/66 e2e × 2 consecutive** · smoke 30/30 |
| Live re-verification | ✅ Log Activity populated panel diffs IDENTICAL ("3 hours ago" / "in 2 days" / "4 days ago"); `[data-slot]` 0 idle + dialog; mobile menu (338/14/36×36 + 182/54/192×164, right 374, enter, round-trip) and desktop avatar menu (1252/14/76×36 + 1136/54/192, right 1328) re-pinned POST-fix — no Tailwind v4 regression |
| Screenshots | ✅ all 20 re-captured |
| Docs | ✅ README, AGENTS.md, CLAUDE.md, PAD (§8 + §12 + date), SKILL v1.9.0 (FS-20/FS-21 + conventions + history), session_10-review.md, worklog Task 26 |
