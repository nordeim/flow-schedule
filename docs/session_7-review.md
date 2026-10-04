# Session 7 Review — FlowSchedule (2026-10-04)

Review + remediation session over base `main @ 58d471f` (the session-6
remediation `9c26d21` plus the operator's session-log commit that added
`docs/session_7.md` — the Session-6 execution narrative). The reviewer's
plan for this session: `docs/remediation-plan-session7.md`.

## 1. What was reviewed

- All five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the fast gates re-executed green at base
  (lint ✓ · typecheck ✓ · 59/59 unit).
- The session-6 remediation commit (`9c26d21`) — every fix verified in
  the code (Planning Card structure, TaskDialog footer, `icon_sm: ""`)
  and still held by its e2e pins.
- Environment contract re-verified: `.env` = `DATABASE_URL="file:../db/
  custom.db"`, `db/` at the repo root (custom.db + e2e.db), `.env.example`
  matches the codebase (unit-pinned), vitest + playwright configs in
  place, 20 screenshots.
- **Mobile navigation re-pinned live on BOTH apps** (390×844): trigger
  338/14/36×36 both; menu 182/54/192×164, right=374, items [Profile,
  Settings, Logout] — **no Tailwind v4 regression** (re-pinned again
  AFTER the remediation).
- **Desktop account dropdown geometry — measured for the first time** on
  BOTH apps (1440×900, trusted mouse events): trigger 1252/14/76×36
  both; menu 1136/54/192×164 right-anchored to the trigger's right edge
  (1328), items identical. The one surface that had only ever had an
  items assertion.
- Header class-tree (desktop): byte-identical.
- Week-init logic: the reference's `lre`/`eSe` decompile (`Ka(new Date,
  {weekStartsOn:1})`) matches the clone; an observed "previous week" on
  the reference's first load turned out to be leftover view state from
  the session-6 browser (a fresh reload of both apps renders the same
  Monday) — recorded as platform state, not app behavior.
- **The audit method this session: state-matched POPULATED-state
  diffing.** Session 6's exhaustive class-tree diff ran on EMPTY states
  (the reference account holds 0 tasks). This session created **four
  identical tasks through each app's own TaskDialog** (Parity Alpha
  10:00/work/high + description, Beta 12:00/personal/medium +
  description, Gamma 15:00/health/urgent, Delta 08:00/learning/low) and
  re-ran the full `<main>` class-tree diff WITH DATA — which is what
  surfaced everything below: none of these DOM nodes exist in the empty
  state.
- StatusCard selection, Log Activity ordering, notes ordering, the AI
  cards' structure: all verified equivalent (decompile + live).

## 2. The finding: 4 gaps — an ordering family, a library major, and a primitive form

1. **G-1 (High — user-visible)**: the clone's `GET /api/tasks` ordered
   tasks `startTime asc`; the reference's default `fn.Task.list()`
   returns **createdAt desc** (live-verified: creating Alpha→Beta→Gamma
   →Delta renders [Delta, Gamma, Beta, Alpha]). The Planning day-card
   chips (`slice(0,3)` + "+N more") and the selected-day task list
   render the array AS RETURNED — so the two apps showed different
   chips behind "+1 more" (REF: Delta/Gamma/Beta hiding Alpha; CLONE:
   Delta/Alpha/Beta hiding Gamma). Six sessions of class-tree diffs
   never saw it: tag+class diffs are blind to text and DOM order.
2. **G-2 (Med)**: the reference's dialog save ends with a fresh
   refetch (newest task FIRST); the clone's `createTask` optimistically
   APPENDED — the new task landed last until a reload.
3. **G-3 (Med — byte parity)**: recharts. The reference's pie DOM is
   the 2.x shape (ZERO `recharts-zIndex` strings in its bundle, no
   `g.recharts-shape` wrappers, tooltip wrapper a sibling AFTER the
   svg). The clone's recharts 3.10.1 emitted 12 empty zIndex layer
   groups + shape wrappers + a pre-svg tooltip + an extra wrapper div —
   visually identical, DOM-different. Session 0's 3.x pick was a
   scaffold default, not a measured fact.
4. **G-4 (Med — byte parity)**: the Badge primitive. The reference
   renders the CLASSIC shadcn badge (`Z1e`/`W$`): a `<div>` with
   `focus:ring-2 focus:ring-ring focus:ring-offset-2` in the base and
   `shadow`/`hover:bg-*` on the variants. The clone shipped the modern
   data-slot `<span>` without those classes. Used in exactly two spots
   (Planning chips + task items) — populated-state-only, which is why
   the empty-state diffs never saw it.
5. **F-2 (found mid-GREEN — test bug)**: the status-card e2e spec
   failed in the first full post-fix run (57/58). Investigated with a
   debug boot of the standalone build: the PATCH landed, the card
   re-rendered to "All caught up!" within 3s — **the app was correct;
   the spec's locator was the bug**. Its post-Mark-Complete locator
   filtered by the "Next Up" heading — but completing the last upcoming
   task swaps the card's h3 to "All caught up!", the locator resolves
   to ZERO elements, and the NEGATED assertion fails with "element(s)
   not found". A state-transition flake that only bites when no future
   task remains — on Sundays after the 10:00 seed slot, or after the
   day's last seeded task. Sessions 4–6 passed because their runs
   predated those times. (FS-16's sibling: the session-6 de-flake fixed
   the wall-clock dependency but kept a component-state assumption.)

## 3. Remediation (TDD: red → green)

- **Red:** 4 new spec failures predicted and confirmed against the
  pre-fix build (the chips order, the SPAN badge, the recharts 3 DOM,
  the append order).
- **Green:** `GET /api/tasks` → `orderBy: { createdAt: "desc" }` (with
  the ordering-is-parity comment); the store's `createTask` prepends;
  recharts downgraded to **2.15.4** (React-19-compatible; the only
  consumer's props are version-agnostic — decompiled g0e matches the
  clone's source exactly); `badge.tsx` rebuilt to the classic shadcn
  div form; the status-card spec's locator broadened to
  `/^(Next Up|All caught up!)$/` (verified green INSIDE the previously
  failing post-10:00 window).
- **Gate after:** lint ✓ · typecheck ✓ · **59/59 unit** · build ✓ ·
  **58/58 e2e × 2 consecutive full runs** (54 → 58: +4 pins) · smoke
  **30/30**.
- **Live parity re-verified on BOTH apps (populated):** Planning
  unselected **74/74**, day-selected **132/132** — only the documented
  filter/funnel icon + day-card div/button differences remain; the
  dashboard **845/838** — the 7-element delta is exactly the documented
  set (3 styled-jsx STYLE nodes + 4 LLM-content chip nodes); the
  task-block order and the recharts DOM now match. G-2 verified live
  (a dialog-created task takes the first block position without a
  reload). The mobile menu re-pinned 374/54/192 after the changes.
- Screenshots: all 20 captures re-run (the 2.x pie, the ordered chips,
  the DIV badges visible in 02/03/10/14).
- The reference's data was cleaned up (the 4 Parity tasks deleted via
  its own UI) — the account is back to 0 tasks, as found.

## 4. Environment notes

- The reference's login session expired mid-session (token TTL) —
  re-login restored it; the second expiry hit during the final diff
  (re-logged again). Same pattern as session 6.
- The reference's calendar came up on the PREVIOUS week on first load —
  leftover per-user view state from the session-6 browser, not an init
  difference (both apps' fresh reloads render the same Monday; the
  bundle's `Ka(new Date, {weekStartsOn:1})` init is identical).
- Creating a task at 12:30 through the reference's dialog: the
  datetime-local minutes spinbutton does not accept scripted fill —
  the task landed at 12:00 (the dialog's prefilled hour). A probing
  artifact, not a clone gap.
- The z-ai SDK 429'd throughout (unchanged, by design — fallbacks
  fired). The LLM-content chip-count difference in the dashboard diff
  (the reference's live summary vs the clone's fallback content) is
  the documented ADR-005 variance — the chip CLASSES are identical.
- agent-browser's `find role click` did not always dispatch the
  trusted events the clone's React handlers need on the STANDALONE
  build (the manual repro initially looked like a broken app); raw
  mouse move/down/up events and Playwright clicks both work. The
  standalone debug boot + Playwright one-off script is what proved the
  app correct and the spec's locator wrong (F-2).

## 5. Knowledge carried forward

- **FS-17 (new): array ordering is a parity surface — and class-tree
  diffs cannot see it.** The API response ORDER decides which Planning
  chips are visible; six sessions of 761/761 diffs never noticed a
  fully user-visible ordering gap because tag+class diffs are blind to
  text and DOM order, and the empty state has no chips at all. The
  method upgrade: diff with MATCHED POPULATED data, and treat response
  ordering as contract (pin it).
- **The same blind-spot class hid two more findings**: the Badge's
  element type (SPAN vs the reference's classic DIV) and the recharts
  major (3.x vs 2.x DOM) — both populated-state-only. "The library
  version is parity data" extends session 6's "dead config is parity
  data" (icon_sm).
- **F-2 / the state-transition corollary: a locator that scopes by a
  heading must survive the component CHANGING that heading.** The
  "Next Up" → "All caught up!" transition zeroes the locator and the
  negated assertion fails with "element(s) not found". Prove the app
  correct FIRST (a debug boot with a one-off Playwright script), then
  fix the spec — the opposite order would have shipped a fake "fix".
- **A passing suite encodes the run's clock and data state**: this
  spec's 6-session green streak was an artifact of pre-10:00 UTC runs
  on Sundays (the seed's last Sunday task starts at 10:00). Same
  lesson as FS-16, one layer up: seed-data timing is part of a spec's
  implicit input domain.
- Test counts moved to **59 unit / 58 e2e / 30 smoke**; the SKILL doc
  moves to v1.6.0 (FS-17).
