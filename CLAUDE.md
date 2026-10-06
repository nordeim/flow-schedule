---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
project_type: nextjs-single-app
version: 1.0.0
last_updated: 2026-10-06
---

# FlowSchedule — Weekly Schedule Planner

Direct clone of the FlowSchedule reference app (weekly time-grid calendar,
AI insights, focus timer, notes) rebuilt as a self-hosted single Next.js
application: cookie-session auth, Prisma/SQLite persistence, and
server-side z-ai-web-dev-sdk LLM calls with deterministic fallbacks.
Maintained as a faithful reference clone; every route, enum, color token,
and interaction mirrors the deployed reference app.

**Stack**: Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 5
(strict) · Tailwind CSS v4 (CSS-first `@theme`, v3 tokens pinned,
tw-animate-css for the Radix enter/exit animations) · shadcn-style Radix
components (the CLASSIC forms — div Badge, tracking-tight DialogTitle) ·
recharts 2.15.x (the reference's measured major) · lucide-react 0.475.x
(the reference's measured version) · framer-motion · Zustand 5 · Prisma 6
· SQLite · z-ai-web-dev-sdk · Vitest + Playwright · Bun runtime.

## Core Identity & Purpose

A time-management workspace: the Dashboard answers "what does my week look
like and what should I focus on today", the Planning page organizes it,
Quick Actions capture work as it happens. The clone replaces the reference
app's base44 platform (auth, entities, InvokeLLM) with self-hosted
equivalents at identical URLs and JSON shapes.

## Foundational Principles

### Meticulous Approach (Six-Phase Workflow)

1. **ANALYZE** — read the relevant files and this document in full before
   writing; identify the reference behavior being changed.
2. **PLAN** — state the smallest correct implementation path.
3. **VALIDATE** — confirm scope for anything touching auth, the API
   envelope, or the Tailwind token pins before coding.
4. **IMPLEMENT** — modular, typed, test-backed increments.
5. **VERIFY** — run the full gate:
   `bun run lint && bun run typecheck && bun run test && bun run build && bun run test:e2e`.
   Claims of "works" require executed evidence.
6. **DELIVER** — note what was verified, what was not, and deferred work.

### Project-Specific Principles

- **Fidelity to the reference is the product.** Route paths
  (`/Dashboard`, `/Planning` — capitalized), enum values, gradient hex
  stops, calendar geometry (16×60px slots, 80px labels), and the mobile
  menu's anchoring are all measured facts, not preferences.
- **The LLM never hard-fails.** Every AI feature has a deterministic
  fallback (the reference's own pattern). A 429 from the SDK must render
  the default quote/summary, never an error state.
- **Evidence-based verification.** Label claims Verified / Reasoned /
  Assumed. If it wasn't executed, say so.

## Implementation Standards

### General Coding Practices

- Early returns; composition over inheritance; self-documenting names.
- Server-side validation of every write (`src/lib/domain.ts` guards:
  `isPriority`, `isCategory`, `isTaskStatus`) — client enums are a
  convenience, never a boundary.
- `serializeTask(task, author)`/`serializeNote(note, author)`
  (`src/lib/serialize.ts`) are the ONLY Prisma→wire seams — the wire is
  the reference's CAPTURED entity shape (session 12 XHR capture:
  created_date/updated_date/is_sample/created_by/created_by_id, tags as
  arrays, the 14-key Task / 9-key Note shapes — emitted in the CAPTURED
  key order, session 16 KO-1/FS-28: Task start_time-first, Note
  title-first, every response surface; internal camelCase fields off
  the wire); `mapTask`/`mapNote` in the store are the ONLY wire→client
  conversion seams. The TaskDialog submits end_time client-computed and
  the description verbatim ("" stays ""); the API stores end_time AS
  SUBMITTED — an omitted end_time stays null on create / unchanged on
  update (the reference's own behavior, probed live, session 16 ET-1:
  NO server-side derivation; its PUT is partial — Mark Complete sends
  only status, nothing else changes).

### TypeScript / Next.js 16 specifics

- `params`/`searchParams`/`cookies()` are **async** — always `await`.
- Page files export only `default` + `metadata`/`generateMetadata`/
  `revalidate`/`dynamic`.
- `useSearchParams` needs a `<Suspense>` boundary (see `/login`).
- `react-hooks/set-state-in-effect` is an ERROR: derive loading states
  (AISummaryCard keyed-result pattern) and reset forms via remount
  (TaskDialog's mounted-on-open body), never via reset-effects.
- API route handlers return the `ok()/fail()` envelope from
  `src/lib/api.ts`; never throw across the boundary.

### Tailwind v4 (CSS-first — no tailwind.config.*)

- All tokens in `src/app/globals.css` `@theme inline`.
- The ui primitives carry **no `data-slot` attributes** (session 10, F-1 —
  the reference's DOM never emits them; do not re-add when pulling shadcn
  updates) and the TaskDialog title input is uncapped client-side (F-3 —
  the 300-char guard lives in the API routes only).
- Semantic tokens are **literal `hsl()` values** — bare triplets resolve
  to transparent (Trap 1).
- `--shadow-sm` and the slate/sky/indigo/etc. palette are **pinned to v3
  values** (Traps 5 and 2) — see `docs/Tailwind-V4-Validation-Report.md`
  before touching them.
- No `space-y-*` container may carry children with explicit mt/mb
  utilities (Trap 4 — the selector rewrite flips which side gets the
  margin and drops specificity to zero).
- **The space-y FIELD-GEOMETRY compat rules are load-bearing (session 22,
  S22-F1/S22-F2 — FS-34)**: v4's `:where(.space-y-N > :not(:last-child))
  { margin-block-end }` lands the margin on the INLINE `<label>` of the
  classic-shadcn field pattern (CSS ignores vertical margins on inline
  boxes — the label→field gap collapses) and loses to the reference's own
  `-mb-2` back-link at zero specificity; Radix's hidden native `<select>`
  also makes the SelectTrigger a `:not(:last-child)` (+8px per Select
  field). The v3-compat rules in `globals.css`
  (`.space-y-1\.5 > label + *`, `.space-y-2 > label + *` and its
  `:not(:last-child)` mb-zero, `.space-y-4 > .-mb-2 + *` + the
  `sm:space-y-6` media variant) restore v3's margin side — the DOM stays
  byte-identical. Pinned by `tests/space-y-compat.test.ts` (source) +
  the auth.spec/dashboard.spec computed-geometry specs; do NOT remove or
  "simplify" them, and measure COMPUTED GEOMETRY (settled animations),
  not class strings, when auditing field layouts.
- Quick Action gradients stay as inline-style hex gradients (Trap 3 —
  sidesteps in-oklab interpolation drift and matches the reference).
- **The shadcn SEMANTIC theme is the reference's DEFAULT (neutral)
  variant, not the scaffold's slate (session 23, S23-F2/FS-35)**: the
  whole `:root` family is pinned to the reference's app stylesheet
  (`--foreground: hsl(0 0% 3.9%)`, `--muted-foreground: hsl(0 0% 45.1%)`,
  `--radius: 0.5rem`, …). `--border`/`--input` keep the slate forms by
  the rendered-match ruling (the reference's nominal neutral-200 never
  renders — its bare borders take the v3 preflight `#e5e7eb`). Pinned
  by `tests/tailwind-theme-pins.test.ts` (source) + the theme-palette
  spec's semantic computed pins; do NOT "restore" the slate family or
  adopt the reference's nominal `--border` values.
- **The v3 LENGTH line-heights are pinned over v4's unitless ratios
  (session 23, S23-F3)**: `--text-xs--line-height: 1rem` (… through
  `--text-2xl--line-height: 2rem`) in `@theme`. v4's
  `--text-xs--line-height: calc(1/.75)` is a RATIO that re-scales on
  inheritance — a `text-[10px]` child of a `text-xs` parent renders
  13.33px where v3's `1rem` length inherits fixed at 16px. Element-
  local pixels are identical either way; only inheritance semantics
  differ. Pinned by the source pins + the day-label computed pin.

### The motion contract (session 19, FS-31)

- The Quick Actions / blob motion configs are DECOMPILED reference
  behavior, byte-pinned by `tests/panel-motion.test.ts` — do not
  "clean up" any duration/ease/delay/keyframe in
  `QuickActions.tsx`/`BackgroundBlobs.tsx` (the pins fail first, the
  e2e family is the last line).
- The reference's motion runtime is the WAAPI-hybrid `motion` engine;
  `framer-motion@14.0.0` is the same family (identical
  `supportedWaapiEasing` tables — circOut IS
  `cubic-bezier(0.55, 0, 1, 0.45)`, not the mathematical circular
  ease). Do NOT bump framer-motion without re-diffing the reference's
  WAAPI metadata (`getAnimations().effect.getComputedTiming()`).
- AnimatePresence exit animations carry the LAST-RENDERED transition —
  the form-view's exit runs with `delay: 0.15` because its final render
  had `activeId` set; the `activeId ? 0.15 : 0` ternary is dead on the
  exit path.
- **Pin animation contracts on METADATA, never on live transient
  computed reads (session 23, S23-F1)**: the panel-body entrance spec
  asserts the WAAPI timing (`duration 300 / delay 200 / circOut / fill
  both`) + the native keyframes (opacity 0→1). A live computed read of
  the mount/delay window is unfixably racy — the mode="wait" mount
  churn can starve the rAF poll ~200 ms (measured mid-tween at
  y=18.37); the single-evaluate variant only removed the CDP round-trip
  class, not the stall class.
- The second background blob renders 0×0 by design (BL-1): the
  reference's `w-100 h-100` is dead in its v3 scale; the clone mirrors
  the RENDERED effect (no width/height utilities). NEVER "fix" it back
  to a real size, and never copy the `w-100` string (v4's dynamic
  spacing would resolve it as 400 px).

### Database URL authority (db-path v3, session 9)

- The schema-owning repo's own `.env` `DATABASE_URL` is authoritative: an
  ambient env var carrying a SQLite URL that resolves OUTSIDE the repo is
  ignored (parent-workspace/harness hijack protection); an ambient URL
  resolving INSIDE the repo (the e2e `db/e2e.db`) or a non-SQLite URL
  (production PostgreSQL) still wins.
- The CLI-facing db scripts (db:push/db:migrate/db:reset) apply the same
  rule via `scripts/prisma-cli.ts`; `db:seed` self-resolves.
- Production: set the absolute path in the repo's `.env`, or remove the
  `DATABASE_URL` line there and use the environment variable.

### The AI prompt wire (session 13, FS-24)

- `src/lib/ai-prompt.ts` holds both prompts pinned BYTE-FOR-BYTE to the
  reference's CAPTURED InvokeLLM request bodies (the 8-space "blank"
  lines, the per-task template + `\n` join, the trailing space on
  item 3, the 6-space final line). `tests/ai-prompt.test.ts` pins the
  bytes + the SDK wiring (vi.mock) + the summary route's
  createdAt-desc task order (fn.Task.list()'s default —
  capture-proven, NOT startTime order). Do not reformat the
  whitespace; do not sort the tasks.
- The seed re-anchors its sample week across week boundaries
  (`src/lib/sample-week.ts`, E-1): the calendar always renders the
  current week, so stale sample rows are deleted and re-created on
  the current week; user rows are never touched.

### The AI response-parse contract (session 14, FS-26)

- The response seams in `src/lib/ai.ts` check SHAPE, not truthiness
  (the probed reference contract: schema-INVALID → fallback,
  schema-VALID-but-empty → rendered verbatim): empty mood/insights
  render empty `<p>`s, empty focus_areas/activities arrays render
  zero chips, empty-string items render empty chips, and the
  daily-focus guard is quote-ONLY (`a && a.quote` — empty
  author/affirmation render verbatim, "- " + "").
  `tests/ai-response.test.ts` pins the five probed classes with the
  mocked-SDK pattern; do NOT re-tighten with truthiness or
  `length > 0` filters.
- The task routes' responses serialize via `okWire`
  (`src/lib/api.ts` → `floatFormatDurations` in `serialize.ts`): the
  integer duration tokens ship as `"duration_minutes":60.0`,
  byte-matching the reference's Python-backed entity wire
  (session-12 P-1, closed). Only the task- and note-entity responses
  use `okWire`/`okWireCreate`; every other route keeps `ok()`.
- **The date-token wire (session 15, DW-1)**: the server-generated
  date tokens (`created_date`/`updated_date`) ship as 6-digit µs
  forms matching the reference's Python datetimes — no Z on read/
  update responses (`okWire`: GET/PATCH tasks + notes), Z on create
  responses (`okWireCreate`, default 201: POST tasks + notes) — via
  `formatWireDates` (`serialize.ts`). `start_time`/`end_time`
  (client-supplied, ms+Z) are never touched; the client keeps the
  strings opaque.

## Development Workflow

### Environment Setup

```bash
bun install
cp .env.example .env          # + AUTH_SECRET=$(openssl rand -hex 32)
bun run db:push && bun run db:seed
bun run dev                   # :3000
```

Demo login: `demo@flowschedule.app` / `demo1234`.

### Build Commands

| Command | Purpose |
|---------|---------|
| `bun run dev` | Dev server :3000 (Turbopack) |
| `bun run build` | Production build → `.next/standalone` |
| `bun run start` | Standalone prod server :3000 |
| `bun run test` | Vitest unit (170 tests) |
| `bun run test:e2e` | Playwright e2e (104 specs, needs prior build) |
| `bun run lint` / `bun run typecheck` | ESLint 9 flat / tsc --noEmit |

Single test: `bunx vitest run tests/auth.test.ts`.
Single e2e: `bun run test:e2e -- -g "mobile account menu"`.

## Testing Strategy

| Level | Tool | Location | Notes |
|-------|------|----------|-------|
| Unit | Vitest | `tests/*.test.ts` | Auth crypto, domain constants (incl. the skills color map + name transform), AI fallback content (Mark Twain set), db-path v3 (incl. the repo-.env authority rule), .env.example contract, site URL helper, next.config contract, rate-limit window/eviction, wire-format serializer (**pinned to the CAPTURED reference wire — created_date/updated_date/is_sample/created_by, the 14/9-key shapes**), the duration float-format wire (session 14, session-12 P-1), the date-token µs wire (session 15, DW-1 — route-keyed Z, start_time untouched), the key-ORDER wire (session 16, KO-1 — the exact captured emission order, start_time-first/title-first), the prisma-CLI wrapper contract |
| E2E | Playwright (90 specs — the planning pins incl. the createdAt-desc order + the DIV badges + the plain-DIV day cards (session 9, F-2) + **the Add Task no-op pin (session 21, S21-F1: the reference's Planning button is decorative — NO dialog, NO POST; the dialog request-body interception pin: end_time client-computed + verbatim description (session 12, W-3/W-4) lives at the DASHBOARD's calendar-cell entry — the reference's one true dialog mount)**; the dashboard pins incl. the recharts 2.x DOM shape, the new-task-first semantics, the enter-animation pin, the classic dialog/select classes, the single lucide-trash2 class, **the captured 14-key response wire shape (session 12, W-1/W-2)**, the strict formatDistanceToNowStrict relative times (session 10, F-2), the zero-data-slot DOM contract + the uncapped title input (session 10, F-1/F-3), the Log Activity top-5 slice + the Brainstorm no-op/order pins (session 11, G-1/G-2/G-3), **the viewport-band family (session 17, VP-1/FS-29: the md edge at 768×900 + the 1024×900 tablet band — desktop nav visible + mobile trigger hidden via computed display — and the no-horizontal-overflow invariant on documentElement at 390/768/1024/1440)**, **the classless body pin (session 17, BD-1: `document.body.className === ""`)**, **the Focus Timer timed-interaction family (session 18, FT-1/FS-30: the pause snap-to-full + resume restart-from-full, the edit-while-paused follow, the 00:00 terminal completion display via `page.clock` runFor — the reference's measured W1e state machine: the display is the `remaining` state, the snap lives in the toggle (both directions), only the completion path leaves 00:00 — and the close/reopen fresh-idle reset)**, **the panel-animation family (session 19, AN-1/FS-31 + BL-1: the overlay's WAAPI timing metadata (350 ms, the circOut bezier), the panel body's translateY(20px)+opacity-0 entrance held 0.2 s, the form-view exit's last-rendered 0.15 s delay, the blob layer's two-visible + second-at-0×0 contract)**, **the theme-palette family (session 20, F-1/C-1/FS-32: the computed font stack — the reference's v4.0-era ui-sans list over v4.3.3's v3-compat default — the AI Summary mood ramp's v3 purple hexes, the chips, the planning badges' text ramps, all pinned as exact computed rgb(...) serializations)**) | `tests/e2e/*.spec.ts` | Mobile-menu geometry parity (animation-settled), auth (the reference's separate sign-up / forgot-password views, the red/green alert cards, post-login landing at "/", the session guards, the custom 404), dashboard (incl. the decompiled Quick Actions open-panel states AND the decompiled sidebar-card states: Next Up + functional Mark Complete, skills-map legend/tooltip, AI-card icons/chips, DailyFocus vertical layout, the content-sized Refresh button), the full-bleed container, day-row spacing, the task-dialog delete confirm + "Create Task"/"Update Task" submit, planning — including the decompiled reference behaviors (null-init selectedDay, the always-visible Card structure — no accordion, no heading role, static stats placeholder, decorative Filter AND Add Task buttons (S21-F1 — both are no-ops in the reference), the clickable-DIV day cards) |

- E2E runs against the **production standalone** on `:3100` with its own
  seeded `db/e2e.db`; the setup project signs in ONCE (login is
  rate-limited) and shares storageState — per-test logins trip the
  rate limiter.
- Measure the menu trigger BEFORE opening the Radix menu (hide-others
  marks the app root `aria-hidden`; role queries for outside elements
  time out otherwise).
- A red test is a regression or a wrong test — never skip to pass.

## Code Quality Standards

- Errors caught at the page/component boundary get `console.error` with
  context; silent `catch(() => null)` without a sibling log is a defect.
- Every list renders an explicit empty state; every async region renders
  loading/empty/error.
- Buttons disable during async operations; forms use controlled handlers.
- Accessibility floor: visible focus states, `aria-label` on icon-only
  buttons, Radix primitives for dialogs/menus (focus trap + Escape are
  free), `prefers-reduced-motion` respected globally.

## Git & Version Control

- Branch `main`; Conventional Commits, atomic scope.
- Never commit `.env*` (except `.env.example`), `db/*.db`, or keys.
- Push via the SSH wrapper runbook:
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` (key never stored in
  the repo; the wrapper shreds its temp copy).

## Error Handling & Debugging

- API failures surface the envelope's `error.message` inline in the UI;
  internals (stack traces, Prisma errors) never reach the client.
- LLM failures log `[ai] … using default` server-side and render the
  deterministic fallback — that is correct behavior, not an incident.
- Debugging order: reproduce with the exact command → read `dev.log` /
  `server.log` → isolate with a minimal repro → fix the root cause. The
  Tailwind-v4 traps and the dev-origin block both present as "styles
  missing / page unhydrated" — check `docs/Tailwind-V4-Validation-Report.md`
  before touching CSS.

## Anti-Patterns to Avoid

- Renaming routes to lowercase or merging pages into an SPA (the reference
  paths are the contract).
- Importing `z-ai-web-dev-sdk` in client components (server-side only).
- Unpinned Tailwind tokens, `var()` chains in `@theme`, or bare-HSL
  triplets.
- `space-y-*` + child `mt-*/mb-*` in the same container.
- Duplicating enum constants outside `src/lib/domain.ts`.
- Per-test real logins in e2e specs (rate limiter).
- Weakening lint/type gates to make a build pass (the build's
  `ignoreBuildErrors` is scaffold legacy — `bun run typecheck` is the
  gate).
