# Remediation Plan — Session 4 (2026-10-04)

Session-4 review of the FlowSchedule clone (base commit `200f070`, i.e. the
session-3 Quick Actions remediation `c3a8ef8` plus the operator's session-log
commit) after `git pull` (fast-forward: `docs/session_4.md`). The `skills/`
folder is excluded from code checking, testing and compilation per the
operating instructions.

Skills used this session: `agent-browser` (live reference measurement +
corroboration on both apps), `tdd` (red → green), `verification-and-review-protocol`
(executed evidence only), `nextjs16-tailwind4` (token-pin discipline),
`clone-app-pat-pro` (decompile-first parity method).

## 1. Audit scope and method

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull origin main` (fast-forward: `docs/session_4.md`) | ✅ clean tree, main @ 200f070 |
| Docs ↔ code alignment | Re-read AGENTS.md, CLAUDE.md, README.md, PAD, flow-schedule_SKILL.md, session_3-review.md, remediation-plan-session3.md, worklog.md, session_4.md; claims re-executed (lint ✓ · typecheck ✓ · 53/53 unit) | ✅ aligned |
| Env contract | `.env` = `DATABASE_URL="file:../db/custom.db"`; `db/` at repo root (custom.db + e2e.db); health probe `"database":"up"`; `.env.example` matches | ✅ correct |
| Mobile navigation | Live re-measurement on the reference at 390×844: trigger right 374 / bottom 50 (h 36); menu right 374 / top 54 / w 192, items [Profile, Settings, Logout] | ✅ byte-identical to the clone's pin — **no Tailwind v4 regression on either app** |
| Recent code changes (`c3a8ef8`) | Read the diff (QuickActions rewrite, next.config flag removal, rate-limit sweep, specs) against the decompiled reference | ✅ clean (session-3 verified) |
| **Reference parity — the DASHBOARD SIDEBAR CARDS + layout surfaces never decompile-verified** | Full decompile from the reference bundle (`ure` StatusCard, `Y1e` DailyFocus, `fre` AISummary, `g0e` SkillsMap, `X1e` Dashboard layout, `are`/`rre` day-rows/task-blocks, `Xne` TaskDialog) + live DOM corroboration on the reference (all classes below measured live, incl. the functional Mark Complete round-trip) | ⚠️ **26 gaps — S-1…S-4, F-1…F-4, A-1…A-6, K-1…K-5, W-1…W-4, D-1, T-1, C-1, X-1** |

The blind-spot class is exactly FS-12 again, one surface further: sessions 0–3
verified the sidebar cards' **content presence** (headings render, data shows)
but never their **state machines** (loading skeletons, the rich "Next Up"
state, live indicators, the Mark Complete mutation, the reference's own
format-string bug) nor the **layout chrome** (full-bleed page container,
day-row spacing).

## 2. Issues, bugs and gaps found

All classes below are the reference's literal values, decompiled AND
live-measured on the logged-in reference at 1440×900.

### StatusCard (`ure`) — the headline finding

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| S-1 | High | **The "Up Next" state is a minimal centered card; the reference's "Next Up" state is a rich card**: `bg-white/60 … p-6 … relative overflow-hidden` + decorative blob (`bg-gradient-to-br from-sky-400/20 to-green-400/20 mx-64 my-4 px-16 absolute top-0 right-0 w-20 h-20 rounded-full transform translate-x-8 -translate-y-8`), header `flex items-start justify-between mb-4` (h3 "Next Up" + priority badge `px-3 py-1 rounded-2xl text-xs font-medium` + color map low=`text-green-600 bg-green-100` medium=`text-yellow-600 bg-yellow-100` high=`text-orange-600 bg-orange-100` urgent=`text-red-600 bg-red-100`), body `space-y-3` (h4 `text-xl font-bold text-slate-900 leading-tight`, optional description `text-slate-600 text-sm leading-relaxed`, Clock `w-4 h-4` + `text-sm font-medium` time, progress row `flex items-center gap-2 pt-2` with `flex-1 h-2 bg-slate-100 rounded-full overflow-hidden` + `h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full animate-pulse` width 75% + `text-xs text-slate-500 font-medium` "Ready"), footer `flex gap-3 mt-6` (Mark Complete `flex-1 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white` + CircleCheck `w-4 h-4 mr-2` — **FUNCTIONAL: PATCHes the task to completed and re-fetches** (live-verified: card flips to "All caught up!"); outline button `rounded-2xl border-slate-200 hover:bg-slate-50` + ArrowRight `w-4 h-4` — decorative no-op). **The time formatter mirrors the reference's own format-string bug**: `format(d, "MMM d at HH:mm")` renders "Oct 6 AM1791284400 11:00" (date-fns `a`=AM/PM + `t`=unix seconds) — dead-code/bug parity per the FS-12 corollary; "Today at HH:mm" / "Tomorrow at HH:mm" branches are literal template strings (no bug) | Rebuild the component to `ure` |
| S-2 | Medium | Empty state: clone `p-8 … min-h-[180px] flex flex-col items-center justify-center` + icon in a `w-14 h-14 rounded-full bg-green-100` wrapper + h3 `mb-1` + p `text-slate-500 text-sm`. Reference: `p-6 … text-center` (nothing else), **raw** CircleCheck `w-12 h-12 text-green-500 mx-auto mb-3`, h3 `mb-2`, p `text-slate-600` (no size class) | Re-class; raw icon; `lucide-circle-check` export |
| S-3 | Medium | No loading state. Reference: `p-6` card + `animate-pulse` (h-6 w-1/3 mb-4, h-4 w-2/3 mb-2, h-4 w-1/2) — shown during its Task.list fetch | Skeleton keyed to the store's `loadingTasks` (mount + Mark Complete refresh) |
| S-4 | Medium | Mark Complete absent (functional gap, live-verified). Selection logic itself matches (filter `start_time && status!=="completed"`, sort asc, first future) | Store `completeTask` (PATCH + refresh, **no** taskVersion bump — the reference's ure does NOT bump the dashboard refresh counter) |

### DailyFocusCard (`Y1e`)

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| F-1 | High | **Wrong deterministic fallback**: clone ships Paul J. Meyer; reference `j1` = quote "The secret of getting ahead is getting started.", author "Mark Twain", affirmation "I am focused, productive, and capable of achieving my goals today." (shown on every SDK failure — a real, user-visible divergence) | Fix in `src/lib/ai.ts` + the card's local copy (dedupe via a shared constants module) |
| F-2 | High | Quote/affirmation layout: clone = horizontal `flex gap-3` rows, quote `italic font-medium leading-relaxed opacity-95`, author `text-xs opacity-75`, affirmation `text-sm opacity-90`. Reference = **vertical** blocks: quote `mb-6` wrapper (Lightbulb `w-5 h-5 opacity-70 mb-1`, p `text-lg italic` with literal `"` quotes, p `text-sm opacity-80 text-right mt-1`), affirmation wrapper (Target `w-5 h-5 opacity-70 mb-1`, p `font-medium`) | Re-class to the vertical forms |
| F-3 | Low | Affirmation icon: clone CircleDot → reference **Target**; loading skeleton has clone-only `min-h-[220px]` | Swap icon; drop min-h |
| F-4 | Medium | No re-fetch on task mutations. Reference re-runs InvokeLLM when `refreshTrigger` changes (dialog save / quick-add bump the counter) | `refreshTrigger` prop from a new store `taskVersion` |

### AISummaryCard (`fre`)

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| A-1 | High | Header: clone = single Sparkles. Reference = **Brain** `w-5 h-5 text-purple-500` + h3 + **Sparkles** `w-3 h-3 text-yellow-500 animate-pulse` (a live indicator after the heading) | Swap/add icons |
| A-2 | High | Mood block: clone `bg-pink-50 rounded-xl p-3 border border-pink-100` + TrendingUp `w-4 h-4 text-pink-600` + span `font-semibold text-sm text-pink-600` + p `text-sm text-slate-700`. Reference: `p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100` + TrendingUp `w-3 h-3 text-purple-600` + span `text-xs font-medium text-purple-900` + p `text-purple-800 capitalize font-medium text-sm` | Re-class |
| A-3 | Medium | Focus Areas: clone h4 `text-xs font-bold`, chips `bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100`, wrapper `gap-1.5`. Reference: h4 `text-xs font-medium`, chips `px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium`, wrapper `gap-1` | Re-class |
| A-4 | Medium | Activities: clone emerald-50/emerald-700 + h4 font-bold. Reference: `bg-green-100 text-green-700` + h4 `text-xs font-medium` | Re-class |
| A-5 | Medium | Insights: clone `max-h-24` + h4 `font-bold` + p `text-xs text-slate-600`. Reference: `max-h-20` + h4 `text-xs font-medium` + p `text-slate-700 text-xs leading-relaxed` | Re-class |
| A-6 | Medium | No re-fetch on task mutations (reference: refreshTrigger → InvokeLLM re-run) | `refreshTrigger` prop |

### SkillsMap (`g0e`)

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| K-1 | Medium | No loading state. Reference: `p-6 … min-h-[280px]` card + header (Target `w-6 h-6 text-indigo-500 animate-pulse` + h3) + `w-48 h-48 bg-slate-200 rounded-full mx-auto animate-pulse` | Skeleton keyed to `loadingTasks` |
| K-2 | Medium | Header: clone has no indicator. Reference: **Award** `w-4 h-4 text-yellow-500` after the h3 | Add |
| K-3 | Medium | Tooltip: clone = default recharts formatter. Reference = custom content `bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-lg border border-white/20` with p `font-medium text-slate-900` (name), p `text-sm text-slate-600` (`{Math.round(v/60)}h {v%60}m`), p `text-sm text-slate-600` (`{pct}% of day`) | Custom Tooltip component |
| K-4 | Medium | Legend: clone span `text-slate-600` + raw name; right `text-slate-500` = `{pct}% · {h}h`. Reference: span `text-slate-700 capitalize` + `name.toLowerCase()`; right `font-medium text-slate-600` = `{pct}%` ONLY | Re-class; drop the hours |
| K-5 | High | Colors: clone personal `#22c55e`, learning `#a855f7`, social `#eab308`, fallback `#94a3b8`. Reference `m0e`: personal **#10B981**, learning **#8B5CF6**, social **#F59E0B**, fallback **#64748B**; row name = `category.replace("_"," ").toUpperCase()`; percentage precomputed `Math.round(b/y*100)` | Fix SKILL_COLORS + row shape |

### WeeklySchedule (`lre`/`are`/`rre`)

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| W-1 | High | Day rows: clone renders rows with **no spacing**; reference wraps the 7 rows in `div.space-y-1.5` (measured 6px gap, 50px row height — live) | Add the wrapper |
| W-2 | Low | TaskBlock zIndex: clone `10 + index` (list position); reference `10 + startMinutes` | Fix |
| W-3 | Low | Cells: clone carries `cursor-pointer`; reference's cells are default-cursor (the click handler is on the parent grid, hour from clientX). Keep the clone's per-cell role=button + aria-label (invisible a11y floor, session-2/3 precedent) but drop the visible `cursor-pointer` | Drop the class |
| W-4 | Low | TaskBlock before-07:00: clone always clips left to 0. Reference: a task entirely before 07:00 is **hidden**; one spanning 07:00 clips to 0 | Mirror the branch |

### Dashboard page (`X1e`) / TaskDialog (`Xne`) / constants

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| D-1 | High | Page container: clone `p-4 md:p-6 max-w-7xl mx-auto` (measured 1280px at a 1440 viewport). Reference: `p-4 md:p-6 lg:p-8`, **full-bleed** (measured 1440px — live) | Re-class |
| T-1 | Medium | TaskDialog delete: clone deletes immediately; reference asks `window.confirm("Are you sure you want to delete this task?")` first | Add the confirm |
| C-1 | Medium | `.custom-scrollbar` globals: clone height/width 5px, track rgba(0,0,0,0.05) r3, thumb rgba(0,0,0,0.15) r3, hover 0.25. Reference ships three global styled-jsx blocks (lre 6px, G1e 5px, fre 3px-width); the live cascade resolves to **height 5px, width 3px, track rgba(0,0,0,0.1) r2, thumb rgba(0,0,0,0.2) r2, hover rgba(0,0,0,0.3)** (last rule per property — all three style tags are unscoped, live-verified) | Update globals.css to the effective values |
| X-1 | Medium | No dashboard refresh-trigger plumbing. Reference: `X1e` holds a counter bumped by dialog save/quick-add (`onTaskUpdate`/`onTaskAdded`); sidebar cards + SkillsMap re-run on it. Mark Complete deliberately does NOT bump (ure re-fetches only itself) | Store: `taskVersion` (bumped by createTask/updateTask/deleteTask) + `completeTask` (no bump); Dashboard threads `taskVersion` as `refreshTrigger` into DailyFocusCard + AISummaryCard (re-fetch) and the skeleton states |

### Deliberately NOT changed (judgment calls, recorded for review)

- **StatusCard/SkillsMap data seam**: the reference's cards fetch `Task.list`
  themselves; the clone reads the store (AGENTS.md invariant: the store is the
  ONLY fetcher). Visible behavior is matched via the loading skeletons
  (keyed to `loadingTasks`) + instant store updates. The one accepted
  divergence: the clone's calendar Refresh button re-fetches the store and
  flashes the skeletons, where the reference's refreshes only its own card
  (a quirk of its per-card fetching — documented, not worth breaking the
  invariant).
- **Mark Complete bumps AI re-fetch**: the store's `completeTask` avoids the
  `taskVersion` bump (matching ure), so the AI cards do NOT re-generate after
  Mark Complete — exactly the reference's behavior.
- **`react-hooks/set-state-in-effect` discipline**: all new loading states
  are DERIVED (loadingTasks/taskVersion props), never reset in effect bodies.
- **aria-labels on icon-only buttons** (Refresh Calendar, cells): invisible
  a11y floor — session-2/3 precedent, kept.
- **DailyFocus/AISummary keep their own fetch effects** (they did before) —
  only the re-fetch trigger is added; the store stays the entity fetcher.
- **Mobile navigation, Quick Actions, Planning, Profile, Settings, header**:
  verified parity (sessions 0–3 + this session's live re-pin 374/54/192) —
  zero changes.

## 3. TDD execution order

**Unit (RED) → e2e (RED) → implementation (GREEN) → gate.**

- **U-1** `tests/ai-defaults.test.ts`: DEFAULT_FOCUS exact values (Mark Twain
  set), EMPTY_DAY_SUMMARY + FALLBACK_SUMMARY pinned (already correct —
  regression pins).
- **U-2** extend `tests/domain.test.ts`: SKILL_COLORS exact hex map + the
  `#64748B` fallback; row-name transform contract.
- **E-1** rework "sidebar cards render" → "Next Up" + priority badge + Mark
  Complete button visible; new spec "status card marks the next task
  complete" (API-create a task 5 min out → card shows its title → click Mark
  Complete → card flips to "All caught up!" → API-verify status=completed →
  converging cleanup).
- **E-2** DailyFocus structural spec: quote p `text-lg italic`, author
  `text-sm opacity-80`, affirmation `font-medium`, `lucide-target`
  affirmation icon, no `min-h-[220px]` skeleton.
- **E-3** AISummary structural spec: header has `lucide-brain` AND
  `lucide-sparkles` (indicator); Mood block `from-purple-50`; chips
  `bg-blue-100` / `bg-green-100`; insights container `max-h-20`.
- **E-4** SkillsMap spec: header has `lucide-award`; legend right spans
  percentage-only (no `·`); span class `text-slate-700 capitalize`.
- **E-5** Dashboard container spec: at 1440×900 the page wrapper is full-width
  (≥1440) and its class contains `lg:p-8`, not `max-w-7xl`.
- **E-6** WeeklySchedule spec: day-row wrapper class `space-y-1.5` (via
  evaluate) and a measured 6px row gap; cells lack `cursor-pointer`.
- **E-7** TaskDialog delete-confirm spec: open an existing task → Delete →
  dialog appears, dismiss → task still exists (API); accept → task gone.
- **GREEN**: rewrite `StatusCard.tsx`, `DailyFocusCard.tsx`,
  `AISummaryCard.tsx`, `SkillsMap.tsx` to the decompiled forms; touch
  `WeeklySchedule.tsx` (space-y wrapper, zIndex, cursor, pre-07:00 branch),
  `Dashboard/page.tsx` (container), `TaskDialog.tsx` (confirm),
  `useFlowStore.ts` (taskVersion + completeTask), `src/lib/ai-defaults.ts`
  (shared constants), `src/lib/domain.ts` (SKILL_COLORS), `globals.css`
  (custom-scrollbar).
- **Gate**: lint → typecheck → unit (53 + new) → build → e2e (38 + new) ×2 →
  smoke 25/25.
- **Live parity spot-check on BOTH apps** (agent-browser): all four sidebar
  cards (both states where reachable), the full-bleed container, day-row gap,
  mobile-menu re-pin (374/54/192).
- **Docs**: README (features/testing), PAD (§ ledger, §11 note), AGENTS.md
  (conventions: sidebar-card decompile facts), CLAUDE.md (counts),
  `flow-schedule_SKILL.md` (v1.3.0: FS-14 — content-presence checks are not
  state-machine parity), `docs/session_4-review.md`, worklog.
- **Screenshots**: re-capture 01–13 (the dashboard chrome changed).
- **Deliver**: single commit on `main`, pushed via `docs/ssh_git_wrapper_v3.py`
  per `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`. No new branches.

## 4. Non-goals (deliberately not changed)

- **Mobile navigation** — geometry re-pinned live this session (374/54/192);
  zero header/menu changes.
- **Quick Actions** (session-3 parity), **Planning** (session-2 parity),
  **Profile/Settings** (session-0 visual parity, `p-6 max-w-4xl mx-auto`
  matches `tSe`/`nSe` exactly — decompile-verified this session).
- **The calendar hour-header/day-label/task-block geometry pins** — sessions
  0–1 measured them; only the row spacing/zIndex/cursor/pre-07:00 items
  above change.
- **API shapes/envelopes, auth, rate limiter, DB contract** — verified green;
  the only API-adjacent change is the shared fallback constants module.
- **`skills/` folder** — excluded from checking/testing/compilation.

## 5. Execution record

| Item | Outcome |
|---|---|
| U-1 (RED) | `tests/ai-defaults.test.ts` — import failure (module absent) as predicted |
| U-2 (RED) | `tests/domain.test.ts` +3 failures: SKILL_COLORS wrong hexes; SKILL_COLORS_LOOKUP/skillRowName absent. (One test EXPECTATION was corrected during GREEN: the reference's `replace("_", " ")` turns "self_care" into "SELF CARE" — the test had wrongly predicted "SELF_CARE") |
| E-1 (RED) | "status card marks the next task complete" — failed on `getByRole('heading', { name: 'Next Up' })` not found (the clone shipped "Up Next") |
| E-2/E-3 (RED) | "sidebar cards render" — failed on `text-lg` quote (clone: `italic font-medium`), `lucide-target`, `lucide-brain`, `from-purple-50`, `max-h-20`, chip colors |
| E-4 (RED) | "skills map matches the reference's data state" — failed on `lucide-award` (absent) + legend percentage-only (clone rendered "33% · 0.8h") |
| E-5 (RED) | full-bleed spec — failed on `max-w-7xl` present + width 1280 < 1440 |
| E-6 (RED) | day-row spec — failed on the missing `space-y-1.5` wrapper (gap 0) + `cursor-pointer` on cells |
| E-7 (RED) | delete-confirm spec — failed: the clone deleted immediately, task gone after the dismiss path |
| S-1..S-4 (GREEN) | `StatusCard.tsx` rebuilt to `ure`: skeleton keyed to `loadingTasks`, rich Next Up card (blob, priority badge map, h4 title, optional description, Clock row with the mirrored "MMM d at HH:mm" format-string bug — live DOM shows the same "Oct 6 AM1791284400 11:00" string), 75% progress + Ready, functional Mark Complete, decorative ArrowRight button; empty state re-classed (p-6, raw CircleCheck w-12, mb-2, text-slate-600) |
| F-1..F-4 (GREEN) | `src/lib/ai-defaults.ts` created (pure, client-safe: Mark Twain default + both summary fallbacks); `lib/ai.ts` consumes + re-exports; `DailyFocusCard.tsx` rebuilt to Y1e (vertical blocks, text-lg italic quote, text-sm opacity-80 author, font-medium affirmation, Target icon, refreshTrigger re-fetch, skeleton without min-h) |
| A-1..A-6 (GREEN) | `AISummaryCard.tsx` rebuilt to fre (Brain + Sparkles live indicator, purple→pink Mood block, blue-100/green-100 chips, max-h-20 insights, refreshTrigger re-fetch) |
| K-1..K-5 (GREEN) | `SkillsMap.tsx` rebuilt to g0e (loading skeleton + Award indicator, custom glass Tooltip with "Xh Ym"/"Z% of day", capitalize legend with percentage-only right column); `domain.ts`: SKILL_COLORS → m0e hexes + SKILL_COLORS_LOOKUP (#64748B fallback) + skillRowName |
| W-1..W-4 (GREEN) | `WeeklySchedule.tsx`: day rows wrapped in `space-y-1.5`; TaskBlock zIndex 10+startMinutes; cells lose `cursor-pointer` (role/aria kept); pre-07:00 spanning/hidden branch mirrored |
| D-1 (GREEN) | Dashboard page container → `p-4 md:p-6 lg:p-8` (max-w-7xl removed — live-measured full-bleed 1440) |
| T-1 (GREEN) | TaskDialog delete asks `window.confirm("Are you sure you want to delete this task?")` |
| C-1 (GREEN) | `globals.css` custom-scrollbar → the reference's live-cascade effective values (height 5px, width 3px, track rgba(0,0,0,0.1) r2, thumb rgba(0,0,0,0.2) r2, hover 0.3) |
| X-1 (GREEN) | Store: `taskVersion` (bumped by createTask/updateTask/deleteTask — mirrors X1e's counter; NOT bumped by `completeTask`, matching ure's Mark Complete which re-fetches only itself); initial `loadingTasks: true` so the sidebar cards skeleton from first paint (the reference's own behavior — a first-paint empty flash was caught as an e2e race and fixed at the component level); bootstrap drops the flag when unauthenticated |
| Flakes fixed during GREEN | (1) "Skills Map" heading locator strict-mode violation (the Next Up h4 task title substring-matches) → `exact: true`; (2) the skills-map evaluate ran in the skeleton state post-reload → `waitForFunction` on the loaded-state Award icon; (3) legend `span:last-child` matched the LEFT span (a last-child of its inner wrapper) → `:scope > span`; (4) chip class filter regex assumed `bg-` prefix → `includes`; (5) e2e residue cascade — failed specs left tasks that pushed the planning page's top-3 chips and the Next Up selection around → ALL E2E specs now wipe `E2E *` residue at start (FS-9 taken to its conclusion) |
| Gate | `bun run lint` clean · typecheck clean · `test` **59/59** · build green (self-type-checked, 19 routes) · `test:e2e` **43/43 × 2 consecutive full runs** · smoke **25/25** (through live SDK 429s — fallbacks by design, and the DailyFocus fallback now shows the reference's Mark Twain content) |
| Live parity (both apps) | Clone vs reference, all measured: page container `p-4 md:p-6 lg:p-8` full-bleed 1440 = 1440; Next Up card byte-identical (card, blob `mx-64 my-4 px-16 …`, header/badge/title/time row/progress 75%/Ready/Mark Complete/ArrowRight classes; Mark Complete round-trip live-verified on BOTH apps: PATCH → completed → card advances); empty state (p-6, raw CircleCheck, text-slate-600) identical; DailyFocus (Mark Twain fallback + vertical text-lg italic quote + Target) identical; AISummary (Brain + Sparkles w-3 yellow, purple→pink Mood, blue/green chips) identical; day rows space-y-1.5 with 6px gap; mobile trigger 374/50/36 and the menu geometry pinned by the e2e spec (reference re-measured 374/54/192 this session — byte-identical) |
| Screenshots | 15 captures in `docs/screenshots/`: 01–09 re-captured (dashboard chrome changed) + 10–13 from session 3 still current + new 14-statuscard-nextup, 15-taskdialog. The Radix-menu + dialog captures required a Playwright script (`scripts/capture-screenshots.mjs` — trusted pointer events; the agent-browser eval click cannot open Radix on the dev build, AGENTS.md quirk) |
| Docs | README (features, testing, screenshots, file tree), PAD (§3 tree, §12 ledger rows, §11 note), AGENTS.md (counts, conventions, quirks), CLAUDE.md (counts, testing), `flow-schedule_SKILL.md` v1.3.0 (FS-14, debugging rows, appendices), this plan, `docs/session_4-review.md`, worklog |
| Push | Single commit on `main` via `docs/ssh_git_wrapper_v3.py` (no new branches) |
