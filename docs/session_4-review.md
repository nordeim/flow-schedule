# Session 4 Review — FlowSchedule (2026-10-04)

Review + remediation session over base `main @ 200f070` (the session-3
Quick Actions remediation `c3a8ef8` plus the operator's session-log
commit). The operator's narrative for the prior session lives in
`docs/session_4.md`; this file is the reviewer's record for the session
that audited it. Plan: `docs/remediation-plan-session4.md`.

## 1. What was reviewed

- All five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the fast gates re-executed green at base.
- The session-3 remediation commit (`c3a8ef8`) — already verified by its
  own session; spot-checked the diff.
- Environment contract: `.env` = `DATABASE_URL="file:../db/custom.db"`,
  `db/` at the repo root (custom.db + e2e.db), health probe
  `"database":"up"`, `.env.example` matches the codebase.
- **Mobile navigation re-measured live on the reference** (390×844):
  trigger right 374 / bottom 50 (h 36); menu right 374 / top 54 / w 192,
  items [Profile, Settings, Logout] — byte-identical to the clone's
  pinned spec. **No Tailwind v4 regression on either app** (the header /
  menu geometry is unchanged; the pinned `--shadow-sm` and palette hexes
  remain load-bearing).
- **The audit target — the dashboard sidebar cards + layout chrome that
  had never been decompile-verified**: `ure` (StatusCard), `Y1e`
  (DailyFocus), `fre` (AISummary), `g0e` (SkillsMap), `X1e` (the Dashboard
  page layout), `are`/`rre` (calendar day rows / task blocks), `Xne`
  (TaskDialog). Every component was extracted from the reference bundle
  and corroborated live on the logged-in reference, including a full
  functional round-trip of the reference's Mark Complete button.

## 2. The finding: 26 gaps across 8 surfaces

Sessions 0–3 had verified the sidebar cards' **content presence**
(headings render, data appears) — the same blind-spot class as session
2's Planning finding (FS-11) and session 3's Quick Actions finding
(FS-12), one surface deeper: nobody had decompiled the cards' **state
machines** (loading skeletons, the rich "Next Up" state, live
indicators, the Mark Complete mutation) or the **layout chrome**
(full-bleed page container, day-row spacing, scrollbar cascade).

Highlights (the full table is in the remediation plan):

1. **StatusCard had the wrong CARD entirely** — the reference's "Next Up"
   is a rich card (priority badge, description, relative time, 75%
   progress bar + "Ready", a **functional Mark Complete** button that
   PATCHes the task, a decorative ArrowRight button) plus a loading
   skeleton; the clone shipped a minimal "Up Next" and nothing else.
   Live-verified on both apps after the fix.
2. **The deterministic AI fallback was the WRONG QUOTE** — the clone
   shipped a Paul J. Meyer quote; the reference's `j1` is Mark Twain's
   "The secret of getting ahead is getting started." That text renders on
   **every SDK failure** (the 429s make it the most-seen content), and it
   had been wrong since session 0.
3. **The reference's own format-string bug is part of the contract**:
   `format(d, "MMM d at HH:mm")` renders "Oct 6 AM1791284400 11:00"
   (date-fns reads `a` as AM/PM and `t` as the unix timestamp). The
   clone now reproduces the exact same string (FS-12's dead-code
   corollary, extended to bug parity — the live reference DOM shows it).
4. **The Dashboard page container was a session-0 guess**: the clone
   shipped `max-w-7xl mx-auto` (1280px at a 1440 viewport); the reference
   is full-bleed `p-4 md:p-6 lg:p-8` (measured 1440px live).
5. **Icon-level gaps**: AISummary's header icon is **Brain** (not
   Sparkles) plus a **Sparkles live indicator** (w-3 h-3 yellow);
   SkillsMap carries an **Award** indicator; the affirmation icon is
   **Target** (not CircleDot); the StatusCard's outline button is
   **ArrowRight**.
6. **SKILL_COLORS hex drift**: personal is emerald `#10B981` (not
   green-500), learning violet `#8B5CF6`, social amber `#F59E0B`, and the
   fallback is `#64748B` — all now unit-pinned.
7. **TaskDialog deleted without a confirm** — the reference asks
   `window.confirm("Are you sure you want to delete this task?")`.
8. **Day rows had no spacing** (the reference wraps them in
   `space-y-1.5`, a measured 6px gap) and the cells carried a clone-only
   `cursor-pointer`.
9. **The custom-scrollbar cascade**: the reference ships three global
   styled-jsx blocks (6px / 5px / 3px-width); the live last-rule-per-
   property resolution is height 5px, width 3px, radius-2 track/thumb —
   the clone's globals.css now matches the effective values.

## 3. Remediation (TDD: red → green)

- **Red:** 2 new unit suites (`ai-defaults` contract, SKILL_COLORS map)
  + 6 new/reworked e2e specs — every one failed against the pre-fix
  build exactly as predicted (one test expectation itself was corrected:
  the reference's underscore transform).
- **Green:** `StatusCard`, `DailyFocusCard`, `AISummaryCard`, `SkillsMap`
  rebuilt to their decompiled forms; `WeeklySchedule` chrome fixes;
  Dashboard container; TaskDialog confirm; `ai-defaults.ts` shared
  constants module; `domain.ts` color fixes; `globals.css` scrollbar;
  store gains `taskVersion` (mirrors the reference's X1e refresh counter
  — bumped by create/update/delete, deliberately NOT by Mark Complete)
  and `completeTask`; initial `loadingTasks: true` so the sidebar cards
  skeleton from first paint.
- **Flakes root-caused en route** (all recorded in the plan): a
  strict-mode substring collision (the Next Up h4 title matches a
  "Skills Map" role query — `exact: true`), a skeleton-state evaluate
  race (waitForFunction on the loaded-state icon), a `span:last-child`
  selector that matched the wrong span (`:scope > span`), and an **e2e
  residue cascade** where failed specs left tasks that pushed the
  planning top-3 chips and the Next Up selection around — all E2E specs
  now wipe `E2E *` residue at start (FS-9 taken to its conclusion).
- **Gate after:** lint ✓ · typecheck ✓ · **59/59 unit** · build ✓
  (self-type-checked) · **43/43 e2e × 2 consecutive full runs** · smoke
  25/25.
- **Live parity re-verified on both apps** (agent-browser): the Next Up
  card byte-identical incl. the Mark Complete round-trip (PATCH →
  completed → the card advances), DailyFocus showing the Mark Twain
  fallback with the reference's vertical layout, AISummary's Brain +
  Sparkles header, the full-bleed 1440 container, the 6px day-row gap,
  and the mobile trigger (374/50/36; the menu geometry is pinned by the
  e2e spec, re-measured on the reference at 374/54/192).
- 15 screenshots in `docs/screenshots/` (01–09 re-captured + new
  14-statuscard-nextup, 15-taskdialog; the Radix/dialog captures needed
  a Playwright script for trusted pointer events —
  `scripts/capture-screenshots.mjs`).

## 4. Environment notes

- The z-ai SDK returned 429s throughout the session — every fallback
  fired as designed, which conveniently made the (now-correct) Mark
  Twain fallback the live-verified default on both cards.
- Both browser sessions (reference + clone) expired mid-session and were
  re-authenticated; the reference auth state was re-saved.
- The smoke suite hits the dev server (:3000) — its request log
  interleaves with manual traffic in `dev.log` (initially confusing
  during the Mark Complete verification; the e2e's trusted-click
  evidence on the production standalone is the authoritative pin).

## 5. Knowledge carried forward

- **FS-14 (new):** fallback content and layout chrome are parity
  surfaces — the deterministic fallback strings render on every SDK
  failure (decompile them like any UI string; a "reasonable" quote
  guess stayed wrong for three sessions), and the page-container /
  spacing / scrollbar classes are measurable chrome, not style
  preferences. "The card renders content" is not a parity claim.
- **Bug parity extends beyond dead code:** the reference's live DOM
  renders "Oct 6 AM1791284400 11:00" from an unescaped `at` in its
  date-fns format string — mirrored exactly (verified byte-identical
  via the same date-fns call).
- **Residue cascades are cross-spec:** a failed spec's un-cleaned data
  can fail a DIFFERENT spec (planning chips, Next Up selection). Cleanup
  blocks should wipe the whole `E2E *` family, not just their own title.
- Test counts moved to **59 unit / 43 e2e**; the sidebar-card surfaces
  are now decompile-pinned like every other surface. Docs and the skill
  realigned (v1.3.0).
