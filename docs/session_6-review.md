# Session 6 Review — FlowSchedule (2026-10-04)

Review + remediation session over base `main @ d99d8ae` (the session-5
login/routing remediation `53706a8` plus the operator's session-log commits;
`git pull` fast-forwarded `docs/session_6.md`). The operator's narrative for
the prior session lives in `docs/session_6.md`; this file is the reviewer's
record for the session that audited it. Plan:
`docs/remediation-plan-session6.md`.

## 1. What was reviewed

- All five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the fast gates re-executed green at base
  (lint ✓ · typecheck ✓ · 59/59 unit).
- The session-5 remediation commit (`53706a8`) — the login page, the
  route guard, the root dashboard, and the 404 re-verified LIVE against the
  reference: header/main/containers byte-identical, the login surface still
  13/13-class parity, post-login `/` landing identical.
- Environment contract re-verified: `.env` = `DATABASE_URL="file:../db/
  custom.db"`, `db/` at the repo root, `.env.example` matches the codebase
  (unit-pinned), vitest + playwright configs in place, 20 screenshots.
- **Mobile navigation re-pinned live on BOTH apps** (390×844, trusted
  clicks): trigger 374/50/36 on both; menu right-anchored to the trigger,
  y=54, w=192, items [Profile, Settings, Logout]; re-pinned again AFTER the
  remediation — **no Tailwind v4 regression at any point**.
- **The audit method this session: state-matched FULL-DOM class-tree
  diffing.** The reference account turned out to hold **0 tasks and 0
  notes** (verified via its entity API — the entity is named "Note"), so an
  empty user was registered in the clone and the COMPLETE `<main>` class
  tree (every element's tag + class string, in document order) was dumped
  and element-wise diffed for the dashboard (761 elements), Planning
  unselected (63), and Planning day-selected. This exhaustive method —
  versus the prior sessions' selected-element checks — is what surfaced the
  small-gap family below.
- Profile/Settings pages, the suspected last unverified surface: full
  bundle decompile + string comparison — **already byte-identical** (the
  session-4 container claim holds; the card content matches too).
- e2e baseline: one failure at base (50/51) that exposed a latent flake —
  see F-1.

## 2. The finding: 8 gaps — a structural one, a label family, and a latent flake

1. **P-1 (structural, High)**: the Planning selected-day section rendered
   as two Radix **Accordions** (button trigger, chevron, collapsible
   animation, h3 heading inside the trigger). The reference renders two
   plain **Cards** — always visible, no button, no heading role (its
   CardTitle is a `div`; the live a11y tree shows the date as plain
   StaticText). The reference's Card merge signature
   (`text-card-foreground shadow bg-white/60 … rounded-3xl`) is reproduced
   exactly by the clone's identical `cn`/Card once the Accordion is
   removed.
2. **P-2 (High — the FS-11 reprise)**: the TaskDialog submit label. The
   clone shipped `{editing ? "Save Changes" : "Add Task"}` — a session-0
   inference that even crept into the e2e spec as a pin. The decompiled
   reference: `children:[Save icon, r ? "Update" : "Create", " Task"]` →
   **"Create Task" / "Update Task"**.
3. **P-3/P-4 (Med)**: the dialog footer details — the submit was missing
   the `Save` icon (`w-4 h-4 mr-2`) and carried an extra `text-white`; the
   Delete icon lacked `mr-2`; the right footer container was `flex gap-2`
   instead of **`flex gap-3 ml-auto`**.
4. **P-5/P-6 (Med)**: the Planning header — both icons missing `mr-2`
   (the Filter button measured 89.1px vs the reference's 100.7px — the
   reference stacks `mr-2` on top of the button's `gap-2`), and the Add
   Task button carried a clone-only hover gradient shift + `text-white`.
5. **P-7 (Med)**: the Dashboard Refresh Calendar button — the reference
   passes `size:"icon_sm"`, a variant **absent from its size map**, so its
   button gets NO size class and sizes from content (**30×30px**,
   measured). The clone's `button.tsx` had invented
   `icon_sm: "h-9 w-9 rounded-lg"` (36×36px).
6. **F-1 (High — test bug, new flake family FS-16)**: the status-card e2e
   spec matched `div.rounded-3xl` + task-title text — which resolves to
   BOTH the WeeklySchedule card (the calendar renders completed tasks; no
   status filter on either app, decompile-verified) and the StatusCard.
   Strict-mode violation + an impossible `toHaveCount(0)` whenever
   `now+5min` lands inside the 07:00–22:00 grid. Sessions 4/5 passed only
   because their runs happened pre-07:00 UTC — a **time-of-day-dependent
   locator**. This session's 09:0x run exposed it.

## 3. Remediation (TDD: red → green)

- **Red:** 10 spec failures predicted and confirmed against the pre-fix
  build (8 planning + 2 dashboard; the de-flaked status spec passed on the
  old build, as expected for a test-only fix).
- **Green:** Planning page Accordion → Card swap; TaskDialog footer
  rebuilt to the decompiled reference; Planning header icons `mr-2` +
  button class cleanup; `icon_sm: ""` in `button.tsx` (the dead-variant
  mirror); the status-card spec re-scoped to the StatusCard via its
  "Next Up" heading.
- **Gate after:** lint ✓ · typecheck ✓ · **59/59 unit** · build ✓ ·
  **54/54 e2e × 2 consecutive full runs** (51 → 54: +2 planning pins, +1
  dashboard pin; the de-flaked spec verified INSIDE the failing
  time-of-day window) · smoke **30/30**.
- **Live parity re-verified on BOTH apps:** Planning day-selected
  **98/98 elements** in the class tree (was 98/106); dashboard **761/761**
  (only the 2 documented lucide polyline/path internals remain); the
  dialog verified live in both create and edit modes; the Refresh button
  **30×30 on both apps**; the mobile menu re-pinned 374/54/192 after the
  changes.
- Screenshots: 02-dashboard, 03-planning, 10-planning-selected,
  15-taskdialog re-captured; the capture script extended with the desktop
  02/03/10 captures.

## 4. Environment notes

- The reference account holds **no data** (0 tasks / 0 notes) — which is
  exactly why this session's state-matched comparison was possible: an
  empty user was registered in the clone (`parity-empty@flowschedule.app`,
  local dev DB only) so both apps rendered their empty-state surfaces
  side-by-side. The reference's empty states (SkillsMap "No activities
  today", StatusCard "All caught up!", Planning "No tasks"/"No tasks
  scheduled for this day") were all verified byte-identical to the clone's
  — the sessions 2–4 state pins hold.
- The reference's task entity is named "Note" (capitalized) at its API;
  its `/api/entities/notes` 404s — a naming detail relevant only to API
  probing, not to UI parity.
- The reference's login session expired mid-session (token TTL); re-login
  restored it. The clone's Radix Dialog AND the reference's both require
  trusted pointer events on their current builds — the bundle decompile
  remains the ground truth for dialog internals, pinned by the e2e.
- The z-ai SDK 429'd throughout (unchanged, by design — fallbacks fired).

## 5. Knowledge carried forward

- **FS-16 (new): time-of-day-dependent e2e locators.** A spec that
  creates a task at `now+N minutes` and asserts page-wide text locators
  changes behavior with the wall clock (the 07:00–22:00 calendar grid).
  Two consecutive green runs prove nothing about the other 22 hours —
  scope locators to the component under test (the StatusCard via its
  heading), and prefer asserting the component's CONTENT over the page's
  element COUNT.
- **The exhaustive class-tree diff is the right closing move**: selected
  element checks (sessions 1–5) found the big structural gaps, but the
  `mr-2`/`text-white`/`gap-3`-sized gaps only fell out of a full-DOM,
  state-matched, element-ordered diff. Both apps at 761/761 and 98/98 is
  the strongest parity statement this project has made.
- **Dead config is parity data**: the reference's `size:"icon_sm"` — a
  variant its own map lacks — is not noise to "fix" but behavior to
  mirror (no size class → content-sized button). The same class as the
  mirrored dead-code alert (session 3) and the format-string bug
  (session 4), now at the component-config level.
- **Specs can inherit wrong inferences**: the planning e2e spec pinned
  the clone's invented "Add Task" submit label. A spec is only as
  reference-true as the decompile that produced it — when a decompile
  contradicts a spec, the spec loses (and gets rewritten).
- Test counts moved to **59 unit / 54 e2e / 30 smoke**; the SKILL doc
  moves to v1.5.0 (FS-16).
