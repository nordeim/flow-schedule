# Remediation Plan — Session 11 (2026-10-05)

Session-11 review of the FlowSchedule clone (base commit `a8e2987` — the
session-10 remediation `49b1c94` plus the operator's docs/session_11.md
prompt commit; fresh `git clone` workspace, .env + db/ re-created from
`.env.example` per the documented setup). The `skills/` folder is excluded
from code checking, testing and compilation per the operating instructions
(eslint ignores `skills`, tsconfig excludes `skills`, vitest includes only
`src/` + `tests/` — all three re-verified this session).

Skills used this session: `agent-browser` (login + live state-matched
diffing on BOTH apps — the >5-item Log Activity, the Brainstorm deeper
states, the mobile + desktop menu re-pins), `clone-app-pat-pro` (the parity
method: measured facts, not preferences), `tdd`/`tdd-workflow`
(red → green), and `verification-and-review-protocol` (executed evidence
only).

## 1. Audit scope and method

Session 10's closing suggestions set this session's two never-pinned
targets — the Brainstorm note-editing flow's deeper states and a
cross-week Log Activity history diff (>5 items to pin the top-5 slice) —
plus the standing per-session re-pins.

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | Fresh `git clone` (main `a8e2987`); `.env` created from `.env.example` with `DATABASE_URL="file:../db/custom.db"` + generated AUTH_SECRET; `db/` at the repo root; `db:push` + `db:seed` (demo user, 9 tasks, 2 notes); dev server verified healthy with `database: "up"`, login + CRUD green — in the ambient-polluted shell (`DATABASE_URL=file:/home/z/my-project/db/custom.db` exported by the harness, resolving OUTSIDE the repo → the db-path v3 rule correctly ignored it) | ✅ clean tree, main @ a8e2987, repo DB seeded |
| Docs ↔ code alignment | The five root docs + session_10-review + remediation-plan-session10 + worklog + session_11 re-read; full gates re-executed at base | ✅ aligned — lint ✓ · typecheck ✓ · **88/88 unit** · build ✓ (19 routes) · **66/66 e2e** |
| **Log Activity top-5 slice (>5 items — session 10's suggestion)** | Created 4 more tasks on the reference through its own dialog (Top5 Parity D/E/F + a cross-week G at −12 d) on top of session 10's A/B/C → 7 qualifying items on BOTH apps (the same instants seeded on the clone via its API, parity-s11@flowschedule.app); opened the panel on both; full tree + text diff | ✅ **IDENTICAL**: both apps render exactly the top-5 by end_time desc (C "Completed in 2 days" · B "Ended 6 hours ago" · D · E · F) and CUT the 6th (4 d old) and 7th (cross-week 12 d old) — the slice, the sort, and the labels all match |
| **Null end_time handling (edge found while reasoning about the filter)** | Quick-added a title-only task ("NullEndTime Probe A") on the reference (its z1e panel) — such tasks carry `end_time: null`; re-opened its Log Activity; then fetched the live bundle and re-decompiled H1e's exact filter | ✅ **PARITY, decompile-verified**: the reference's filter is `d.status==="completed" || d.end_time && Wc(d.end_time) < l` — the same null guard structure as the clone's (`t.end_time && …`), so null-end_time tasks are excluded on BOTH apps; the reference also captures `now` once per mount (`const l = new Date` inside the mount effect) exactly like the clone's `useMemo(() => new Date(), [])` |
| **Brainstorm deeper states (session 10's suggestion)** | On BOTH apps: empty state → create view → typed >30-char note → list view (truncation) → viewNote/edit view → content edit → update → list; the empty-content save/update no-op; the delete confirm message (hooked `window.confirm`, cancel path); multi-note ordering (a second note created on both) | ✅ **IDENTICAL in every state**: panel container/gradient, "My Notes" header + New Note button classes, item row classes, `text-sm text-slate-800 truncate cursor-pointer hover:underline` preview with the SAME 30-char + "…" truncation, Eye/Trash icon-button classes (clone's aria-labels = the documented a11y floor), textarea classes + prefilled value, "← Back to List" / "Save Note" / **"Update Note"** buttons (bg-green-500 family, save icon `w-4 h-4 mr-1.5`), empty save = no-op on both, confirm text "Are you sure you want to delete this note?" on both, **newest-first multi-note order on both** (the store's prepend = the reference's createdAt-desc list) |
| Mobile menu (highest regression risk) | Live re-measurement on BOTH apps at 390×844 (trusted clicks, animations settled) + navigation round-trip (Profile → back) + Escape close | ✅ trigger 338/14/36×36, right 374 both; menu 182/54/192×164, right 374; items [Profile, Settings, Logout]; computed `animation-name: enter` on both — **no Tailwind v4 regression** |
| Desktop avatar menu | Live re-measurement on BOTH apps at 1440×900 | ✅ trigger 1252/14/76×36, menu 1136/54/192×164, right 1328, `enter` — identical |
| Sticky-header scroll behavior (probed during the mobile ritual) | Scrolled both apps to y=600 and measured the trigger | ✅ both apps' headers scroll away identically (`sticky top-0 z-50` computed on both; same ancestor overflow context) — parity, not a bug |
| Recent code changes (`49b1c94`) | Code spot-check: `formatDistanceToNowStrict` import + single call site in QuickActions.tsx; repo-wide `data-slot` search (1 match = the badge comment only); TaskDialog maxLength absence | ✅ all session-10 fixes in place; the 66 e2e pins held at base |
| Env contract | `.env` = `DATABASE_URL="file:../db/custom.db"` + AUTH_SECRET; `db/` at the repo root (custom.db); `.env.example` contract test green | ✅ held |
| Test configs (vitest + playwright) | Configs re-read + full runs | ✅ vitest: node env + `@` alias + `*.test.ts` only (skills never matched); playwright: production standalone on :3100 with its own seeded db/e2e.db, storageState one-time login, 1 worker |

## 2. Issues, bugs and gaps found

The audit found **zero code-level divergences**: every probed surface diffs
identical (live) and the H1e re-decompile closed the one reachable edge
(null end_time) at the source level. What the audit DID find is **three
unpinned behaviors** — the exact surfaces this session was asked to diff
have no e2e pin, so a future regression in any of them would pass CI.

### G-1 (Medium — test gap): the Log Activity top-5 slice has no pin with >5 qualifying items

Both existing Log Activity specs seed exactly ONE task ("E2E log activity
task" / "E2E strict time task"). The `.slice(0, 5)` and the end_time-desc
sort have therefore never executed with a saturated list in CI: removing
the slice, breaking the comparator, or flipping the sort direction would
all stay green. Session 10's closing suggestion called this out
explicitly ("a cross-week Log Activity history diff (>5 items to pin the
top-5 slice)") — the LIVE diff is now done (identical), the pin is not.

Fix: a new e2e spec that seeds SEVEN qualifying tasks via the API — a
completed one with a future end (the C-class case, sort-first), a 6h-past
one, a 30h-past one, a 54h-past one, a 78h-past one, a 4.5-day-past one
(6th — must be cut) and a 12-day-past cross-week one (7th — must be cut) —
then asserts: panel item count is exactly 5, the five visible titles in
end_time-desc DOM order, the 6th/7th titles absent from the PANEL (scoped
to `div.max-h-80` — they render on the calendar as blocks, so page-level
negation would false-fail), and the completed item's band-stable "in 2
days" wording (40 h future → Math.round(1.67) = 2; minutes of test drift
cannot cross the 1.5-day rounding boundary).

### G-2 (Low — test gap): the Brainstorm empty-content save no-op has no pin

Live-verified this session on BOTH apps: clicking "Save Note" (create
view) or "Update Note" (edit view) with empty content does nothing — the
view stays, no note is created. That is the reference's behavior
(`if (!e.target.value… trim()) return` — the K1e guard) and the clone
mirrors it (`if (!content.trim()) return`). Unpinned: a regression that
starts creating empty notes or navigating back on empty save would pass
CI.

Fix: extend the existing Brainstorm spec — after opening the create view,
click "Save Note" with the textarea empty and assert the create view is
still mounted (the textarea is still visible) and the notes count did not
change.

### G-3 (Low — test gap): the multi-note newest-first order has no pin

Live-verified this session on BOTH apps: with two notes, the newer
renders FIRST (the reference's list is createdAt-desc; the clone's API
`orderBy: { createdAt: "desc" }` and the store's `createNote` prepend).
The existing Brainstorm spec creates one note at a time and deletes
before the next, so ordering never executes with 2+ live notes.

Fix: extend the existing Brainstorm spec — after the first note's edit
cycle, create a second note and assert it renders as the FIRST list item
(the first `p.truncate` in the panel).

### P-1 (observed, no action): the hour→day band boundary sits exactly at 24 h

The reference rendered "Ended **24 hours ago**" for a 23 h 59 m distance
(the hour band rounds 23.98 → 24) while the clone rendered "Ended
**1 day ago**" for the same task observed 7 minutes later (24 h 6 m → the
day band). Both outputs are correct `formatDistanceToNowStrict` behavior
— the difference was the OBSERVATION TIME, not the code (verified by
re-deriving both bands against the same instants before blaming either
app). The lesson generalizes FS-21: relative-word pins must never sit
within minutes of a unit boundary; the new G-1 spec uses distances
(6 h/30 h/40 h) that are hours away from any boundary.

### P-2 (observed, no action): the sticky header scrolls away on both apps

Probed during the mobile ritual: at scrollY=600 the mobile trigger sits
at y=−586 on BOTH apps despite `position: sticky; top: 0` — the ancestor
overflow context defeats sticking identically on both. Parity; no
action.

## 3. Remediation (TDD: red → green)

All three gaps are PIN specs over live-verified correct behavior (the
same class as the mobile-menu geometry pins — they pass now and exist to
catch regressions). The TDD evidence for a pin is: (a) the spec is
written from the LIVE reference measurement (not inferred), (b) it is
RED against a deliberately-broken local build (mutation check — revert
the mutation, GREEN again), (c) the full gate re-runs clean. For G-1 the
mutation check is "remove the `.slice(0, 5)`" (the spec must fail); for
G-2 "delete the `content.trim()` guard"; for G-3 "flip the store prepend
to append".

### G-1 — the top-5 slice pin (`tests/e2e/dashboard.spec.ts`)

- Seed 7 tasks via the API (titles "E2E top5 slice task 1..7"), end_times
  at +40 h (completed), −6 h, −30 h, −54 h, −78 h, −4.5 d, −12 d
  (cross-week); converging cleanup first (FS-9).
- Assert: `div.max-h-80` contains exactly 5 item rows; the visible titles
  in DOM order are [1, 2, 3, 4, 5] (end_time desc); titles 6 and 7 have
  count 0 INSIDE the panel; the completed item shows "Completed in 2
  days".
- Drift analysis: +40 h stays "in 2 days" for ±hours of test-time drift;
  −6 h stays "6 hours ago" (the hour band spans 60 min…24 h); the
  order/count/cut assertions are drift-free (the gaps between items are
  24 h).

### G-2 — the empty-save no-op pin (extend the Brainstorm spec)

- After "New Note" opens the create view: click "Save Note" with the
  textarea empty; assert the textarea is still visible (the view did not
  change) and the API notes list gained no "E2E QA note" rows.

### G-3 — the multi-note order pin (extend the Brainstorm spec)

- After the first note exists: create "E2E QA note: second-created note"
  and assert the FIRST `div.max-h-80 p.truncate` reads the second note
  (newest first), and the last reads the first.

### Gate after (in the polluted shell, on purpose)

`bun run lint && bun run typecheck && bun run test && bun run build &&
bun run test:e2e` — expected 88/88 unit and **67/67 e2e (66 + the 1 new G-1
spec; G-2/G-3 are assertion blocks inside the extended Brainstorm spec)**,
plus a second consecutive full e2e run for determinism (the session
convention).

### Live parity re-verification

Re-open the reference's and the clone's Log Activity panels with the
7-item set one final time post-pin (the wording/order/cut confirmed
identical); re-pin the mobile menu once more after the codebase changes
(tests only — zero production-code changes this session, so the menu
pins are re-verified by the suite's own geometry spec plus a smoke
re-measure).

## 4. Deliverables

- `docs/remediation-plan-session11.md` (this file) + execution record.
- `docs/session_11-review.md` (the session review).
- Screenshots re-captured (dev server, 1440×900 + 390×844 set) into
  `docs/screenshots/`.
- Docs realigned: README (test counts), AGENTS.md (counts + the session-11
  conventions), CLAUDE.md (counts), PAD §12 ledger, flow-schedule_SKILL.md
  (v2.0.0 — the pin-the-slice lesson), worklog.md (Task ID 27).
- `.env.example` — unchanged (its contract test stays green); re-verified
  to match the codebase.
- Commit on `main` + push via `docs/ssh_git_wrapper_v3.py`.

## 5. Execution record (2026-10-05)

Executed as planned, with the pin-TDD evidence split into a GREEN run
against the correct build and a mutation (RED) phase, plus two honest
findings from the mutation phase about WHERE the behavior is enforced.

| Step | Result |
|---|---|
| G-1 spec written (7 seeds, count/order/cut/wording) | ✅ first run RED — the spec's own logic bug: page-level paragraph counting while the create view masks the list (a wrong test, not a regression; fixed to assert from the list view) |
| G-3 order assertion | ✅ first run RED — the seed's own sample notes occupy `.last()`; fixed to assert DOM order WITHIN the E2E family (indices, not `.first()/.last()`) |
| GREEN: both specs on the correct build | ✅ "Log Activity caps the history at the top-5 … (G-1)" 7.1 s · extended Brainstorm spec 14.6 s |
| MUTATION A: `.slice(0, 5)` removed | ✅ G-1 spec FAILS (rows 7 ≠ 5) — the pin catches the exact regression class session 10 worried about |
| MUTATION B: the client `content.trim()` guard removed | ⚪ spec stays GREEN — the empty save is ALREADY rejected server-side (`/api/notes` VALIDATION "Note content is required."), the same self-hosted write-validation class as the login rate limiter; the client guard is defense-in-depth. The pin correctly guards the BEHAVIOR (no view flip, no note created), not the redundant client check |
| MUTATION C: the store's createNote prepend flipped to append | ⚪ spec stays GREEN — the save flow's `refreshNotes()` re-fetch re-orders from the API's createdAt-desc list, so the rendered order is server-driven; the store prepend only affects the optimistic intermediate render, which no observable behavior depends on. The pin guards the RENDERED order (the parity surface) |
| Mutations reverted (source tree clean) + rebuild | ✅ `git status` shows only the spec file + the new docs |
| Full gate | ✅ lint · tsc · 88/88 unit · build (19 routes) · **67/67 e2e × 2 consecutive full runs** · smoke 30/30 |
| Live re-verification | ✅ the >5-item Log Activity panels diffed IDENTICAL on both apps pre-pin (the wording/order/cut confirmed); the mobile + desktop menu geometry pins passed inside both full e2e runs (the suite's own specs) — no Tailwind v4 regression |
| Screenshots | ✅ all 20 re-captured on the remediated codebase |
| Docs | ✅ README, AGENTS.md, CLAUDE.md, PAD (§8 counts + §12 ledger), flow-schedule_SKILL.md v2.0.0 (FS-22 + session-11 history), session_11-review.md, worklog Task 27 |
