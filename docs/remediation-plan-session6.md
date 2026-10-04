# Remediation Plan — Session 6 (2026-10-04)

Session-6 review of the FlowSchedule clone (base commit `d99d8ae`, i.e. the
session-5 login/routing remediation `53706a8` plus the operator's session-log
commit) after `git pull` (fast-forward: `docs/session_6.md` — the operator's
session-5 narrative). The `skills/` folder is excluded from code checking,
testing and compilation per the operating instructions.

Skills used this session: `agent-browser` (live state-matched class-tree
diffing on BOTH apps — the reference user has 0 tasks + 0 notes, so an empty
user was registered in the clone for state-matched comparison),
`clone-app-pat-pro` (decompile-first: every finding below is quoted from the
reference's live DOM and/or its bundle), `tdd` (red → green),
`verification-and-review-protocol` (executed evidence only),
`nextjs16-tailwind4` (token-pin discipline — unchanged this session).

## 1. Audit scope and method

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull origin main` (fast-forward: `docs/session_6.md`) | ✅ clean tree, main @ d99d8ae |
| Docs ↔ code alignment | Re-read the five root docs + session_5-review.md + remediation-plan-session5.md + worklog.md + session_6.md; fast gates re-executed at base | ✅ aligned — lint ✓ · typecheck ✓ · 59/59 unit |
| Env contract | `.env` = `DATABASE_URL="file:../db/custom.db"`; `db/` at repo root (custom.db + e2e.db); `.env.example` unit-pinned; vitest + playwright configs in place; 20 screenshots present | ✅ intact |
| Recent code change (`53706a8`) | Diff spot-check (login page, guard, root route, 404) + live re-verification of its surfaces | ✅ clean — header/main/containers byte-identical live |
| **Reference parity — state-matched full-DOM class-tree diff** | agent-browser on BOTH apps: the reference account has **0 tasks and 0 notes** (verified via its entity API), so an empty user (`parity-empty@flowschedule.app`) was registered in the clone; the full `<main>` class tree dumped and element-wise diffed for the dashboard (761 elements), Planning unselected (63) and Planning day-selected (98/106) | ⚠️ **8 findings — P-1…P-7, F-1** |
| Profile/Settings pages (suspected last unverified surface) | Full bundle decompile + string comparison | ✅ byte-identical already (the session-4 claim holds) |
| Mobile navigation (highest regression risk) | Live re-measurement on BOTH apps at 390×844 + trusted-click menu opening + the e2e geometry pin | ✅ trigger 374/50/36 both; menu right-anchored, y=54, w=192, items [Profile, Settings, Logout] — **no Tailwind v4 regression** |
| e2e baseline | Full `bun run test:e2e` at base | ⚠️ 50/51 — one failure exposing the latent time-of-day flake F-1 |

The audit's headline method difference: prior sessions diffed SELECTED
elements; this session dumped and diffed the COMPLETE class tree of every
page state (with matched data states — both apps empty), which surfaced the
small-gap family (icon margins, button sizes, class extras) that
element-by-element checks had skipped, plus the structural Planning finding.

## 2. Issues, bugs and gaps found

All reference values are quoted from the live reference DOM (agent-browser,
1440×900 / 390×844) and corroborated against the decompiled bundle
(`reference/app-chunks/index.js`).

### The Planning selected-day section (P-1 — structural, High)

The clone renders the task list and Day Statistics as two Radix
**Accordions** (button trigger + chevron + collapsible animation + an `h3`
heading inside the trigger). The reference renders them as two plain
**Cards** — always visible, no button, no heading role:

```jsx
// tE=Card, nE=CardHeader, rE=CardTitle, iE=CardContent (decompiled)
S.jsxs(tE, {className:"bg-white/60 backdrop-blur-xl border border-white/20 rounded-3xl", children:[
  S.jsx(nE, {children:
    S.jsxs(rE, {className:"flex items-center gap-2", children:[
      S.jsx(WC, {className:"w-5 h-5 text-sky-500"}),       // Calendar icon
      format(i, "EEEE, MMM d, yyyy")
    ]})
  }),
  S.jsx(iE, {children:
    S.jsxs("div", {className:"space-y-3", children:[ /* task items | empty state */ ]})
  })
]})
// …and the Day Statistics card with HC (chart-column) w-5 h-5 text-purple-500
```

Live class strings (both measured): Card `text-card-foreground shadow
bg-white/60 backdrop-blur-xl border border-white/20 rounded-3xl` (the Card
base `rounded-xl border bg-card text-card-foreground shadow` tailwind-merged
with the passed classes — the clone's identical `cn` reproduces the exact
string), CardHeader `flex flex-col space-y-1.5 p-6`, CardTitle
`font-semibold leading-none tracking-tight flex items-center gap-2`,
CardContent `p-6 pt-0`. The task-item markup and empty states inside are
already byte-identical (sessions 2). The reference's a11y tree shows the
date title as plain StaticText — NOT a heading; the clone's AccordionTrigger
currently renders an h3 + button (clickable collapse the reference does not
have).

### The TaskDialog footer (P-2…P-4)

Decompiled reference footer:

```jsx
S.jsxs("div", {className:"flex justify-between pt-4", children:[
  r && S.jsxs(ut, {type:"button", variant:"outline", onClick:c,
    className:"rounded-2xl border-red-200 text-red-600 hover:bg-red-50",
    children:[S.jsx(mF, {className:"w-4 h-4 mr-2"}), "Delete"]}),   // mF = Trash2
  S.jsxs("div", {className:"flex gap-3 ml-auto", children:[
    S.jsx(ut, {type:"button", variant:"outline", onClick:t,
      className:"rounded-2xl border-slate-200", children:"Cancel"}),
    S.jsxs(ut, {type:"submit",
      className:"rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700",
      children:[S.jsx(hE, {className:"w-4 h-4 mr-2"}), r?"Update":"Create", " Task"]})  // hE = Save
  ]})
]})
```

| ID | Severity | Clone ships | Reference ships |
|----|----------|------------|-----------------|
| P-2 | High | Submit label `{editing ? "Save Changes" : "Add Task"}` (a session-0 inference; `tests/e2e/planning.spec.ts:61` pinned the WRONG label) | **"Create Task"** (create) / **"Update Task"** (edit) |
| P-3 | Med | No submit icon; extra `text-white` | `Save` lucide icon `w-4 h-4 mr-2`; no text-white (the default variant's `text-primary-foreground` styles it — hsl(210 40% 98%)) |
| P-4 | Med | Delete icon `w-4 h-4` (no margin); right container `flex gap-2`; Delete classes ordered `text-red-600 border-red-200` | Delete icon `w-4 h-4 mr-2`; right container **`flex gap-3 ml-auto`**; Delete classes ordered `border-red-200 text-red-600 hover:bg-red-50` |

### The Planning header buttons (P-5, P-6)

| ID | Severity | Clone ships | Reference ships (measured) |
|----|----------|------------|------------------------------|
| P-5 | Med | Filter icon `w-4 h-4` and Add-Task icon `w-4 h-4` — no right margin (gap-2 alone: 8px icon→text) | both icons carry **`mr-2`** — gap-2 + mr-2 = 16px (the Filter button measures 100.7px on the reference vs 89.1px on the clone) |
| P-6 | Med | Add Task button `…from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white` | `…from-sky-500 to-blue-600` only — **no gradient hover shift**, no `text-white` (default variant's `text-primary-foreground`); the hover darkening the clone ships belongs to the DIALOG's submit, not this button |

### The Dashboard Refresh Calendar button (P-7)

The reference passes `size:"icon_sm"` — a variant **absent from its size map**
(`size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10
rounded-md px-8",icon:"h-9 w-9"}`), so cva emits NO size class and the button
sizes from its content (`[&_svg]:size-4` svg 16px + `p-1.5` + border =
**30×30px**, measured). The clone's `button.tsx` invented
`icon_sm: "h-9 w-9 rounded-lg"` → **36×36px** (measured on both).

### The e2e latent flake (F-1 — test bug, High)

`tests/e2e/dashboard.spec.ts` "status card marks the next task complete":
`page.locator("div.rounded-3xl", { hasText: "E2E next up task" })` matches
BOTH the WeeklySchedule card (the calendar task block renders the title — no
status filter on either app, decompile-verified) AND the StatusCard →
**strict-mode violation** at line 430, and `toHaveCount(0)` at line 446 can
never hold while the (completed) task is inside the visible 07:00–22:00 grid.
The test passed in sessions 4/5 only because those runs happened pre-07:00
UTC (the task at now+5min fell before the grid → hidden → 1 match). This
session's 08:55 UTC run exposed it (50/51). The class: **time-of-day-dependent
locators** — a new flake family (FS-16).

### Deliberately NOT changed (judgment calls, recorded for review)

- **Day-card element type**: reference `<div onClick>`, clone `<button>` —
  the session-2 documented a11y decision, pinned by the e2e specs. The
  button's `text-left` is a technical necessity (buttons center by default);
  invisible.
- **Dialog inline error `<p>`**: the reference has no error UI in the dialog
  (its catch blocks console.error only). The clone's inline error is the
  CLAUDE.md code-quality floor and renders only on API failure. Kept.
- **`maxLength={300}` on the dialog title input** (clone-only): invisible
  hardening; the API caps length anyway. Kept.
- **Filter icon shape**: the reference's old lucide `Filter` IS the funnel
  shape; the clone's `Funnel` renders the identical SVG (only the class
  string differs: `lucide-funnel` vs `lucide-filter`). Kept `Funnel`.
- **`polyline` vs `path` internals** on lucide-trending-up (lucide version
  artifact): identical class strings and visuals. Not actionable.
- **styled-jsx `<style>` tags**: the reference emits them into the DOM; the
  clone carries the same effective values in `globals.css` (session-4
  documented equivalence). Not actionable.
- **Store seam / API shapes / auth / rate limiter / DB contract**: verified
  green; zero changes.

## 3. TDD execution order

**e2e (RED) → implementation (GREEN) → gate → live parity → docs.**

### E-A `tests/e2e/planning.spec.ts` (rework + new pins)

1. Replace every `getByRole("heading", { name: /<DAY>/ })` on the
   selected-day section with scoped TEXT locators (the reference's title is
   a div — no heading role): `getByText(LONG_DATE)` / regex day-date text.
2. New spec "selected-day sections render as always-visible cards (no
   accordion)":
   - no `button` whose accessible name is the long date (the accordion
     trigger must not exist);
   - the date title div carries `font-semibold` (CardTitle) and is visible
     IMMEDIATELY after the day click (no expand step);
   - "Day Statistics" + "Statistics for selected day" are visible without
     any second click;
   - the two card containers expose the Card merge signature
     (`text-card-foreground shadow bg-white/60 … rounded-3xl`, `p-6 pt-0`
     content).
3. New pins: Filter button's svg has class `/mr-2/`; Add Task button's svg
   has class `/mr-2/`; the header Add Task button does NOT carry
   `hover:from-sky-600` (toHaveClass negation) nor `text-white`.
4. The dialog-flow spec: submit button name "Add Task" → **"Create Task"**
   (the header button keeps "Add Task" — assert both distinctly).

### E-B `tests/e2e/dashboard.spec.ts`

1. F-1 fix — scope the status-card locators to the StatusCard itself:
   `page.locator("div.rounded-3xl").filter({ has:
   page.getByRole("heading", { name: "Next Up", exact: true }) })`, assert
   `toContainText("E2E next up task")` / after complete
   `not.toContainText(...)` (correct whether the card advances to another
   task or "All caught up!"); keep the API status check.
2. New pin: the Refresh Calendar button — class does NOT match `/h-9 w-9/`
   and its bounding box is 30×30 (content-sized, matching the measured
   reference).
3. Dialog prefill spec: additionally assert the submit button's name is
   "Create Task" and shows a Save svg with `mr-2` (visible in the open
   dialog).

### GREEN (implementation)

1. `src/app/(app)/Planning/page.tsx`:
   - swap the two Accordions for `Card`/`CardHeader`/`CardTitle`/`CardContent`
     with the reference's exact classNames (`bg-white/60 backdrop-blur-xl
     border border-white/20 rounded-3xl` on Card; `flex items-center gap-2`
     on CardTitle; task list in `div.space-y-3`, stats in `div.space-y-4`);
   - Filter icon → `w-4 h-4 mr-2`; Plus icon → `w-4 h-4 mr-2`;
   - header Add Task button → drop `hover:from-sky-600 hover:to-blue-700`
     and `text-white`;
   - remove the Accordion import (the `ui/accordion.tsx` primitive stays —
     library file, harmless).
2. `src/components/planning/TaskDialog.tsx`:
   - submit: add `<Save className="w-4 h-4 mr-2" />`, label
     `{editing ? "Update Task" : "Create Task"}`, drop `text-white`;
   - Delete icon → `w-4 h-4 mr-2`, class order →
     `rounded-2xl border-red-200 text-red-600 hover:bg-red-50`;
   - right footer container → `flex gap-3 ml-auto`.
3. `src/components/ui/button.tsx`: `icon_sm: "h-9 w-9 rounded-lg"` →
   `icon_sm: ""` with a comment pinning the reference's dead-variant
   behavior (unknown size ⇒ no size class ⇒ content-sized 30px button).

### Gate

`bun run lint && bun run typecheck && bun run test && bun run build &&
bun run test:e2e` (twice consecutively) + `scripts/smoke-test.sh` (30/30).
The e2e must now pass at ANY hour of the day (F-1 de-flaked).

### Live parity re-verification (agent-browser, both apps)

- Planning unselected + day-selected class-tree re-diff (expect: only the
  documented div/button day-card + icon-name differences remain);
- the dialog: open on the clone dev server via a task-block click (Playwright
  trusted click in the capture script) and diff footer strings against the
  decompiled reference;
- the mobile menu geometry re-pin (unchanged surface, re-verified per the
  operating instructions).

### Screenshots

Re-capture 03-planning (new card structure), 10-planning-selected, and
15-taskdialog (Create/Update Task + Save icon) via
`scripts/capture-screenshots.mjs`; refresh 01/02 (login/dashboard re-render
chrome unchanged — re-capture to keep the set coherent).

### Docs

README (planning feature row, dialog row, testing row), AGENTS.md (the
Planning card convention + the icon_sm dead-variant quirk + the F-1
time-of-day flake), CLAUDE.md (testing), PAD (§3 tree, §8, §11, §12 ledger),
flow-schedule_SKILL.md v1.5.0 (**FS-16: time-of-day-dependent e2e locators**
+ the full-class-tree-diff method note), this plan's execution record,
`docs/session_6-review.md`, worklog.

### Deliver

Single commit on `main`, pushed via `docs/ssh_git_wrapper_v3.py` per
`docs/how-to-git-push-using-ssh-wrapper_SKILL.md`. No new branches.

## 4. Non-goals (deliberately not changed)

- Dashboard calendar/sidebar cards/Quick Actions/login/routing — sessions
  0–5 pinned; zero changes (the Refresh button's SIZE class is the only
  dashboard touch).
- Profile/Settings — verified byte-identical against the bundle this
  session; zero changes.
- API shapes/envelopes, auth crypto, rate limiter, DB contract, env
  contract, mobile menu/header — verified; zero changes.
- The judgment-call divergences listed in §2.
- `skills/` folder — excluded from checking/testing/compilation.

## 5. Execution record

| Item | Outcome |
|---|---|
| E-A (RED) | 8 planning specs failed against the pre-fix build exactly as predicted: the "Create Task" submit not found (old label "Add Task"), the DAY_TITLE (`div.tracking-tight`) locator not found (the Accordion renders no such div — the heading-pin corollary), the card-structure spec (accordion chevron/button present), and the mr-2 icon pins |
| E-B (RED) | The dialog-prefill spec failed ("Create Task" not found) and the refresh-button spec failed (`h-9` present, box 36px); the de-flaked status-card spec PASSED on the pre-fix build (test-only fix — expected) |
| P-1 (GREEN) | `src/app/(app)/Planning/page.tsx`: the two Accordions replaced with `Card`/`CardHeader`/`CardTitle`/`CardContent` (`bg-white/60 backdrop-blur-xl border border-white/20 rounded-3xl`, CardTitle `flex items-center gap-2`, task list in `div.space-y-3`, stats in `div.space-y-4`); the Accordion import removed (`ui/accordion.tsx` stays as an unused library primitive); the e2e heading assertions re-based to the reference's div-title semantics (`div.tracking-tight` + text pins; `getByRole("heading")` count-0 pins proving NO heading role) |
| P-2…P-4 (GREEN) | `src/components/planning/TaskDialog.tsx`: submit → `<Save className="w-4 h-4 mr-2" />` + `{editing ? "Update Task" : "Create Task"}`, `text-white` dropped (the default variant's `text-primary-foreground` styles it); Delete icon → `w-4 h-4 mr-2`, class order → `border-red-200 text-red-600 hover:bg-red-50`; right footer → `flex gap-3 ml-auto` |
| P-5/P-6 (GREEN) | Planning header: `Filter`/`Plus` icons → `w-4 h-4 mr-2`; the Add Task button drops `hover:from-sky-600 hover:to-blue-700` + `text-white` (measured after: 100.7px ≈ the reference's 100.7px Filter width — the 11.5px gap closed) |
| P-7 (GREEN) | `src/components/ui/button.tsx`: `icon_sm: ""` with the dead-variant comment — the Refresh Calendar button is content-sized (measured **30×30 on both apps**, no `h-9`/`w-9`) |
| F-1 (GREEN) | `tests/e2e/dashboard.spec.ts` status-card spec re-scoped to the StatusCard via the "Next Up" heading filter (`toContainText`/`not.toContainText` instead of the page-wide `div.rounded-3xl` + hasText + `toHaveCount(0)`); the completed task stays on the calendar on BOTH apps (decompile-verified: no status filter in `rre`/`are`/the clone's calendar) — the spec now asserts the CARD drops the task, not the page. Plus one mid-GREEN locator fix: the chevron-count assertion scoped to `main` (the header's desktop avatar also ships a chevron-down) |
| Gate | `bun run lint` clean · typecheck clean · `test` **59/59** · build green (19 routes; compiled successfully) · `test:e2e` **54/54 × 2 consecutive full runs** (51 → 54 specs: +2 planning pins + 1 dashboard pin; the de-flaked status spec now passes at ANY hour — verified at 09:0x UTC, inside the 07:00–22:00 grid window that failed at base) · smoke **30/30** |
| Live parity | Planning unselected + day-selected class-tree re-diff: **98/98 elements** (was 98/106 — the accordion's extra nodes gone), the selected-day Card region fully identical; remaining 9 diffs are ONLY the documented divergences (day-card div/button + `text-left`, `lucide-filter` vs `lucide-funnel` + polygon/path internals). Dashboard: **761/761 elements**, only the 2 lucide polyline/path internals (the Refresh button gap closed). Dialog verified live in BOTH modes: create ("Create Task" + Save icon `mr-2`, no text-white) and edit ("Edit Task"/"Update Task", Delete `mr-2` + reference class order, right container `flex gap-3 ml-auto`). Mobile menu re-pinned after remediation: trigger 374/50/36, menu 374/54/192, items [Profile, Settings, Logout] — **no Tailwind v4 regression** |
| Screenshots | 20 captures: 02-dashboard, 03-planning, 10-planning-selected, 15-taskdialog re-captured (the changed surfaces) + the full set re-run via the extended `scripts/capture-screenshots.mjs` (the script gained the 02/03/10 desktop captures) |
| Docs | README (planning/dialog feature rows, 54 e2e), AGENTS.md (the card convention, the icon_sm dead-variant quirk, the FS-16 flake family, session-6 references), CLAUDE.md (counts), PAD (§8 counts, §11, §12 ledger rows), flow-schedule_SKILL.md v1.5.0 (FS-16 + the full-class-tree-diff method), this execution record, `docs/session_6-review.md`, worklog |
| Push | Single commit on `main` via `docs/ssh_git_wrapper_v3.py` (no new branches) |
