---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
project_type: nextjs-single-app
version: 1.0.0
last_updated: 2026-10-04
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
  arrays, the 14-key Task / 9-key Note shapes; internal camelCase fields
  off the wire); `mapTask`/`mapNote` in the store are the ONLY wire→client
  conversion seams. The TaskDialog submits end_time client-computed and
  the description verbatim ("" stays ""); the API accepts an optional
  caller-supplied end_time and derives it from start+duration otherwise.

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
- Quick Action gradients stay as inline-style hex gradients (Trap 3 —
  sidesteps in-oklab interpolation drift and matches the reference).

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
| `bun run test` | Vitest unit (89 tests) |
| `bun run test:e2e` | Playwright e2e (67 specs, needs prior build) |
| `bun run lint` / `bun run typecheck` | ESLint 9 flat / tsc --noEmit |

Single test: `bunx vitest run tests/auth.test.ts`.
Single e2e: `bun run test:e2e -- -g "mobile account menu"`.

## Testing Strategy

| Level | Tool | Location | Notes |
|-------|------|----------|-------|
| Unit | Vitest | `tests/*.test.ts` | Auth crypto, domain constants (incl. the skills color map + name transform), AI fallback content (Mark Twain set), db-path v3 (incl. the repo-.env authority rule), .env.example contract, site URL helper, next.config contract, rate-limit window/eviction, wire-format serializer (**pinned to the CAPTURED reference wire — created_date/updated_date/is_sample/created_by, the 14/9-key shapes**), the prisma-CLI wrapper contract |
| E2E | Playwright (67 specs — the planning pins incl. the createdAt-desc order + the DIV badges + the plain-DIV day cards (session 9, F-2) + **the dialog request-body interception pin: end_time client-computed + verbatim description (session 12, W-3/W-4)**; the dashboard pins incl. the recharts 2.x DOM shape, the new-task-first semantics, the enter-animation pin, the classic dialog/select classes, the single lucide-trash2 class, **the captured 14-key response wire shape (session 12, W-1/W-2)**, the strict formatDistanceToNowStrict relative times (session 10, F-2), the zero-data-slot DOM contract + the uncapped title input (session 10, F-1/F-3), the Log Activity top-5 slice + the Brainstorm no-op/order pins (session 11, G-1/G-2/G-3)) | `tests/e2e/*.spec.ts` | Mobile-menu geometry parity (animation-settled), auth (the reference's separate sign-up / forgot-password views, the red/green alert cards, post-login landing at "/", the session guards, the custom 404), dashboard (incl. the decompiled Quick Actions open-panel states AND the decompiled sidebar-card states: Next Up + functional Mark Complete, skills-map legend/tooltip, AI-card icons/chips, DailyFocus vertical layout, the content-sized Refresh button), the full-bleed container, day-row spacing, the task-dialog delete confirm + "Create Task"/"Update Task" submit, planning — including the decompiled reference behaviors (null-init selectedDay, the always-visible Card structure — no accordion, no heading role, static stats placeholder, decorative Filter with mr-2 icon, the clickable-DIV day cards) |

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
