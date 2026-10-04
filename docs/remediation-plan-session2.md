# Remediation Plan — Session 2 (2026-10-04)

Session-2 review of the FlowSchedule clone (base commit `1742785`, the
session-1 remediation) after `git pull` (fast-forward:
`docs/session_2.md`). This plan records every gap found by the audit, the
remediation strategy, and the TDD execution order. The `skills/` folder is
excluded from code checking, testing and compilation per the operating
instructions.

Skills used this session: `agent-browser` (live reference re-measurement +
DOM audit), `code-review`/`code-review-checklist` (change-since-commit
review of `1742785`), `verification-and-review-protocol` (Iron Law:
executed evidence only), `tdd` (red → green), `nextjs16-tailwind4`
(mobile-nav debugging methodology).

## 1. Audit scope and method

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull origin main` (fast-forward, 1 file: `docs/session_2.md`) | ✅ clean tree, main @ 1742785 |
| Docs ↔ code alignment | Read `AGENTS.md`, `CLAUDE.md`, `README.md`, `Project_Architecture_Document.md`, `flow-schedule_SKILL.md`, `docs/session_2.md`, `docs/remediation-plan-session1.md`, `worklog.md`; verified claims against the tree | ✅ aligned |
| Verification gate | `bun run lint` clean · `typecheck` clean · `test` 44/44 · `build` 19 routes · `test:e2e` 29/29 · `scripts/smoke-test.sh` 25/25 | ✅ all green |
| Recent code changes (`1742785`) | Read every changed source file: `src/lib/site.ts`, `src/app/{sitemap,robots,layout}.tsx`, both new unit tests, 3 e2e specs, `vitest.config.ts` | ✅ clean, well-pinned |
| Database contract | `.env` = `DATABASE_URL="file:../db/custom.db"`; `db/` at repo root (custom.db + e2e.db); dev-server health probe `"database":"up"` | ✅ correct |
| Reference parity (mobile nav) | agent-browser live re-measure BOTH apps @390×844: menu right 374 / top 54 / w 192, trigger right 374 / bottom 50, items `My Account` + Profile/Settings/Logout | ✅ byte-identical, no Tailwind v4 regression |
| Reference parity (dashboard) | Live DOM + computed-style comparison: card set (6), calendar grid `80px repeat(16, 60px)`, task-block styles (left/width/top/zIndex/rounded-lg/px-2/py-0.5/text-[10px]/shadow-md, title format), Quick Action inline hex gradients (byte-identical), canvas endpoints | ✅ parity (oklab midtone delta measured 0–3 RGB units — documented acceptance upheld) |
| Reference parity (profile/settings) | Heading-structure diff, both apps | ✅ identical |
| **Reference parity (planning)** | Live DOM snapshot + **full decompile of the reference's Planning component from its bundle** (`eSe` in `bundle.js`) + session-0 screenshot corroboration | ⚠️ **7 gaps — P-1…P-7 below** |
| Git hygiene | `git status` clean; `.env` untracked; no `*.db` tracked | ✅ clean |

## 2. Issues, bugs and gaps found

All seven Planning-page gaps trace to one root cause: session 0 built the
Planning page from the *live empty-state reference* (no tasks, no day
selected) and inferred "reasonable" behavior instead of decompiling the
component. The bundle decompile (this session) pins the actual behavior.

| ID | Severity | Finding (reference = ground truth) | Fix strategy |
|----|----------|-----------------------------------|--------------|
| P-1 | Medium | **selectedDay initial state**: reference `useState(null)` + `i && <panel>` render guard — the whole selected-day section (task card + Day Statistics) is absent until a day card is clicked. Clone: `useState(() => new Date())` — panel always renders with today preselected | `useState<Date \| null>(null)` + guard the 2-col grid on `selectedDay` |
| P-2 | Medium | **Day-card highlight**: reference highlights the **selected** day (`v = i && zc(i, y)` → `bg-sky-50 border-sky-200`); there is no "today" highlight at all. Clone highlights **today** and never moves | Highlight = `selectedDay && isSameDay(selectedDay, day)`; drop the today logic |
| P-3 | Medium | **"Unscheduled" accordion**: the string "Unscheduled" does not occur anywhere in the reference bundle — the reference renders no such section; unscheduled tasks are simply not shown on /Planning. Clone renders an extra accordion | Remove the accordion + the `unscheduled` derivation |
| P-4 | Low | **Filter button**: reference is decorative — `variant:"outline"`, label `"Filter"`, **no onClick** (verified in the bundle: the button JSX carries no handler). Clone cycles all → scheduled → unscheduled and labels `Filter: {state}` | Remove the filter state + `visibleTasks` seam; render a plain `"Filter"` outline button |
| P-5 | Low | **Day-card task chips**: reference chips are plain display divs (no role, no onClick) — a click on a chip bubbles up and **selects the day**. Clone chips are `role="button"` + `stopPropagation` + open the Edit dialog. (This is also what caused the session-1 e2e flake FS-7.) | Remove role/tabIndex/onClick/onKeyDown from the chips; clicks bubble to the day card |
| P-6 | Low | **Selected-day task items**: reference items are display-only (title, priority, description, category badge, `HH:mm`) — **no Mark-done/Edit buttons, no duration text**. Task editing happens exclusively from the Dashboard calendar task blocks. Clone adds Mark done / Edit / duration | Remove the action buttons + duration span (+ `toggleComplete`, unused imports) |
| P-7 | Medium | **Day Statistics content**: reference renders a static placeholder unconditionally — BarChart3 icon + "Statistics for selected day" (the accordion's only content in the bundle; there is no data branch). Clone computes and renders real stats (hours, completed, category bars) | Replace the data branch with the static placeholder; remove `selectedStats` |

Deliberately NOT changed (judgment calls, recorded for review):

- **Day-card element type**: reference uses `<div onClick>`; clone uses
  `<button>`. Visible + functional behavior is identical; the button is
  strictly better for a11y and the e2e specs pin it. Parity is about the
  visible/functional contract, not DOM internals.
- **Calendar task blocks**: already byte-identical (style, classes, title
  tooltip, stopPropagation + click → Edit dialog). The Dashboard remains
  the ONLY task-edit entry point — matching the reference.
- **TaskDialog**: stays — the reference opens it from the Add Task button
  and the Dashboard's calendar cells/blocks.
- **oklab gradient midtones**: measured 0–3 RGB units vs the reference's
  sRGB (endpoints byte-identical, pinned). PAD ADR-004's documented
  acceptance is upheld with fresh pixel evidence.

## 3. TDD execution order

Tests first (red), then the implementation (green), then the gate.

- **T-1 (red for P-1):** `tests/e2e/planning.spec.ts` — new spec
  "no selected-day section before a day is clicked": after load, neither
  "Day Statistics" nor a `/^(Monday|Tuesday|…),/` long-date heading nor
  "Unscheduled" exists.
- **T-2 (red for P-7):** rewrite "day statistics accordion shows totals
  for the selected day" → click Monday's header block → expect the
  Monday heading AND the placeholder "Statistics for selected day";
  assert `3.5h` is absent.
- **T-3 (red for P-3):** "no Unscheduled accordion renders" —
  `getByText("Unscheduled")` count = 0 (fold into T-1's absence checks
  plus an explicit post-click check).
- **T-4 (red for P-4):** "Filter button is decorative" — label is
  exactly "Filter"; clicking it changes nothing (label stays "Filter",
  seeded chips unchanged).
- **T-5 (red for P-2):** "selected day card is highlighted, today is
  not" — click Wednesday's card; the Wed card carries
  `bg-sky-50`/`border-sky-200`, today's does not (when they differ).
- **T-6 (red for P-5/P-6):** "chip clicks select the day (no edit
  dialog)" — click a seeded chip → the panel shows that day's long-date
  heading; no dialog appears. And the selected-day task item has no
  "Mark done"/"Edit" buttons.
- **T-7 (update, dashboard.spec.ts):** "Add New Task panel creates a
  task" — after creating, verify the task via `GET /api/tasks` (the
  reference surfaces unscheduled tasks nowhere in the UI), keep the API
  cleanup loop.
- **Implementation:** all seven fixes in
  `src/app/(app)/Planning/page.tsx` (single-file change + import
  cleanup).
- **Gate re-run:** lint → typecheck → 44 unit → build → e2e (all 29,
  with the updated specs), smoke 25/25.
- **Docs:** PAD (§ known issues — the Filter note is now moot; Planning
  description; verification ledger), AGENTS.md (mobile-nav section is
  untouched; add the Planning parity notes), CLAUDE.md, README
  (Planning feature row), `flow-schedule_SKILL.md` (anti-pattern FS-11:
  "infer instead of decompile"; session history appendix), worklog.
- **Screenshots:** re-capture 03-planning + 09-mobile-planning (and any
  other view whose pixels change).
- **Deliver:** single commit on `main`, pushed via
  `docs/ssh_git_wrapper_v3.py` per
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`. No new branches.

## 4. Non-goals (deliberately not changed)

- **Mobile navigation** — re-measured byte-identical today; the
  geometry spec stays the pin; zero header/menu changes.
- **Dashboard cards** — verified parity (structure, gradients, task
  blocks, quick actions, timer, AI cards).
- **Database/env contract** — already correct and test-pinned.
- **`skills/` folder** — excluded from checking/testing/compilation.
- **Profile/Settings static cards** — parity surfaces (identical to the
  reference's placeholders); making them functional would diverge.

## 5. Execution record (filled during execution)

| Item | Outcome |
|---|---|
| T-1…T-6 specs (RED) | Written first in `tests/e2e/planning.spec.ts` (6 new specs + 1 rewritten + 1 extended); run against the pre-fix build: **7 failed exactly as predicted** (P-1…P-7 each produced its predicted failure mode), 3 carried specs stayed green |
| T-7 (dashboard.spec.ts) | "Add New Task panel creates a task" migrated from Planning-UI visibility to API verification (`GET /api/tasks` + converging delete) — the reference surfaces unscheduled tasks nowhere |
| P-1…P-7 implementation (GREEN) | Single-file change `src/app/(app)/Planning/page.tsx` (rewrite): `useState<Date \| null>(null)` + `{selectedDay && …}` guard; highlight = selection; static "Statistics for selected day" placeholder; decorative Filter; display-only chips (bubbling); display-only task items; Unscheduled accordion removed; `taskToForm`/`updateTask`/`SKILL_COLORS` imports dropped |
| Gate | `bun run lint` clean · `bun run typecheck` clean · `bun run test` **44/44** · `bun run build` green (19 routes) · `bun run test:e2e` **34/34 × 2 consecutive runs** (29 → 34: +6 planning parity specs) · smoke **25/25** |
| Live parity spot-check (dev server, post-fix) | Clone Planning initial state = reference (no panel, no Unscheduled, label "Filter"); after clicking Monday on BOTH apps: Monday heading ✓, static placeholder ✓, Monday highlighted ✓, Sunday (today) unhighlighted ✓ |
| Mobile-menu regression check | Post-fix re-measurement on the remediated build: trigger right 374 / bottom 50, menu right 374 / y 54 / w 192 — byte-identical to the reference; the geometry pin held through the change |
| FS-7 status | Chip interception is now **structurally impossible** (chips are display-only — clicks bubble); the header-block click + hydration gate stay as robust patterns; SKILL.md FS-7/FS-9/FS-11 updated |
| Screenshots | 10 captures in `docs/screenshots/` from the remediated dev server: 01–09 re-captured + new `10-planning-selected.png` (the click-to-select behavior) |
| Docs | README (features, test counts, hierarchy), PAD (§3.2, §8, §10.1, §11, §12 ledger), AGENTS.md (commands, Planning conventions, reference), CLAUDE.md (commands, testing), `flow-schedule_SKILL.md` (v1.1.0: FS-11, FS-7/FS-9 updates, appendices B/C), this plan, `docs/session_2-review.md`, worklog |
| Push | Single commit on `main` via `docs/ssh_git_wrapper_v3.py` (no new branches) |
