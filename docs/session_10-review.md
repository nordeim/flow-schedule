# Session 10 Review — FlowSchedule (2026-10-04/05)

Review + remediation session over base `main @ be137a4` (the session-9
remediation `7c26edd` plus the operator's docs/session_10.md prompt
commit) on a `git pull`ed workspace (not reset — the tree was clean and
current). The reviewer's plan for this session:
`docs/remediation-plan-session10.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the full gates re-executed green at base
  (lint ✓ · typecheck ✓ · 88/88 unit · build ✓ (19 routes) · **64/64
  e2e** · smoke 30/30).
- The session-9 remediation commit (`7c26edd`) — every fix re-verified
  in code (db-path v3's `chooseEnvSource`/`repoEnvDatabaseUrl`, the
  `scripts/prisma-cli.ts` wrapper + package.json db scripts, the
  Planning day-card plain div) and held by its 64 pins.
- The dev server re-verified on the repo's own seeded `db/custom.db`
  (the session-9 F-1 acceptance in the polluted shell: login + CRUD
  green, the parent `db/` absent).
- **The audit targets were session 9's two closing suggestions** — the
  Focus Timer's RUNNING-state visuals and a populated Log Activity
  history — plus a NEW audit method: the **attribute-inventory diff**
  (all attribute names on both DOMs, state-matched, on the idle
  dashboard + the open TaskDialog + the open menus).

## 2. The findings: 3 gaps — a formatter variant, a whole attribute
class, and one input cap

1. **F-2 (High — user-visible text parity)**: the Log Activity
   relative times used the NON-strict date-fns formatter. Live-diffed
   on a populated 3-task history (same end_time instants on both apps):
   the reference renders "Ended **3 hours ago**" / "Completed **in 2
   days**" while the clone rendered "Ended **about 3 hours ago**" /
   "Completed **in 1 day**". Decompile (the live bundle's H1e): the
   reference calls `formatDistanceToNowStrict` (`GJ(Wc(end_time),
   {addSuffix:!0})` — its token table picks plain `xHours`/`xDays` with
   Math.round; both apps bundle the SAME v3/v4 enUS locale object).
   Fixed: one import + one call site in `QuickActions.tsx`; e2e-pinned
   (a 3h-past end_time renders "Ended 3 hours ago", never "about").
2. **F-1 (Medium — DOM attribute parity)**: the clone's 9 shadcn-style
   primitives emitted `data-slot` markers — 6 elements on the idle
   dashboard, 24 in the open TaskDialog — while the reference renders
   ZERO `data-slot` attributes in ANY state. Invisible to every
   class-tree diff (they extract `class` only — the method's blind
   spot). Nothing depended on them (repo-wide search: no CSS, no
   locator, no script). Removed (24 sites); pinned by an
   attribute-count e2e spec (`[data-slot]` count 0, idle AND dialog).
3. **F-3 (Low — DOM attribute parity, found BY F-1's verification)**:
   the TaskDialog's title input carried `maxLength={300}` the
   reference's input does not (live-verified: its title input shows
   `class, id, placeholder, required, value` — no maxlength). Removed
   client-side (the reference's typing UX is the parity surface; pinned
   via `not.toHaveAttribute("maxlength")`); the 300-char write guard
   stays in the API routes (self-hosted validation — the
   login-rate-limiter evidence class).
- **P-1 (observed, no action)**: the reference's Log Activity fetches
  its own server-sorted list (`fn.Task.list("-end_time")`) while the
  clone re-reads the store and client-sorts — behaviorally equivalent
  for every reachable state; documented in the remediation plan.
- **Focus Timer: FULL PARITY, no action** — the running and paused
  panel class trees diff **byte-identical** on both apps; the minutes
  input hides while running on both; pausing snaps the display back to
  the full duration on both (the reference's idle effect = the clone's
  derived display); the W1e decompile re-verified every semantic
  (parse rule, disabled-at-0, reset); and the completion alert was
  LIVE-verified on the reference this session (alert hooked, minutes=1:
  01:00 → 00:00 → `alert("Focus session complete!")` → display snaps
  back to 01:00) — previously only decompile + one-off evidence.

## 3. Remediation (TDD: red → green)

- **Red:** 2 new e2e specs failed on the base build (the strict-wording
  spec: "Ended about 3 hours ago" ≠ the pin; the data-slot spec: 6 and
  24 ≠ 0) + 1 assertion added mid-flight (the maxlength pin — RED
  verified separately before its fix).
- **Green:** `formatDistanceToNowStrict` (one import + one call site);
  the 24 `data-slot` deletions across the 9 primitives; the
  `maxLength={300}` removal.
- **Gate after:** lint ✓ · typecheck ✓ · **88/88 unit** · build ✓ ·
  **66/66 e2e × 2 consecutive full runs** (64 → 66) · smoke **30/30**.
- **Live parity re-verified on BOTH apps:** the populated Log Activity
  panel now diffs **IDENTICAL** ("3 hours ago" / "in 2 days" / "4 days
  ago"); `[data-slot]` count 0 on the clone's idle dashboard AND open
  dialog; the mobile menu re-pinned POST-fix (the Button primitive
  changed — trigger 338/14/36×36 + menu 182/54/192×164, right 374,
  `animation-name: enter`, navigation round-trip) and the desktop
  avatar menu re-pinned POST-fix (1252/14/76×36 + 1136/54/192, right
  1328) — **no Tailwind v4 regression**.
- Screenshots: all 20 captures re-run on the remediated codebase.

## 4. Environment notes

- The reference's login session held through the whole session (no
  re-login needed); the browser's local TZ is UTC (the parity tasks
  were created with UTC instants on both apps — the C-task "in 2 days"
  vs "in 1 day" delta was the formatter, not the timezone: verified by
  testing both date-fns variants locally against the same instants
  BEFORE the decompile confirmed which variant the reference calls).
- The z-ai SDK 429'd on the summary endpoint during the e2e runs (the
  documented pattern — the fallback fired) while the reference's
  Daily Focus rendered a Walt Disney quote live (LLM live again).
- agent-browser's `click @ref` (trusted events) opened every Radix
  surface on both apps; the reference's task creation went through its
  own dialog (datetime-local value set via the native setter + input
  event — the React controlled-input seam).

## 5. Knowledge carried forward

- **FS-20 (new): class-tree parity has a blind spot — diff the
  ATTRIBUTE inventory too.** Nine sessions of "identical" class-tree
  diffs never saw the shadcn generator's `data-slot` markers (24 sites,
  attribute-only, no class/rule footprint). Rules: run an
  all-attribute-NAME inventory diff on both DOMs periodically; the
  difference set separates framework markers (remove) from the
  documented a11y floor (keep) and dev-mode artifacts (ignore — absent
  in the production standalone); generator conventions are not the
  reference's conventions (the session-7/8 "classic form" conversions
  were the class-space lesson; data-slot was the attribute-space
  repeat). One method, three findings (F-1, F-3, plus confirmation the
  rest of the extras are the documented a11y floor).
- **FS-21 (new): "uses date-fns" is not a formatter contract — pin the
  VARIANT.** Same locale bundle, same tokens, different call
  (`formatDistanceToNowStrict` vs `formatDistanceToNow`) → "3 hours
  ago"/"in 2 days" vs "about 3 hours ago"/"in 1 day". Rules: when a
  dependency exposes near-identical variants, decompile which one the
  reference actually calls (the minified call site + token table
  answers it); pin with band-stable discriminators (3h ± seconds stays
  "3 hours" in both variants — 90 minutes would flap).
- **The populated-diff discipline:** state-matched diffs need the same
  DATA on both apps — 3 tasks created through each app's own UI at the
  same instants; only then do wording differences isolate to code (the
  formatter), not to inputs.
- Test counts moved to **88 unit / 66 e2e / 30 smoke**; the SKILL doc
  moves to v1.9.0 (FS-20 + FS-21; the data-slot and strict-formatter
  conventions; the uncapped title input).
