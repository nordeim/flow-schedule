# Session 8 Review — FlowSchedule (2026-10-04)

Review + remediation session over base `main @ 567a6a6` (the session-7
remediation `2461446` plus the operator's session-log commit that added
`docs/session_8.md` — the Session-7 execution narrative). The reviewer's
plan for this session: `docs/remediation-plan-session8.md`.

## 1. What was reviewed

- All five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the full gates re-executed green at base
  (lint ✓ · typecheck ✓ · 59/59 unit · build ✓ · 58/58 e2e · smoke 30/30).
- The session-7 remediation commit (`2461446`) — every fix verified in
  the code (tasks route `orderBy createdAt desc`, store prepend,
  recharts 2.15.4, the classic Badge div) and still held by its pins.
- Environment contract re-verified: `.env` = `DATABASE_URL="file:../db/
  custom.db"`, `db/` at the repo root, `.env.example`, vitest +
  playwright configs, 20 screenshots.
- **The audit method this session: the never-diffed surfaces.** Session 7
  diffed the populated CURRENT week; this session diffed (1) the
  populated **NEXT-week calendar view** (state-matched: the reference's
  own leftover task reproduced on the clone — created via the calendar
  dialog + Mark Complete so the statuses matched too), and (2) the
  **EDIT-MODE TaskDialog** (a populated-only surface — session 6 diffed
  the create mode; the Delete button and the prefilled values exist only
  in edit mode), plus (3) the open Select listbox and (4) the open-menu
  class tree. The reference's leftover task became the matched-data seed:
  **"Live verify scheduled"** (completed, work, Tue Oct 6 11:00, 60min) —
  created during session 5's Mark Complete live verification and never
  deleted; sessions 6/7's "the account is back to 0 tasks" checks had
  only looked at the CURRENT week (P-3, cleaned up at the end).

## 2. The finding: 4 gaps — dead animation CSS, a library version, the classic primitive family, and an asymmetric wire

1. **G-1 (High — behavioral/visual)**: every Radix animation was DEAD
   CSS. `dialog.tsx`/`dropdown-menu.tsx`/`select.tsx` carry the full
   shadcn animation class set, `tw-animate-css` 1.4.0 sat in
   devDependencies — and `globals.css` never imported it. The built
   stylesheet contained ZERO rules for `animate-in`/`fade-in-0`/
   `zoom-in-95`/`slide-in-from-*` (grep-verified). The reference's live
   stylesheet defines `.animate-in { animation-name: enter;
   animation-duration: 0.15s }` — its dialog genuinely slides/zooms/
   fades in. Seven sessions of class-tree diffs were blind to it (class
   equality is not CSS existence), and static e2e pins never assert
   motion. The sibling `tailwindcss-animate` (v3 plugin, unusable under
   v4 CSS-first) was equally dead weight.
2. **G-2 (High — byte parity)**: lucide-react 0.525.0 vs the reference's
   **0.475.0** (the banner is IN its bundle). The reference's factory
   emits exactly ONE class per icon; 0.525+ emits two for renamed icons
   (the clone rendered `lucide lucide-trash2 lucide-trash-2` vs the
   reference's `lucide lucide-trash2`) and different icon NODES (LogOut
   as path+path vs the reference's polyline+line — the long-documented
   "lucide internals" divergence is VERSION-driven). The same evidence
   class as session 7's recharts 2.x pin: the library version is parity
   data.
3. **G-3 (Medium — byte parity)**: the classic shadcn primitive family
   (the session-7 Badge story, continued): DialogContent (modern
   `left-1/2 -translate-x-1/2`, no slides, `rounded-lg` vs the classic
   `left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]` + 4
   slide classes + `sm:rounded-lg`), DialogTitle (missing
   `tracking-tight`), SelectTrigger (`placeholder:` variant vs
   `ring-offset-background data-[placeholder]:`), SelectContent (missing
   the side `slide-in-from-*` classes).
4. **G-4 (Medium — API contract)**: the wire was asymmetric — requests
   spoke the documented snake_case (`start_time`, `duration_minutes`)
   while the responses returned raw camelCase Prisma objects (plus the
   clone-internal `isSample`/`userId`, plus notes' `tags` as a JSON
   string). The reference's entity API speaks snake_case on both
   directions (its bundle's TaskDialog state is
   `{start_time:"", end_time:"", duration_minutes:60}`; notes' tags are
   consumed as an array). Fixed with `serializeTask`/`serializeNote`
   (`src/lib/serialize.ts`) — the documented contract became true.
- **P-1 (docs)**: README's daily-focus row still said "Paul J. Meyer
  default" — session 4 fixed the fallback to the Mark Twain set; the row
  was never updated.
- **P-2 (documented divergence)**: the dropdown ITEM class strings
  differ in ORDER (and the reference's even carries duplicated
  `flex items-center px-2 py-1.5` tokens — plain concat, no twMerge).
  Same class SET, style-neutral, geometry identical. Not fixed —
  replicating plain-concat merges buys no visual parity.
- **P-3 (residue)**: session 5's leftover task on the reference —
  deleted via the reference's own dialog (confirm armed), restoring the
  TRUE 0-task baseline.

## 3. Remediation (TDD: red → green)

- **Red:** 7 unit tests (the serializer contract — module absent) + 5
  new e2e specs, all failing against the pre-fix build exactly as
  predicted (computed `animation-name: none`; no `tracking-tight`; no
  `ring-offset-background`; the dual trash class; `startTime`/
  `isSample` on the wire).
- **Green:** `@import "tw-animate-css"` in `globals.css` (+
  `tailwindcss-animate` removed from devDependencies); lucide-react
  pinned to `^0.475.0`; the classic DialogContent/DialogTitle/
  SelectTrigger/SelectContent forms; `serializeTask`/`serializeNote`
  wired into all 4 task/note routes + `mapTask`/`mapNote` reading the
  snake_case wire.
- **E-C (spec robustness)**: the mobile-menu geometry spec now waits for
  `getAnimations()` to finish before measuring (Playwright's
  `boundingBox()` includes transforms — a mid-zoom read would flake the
  192±2 width pin); the capture script settles animations before the
  menu/dialog shots.
- **Gate after:** lint ✓ · typecheck ✓ · **66/66 unit** (59 → 66) ·
  build ✓ · **63/63 e2e × 2 consecutive full runs** (58 → 63) · smoke
  **30/30**.
- **Live parity re-verified on BOTH apps:** the EDIT-MODE dialog
  class-tree diff is **0/62** — byte-identical including the container
  string and the input values; the NEXT-week populated calendar:
  **0 diffs across the entire calendar + Quick Actions region (elements
  0–653)** with the task block at the identical DOM index [227]; the
  dialog's computed animation-name is `enter` on both apps; the mobile
  menu re-pinned at 338/14/36×36 + 182/54/192×164 (identical, now
  animated like the reference's); the Log Activity populated entries
  identical; the wire verified live (snake_case + tags arrays + no
  internal fields).
- Screenshots: all 20 captures re-run (the script extended to settle
  animations and to re-capture the profile/settings/quickaction/
  mobile-dashboard views so the lucide 0.475 icons render in every
  shot).
- The reference's data cleaned up (its leftover task deleted via its own
  UI) — the account is back to the TRUE 0-task baseline.

## 4. Environment notes

- The reference's login session held through the whole session (no
  mid-session re-login needed for once).
- The z-ai SDK 429'd throughout (unchanged, by design — the fallbacks
  fired; the e2e log lines are the documented pattern).
- agent-browser's `click @ref` (its automation API, NOT eval `.click()`)
  DID open the reference's Radix menus this session — the
  trusted-events requirement holds for eval clicks only.
- One measurement detour: a week-navigation click fired twice cumulatively
  (the browser had already advanced), producing a phantom "task block
  missing" alarm — resolved by re-checking which week the page showed
  (the FS-17-family lesson: verify the VIEW STATE before diffing).

## 5. Knowledge carried forward

- **FS-18 (new): class equality is not CSS existence.** Seven sessions
  of 761/761-class-tree diffs passed while every animation in the app
  was a dead string — the classes matched; the stylesheet had no rules
  behind them. Rules: importing a utility library is load-bearing (pin
  computed styles, grep the BUILT stylesheet); motion is a parity
  surface; geometry-measuring specs must settle animations first
  (`getAnimations()` finished — `boundingBox()` includes transforms).
- **The lucide corollary to "the library version is parity data"**: the
  reference's VERSION BANNER is readable in its bundle (v0.475.0), its
  icon factory is decompilable (one class per icon), and the icon NODE
  shapes differ across versions. The documented "lucide polyline/path
  internals" divergence from sessions 4–7 was never "not actionable" —
  it was a version pin waiting to be measured.
- **Populated-only surfaces keep yielding**: the edit-mode dialog (the
  Delete button + prefilled values exist only there) hid three of this
  session's four code gaps. Diff BOTH modes of every interactive
  component.
- **The wire contract is symmetric or it is drifting**: requests spoke
  snake_case while responses shipped camelCase Prisma passthrough — the
  asymmetry actively misled this session's own API probing (`t.start_time`
  → undefined). A serializer seam (`src/lib/serialize.ts`) now owns the
  response shape, unit-pinned.
- **Cleanup claims must match their probe scope**: "the account is back
  to 0 tasks" was true only for the CURRENT week — session 5's residue
  sat in next week the whole time. When verifying cleanup, enumerate via
  the API or check EVERY view that can hold data.
- Test counts moved to **66 unit / 63 e2e / 30 smoke**; the SKILL doc
  moves to v1.7.0 (FS-18; the stack-table recharts/ignoreBuildErrors
  rows were also corrected to match reality).
