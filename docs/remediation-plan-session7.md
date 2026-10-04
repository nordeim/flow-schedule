# Remediation Plan — Session 7 (2026-10-04)

Session-7 review of the FlowSchedule clone (base commit `58d471f` — the
session-6 remediation `9c26d21` plus the operator's session-log commit that
added `docs/session_7.md`, the Session-6 execution narrative) after
`git pull`. The `skills/` folder is excluded from code checking, testing and
compilation per the operating instructions (eslint ignores `skills`,
tsconfig excludes `skills`, vitest includes only `src/` + `tests/`).

Skills used this session: `agent-browser` (live state-matched diffing on
BOTH apps — this time with POPULATED data: four identical "Parity *"
tasks were created through each app's own TaskDialog), `clone-app-pat-pro`
(decompile-first: every ordering finding is quoted from the reference's
live DOM AND its bundle), `tdd-workflow` (red → green),
`verification-and-review-protocol` (executed evidence only).

## 1. Audit scope and method

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull origin main` (fast-forward: `docs/session_7.md`) | ✅ clean tree, main @ 58d471f |
| Docs ↔ code alignment | Re-read the five root docs + session_6-review.md + remediation-plan-session6.md + worklog.md + session_7.md; fast gates re-executed at base | ✅ aligned — lint ✓ · typecheck ✓ · 59/59 unit |
| Session-6 remediation (`9c26d21`) | Code spot-check (Planning Card structure, TaskDialog footer, `icon_sm: ""`) — all in place; the e2e pins held | ✅ clean |
| Env contract | `.env` = `DATABASE_URL="file:../db/custom.db"`; `db/` at repo root; `.env.example` unit-pinned; vitest + playwright configs; 20 screenshots | ✅ intact |
| **Mobile navigation (highest regression risk)** | Live re-measurement on BOTH apps at 390×844 (trusted mouse events) | ✅ trigger 374/50/36 both; menu 374/54/192, items [Profile, Settings, Logout] — **no Tailwind v4 regression** |
| **Desktop account dropdown (never geometry-measured before)** | Live measurement on BOTH apps at 1440×900 (trusted mouse events) | ✅ trigger 1252/14/76×36 both; menu 1136/54/192×164 right-anchored to 1328, items identical — first-time pinned |
| Header class-tree (desktop) | Full tag+class tree dump + diff | ✅ byte-identical |
| Week-init logic | Reference bundle decompile (`lre`/`eSe`: `Ka(new Date,{weekStartsOn:1})`) + live reload test | ✅ identical (an observed "previous week" on the reference's first load was leftover view state from the session-6 browser, not an init difference — a fresh reload of both apps renders the same Monday) |
| **Populated-state parity (the session's headline method)** | 4 identical tasks created through each app's TaskDialog (Parity Alpha 10:00/work/high + desc, Beta 12:00/personal/medium + desc, Gamma 15:00/health/urgent, Delta 08:00/learning/low); full `<main>` class-tree dump + element-wise diff for the dashboard (desktop 836 vs 845 lines, mobile) and Planning (132 vs 132) | ⚠️ **4 findings — G-1…G-4** |
| StatusCard selection | Reference `ure` decompile + live behavior on both apps | ✅ logic identical (filter → sort asc → find start > now); a transient stale-card observation on the reference was its fetch timing, not a logic difference |
| Log Activity ordering | Reference `H1e` decompile (`fn.Task.list("-end_time")` + filter + slice(0,5)) vs the clone (client sort by end_time desc + slice) | ✅ equivalent output |
| Notes ordering | Reference `fn.Note.list("-created_date")` vs the clone's `orderBy: { createdAt: "desc" }` | ✅ matches |
| AI summary / DailyFocus | LLM content variance (chips count differs run-to-run) — structure class-identical | ✅ accepted (documented) |

The audit's headline method difference: session 6 diffed the EMPTY state
(the reference account holds 0 tasks); this session created **matched data
on both apps** and diffed the POPULATED state — which is what surfaced the
ordering family (chips, list order) and the Badge element type: none of
those DOM nodes exist in the empty state.

## 2. Issues, bugs and gaps found

All reference values are quoted from the live reference DOM (agent-browser,
1440×900 / 390×844) and corroborated against the decompiled bundle
(`reference/app-chunks/index.js`, scratch — git-ignored).

### G-1 (High — user-visible): task list ordering

The reference's default `fn.Task.list()` returns tasks **createdAt desc**
(newest first). Live evidence: creating Alpha→Beta→Gamma→Delta (in that
order) on the reference yields the day's task array as
**[Delta, Gamma, Beta, Alpha]** — which is neither startTime asc nor desc;
it is exactly reverse creation order. The clone's `GET /api/tasks` ships
`orderBy: [{ startTime: "asc" }, { createdAt: "desc" }]` →
**[Delta, Alpha, Beta, Gamma]**.

User-visible consequences (both verified live, side-by-side):

1. **Planning day-card chips** — `dayTasks.slice(0, 3)` renders the first
   three in array order, then "+N more". With 4 tasks:
   REF card = `Sun 4 | Parity Delta, Parity Gamma, Parity Beta | +1 more`
   (Alpha hidden); CLONE card = `Sun 4 | Parity Delta, Parity Alpha,
   Parity Beta | +1 more` (Gamma hidden). Different chips visible.
2. **Planning selected-day task list** — REF renders
   [Delta, Gamma, Beta, Alpha]; CLONE renders [Delta, Alpha, Beta, Gamma].

Order-independent consumers (verified): the StatusCard sorts by start_time
itself before `find`; the Log Activity panel sorts by end_time desc
client-side; the calendar blocks are absolutely positioned. The AI summary
prompt iterates the array in order — after the fix the prompt's task order
matches the reference too.

### G-2 (Medium — user-visible right after creation): store createTask appends

The reference's TaskDialog save (`Xne` → `onSave` → `lre`'s `P` = refetch
+ parent bump) ends with a **fresh `fn.Task.list()`** — so the newly
created task takes the FIRST position of the array (createdAt desc). The
clone's `createTask` optimistically **appends**:
`set((s) => ({ tasks: [...s.tasks, task], … }))` — the new task lands
LAST until a reload. Live evidence: right after creating Delta on the
clone (no reload), the calendar's task-block DOM order was
[Alpha, Beta, Gamma, Delta]; the reference's is [Delta, Gamma, Beta,
Alpha]. Invisible on the calendar (absolute positioning) but visible on
the Planning chips immediately after a creation without reload.

### G-3 (Medium — byte-parity): recharts 3.x vs the reference's 2.x

The reference's SkillsMap pie DOM has **no `recharts-zIndex-layer_*`
groups** (0 occurrences of the string in its bundle), no
`g.recharts-shape` wrapper per sector, and its `recharts-tooltip-wrapper`
is a sibling **after** the `svg.recharts-surface` — the recharts 2.x DOM.
The clone (recharts 3.10.1) emits 12 empty zIndex layer groups, wraps each
sector's path in an extra `g.recharts-layer.recharts-shape`, renders the
tooltip wrapper **before** the svg, and adds an extra empty-class wrapper
DIV around `recharts-wrapper`. The visual output is identical (same props:
`cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2}
dataKey="value"` — decompiled `g0e` matches the clone's source exactly);
the internal DOM is not. Session 0 picked recharts 3.x as a scaffold
default — the reference's measured version is 2.x.

### G-4 (Medium — byte-parity): the Badge component's element type + classes

The reference's Badge (`Z1e`/`W$`, classic shadcn) renders a **`<div>`**
via forwardRef with the full classic class set:

```
cva base:  inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs
           font-semibold transition-colors focus:outline-none focus:ring-2
           focus:ring-ring focus:ring-offset-2
default:   border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80
secondary: border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80
destructive: border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80
outline:   text-foreground
```

The clone's `ui/badge.tsx` is the modern shadcn form: a `<span
data-slot="badge">` **without** `focus:ring-2 focus:ring-ring
focus:ring-offset-2` and without the `shadow` / `hover:bg-*` variant
classes. Live diff (planning populated): REF chips render
`DIV|…focus:ring-2 focus:ring-ring focus:ring-offset-2
border-transparent hover:bg-secondary/80 text-xs bg-purple-100…`; CLONE
renders `SPAN|…border-transparent text-xs bg-purple-100…`. Used in exactly
two spots (Planning day-card chips + Planning selected-day task items) —
invisible in the empty state, which is why six sessions of class-tree
diffs never saw it.

### Deliberately NOT changed (judgment calls, recorded for review)

- **Task-block DOM order tie-breaking on the calendar**: fixed implicitly
  by G-1 (same-minute overlaps now tie-break in the reference's order).
- **The reference's per-card refetch-on-save** (`lre` refetches its own
  list; the clone optimistically mutates the store): the observable
  outcome is equalized by G-2's prepend; a full refetch flow would add a
  network round-trip the store design (ADR-003) deliberately avoids.
- **styled-jsx `<style>` tags** (reference emits 2 into the DOM; the clone
  carries the same effective values in globals.css — session-4 documented
  equivalence). Not actionable.
- **lucide polyline vs path internals + `lucide-filter` vs
  `lucide-funnel`**: identical classes and visuals, lucide-version
  artifacts. Not actionable (documented).
- **AI chips count**: LLM content variance — both apps' chips are
  class-identical; only the number of focus-areas/activities differs
  run-to-run. Accepted (ADR-005).
- **Day-card `div` (reference) vs `button` (clone)**: the session-2
  documented a11y judgment, pinned by the e2e. Kept.
- **The reference's week-view state persistence** (its calendar came up on
  the previous week after the session-6 browser left it there): platform
  state, not app behavior; both apps' week-init is identical. Not
  actionable.

## 3. TDD execution order

**e2e (RED) → implementation (GREEN) → gate → live parity → docs.**

### E-A `tests/e2e/planning.spec.ts` (new pins)

1. New spec "day-card chips follow the reference's createdAt-desc order":
   create task A ("E2E order alpha", today 15:00) then task B ("E2E order
   beta", today 09:00) via `page.request.post("/api/tasks")` (alpha FIRST,
   beta SECOND — so startTime-asc would render [beta, alpha] but
   createdAt-desc renders [beta, alpha]… no: createdAt-desc renders B
   first because B was created last); load /Planning; assert the day card's
   chip sequence is **[beta, alpha]** and the selected-day list order is
   **[beta, alpha]**. Clean up both tasks.
2. New spec "category badges render as the reference's classic div badge":
   the day-card chip badge's tag name is `DIV` and its class list contains
   `focus:ring-2`, `focus:ring-ring`, `focus:ring-offset-2`, and (for the
   secondary variant used by the chips) `hover:bg-secondary/80`; the
   selected-day task-item badge likewise carries the focus-ring classes.

### E-B `tests/e2e/dashboard.spec.ts` (new pins)

1. New spec "the Skills Map pie renders the reference's recharts 2.x DOM
   shape": inside the populated pie container there are **no**
   `g[class*="recharts-zIndex"]` elements and **no**
   `g.recharts-shape` wrappers, and the `div.recharts-wrapper`'s children
   are `[svg.recharts-surface, div.recharts-tooltip-wrapper]` in that
   order (tooltip AFTER the svg). RED on recharts 3, GREEN on 2.
2. New spec "a newly created task takes the first DOM position on its
   day" (G-2): create task A (today 15:00) via the API, reload the
   dashboard (array = [A] for the day); then create task B (today 09:00)
   via the API **without reloading** — hmm: the store only refetches on
   `refreshTasks`/`taskVersion` consumers… the dialog flow is the real
   path: create B through the calendar-cell TaskDialog (trusted clicks);
   then, without reload, the day's task-block DOM order must be **[B, A]**
   (B prepended). RED with the current append, GREEN with prepend.

### GREEN (implementation)

1. `src/app/api/tasks/route.ts` (G-1):
   `orderBy: [{ startTime: "asc" }, { createdAt: "desc" }]` →
   `orderBy: { createdAt: "desc" }` with a comment pinning the reference's
   default `fn.Task.list()` semantics (ordering IS parity — it decides the
   Planning chips and the selected-day list).
2. `src/store/useFlowStore.ts` (G-2): `createTask`'s
   `tasks: [...s.tasks, task]` → `tasks: [task, ...s.tasks]` with a
   comment (the reference's save → refetch → newest-first; prepend to the
   already-createdAt-desc array is the same result without the round-trip).
3. `package.json` (G-3): `recharts: "^3.10.1"` → `"^2.15.4"` (the final
   2.x; React-19-compatible peer range; the reference's bundle carries no
   recharts-zIndex strings — the 2.x DOM signature). `bun install` to
   refresh the lockfile; verify the SkillsMap still renders (live + e2e).
4. `src/components/ui/badge.tsx` (G-4): rewrite to the classic shadcn
   form — `div` root via forwardRef, `displayName="Badge"`, the full cva
   base (with `focus:ring-2 focus:ring-ring focus:ring-offset-2`) and the
   four variants with their `shadow`/`hover:bg-*` classes, exactly the
   reference's `Z1e`/`W$`.

### Gate

`bun run lint && bun run typecheck && bun run test && bun run build &&
bun run test:e2e` (twice consecutively) + `scripts/smoke-test.sh` (30/30).

### Live parity re-verification (agent-browser, both apps)

- Dashboard populated class-tree re-diff (expect: only the 2 documented
  lucide polyline/path internals + the 2 documented styled-jsx STYLE
  nodes + LLM-content chip-count variance remain);
- Planning populated class-tree re-diff (chips + selected-day list now in
  the reference's order; badges as DIVs with the focus-ring classes);
- the "new task first" behavior live-verified on both apps;
- the mobile menu geometry re-pin (unchanged surface, re-verified per the
  operating instructions);
- reference data cleanup: delete the four Parity tasks from the reference
  account (leave it as found — 0 tasks).

### Screenshots

Re-capture 02-dashboard (populated pie in the 2.x DOM + sidebar) and
03-planning + 10-planning-selected (chips/list order + DIV badges) via
`scripts/capture-screenshots.mjs`; keep the rest of the set coherent.

### Docs

README (recharts 2.x row, testing row counts), AGENTS.md (the ordering
quirk + the recharts pin + the Badge note + session-7 references),
CLAUDE.md (testing counts), PAD (§1.2 stack row, §5.3, §8, §12 ledger),
flow-schedule_SKILL.md v1.6.0 (**FS-17: array ordering is a parity
surface — class-tree diffs ignore text and DOM order; populated-state
diffs need matched data**), this plan's execution record,
`docs/session_7-review.md`, worklog.

### Deliver

Single commit on `main`, pushed via `docs/ssh_git_wrapper_v3.py` per
`docs/how-to-git-push-using-ssh-wrapper_SKILL.md`. No new branches.

## 4. Non-goals (deliberately not changed)

- Dashboard calendar/sidebar cards/Quick Actions/login/routing — zero
  changes (G-1's ordering reaches them via the store but changes no
  component code).
- Profile/Settings — verified byte-identical (session 6); zero changes.
- API shapes/envelopes, auth crypto, rate limiter, DB contract, env
  contract, mobile menu/header — verified; zero changes.
- The judgment-call divergences listed in §2.
- `skills/` folder — excluded from checking/testing/compilation.

## 5. Execution record

| Item | Outcome |
|---|---|
| E-A (RED) | The 4 new specs failed against the pre-fix build exactly as predicted: G-1 [alpha, beta] (startTime-asc chips), G-4 SPAN without the focus-ring classes, G-3 (12 zIndex layers + shape wrappers + pre-svg tooltip + the extra wrapper div), G-2 ([alpha, beta] block order after the dialog create) |
| G-1 (GREEN) | `src/app/api/tasks/route.ts`: `orderBy: { createdAt: "desc" }` with the parity comment; verified live — both apps' Sunday chips now [Delta, Gamma, Beta] and the selected-day lists both [Delta, Gamma, Beta, Alpha] |
| G-2 (GREEN) | `src/store/useFlowStore.ts` createTask prepends (`[task, ...s.tasks]`); live-verified without reload: creating "Parity Epsilon" via the dialog put its block FIRST ([Epsilon, Delta, Gamma, Beta, Alpha]) |
| G-3 (GREEN) | `package.json` recharts `^3.10.1` → `^2.15.4` (React-19-compatible peer range; the only consumer is SkillsMap, whose props are version-agnostic — decompiled g0e matches the clone's source exactly); `bun install` lockfile refreshed; the pie DOM now byte-matches the reference's shape |
| G-4 (GREEN) | `src/components/ui/badge.tsx` rebuilt to the classic shadcn form (div, the full cva base with focus-ring classes, the four variants with shadow/hover); the Planning chips and task items now render DIV badges with the reference's exact class strings (live class-tree diff) |
| F-2 (found mid-GREEN) | The status-card spec failed in the first full run (57/58) — investigated with a debug boot of the standalone build (a fresh task + Mark Complete round-trip): the PATCH landed and the card re-rendered to "All caught up!" within 3s — the APP was correct; the SPEC's post-click locator filtered by the "Next Up" heading, which the card DROPS on the empty-state transition → "element(s) not found" on the negated assertion. A state-transition flake (FS-17's corollary): sessions 4–6 passed only because their runs predated the day's last seeded task (Sunday's 10:00 slot). Fixed: the locator now accepts /^(Next Up\|All caught up!)$/; verified green INSIDE the previously failing window (post-10:00 UTC) |
| Gate | lint clean · typecheck clean · test **59/59** · build green (19 routes) · `test:e2e` **58/58 × 2 consecutive full runs** (54 → 58: +4 new pins) · smoke **30/30** |
| Live parity | Dashboard populated class-tree: **845/838** — the 7-element delta is exactly the documented set (3 styled-jsx STYLE nodes + 4 LLM-content chip nodes; the recharts + task-order diffs GONE). Planning unselected **74/74** and day-selected **132/132** — only the documented filter/funnel icon + day-card div/button differences remain. G-2 verified live (new task first, no reload). Mobile menu re-pinned 374/54/192 after the changes — no Tailwind v4 regression. Desktop dropdown geometry first-time measured: trigger 1252/14/76×36, menu 1136/54/192×164 right-anchored — identical on both apps |
| Reference cleanup | The 4 Parity tasks deleted from the reference account via its own UI (dialog Delete + confirm) — the account is back to 0 tasks, exactly as found; the clone's debug tasks removed (parity7's Epsilon + the dev demo's Debug task) |
| Screenshots | All 20 captures re-run via `scripts/capture-screenshots.mjs` (the recharts 2.x pie, the createdAt-desc chips, and the DIV badges render in 02/03/10/14) |
| Docs | README (recharts 2.15.x row, planning feature row, 58-e2e counts, testing-table pins), AGENTS.md (the ordering-is-parity section, the recharts + Badge quirks, the F-2 locator rule, session-7 references), CLAUDE.md (stack + counts), PAD (§1.2 recharts row, §5.3, §8 counts + new pins, §10.1, §12 — 8 new session-7 ledger rows), flow-schedule_SKILL.md v1.6.0 (FS-17 + the state-transition corollary, 5 debugging rows, session history), this execution record, `docs/session_7-review.md`, worklog |
| Push | Single commit on `main` via `docs/ssh_git_wrapper_v3.py` (no new branches) |
