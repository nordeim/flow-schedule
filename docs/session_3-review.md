# Session 3 Review — FlowSchedule (2026-10-04)

Review + remediation session over base `main @ dac1fad` (the session-2
Planning parity remediation). The operator's narrative for the prior
session lives in `docs/session_3.md`; this file is the reviewer's record
for the session that audited it. Plan: `docs/remediation-plan-session3.md`.

## 1. What was reviewed

- All five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; every command/test-count claim re-executed.
- The session-2 remediation commit (`dac1fad`) file-by-file: the Planning
  page rewrite (clean, comments cite bundle evidence), the two e2e specs.
- Full gate at base: lint ✓ · typecheck ✓ · 44/44 unit · build (19 routes)
  ✓ · 34/34 e2e · smoke 25/25.
- Environment contract: `.env` = `DATABASE_URL="file:../db/custom.db"`,
  `db/` at the repo root (custom.db + e2e.db), health probe `"database":"up"`.
- Live reference re-measurement (agent-browser, saved auth): mobile menu
  geometry **byte-identical** on both apps (trigger right 374 / bottom 50;
  menu right 374 / top 54 / w 192) — no Tailwind v4 regression in the
  header/menu.
- Deferred-work audit (PAD §11): the `ignoreBuildErrors` flag and the
  rate-limiter bucket leak were both actionable (D-1/D-2).

## 2. The finding: nine Quick Actions gaps (Q-1…Q-7 + D-1/D-2)

Sessions 0–2 verified the Quick Actions card **at rest** — the four tiles
and their inline hex gradients were measured byte-identical. The
**open-panel state** was never decompiled. This session extracted the
reference's Quick Actions components from its minified bundle
(`G1e` container + `z1e`/`W1e`/`H1e`/`K1e` panels + the icon map) and
corroborated live on both apps:

1. **Q-1 container morph** — the reference's whole card becomes the
   action's gradient (`p-4 … overflow-hidden min-h-[280px]`, motion
   layout + an AnimatePresence expanding overlay from the clicked tile);
   the clone used a static white card with a separate gradient panel.
2. **Q-2 header replacement** — the reference replaces the "Quick
   Actions" h3 with the panel header; the clone showed both.
3. **Q-3 tile geometry** — `h-24 rounded-2xl p-3 shadow-lg`, grid
   `gap-3`, icon `w-5 h-5 mb-1.5`, label `text-[11px]`, framer
   hover/tap; the clone had `h-28 rounded-xl p-5 … text-sm`.
4. **Q-4 quick-add form** — placeholder-only input (no label), size-sm
   `rounded-lg` buttons, a **slate-700** submit (not a blue gradient).
5. **Q-5 Focus Timer** — minutes input hidden while running, Play/Pause
   toggle (the clone showed a RotateCcw "pause" icon), completion alert,
   neutral outline reset button, `mt-2` close button.
6. **Q-6 Log Activity** — a READ-ONLY top-5 completed/past history with
   relative end times; the clone had a 20-row action list with
   clone-only Done buttons.
7. **Q-7 Brainstorm** — three views with note EDITING (Update/Save),
   30-char truncated clickable previews, Eye/Trash2 icon actions, and
   `window.confirm` deletes; the clone had none of those.
8. **D-1** — `typescript.ignoreBuildErrors: true` still shipped
   (deferred by PAD §11; typecheck was clean, so removal was safe but
   untested).
9. **D-2** — the rate-limiter `buckets` Map never evicted expired
   entries (unbounded growth under a distributed key spray).

Two insights worth recording: the reference's own **dead code** — the
"Please set a valid duration." alert is unreachable behind
`disabled: minutes<=0` — must be MIRRORED, not "fixed"; and Playwright's
`getByText` can match a still-mounted controlled **textarea's
default-value text node**, which produced a load-dependent e2e flake
(fixed by role-scoped locators; recorded as FS-13).

## 3. Remediation (TDD: red → green)

- **Red:** 6 new/reworked e2e specs + 2 new unit suites written first;
  every one failed against the pre-fix build exactly as predicted.
- **Green:** single-file rewrite of
  `src/components/dashboard/QuickActions.tsx` implementing the
  decompiled container + all four panels (the timer was translated to a
  derived-idle display to respect `react-hooks/set-state-in-effect`);
  `next.config.ts` flag removal; rate-limiter throttled eviction.
- **Gate after:** lint ✓ · typecheck ✓ · **53/53 unit** · build ✓
  (self-type-checked — no bypass flags) · **38/38 e2e × 2 consecutive
  full runs** · smoke 25/25.
- **Live parity re-verified on both apps:** container classes + computed
  gradients, tile geometry, panel buttons, minutes-hidden running state,
  and the mobile-menu geometry re-pin (374/54/192) after the change.
- The Focus Timer completion alert was verified by a one-off Playwright
  run ("Focus session complete!" fires at 0; too slow for the suite).
- 13 screenshots in `docs/screenshots/` (incl. the three new
  quick-action open-panel captures).

## 4. Environment notes

- The persistent shell's exported `DATABASE_URL` from session 1 was
  already cleared; `db/custom.db` (repo root) seeded and healthy.
- The z-ai SDK returned 429s throughout the session — all fallbacks fired
  as designed (every gate stayed green through them).
- The dev server hot-reloaded the rewritten component cleanly; the e2e
  suite exercised the rebuilt production standalone.

## 5. Knowledge carried forward

- **FS-12 (new):** parity is a claim over the STATE MACHINE, not a
  screenshot — enumerate every interactive surface's states (resting,
  open, running, loading, empty, error) and decompile + pin each one.
  Two sessions of "verified" tiles hid four divergent panels.
- **FS-13 (new):** scope list-item text assertions by role —
  `getByRole("paragraph").filter({ hasText })` never matches the
  textarea whose default-value text node otherwise shadows the list
  item under load.
- **Dead code is part of the contract:** the reference's unreachable
  alert is mirrored deliberately (documented in PAD §11).
- Test counts moved to **53 unit / 38 e2e**; the production build now
  type-checks itself (no bypass flags — `tests/next-config.test.ts`
  pins it); docs and the skill realigned (v1.2.0).
