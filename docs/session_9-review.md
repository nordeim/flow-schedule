# Session 9 Review — FlowSchedule (2026-10-04/05)

Review + remediation session over base `main @ e4c66e8` (the session-8
remediation `8a6d9f7` plus the operator's "update prompts" commit) on a
fresh `git clone` — the workspace had been reset. The reviewer's plan for
this session: `docs/remediation-plan-session9.md`.

## 1. What was reviewed

- All five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the full gates re-executed green at base
  (lint ✓ · typecheck ✓ · 66/66 unit · build ✓ (19 routes) · 63/63 e2e ·
  smoke 30/30).
- The session-8 remediation commit (`8a6d9f7`) — every fix verified in
  the code (the tw-animate-css import, lucide ^0.475.0, the classic
  dialog/select primitives, `serializeTask`/`serializeNote` wired into
  all 4 task/note routes) and still held by its pins.
- Environment contract rebuilt per the operator's instruction: `.env` =
  `DATABASE_URL="file:../db/custom.db"`, `db/` at the repo root
  (custom.db seeded + e2e.db), `.env.example`, vitest + playwright
  configs, 20 screenshots.
- **The audit method this session: the never-diffed surfaces + the
  environment itself.** Live state-matched class-tree diffs (an empty
  `parity-empty@flowschedule.app` user registered in the clone to match
  the reference's true 0-task baseline): dashboard **761/761** at BOTH
  1440×900 and 390×844 (only the 3 documented styled-jsx style nodes),
  Planning 63/63 + 98/98 modulo the day-card divergence, Profile
  **26/26**, Settings **39/39**; the OPEN Select listbox item states
  (session 8's suggestion — byte-identical, first-time diff); the
  mobile + desktop menu re-pins; and the reference's LLM content (both
  apps' LLMs observed LIVE for the first time).

## 2. The findings: 2 gaps — an environment hijack and the last class-tree divergence

1. **F-1 (High — environment/infrastructure)**: the repo's database
   location was not authoritative. The workspace injects
   `DATABASE_URL=file:/home/z/my-project/db/custom.db` (absolute,
   OUTSIDE the repo) into every shell — and Bun's parent-directory
   `.env` auto-loading does the same in any workspace with a parent
   `.env`. Under db-path v2.3's pass-through contract both win:
   reproduced, `db:push` created and seeded the PARENT file, and a dev
   server started in that shell pointed at it (a missing file once the
   parent was cleaned → "Unable to open the database file" on every
   query). Fixed with **db-path v3**: the schema-owning repo's own
   `.env` is authoritative (`chooseEnvSource` + `repoEnvDatabaseUrl`,
   pure, 17 new unit tests) with three deliberate exceptions — an
   ambient SQLite URL resolving INSIDE the repo (the e2e's
   `file:../db/e2e.db`) still wins, a non-SQLite ambient URL
   (production PostgreSQL) still wins, and no repo `.env` value →
   ambient wins. The Prisma CLI applies the same rule via the new
   `scripts/prisma-cli.ts` wrapper (prisma's dotenv never overrides an
   existing process-env value).
2. **F-2 (Medium — byte parity)**: the Planning day-card was a
   `<button … text-left …>` while the reference renders a plain
   clickable `<div …>` (live-measured: onclick, no role/tabindex/aria,
   `cursor-pointer`, `text-align: start`) — the last remaining live
   class-tree divergence (documented since session 7). Converted; the
   Planning class trees now diff **IDENTICAL** (63/63 unselected,
   98/98 day-selected) and the a11y trees match (`generic …
   [cursor:pointer, onclick]`). Keyboard access is the reference's own
   behavior (none) — documented acceptance, same class as its
   decorative Filter button.
- **P-1 (observed, no action)**: both apps' LLMs are LIVE (the
  reference rendered a Paul J. Meyer quote — its InvokeLLM succeeded;
  session 4's "Mark Twain fallback" claim is about the bundle's catch
  block and still holds — while the clone's z-ai SDK returned a Walt
  Disney quote). The first session observing both live; content stays
  non-deterministic by design, the fallback structure unit-pinned.
- **E-1 (spec robustness, in-suite)**: the badge spec's task-item
  locator had used the day-card's button TAG as its discriminator
  ("the task items are DIVs — the day CARDS are buttons"); the div
  conversion silently retargeted it onto the day-card's chip badge.
  Retargeted to `:not([class*="cursor-pointer"])` — the FS-19 locator
  corollary.

## 3. Remediation (TDD: red → green)

- **Red:** 21 failing unit tests (the v3 rule + the wrapper contract —
  "chooseEnvSource is not a function", `db:push` not routed through
  the wrapper) + 1 failing e2e spec (the day-card div pin — zero div
  day-cards on the pre-fix build).
- **Green:** db-path v3 (`chooseEnvSource`, `repoEnvDatabaseUrl`,
  exported `findSchemaRoot`); `scripts/prisma-cli.ts` +
  package.json (db:push/db:migrate/db:reset); the Planning day-card
  div conversion (+ 10 spec locator sites + the capture script); the
  badge-spec locator fix.
- **Gate after (in the polluted shell — the point of F-1):** lint ✓ ·
  typecheck ✓ · **88/88 unit** (66 → 88) · build ✓ · **64/64 e2e × 2
  consecutive full runs** (63 → 64) · smoke **30/30**.
- **Live parity re-verified on BOTH apps:** Planning IDENTICAL (both
  states); the dashboard re-diff 761/761 + the 3 style nodes; the
  mobile menu re-pinned (338/14/36×36 + 182/54/192×164,
  `animation-name: enter`, navigation round-trip); the desktop avatar
  menu re-pinned (1252/14/76×36 + 1136/54/192, right 1328); the
  F-1 acceptance in the polluted shell (db:push/db:seed target
  `<repo>/db/`, the dev server serves the seeded repo DB).
- Screenshots: all 20 captures re-run (the day-card divs render in
  03/09/10).

## 4. Environment notes

- The reference's login session held through the whole session (no
  re-login needed).
- The z-ai SDK 429'd on the summary endpoint during the e2e runs (the
  documented pattern — the fallback fired) while the daily-focus call
  SUCCEEDED live outside the suite: both behaviors observed in one
  session, both correct.
- The workspace's parent `.env` (a second pollution vector alongside
  the shell export) was neutralized for the audit by renaming; the
  harness shell export remained — which is exactly why the fix had to
  be in-code (v3) rather than in-shell discipline.
- agent-browser's `click @ref` opened every Radix surface needed
  (menu, dialog, select listbox) on BOTH apps — the trusted-events
  rule holds (eval `.click()` still cannot open them).

## 5. Knowledge carried forward

- **FS-19 (new): a pass-through env seam is a policy vacuum.**
  db-path v2.3 answered "how do I resolve a URL?" but never "whose URL
  wins?" — and the environment answered it by accident, twice over (a
  parent `.env` and a harness shell export). Rules: when a config value
  can arrive from multiple sources, write the PRIORITY rule down and
  pin it with tests ("both are supported" is not a contract, it's a
  coin flip); CLI tools with no-override dotenv semantics need a
  wrapper that applies the same rule — one rule, two enforcement
  points; acceptance-test the ENVIRONMENT, not just the code (this
  session's gates run in the polluted shell on purpose).
- **The locator corollary:** when an e2e locator uses a TAG as its
  discriminator, a tag conversion silently retargets it — discriminate
  on a class the reference's own DOM guarantees (day cards carry
  `cursor-pointer`; task items never do).
- **The reference's LLM content is not the fallback.** The live
  reference can render an LLM-chosen quote (Paul J. Meyer) while the
  decompiled fallback stays Mark Twain — evidence about content must
  distinguish LIVE output from FALLBACK output (the same distinction
  the sessions 3–8 "429 everywhere" environment never forced).
- Test counts moved to **88 unit / 64 e2e / 30 smoke**; the SKILL doc
  moves to v1.8.0 (FS-19; the env-trap rewrite; the day-card div
  convention).
