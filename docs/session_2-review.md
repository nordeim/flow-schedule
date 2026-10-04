# Session 2 Review — FlowSchedule (2026-10-04)

Review + remediation session over base `main @ 1742785` (the session-1
remediation). The operator's narrative for the prior session lives in
`docs/session_2.md`; this file is the reviewer's record for the session
that audited it. Plan: `docs/remediation-plan-session2.md`.

## 1. What was reviewed

- All five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; every command/test-count claim re-executed.
- The session-1 remediation commit (`1742785`) file-by-file: `site.ts`,
  `sitemap.ts`, `robots.ts`, `layout.tsx`, both new unit tests, the three
  touched e2e specs, `vitest.config.ts` — clean, contract-pinned.
- Full gate at base: lint ✓ · typecheck ✓ · 44/44 unit · build (19 routes)
  ✓ · 29/29 e2e · smoke 25/25.
- Live reference re-measurement (agent-browser, saved auth): mobile menu
  geometry **byte-identical** on both apps (trigger right 374 / bottom 50;
  menu right 374 / top 54 / w 192; items `My Account` + Profile/Settings/
  Logout) — no Tailwind v4 regression in the header/menu.
- Dashboard parity: card set, calendar grid `80px repeat(16, 60px)`,
  task-block styling, Quick Action inline hex gradients (byte-identical),
  canvas gradient endpoints; the oklab-vs-sRGB midtone delta was measured
  by pixel sampling at **0–3 RGB units** — the PAD's documented acceptance
  (ADR-004) holds with fresh evidence.
- Profile/Settings: heading structures identical on both apps.

## 2. The finding: seven Planning-page parity gaps

Session 0 had built `/Planning` from the live **empty-state** reference
(no tasks, no day selected) and inferred "reasonable" behavior. This
session decompiled the reference's actual Planning component from its
minified bundle (`eSe` in `reference/app-source/bundle.js`) and found
seven divergences (P-1…P-7, full table in the remediation plan):

1. `selectedDay` starts `null` in the reference (the whole selected-day
   section is render-guarded); the clone preselected today.
2. The day-card highlight follows the **selection** in the reference —
   there is no today-highlight; the clone highlighted today.
3. The reference has **no "Unscheduled" accordion** (the string is absent
   from its bundle); the clone had one.
4. The reference's Filter button is **decorative** (no handler in the
   bundle); the clone cycled a three-state filter.
5. Reference day-card chips are display-only (clicks **bubble** and select
   the day); the clone's chips opened the Edit dialog — the very behavior
   behind session 1's FS-7 e2e flake.
6. Reference task items carry no action buttons and no duration text;
   editing happens **only** from the Dashboard calendar task blocks.
7. The reference's Day Statistics is a **static placeholder** — its bundle
   contains no data branch; the clone computed real stats.

## 3. Remediation (TDD: red → green)

- **Red:** 6 new e2e specs + 1 rewrite + 1 extension in
  `tests/e2e/planning.spec.ts`; run against the pre-fix build — 7 failed
  exactly as predicted. `dashboard.spec.ts`'s unscheduled-task assertion
  migrated to API verification.
- **Green:** single-file rewrite of `src/app/(app)/Planning/page.tsx`
  implementing all seven reference behaviors.
- **Gate after:** lint ✓ · typecheck ✓ · 44/44 unit · build ✓ ·
  **34/34 e2e × 2 consecutive runs** (was 29) · smoke 25/25.
- **Live parity re-verified on both apps** (initial state AND the
  Monday-clicked state): heading, placeholder, highlight, and absence
  checks all match.
- **Mobile-menu pin held**: re-measured after the change — 374/54/192.
- 10 screenshots re-captured (incl. new `10-planning-selected.png`).

## 4. Environment notes

- The persistent shell's exported `DATABASE_URL` from session 1 was
  already cleared; `db/custom.db` (repo root) seeded and healthy
  (`"database":"up"`).
- The z-ai SDK returned 429s during parts of the session — all fallbacks
  fired as designed (the VLM-based screenshot diff was replaced by
  computed-style + pixel-sampling comparison, which is more precise
  anyway).

## 5. Knowledge carried forward

- **FS-11 (new):** decompile the reference's bundle before building a
  view — the live empty-state DOM is corroboration, not ground truth.
  "The reference wouldn't do that" is not evidence.
- **FS-7 (resolved properly):** chip interception was a symptom of
  diverging from the reference; matching it (display-only chips) made the
  flake structurally impossible instead of working around it.
- Test counts moved to **44 unit / 34 e2e**; docs and the skill realigned.
