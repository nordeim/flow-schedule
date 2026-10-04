# Remediation Plan — Session 8 (2026-10-04)

Session-8 review of the FlowSchedule clone (base commit `567a6a6` — the
session-7 remediation `2461446` plus the operator's session-log commit that
added `docs/session_8.md`, the Session-7 execution narrative) after
`git pull`. The `skills/` folder is excluded from code checking, testing and
compilation per the operating instructions (eslint ignores `skills`,
tsconfig excludes `skills`, vitest includes only `src/` + `tests/`).

Skills used this session: `agent-browser` (live state-matched diffing on
BOTH apps — next-week view, edit-mode dialog, Log Activity panel, mobile
menu re-pin), `clone-app-pat-pro` (decompile-first: the lucide version and
the classic primitive forms are quoted from the reference's live DOM AND
its bundle), `tdd-workflow` (red → green),
`verification-and-review-protocol` (executed evidence only).

## 1. Audit scope and method

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull origin main` (fast-forward: `docs/session_8.md`) | ✅ clean tree, main @ 567a6a6 |
| Docs ↔ code alignment | Re-read the five root docs + session_7-review.md + remediation-plan-session7.md + worklog.md + session_8.md; full gates re-executed at base | ✅ aligned — lint ✓ · typecheck ✓ · 59/59 unit · build ✓ · **58/58 e2e** · smoke 30/30 |
| Session-7 remediation (`2461446`) | Code spot-check (tasks route `orderBy createdAt desc`, store prepend, recharts 2.15.4, classic Badge div) | ✅ all in place; the 4 e2e pins held |
| Env contract | `.env` = `DATABASE_URL="file:../db/custom.db"`; `db/` at repo root; `.env.example`; vitest + playwright configs; 20 screenshots | ✅ intact |
| **Week-navigation view (never live-diffed before)** | Populated state-matched diff: the reference's leftover completed task ("Live verify scheduled", Tue Oct 6 11:00 — session-5 live-verification residue) was reproduced on the clone (created via the calendar dialog + Mark Complete), both apps navigated to NEXT week, full `<main>` class-tree diff | ✅ **0 diffs across the entire calendar + Quick Actions region (elements 0–653)** — the task block sits at the identical DOM index [227] with identical classes; the remaining diffs are the documented styled-jsx STYLE node + today-data sidebar-card states (the demo user's seed tasks vs the reference's 0-tasks-today) |
| **Edit-mode TaskDialog (first populated class-tree diff)** | Opened via the task-block click on BOTH apps; 62-element tree diff + input values | ⚠️ **3 real findings — G-2/G-3** (8 raw diffs: 4 were dump artifacts; the rest: DialogTitle `tracking-tight`, SelectTrigger classic classes, the lucide trash dual class) |
| **Log Activity populated panel** | State-matched entries on both apps | ✅ identical ("Live verify scheduled" / "Completed in 2 days", same classes) |
| **Mobile navigation (highest regression risk)** | Live re-measurement on BOTH apps at 390×844 (trusted clicks) | ✅ trigger 338/14/36×36 both; menu 182/54/192×164, items [Profile, Settings, Logout] — **no Tailwind v4 regression**; the 58/58 e2e includes the 9 mobile pins |
| **Open-menu class tree** | 16-element diff of the open dropdown on both apps | ⚠️ order-only class diffs (P-2 — same class SET, style-neutral; documented, not fixed) |
| **Open Select listbox** | Structure diff of the open priority Select on both apps | ⚠️ SelectContent missing the side `slide-in-from-*` classes (G-3) — SelectItem/SelectContent otherwise byte-identical |
| Reference residue | Found "Live verify scheduled" (completed) on the reference's next week — created during session 5's Mark Complete live verification, never deleted; sessions 6/7's "0 tasks" checks only looked at the CURRENT week | P-3 — clean up at session end (restore the true 0-task baseline) |

The audit's headline method difference: session 7 diffed the populated
CURRENT week; this session diffed the populated **NEXT week** (a view no
prior session ever class-tree diffed) and the **edit-mode dialog** (which
only exists in a populated state) — plus the reference's own leftover data
became the matched-data seed.

## 2. Issues, bugs and gaps found

All reference values are quoted from the live reference DOM (agent-browser)
and corroborated against the decompiled bundle
(`reference/app-chunks/index.js`, scratch — git-ignored).

### G-1 (High — behavioral/visual): every Radix animation is DEAD CSS

The clone's `dialog.tsx`, `dropdown-menu.tsx` and `select.tsx` carry the
full shadcn animation class set
(`data-[state=open]:animate-in … fade-in-0 … zoom-in-95 …
slide-in-from-top-2`), and **tw-animate-css 1.4.0 sits in devDependencies**
— but `globals.css` never imports it. The built stylesheet contains ZERO
`animate-in` / `fade-in-0` / `zoom-in-95` / `slide-in-from-*` rules: the
classes are dead strings. The reference's live stylesheet defines
`.animate-in { animation-name: enter; animation-duration: 0.15s; … }` and
its dialog/dropdown/select genuinely animate (fade + zoom + slide from
top-[48%] / top-2). Seven sessions of class-tree diffs were blind to it
(class equality ≠ CSS existence), and static e2e pins never assert motion.
`tailwindcss-animate` (the v3 plugin) is ALSO in devDependencies, equally
unused — dead weight (and unusable under Tailwind v4 CSS-first anyway).

### G-2 (High — byte parity): lucide-react 0.525.0 vs the reference's 0.475.0

The reference's bundle carries the banner `lucide-react v0.475.0` and its
icon factory emits exactly ONE class per icon
(`fF(\`lucide-${$W(e)}\`, r)` with
`$W = e => e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()`). The
clone's 0.525.0 factory emits TWO (`lucide-${toKebabCase(toPascalCase(name))}`
+ `lucide-${name}`). Consequences (all live-measured):
1. **Trash2** renders `lucide lucide-trash2 lucide-trash-2` on the clone vs
   `lucide lucide-trash2` on the reference (the edit-dialog diff's [44]).
2. **LogOut** renders `path`+`path` internals on the clone vs the
   reference's `polyline`+`line` (the open-menu diff's [14]/[15]) — the
   documented "lucide polyline/path internals" divergence is VERSION
   DRIVEN, not fundamental.
3. The Filter/funnel naming family (documented since session 2) is the same
   version gap.
Downgrading to the reference's measured 0.475.0 (peer range includes
`^19.0.0` — React-19-compatible) closes all three at once. This mirrors
session 7's G-3 recharts pin: **the library version is parity data.**

### G-3 (Medium — byte parity): classic shadcn primitive forms (the session-7 Badge family, continued)

1. **DialogContent** — the clone ships the modern form
   (`left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`, no slide
   animations, `rounded-lg` instead of `sm:rounded-lg`). The reference
   renders the classic form: `fixed left-[50%] top-[50%] … translate-x-[-50%]
   translate-y-[-50%] … data-[state=closed]:slide-out-to-left-1/2
   data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2
   data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg`.
2. **DialogTitle** — the reference's H2 renders `tracking-tight text-xl
   font-bold text-slate-900`; the clone's base
   (`text-lg font-semibold leading-none`) drops `tracking-tight`, so the
   merged output misses it.
3. **SelectTrigger** — the reference renders `… shadow-sm
   ring-offset-background data-[placeholder]:text-muted-foreground
   focus:outline-none …`; the clone's modern base replaced that with
   `placeholder:text-muted-foreground` and dropped `ring-offset-background`.
4. **SelectContent** — the reference's listbox carries the side-slide
   classes (`data-[side=bottom]:slide-in-from-top-2` …); the clone's base
   omits them.

### G-4 (Medium — API contract): responses ship camelCase Prisma passthrough, the documented wire is snake_case

AGENTS.md/PAD/CLAUDE.md all pin "the task/note JSON wire format is
snake_case (`start_time`, `duration_minutes`, `created_at`) — the reference
app's entity shape", and the POST/PATCH routes DO accept snake_case
(`body.start_time`, `body.duration_minutes`). But every GET/POST/PATCH
response returns raw Prisma objects (`startTime`, `endTime`,
`durationMinutes`, `isSample`, `userId`, tags as a JSON STRING), and
`mapTask`/`mapNote` in the store convert FROM camelCase. The reference's
own entity API speaks snake_case (its bundle reads `start_time` /
`end_time` / `duration_minutes`; `fn.Note.list("-created_date")`; the
TaskDialog form state is `{…, start_time:"", end_time:"", duration_minutes:60}`)
and its notes carry `tags` as an ARRAY. The asymmetry (snake requests ↔
camel responses + string tags) actively misled this session's own API
probing and will mislead future consumers. Fix: serialize responses to the
documented entity shape (snake_case fields, `tags` as an array, drop the
clone-internal `isSample`/`userId` from the wire) and point `mapTask`/
`mapNote` at the snake_case raw shape.

### P-1 (docs): README API-table drift

`README.md` line 207 still says the daily-focus fallback is "Paul J. Meyer
default" — session 4 fixed the fallback to the reference's Mark Twain set
(unit-pinned); the README row was never updated.

### P-2 (documented divergence — NOT fixed): dropdown item class order

The open-menu tree diff shows the Profile/Settings/Logout items carry the
SAME class set on both apps but in a different ORDER — and the reference's
string even contains duplicated `flex items-center px-2 py-1.5` tokens
(plain concatenation, no tailwind-merge, in its item composition).
Style-neutral (CSS cascade ignores attribute order; geometry
live-measured identical). Replicating it would mean abandoning twMerge for
dropdown items — risk without visual payoff. Accepted and documented.

### P-3 (reference residue): session-5's leftover task

"Live verify scheduled" (completed, work, Tue Oct 6 11:00, 60min) sits on
the reference account — created during session 5's Mark Complete live
verification and never deleted. Sessions 6/7's "back to 0 tasks" cleanup
claims only checked the current week. Delete it at session end (its
clone-side twin too), restoring the true 0-task baseline.

## 3. TDD execution order

**e2e/unit (RED) → implementation (GREEN) → gate → live parity → docs.**

### E-A new unit pins (`tests/wire-format.test.ts`)

`serializeTask` / `serializeNote` (new `src/lib/serialize.ts`): tasks →
`{ id, title, description, priority, category, status, start_time,
end_time, duration_minutes, created_at, updated_at }` (snake_case; NO
`isSample`/`userId`); notes → `{ id, title, content, tags (array),
created_at, updated_at }`. RED: module does not exist.

### E-B e2e pins (extend `tests/e2e/dashboard.spec.ts` + `planning.spec.ts`)

1. "the task dialog animates open like the reference" (G-1): open the
   create dialog via a calendar-cell click; the content element's computed
   `animation-name` is `enter` (RED: `none` — the utilities are dead CSS).
2. "the dialog title renders the classic tracking-tight heading" (G-3):
   the dialog H2's class list contains `tracking-tight` (RED now).
3. "the select trigger carries the classic ring/placeholder classes"
   (G-3): the priority Select trigger's class list contains
   `ring-offset-background` and `data-[placeholder]:text-muted-foreground`
   (RED now).
4. "the edit dialog's delete icon renders the reference's single lucide
   class" (G-2): the trash svg carries `lucide-trash2` and NOT
   `lucide-trash-2` (RED now).
5. "the tasks API responds in the reference's snake_case entity shape"
   (G-4): POST a task with `start_time`; the response's `data.task` has
   `start_time`/`duration_minutes`/`created_at` keys and no `startTime`/
   `isSample`/`userId` (RED now).

### E-C spec robustness (part of G-1's GREEN)

`mobile-navigation.spec.ts` measures `menu.boundingBox()` immediately
after `toBeVisible()`. With the animations live, the menu is mid
zoom-in-95/slide-in-from-top-2 at that instant (Playwright's boundingBox
includes transforms) → the 192±2 width pin would flake. Add an
animation-settled wait (`getAnimations()` finished) before measuring —
mirroring how the reference's own measurements always settled.

### GREEN (implementation)

1. `src/app/globals.css` (G-1): `@import "tw-animate-css";` after
   `@import "tailwindcss";`. Remove the unused `tailwindcss-animate` from
   devDependencies (tw-animate-css already present, v4-native).
2. `package.json` (G-2): `lucide-react: "^0.525.0"` → `"^0.475.0"` (the
   reference's measured version; peer range includes React 19); `bun
   install` to refresh the lockfile. Verify all 36 imported icons exist
   (typecheck) and the visual set is unchanged.
3. `src/components/ui/dialog.tsx` (G-3.1/2): DialogContent base → the
   classic shadcn form (left-[50%]/top-[50%]/translate-x-[-50%]/
   translate-y-[-50%] + the 4 slide classes + `sm:rounded-lg`); DialogTitle
   base → `text-lg font-semibold leading-none tracking-tight`.
4. `src/components/ui/select.tsx` (G-3.3/4): SelectTrigger base
   `placeholder:text-muted-foreground` → `ring-offset-background
   data-[placeholder]:text-muted-foreground`; SelectContent base gains the
   4 side slide-in classes.
5. `src/lib/serialize.ts` + routes + store (G-4): serializeTask/
   serializeNote used by `api/tasks` (GET/POST), `api/tasks/[id]`
   (PATCH/DELETE-adjacent returns), `api/notes`, `api/notes/[id]`;
   `mapTask`/`mapNote` read the snake_case raw shape (tags as array).

### Gate

`bun run lint && bun run typecheck && bun run test && bun run build &&
bun run test:e2e` (twice consecutively) + `scripts/smoke-test.sh` (30/30).

### Live parity re-verification (agent-browser, both apps)

- Edit-mode dialog re-diff (expect: only the documented order-only menu
  diffs + the >VAL dump artifacts gone — zero class diffs);
- the dialog's computed animation-name === "enter" on BOTH apps;
- the next-week populated calendar re-diff (still 0-diff in the calendar
  region);
- the mobile menu geometry re-pin after the animation change (settle first);
- reference residue cleanup: delete "Live verify scheduled" from the
  reference (and its clone twin) — back to the true 0-task baseline.

### Screenshots

Re-capture the animated-state screenshots (15-taskdialog + 08-mobile-menu)
plus the standing set via `scripts/capture-screenshots.mjs` (its trusted
Playwright clicks + waits settle animations naturally).

### Docs

README (P-1 Mark Twain row; wire-format rows; the animation row),
AGENTS.md (the tw-animate-css import quirk + the lucide 0.475 pin + the
classic primitive set + the wire serializer seam + session-8 references),
CLAUDE.md (stack + counts), PAD (§1.2 lucide row, §4.1 wire contract, §5.3,
§8, §12 ledger), flow-schedule_SKILL.md v1.7.0 (**FS-18: class equality is
not CSS existence — dead utility classes pass every class-tree diff; and
library versions are parity data (the lucide corollary)**), this plan's
execution record, `docs/session_8-review.md`, worklog.

### Deliver

Single commit on `main`, pushed via `docs/ssh_git_wrapper_v3.py` per
`docs/how-to-git-push-using-ssh-wrapper_SKILL.md`. No new branches.

## 4. Non-goals (deliberately not changed)

- The dropdown-item class ORDER (P-2 — same set, style-neutral; the
  reference's plain-concat duplicates not replicated).
- The response `end_time` derivation (server-side, PAD §4.2's documented
  single-source-of-truth divergence) — responses still SHIP end_time.
- Dashboard calendar/sidebar cards/Quick Actions/login/routing — zero
  changes (this session's diffs found them clean).
- The reference's `created_date` Note sort-field naming (the wire ships
  `created_at`, the repo's documented contract; the reference's field name
  appears in its bundle only as a sort-key string).
- `skills/` folder — excluded from checking/testing/compilation.

## 5. Execution record

| Item | Outcome |
|---|---|
| E-A (RED) | `tests/wire-format.test.ts` failed to load (module absent) — the predicted red |
| E-B (RED) | All 5 new e2e specs failed against the pre-fix build exactly as predicted: the dialog's computed animation-name was `none`, the H2 lacked `tracking-tight`, the SelectTrigger lacked `ring-offset-background`/`data-[placeholder]:`, the trash svg carried BOTH lucide classes, and the POST response shipped `startTime`/`isSample` (camelCase passthrough) |
| G-1 (GREEN) | `globals.css`: `@import "tw-animate-css";` after Tailwind + the load-bearing comment; `tailwindcss-animate` removed from devDependencies (dead weight, unusable under v4); live-verified: the dialog's computed `animation-name: enter`, the mobile menu animates and settles to the identical geometry |
| G-2 (GREEN) | lucide-react `^0.525.0` → `^0.475.0` + `bun install`; typecheck confirmed all 36 icon imports exist; the edit dialog's trash icon now renders the reference's single `lucide-trash2` (e2e-pinned) |
| G-3 (GREEN) | dialog.tsx: DialogContent classic form (left-[50%]/top-[50%]/translate-x-[-50%]/translate-y-[-50%] + 4 slide classes + sm:rounded-lg; the rendered container is BYTE-IDENTICAL to the reference's), DialogTitle base + `tracking-tight`; select.tsx: SelectTrigger `ring-offset-background data-[placeholder]:text-muted-foreground`, SelectContent side slide-ins |
| G-4 (GREEN) | `src/lib/serialize.ts` (serializeTask/serializeNote) wired into all 4 task/note routes; mapTask/mapNote read the snake_case wire (tags as arrays); 7 unit tests pin the serializer; e2e pins the POST+GET response shape |
| E-C (GREEN) | `mobile-navigation.spec.ts` waits for `getAnimations()` to finish before measuring; `scripts/capture-screenshots.mjs` settles the menu + dialog animations before capturing |
| P-1 (GREEN) | README's `/api/ai/daily-focus` row now says the Mark Twain set (matching `src/lib/ai-defaults.ts`, unit-pinned) |
| P-2 (documented) | The dropdown-item class-order divergence recorded in AGENTS.md/SKILL (same class set, style-neutral; the reference's plain-concat duplicates not replicated) |
| P-3 (GREEN) | "Live verify scheduled" deleted from the reference via its own dialog (confirm armed) AND from the clone — the reference account is back to the TRUE 0-task baseline (the sessions-6/7 "0 tasks" checks had only looked at the current week) |
| Gate | lint clean · typecheck clean · **66/66 unit** (59 → 66: +7 wire-format) · build green (19 routes) · **63/63 e2e × 2 consecutive full runs** (58 → 63: +5 pins) · smoke **30/30** |
| Live parity | The EDIT-MODE dialog class-tree diff is now **0/62** (was 8 raw diffs / 3 real findings) — byte-identical including the container string and the input values; the NEXT-week populated calendar re-diff: **0 diffs across the entire calendar + Quick Actions region (elements 0–653)**, the task block at the identical index [227]; the dialog's computed animation-name is `enter` on BOTH apps; the mobile menu re-pinned at 338/14/36×36 + 182/54/192×164 (identical, animation settled); Log Activity populated entries identical |
| Screenshots | All 20 captures re-run on the remediated codebase (the script now settles animations before the menu/dialog shots and re-captures the profile/settings/quickaction/mobile-dashboard views so the lucide 0.475 icons render) |
| Docs | README (P-1 row, wire-format API rows, lucide 0.475.x row, 66/63 counts, animation-settled notes), AGENTS.md (4 new quirks: the tw-animate-css import, the lucide 0.475 pin, the classic dialog/select primitives, the animation-settle spec rule + the snake_case-wire rewrite + session-8 references), CLAUDE.md (stack + counts + serializer seams), PAD (§1.2 lucide/animations rows, §4.1 wire contract, §5.3, §8, §10.1, §12 — 9 new session-8 ledger rows), flow-schedule_SKILL.md v1.7.0 (FS-18 + 6 debugging rows + the session-8 history entry + the recharts 2.15.4/ignoreBuildErrors stack-table corrections), this execution record, `docs/session_8-review.md`, worklog |
| Push | Single commit on `main` via `docs/ssh_git_wrapper_v3.py` (no new branches) |
