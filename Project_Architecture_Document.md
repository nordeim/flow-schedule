# FlowSchedule — Master Project Architecture Document (PAD) v1.0

**Classification:** Internal Engineering Reference
**Status:** DEFINITIVE, PRODUCTION-LOCKED BLUEPRINT
**Companion Documents:** `README.md` (onboarding), `AGENTS.md` (agent operating contract), `CLAUDE.md` (Claude Code conventions), `docs/Tailwind-V4-Validation-Report.md` (trap taxonomy)
**Last Updated:** 2026-10-04
**Audience:** Senior Engineers, Tech Leads, DevOps, and Onboarding Engineers
**Rule:** Every architectural decision in this document traces to a specific rationale. Nothing is here "because it's popular."

---

#### Revision Block — v1.0 (Tracked Changes)

- `[AUTH]` Initial as-built PAD for the FlowSchedule clone, generated after the full verification gate ran green (lint, tsc, 44/44 unit, build, 29/29 e2e). Session-1 remediation additions: site metadata layer (`src/lib/site.ts`, `/sitemap.xml`, `/robots.txt`, `metadataBase`), `.env.example` contract tests, e2e determinism hardening — see `docs/session_1-review.md` (build narrative: `docs/session_1.md`).
- `[SYN]` Reference-app facts (routes, enums, geometry, gradients, prompts) were extracted from the deployed reference's compiled bundle and live DOM — measured, not guessed.
- `[CA]` The five Tailwind v4 traps in §5.4 are applied as code-level mitigations, each traced to `docs/Tailwind-V4-Validation-Report.md`.

---

## Table of Contents

1. [System Overview & Decisions](#1-system-overview--decisions)
2. [High-Level System Topology](#2-high-level-system-topology)
3. [Application Architecture](#3-application-architecture)
4. [Data Architecture](#4-data-architecture)
5. [Design System Reference](#5-design-system-reference)
6. [Security Architecture](#6-security-architecture)
7. [AI Integration Architecture](#7-ai-integration-architecture)
8. [Testing Strategy](#8-testing-strategy)
9. [Build & Deployment](#9-build--deployment)
10. [Developer Handbook](#10-developer-handbook)
11. [Known Issues & Deferred Work](#11-known-issues--deferred-work)
12. [Verification Ledger](#12-verification-ledger)

---

## 1. System Overview & Decisions

### 1.1 Document Metadata & Purpose

FlowSchedule is a faithful, self-hosted clone of the FlowSchedule reference
app (a base44-built weekly schedule planner). This PAD is the single
source of truth for the clone's architecture: read it before extending,
debugging, or replicating the system. New engineers should read §1–§5
first; debugging starts at §10 (the handbook) and the trap taxonomy in
§5.4; reviewers of tech choices start at §1.3 (the ADRs).

The product surface: a **weekly time-grid calendar** (16 hour slots
07:00–22:00 × 7 days), a **weekly planning** view with day columns and
statistics, **four quick-action panels** (quick task add, focus timer,
activity log, notes brainstorm), and **two LLM-backed sidebar cards**
(daily focus quote, AI schedule summary).

### 1.2 Technology Stack Summary

| Layer | Technology | Version | Key Rationale |
|---|---|---|---|
| Web framework | Next.js (App Router, Turbopack) | 16.x | Real-file routes at the reference's exact paths; API route handlers for the typed JSON layer; standalone output for deploys |
| UI runtime | React | 19.x | The only runtime Next 16 supports; client components for the interactive islands |
| Language | TypeScript | 5.x (strict) | Typesafety across the store/API/Prisma seams |
| Styling | Tailwind CSS | 4.x (CSS-first) | The reference's utility vocabulary; `@theme` tokens with v3 values pinned (see §5.4) |
| Animations | tw-animate-css | 1.4.x | The v4-native port of tailwindcss-animate — powers the Radix enter/exit utilities (.animate-in, fade/zoom/slide) the reference's stylesheet defines (session 8, G-1) |
| Component primitives | Radix (shadcn-style) | latest | Accessible Dialog/Select/DropdownMenu/Accordion — focus trap, Escape, and ARIA for free |
| Charts | recharts | 2.15.x | The Skills Map pie — the reference's MEASURED major (its bundle's pie DOM has no recharts-zIndex layers; session 7, G-3, e2e-pinned) |
| Icons | lucide-react | 0.475.x | The reference's MEASURED version (its bundle banner: v0.475.0, single-class emission; session 8, G-2, e2e-pinned) |
| Motion | framer-motion | 14.x | The reference's three drifting background blobs |
| Client state | Zustand | 5.x | Single store, envelope unwrapping, no server-state caching layer needed |
| ORM | Prisma | 6.x | Schema-as-code, SQLite-first with a PostgreSQL escape hatch |
| Database | SQLite | — | Zero-config self-hosting; one file, CLI+runtime path resolution seam (§4.3) |
| LLM | z-ai-web-dev-sdk | 0.0.x | Server-side chat completions for the two AI cards; deterministic fallbacks |
| Unit tests | Vitest | 5.x | Fast pure-seam suites (crypto, constants, path resolution) |
| E2E tests | Playwright | 1.6x | Trusted pointer events (required for Radix), production-standalone target |
| Runtime | Bun | 1.3+ | Dev server, seed execution, standalone prod server |

### 1.3 Architecture Decision Records (ADRs)

**ADR-001: Real Next.js routes instead of a single-page app with rewrites**

- **Context:** The reference is a React Router SPA with path-based views
  (`/Dashboard`, `/Planning`, `/Profile`, `/Settings`); the scaffold's
  previous occupant (ORBITAL) used one page + `next.config.ts` rewrites to
  emulate it.
- **Decision:** FlowSchedule's views are real App Router route folders,
  named with the reference's exact capitalization, inside an `(app)`
  route group with a shared client layout. `/login` is standalone.
- **Rationale:** Four real pages make server-side metadata, per-route
  code splitting, and direct navigation work natively; the SPA-rewrite
  machinery exists to emulate what App Router already provides. The
  capitalized folder names keep the URLs byte-identical to the reference
  (links, bookmarks, and the e2e URL assertions depend on it).
- **Consequences:** Slightly more files; no History-API sync code to
  maintain; deep links are real.
- **Alternatives Rejected:** single page + rewrites (ORBITAL pattern —
  more machinery, same UX); lowercase routes (breaks reference parity).

**ADR-002: Cookie-session auth (scrypt + HMAC tokens) instead of an auth library**

- **Context:** The reference delegates auth to the base44 platform
  (opaque to a self-hosted clone). The scaffold has no NextAuth/Better-Auth
  dependency.
- **Decision:** Hand-rolled sessions: scrypt password hashes
  (`salt:hash`), HMAC-SHA256-signed tokens (`userId.expiry.mac`) in an
  HttpOnly `fs_session` cookie, 30-day TTL, `timingSafeEqual`
  verification; per-IP fixed-window login/register rate limiting.
- **Rationale:** Zero new dependencies; the full auth surface is ~100
  auditable lines; timing-safe comparisons and salted scrypt are the
  load-bearing security properties; the ORBITAL predecessor validated
  this exact pattern in production.
- **Consequences:** No OAuth (the "Continue with Google" button renders
  an explanatory notice — parity without credentials); password reset is
  an admin action.
- **Alternatives Rejected:** Better-Auth (adds DB session rows + provider
  config for a two-role single-user app); NextAuth v5 (OAuth-first, no
  email/password focus).

**ADR-003: Zustand store as the single API client (no RSC data layer)**

- **Context:** The reference is a client SPA where every view fetches
  through a platform SDK; the clone's pages are interactive (calendar
  geometry, panels, timers) and need fine-grained client state anyway.
- **Decision:** One client store (`useFlowStore`) owns user/tasks/notes
  and wraps every `/api/*` call, unwrapping the
  `{ ok, data } | { ok, error }` envelope. Server components only render
  shells; entity data never flows through RSC props.
- **Rationale:** Mirrors the reference's data-flow shape (component →
  store → API → DB), keeps mutations and optimistic-ish refresh in one
  place, and avoids a parallel RSC query layer that would immediately be
  bypassed by the interactive components.
- **Consequences:** Authenticated pages load data client-side after
  mount (skeletons cover it — the reference behaves identically); the
  store's mapper functions are the only snake/camelCase seams.
- **Alternatives Rejected:** RSC + Server Actions (the interactive
  calendar would need a parallel client cache anyway); React Query
  (extra dependency for five endpoints).

**ADR-004: Tailwind v4 with the v3-era token values pinned in `@theme inline`**

- **Context:** The reference compiles with Tailwind v3-era semantics; v4
  changes default palette (oklch drift), shadow scale (one-notch shift),
  gradient interpolation (oklab), space-y selector (side + specificity),
  and silently drops bare-HSL theme triplets under `@theme inline`.
- **Decision:** `src/app/globals.css` pins: full `hsl()` semantic tokens
  (Trap 1), the v3 hex palette (Trap 2), `--shadow-sm: 0 1px 2px 0
  rgb(0 0 0 / 0.05)` (Trap 5), a `cursor: pointer` base rule for buttons
  (v4 preflight omits it), and a repo-wide prohibition on `space-y-*`
  containers with mt/mb-carrying children (Trap 4). Quick Action
  gradients ship as inline-style hex gradients (Trap 3 — the reference's
  own form).
- **Rationale:** `docs/Tailwind-V4-Validation-Report.md` documents all
  five traps with production evidence; pinning tokens preserves computed
  parity with the reference while using the v4 engine.
- **Consequences:** globals.css is append-only in spirit — refactors must
  re-verify §5.4; the mobile-menu geometry spec guards Trap 4.
- **Alternatives Rejected:** downgrading to Tailwind v3 (loses v4
  CSS-first and the scaffold's toolchain); accepting v4 defaults
  (visibly drifts from the reference).

**ADR-005: LLM server-side only, with deterministic fallbacks**

- **Context:** The reference calls a platform `InvokeLLM` endpoint with
  JSON schemas; a self-hosted clone must own that call and survive SDK
  outages/rate limits (observed: 429s during the e2e run).
- **Decision:** `src/lib/ai.ts` wraps `z-ai-web-dev-sdk` chat
  completions for the two AI surfaces (daily focus quote; schedule
  summary) — server-side only, exact reference prompts, defensive JSON
  extraction, typed guards, and canned fallbacks on any failure path.
- **Rationale:** The reference's own catch blocks ship fallback content
  ("Could not fetch dynamic focus data, using default") — mirroring it
  keeps the dashboard render total (verified: e2e passed through live
  429s).
- **Consequences:** AI content varies run-to-run (both valid in tests);
  SDK errors log `[ai] … using default` — informational, not incidents.
- **Alternatives Rejected:** client-side SDK use (exposes credentials,
  breaks the reference's server-side shape); no AI (drops a headline
  feature).

**ADR-006: Playwright against the production standalone build**

- **Context:** E2E must catch build-output-only failures (Tailwind token
  generation, standalone bundling) and needs trusted pointer events for
  Radix menus.
- **Decision:** `playwright.config.ts` boots `.next/standalone/server.js`
  on `:3100` with an isolated seeded `db/e2e.db`; a setup project signs
  the demo user in once and shares storageState (login is rate-limited).
- **Rationale:** Dev-server e2e hides production CSS/bundling bugs;
  per-test logins trip the rate limiter; one worker keeps the shared
  SQLite file consistent.
- **Consequences:** `bun run build` is a precondition; the suite is
  slower to boot but hermetic.
- **Alternatives Rejected:** dev-server e2e (misses prod-only defects);
  parallel workers (SQLite contention).

---

## 2. High-Level System Topology

```mermaid
flowchart TB
    subgraph Browser
        PGC["Pages (client islands)<br/>/Dashboard /Planning /Profile /Settings /login"]
        ST["Zustand store<br/>useFlowStore"]
        PGC <--> ST
    end
    subgraph NextServer["Next.js 16 (Node) — standalone server.js"]
        RH["API route handlers (11)<br/>/api/auth /api/tasks /api/notes /api/ai /api/health"]
        AUTHG["session guard + rate limiter<br/>src/lib/api.ts, auth.ts"]
        AI["src/lib/ai.ts<br/>z-ai-web-dev-sdk"]
        PR["Prisma Client<br/>src/lib/db.ts (db-path resolved)"]
        ST -->|fetch JSON envelope| RH
        RH --> AUTHG
        RH --> PR
        RH --> AI
    end
    DB[("SQLite file<br/>db/custom.db (dev)<br/>db/e2e.db (e2e)")]
    LLM["Z-AI chat completions<br/>(server-side only)"]
    PR --> DB
    AI -->|chat.completions.create| LLM
```

- **Browser layer**: React 19 client components; Zustand store is the
  only fetcher; Radix portals for menus/dialogs; framer-motion blobs.
- **Application layer**: Next.js App Router — static pages + dynamic API
  route handlers; every handler runs the session guard before touching
  Prisma.
- **Data layer**: Prisma 6 over SQLite (dev/e2e) or PostgreSQL
  (`DATABASE_URL` swap; schema provider change).
- **External services**: the z-ai SDK (LLM) — the only outbound call;
  failures degrade to defaults, never bubble.

---

## 3. Application Architecture

### 3.1 The Layer Model (the Golden Rule)

Classify every request by exactly ONE layer before writing code:

```
Layer 0: Pages/Routes — src/app/**. Real route folders ((app)/ root
         dashboard, Dashboard, Planning, Profile, Settings; login;
         not-found) — the (app) layout is a server-side session guard
         (no valid cookie → redirect /login). Rule: pages render shells
         + client islands; no entity fetching here.
Layer 1: Client islands — "use client" components (layout/, dashboard/,
         planning/) + the Zustand store. Rule: ALL entity data flows
         through the store's envelope-unwrap; components never fetch
         /api/* directly.
Layer 2: API route handlers — src/app/api/**. Rule: validate input
         (domain guards + manual checks), enforce the session, return
         ok()/fail() — never throw, never leak internals.
Layer 3: Domain/lib seams — src/lib/{auth,api,domain,ai,db,db-path}.ts.
         Rule: pure, unit-testable logic; the ONLY places that know
         crypto, enums, geometry, LLM prompts, or DB URLs.
```

Dependency direction: `L0 → L1 → L2 → L3`; `L3` never imports upward.
`src/lib/domain.ts` is the single enum/constant source — duplicating its
values in components is a defect.

### 3.2 Annotated Directory Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root: metadata, viewport, body
│   ├── not-found.tsx               # The reference's custom 404 (session 5)
│   ├── globals.css                 # Tailwind v4 @theme + 5 trap pins (§5.4)
│   ├── (app)/                      # Session-guarded group (server guard in layout)
│   │   ├── layout.tsx              # getSessionUser() → redirect(/login) + AppShell
│   │   ├── page.tsx                # "/" — the dashboard root (the reference's landing)
│   │   ├── Dashboard/page.tsx      # "/Dashboard" — thin wrapper over DashboardView
│   │   ├── Planning/page.tsx       # Week cards + click-to-select day panel (decompiled reference behavior: selectedDay starts null, static Day Statistics placeholder, decorative Filter)
│   │   ├── Profile/page.tsx        # Static preference cards
│   │   └── Settings/page.tsx       # Theme/Dark/Language/Performance cards
│   ├── login/page.tsx              # Suspense-wrapped auth views: sign-in /
│   │                               # sign-up / forgot / reset-sent (session 5)
│   └── api/
│       ├── auth/login|register|me  # Cookie-session endpoints
│       ├── logout/                 # Cookie clear
│       ├── tasks/ + tasks/[id]/    # CRUD, enum-validated, ownership-scoped
│       ├── notes/ + notes/[id]/    # CRUD, tags JSON-array
│       ├── ai/daily-focus|summary  # LLM + fallbacks (ADR-005)
│       └── health/                 # Liveness + DB probe
├── components/
│   ├── ui/                         # shadcn primitives (button, dialog,
│   │                               # select, dropdown-menu, accordion, …)
│   ├── layout/
│   │   ├── AppShell.tsx            # Store bootstrap + gradient canvas
│   │   ├── Header.tsx              # THE mobile menu + desktop dropdown (§5.5)
│   │   └── BackgroundBlobs.tsx     # framer-motion drifting blobs
│   ├── dashboard/
│   │   ├── WeeklySchedule.tsx      # 80px+16×60px grid, 1px/min blocks
│   │   ├── QuickActions.tsx        # 4 tiles + decompiled panels (G1e/z1e/
│   │   │                           # W1e/H1e/K1e: gradient card morph,
│   │   │                           # expanding overlay, per-panel views)
│   │   ├── SkillsMap.tsx           # recharts pie + center total
│   │   ├── StatusCard.tsx          # All-caught-up / Up Next
│   │   ├── DailyFocusCard.tsx      # LLM quote card
│   │   └── AISummaryCard.tsx       # LLM summary card (derived loading)
│   └── planning/
│       └── TaskDialog.tsx          # Add/Edit form (remount-reset pattern)
├── lib/
│   ├── auth.ts                     # scrypt + HMAC + session helpers
│   ├── api.ts                      # ok/fail envelope, rate limit, guard
│   ├── domain.ts                   # enums, geometry, color maps (measured)
│   ├── ai-defaults.ts              # shared AI fallback content (client-safe, unit-pinned)
│   ├── ai.ts                       # LLM wrappers + fallbacks
│   ├── db.ts / db-path.ts          # Prisma singleton + URL resolution seam
│   └── utils.ts                    # cn()
└── store/
    └── useFlowStore.ts             # The API client + mappers
prisma/
├── schema.prisma                   # User/Task/Note (reference entity shapes)
└── seed.ts                         # Idempotent (is_sample guards)
tests/
├── auth.test.ts / domain.test.ts / db-path.test.ts   # Vitest unit
└── e2e/                            # Playwright (production target)
    ├── mobile-navigation.spec.ts   # THE mobile-menu pin (§5.5)
    ├── auth.spec.ts / dashboard.spec.ts / planning.spec.ts
    ├── auth.setup.ts               # Single sign-in → storageState
    └── global-setup.ts             # db/e2e.db push + seed
```

### 3.3 Critical Code Patterns

**Pattern 1 — the API envelope (every route handler)**

```ts
// src/app/api/tasks/route.ts (excerpt)
export async function POST(req: Request) {
  const auth = await requireUser();            // session guard FIRST
  if ("response" in auth) return auth.response; // 401 envelope
  const body = await readJson(req);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return fail("VALIDATION", "Task title is required.");
  const priority = isPriority(body.priority) ? body.priority : "medium"; // enum guard
  const task = await db.task.create({ /* … */ });
  return ok({ task }, 201);
}
```

*Why:* the `{ ok, data } | { ok, error }` contract lets the store unwrap
uniformly and keeps errors typed and customer-safe. The guard-first
ordering means no handler logic runs unauthenticated.

**Pattern 2 — derived loading state (no effect-body setState)**

```ts
// src/components/dashboard/AISummaryCard.tsx (excerpt)
const dayKey = format(day, "yyyy-MM-dd");
const [result, setResult] = useState<{ day: string; summary: AiSummary } | null>(null);
const loading = !result || result.day !== dayKey;   // DERIVED
useEffect(() => {
  let cancelled = false;
  (async () => {
    const next = await fetchSummary(dayKey);        // await FIRST
    if (!cancelled) setResult({ day: dayKey, summary: next });
  })();
  return () => { cancelled = true; };
}, [dayKey]);
```

*Why:* `react-hooks/set-state-in-effect` is an ERROR in this repo — it
caught real cascading-render bugs. The keyed-result shape resets loading
implicitly when the day changes, with zero synchronous setState.

**Pattern 3 — form reset by remount (TaskDialog)**

```tsx
// src/components/planning/TaskDialog.tsx (excerpt)
export function TaskDialog({ open, onOpenChange, editing, initial }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <TaskFormBody editing={editing} initial={initial} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}
function TaskFormBody({ initial, /* … */ }) {
  const [form, setForm] = useState(initial);   // fresh per open-session
  // …
}
```

*Why:* Radix mounts `DialogContent`'s children only while open — the body
re-mounts each session, so `useState(initial)` seeds fresh values with no
reset effect and no stale-form bug.

**Pattern 4 — measured geometry as constants (the calendar)**

```ts
// src/lib/domain.ts (measured from the reference bundle)
export const CALENDAR_HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00–22:00
export const CALENDAR_LABEL_WIDTH = 80;
export const CALENDAR_SLOT_WIDTH = 60;   // → PX_PER_MINUTE = 1

// WeeklySchedule task block: left = minutesSince07:00 × 1px, width = max(duration, 10px)
```

*Why:* hardcoding the measured constants (not deriving them from
"responsive" abstractions) is what keeps task blocks at byte-identical
positions; the unit tests pin the 60px/60min identity.

---

## 4. Data Architecture

### 4.1 Database Schema

```mermaid
erDiagram
    User ||--o{ Task : owns
    User ||--o{ Note : owns
    User {
        string id PK
        string email UK
        string passwordHash "scrypt salt:hash"
        string fullName
        datetime createdAt
        datetime updatedAt
    }
    Task {
        string id PK
        string title
        string description "nullable"
        string priority "low|medium|high|urgent"
        string category "work|personal|health|learning|creative|social|planning"
        string status "todo|in_progress|completed"
        datetime startTime "nullable = unscheduled"
        datetime endTime "derived from duration"
        int durationMinutes
        boolean isSample
        string userId FK
    }
    Note {
        string id PK
        string title "nullable"
        string content
        string tags "JSON string array"
        boolean isSample
        string userId FK
    }
```

The shapes mirror the reference app's entities exactly (Task with
`start_time`/`duration_minutes`/`end_time`, Note with `tags` array, User)
— the field names corroborated by the reference's bundle (its TaskDialog
state initializes `{start_time:"", end_time:"", duration_minutes:60}`;
`fn.Note.list("-created_date")`; notes' tags consumed as an array). The
wire format is snake_case in BOTH directions — requests accept
`start_time`/`duration_minutes`, responses ship through
`serializeTask`/`serializeNote` (`src/lib/serialize.ts`, session 8 G-4:
snake_case fields, tags unwrapped to arrays, clone-internal `isSample`/
`userId` kept off the wire); Prisma stays camelCase; `mapTask`/`mapNote`
are the wire→client conversion seams.

### 4.2 Persistence Strategy

- **Writes**: API routes validate → Prisma create/update/delete scoped by
  `userId` (ownership: `findFirst({ where: { id, userId } })` — a cross-user
  id 404s, never leaks).
- **end_time derivation**: both the create and patch handlers recompute
  `endTime = startTime + durationMinutes` whenever either input changes —
  the reference computes it in the form; the clone computes it
  server-side (one source of truth).
- **Seed idempotency**: `prisma/seed.ts` upserts the user by unique email
  and guards sample rows with `is_sample: true` counts — re-running is a
  no-op.

### 4.3 The SQLite URL Resolution Seam

`DATABASE_URL` relative `file:` URLs resolve against the repo that owns
`prisma/schema.prisma` — for the Prisma CLI, `next build`, AND the
standalone server (which `chdir`s into `.next/standalone`). The logic
lives in `src/lib/db-path.ts` with anchor fallbacks (module repo root →
standalone root detection → CWD), absolute URLs pass through, and
`tests/db-path.test.ts` pins the contract.

**v3 (session 9, F-1): the repo's own `.env` is AUTHORITATIVE.** The
environment a repo runs in can carry a `DATABASE_URL` the repo never asked
for — Bun auto-loads `.env` files from PARENT directories, and CI/sandbox
harnesses can export the variable directly into the shell; both were
reproduced (the session-1..8 behavior let either one win, so `db:push`,
`db:seed` and `next dev` silently targeted a database OUTSIDE the repo,
lost on every workspace reset). The v3 rule (`chooseEnvSource`, pure,
unit-pinned):

| Condition (ambient env vs repo's own `.env`) | Winner |
|---|---|
| Ambient SQLite `file:` URL resolving **outside** the repo | **Repo `.env`** (hijack protection) |
| Ambient SQLite `file:` URL resolving **inside** the repo (e.g. the e2e `file:../db/e2e.db`) | Ambient (a deliberate isolation override) |
| Ambient non-SQLite URL (PostgreSQL in production) | Ambient (a deliberate provider override) |
| No repo `.env` `DATABASE_URL` | Ambient (the production env-var flow) |
| No ambient value | Repo `.env` (the fresh-checkout dev flow) |

The Prisma CLI path applies the same rule via `scripts/prisma-cli.ts`
(db:push/db:migrate/db:reset route through it — prisma's own dotenv never
overrides an existing process-env value); `db:seed` self-resolves
(`prisma/seed.ts` imports the seam). Production guidance (DEPLOYMENT.md §4,
updated): set the absolute path in the repo's `.env`, or remove the
`DATABASE_URL` line there and use the environment variable.

---

## 5. Design System Reference

### 5.1 Typographic System

System font stack (Next's default `antialiased` body); sizes are utility
class-level: `text-2xl/3xl` page titles, `text-xl` card titles,
`text-base` labels, `text-sm` body, `text-xs`/`text-[10px]` chips and
calendar day dates, `text-5xl font-mono tabular-nums` timer.

### 5.2 Color Tokens (the load-bearing pins)

Semantic tokens (full `hsl()` values — Trap 1) + the pinned v3 hexes
(Trap 2) live in `src/app/globals.css` `@theme inline`. The reference
vocabulary: slate canvas gradient (`from-slate-50 via-sky-100
to-indigo-100`), glass cards (`bg-white/60 backdrop-blur-xl
rounded-3xl shadow-xl border-white/20`), sky/blue primary gradients,
category gradients per §1.1, destructive `text-red-600`.

### 5.3 Component Primitives

shadcn-style Radix wrappers in `src/components/ui/` (button, input,
textarea, label, badge, dialog, select, dropdown-menu, accordion, card)
— unstyled primitives themed via `cn()`; portals at z-50. The **classic
shadcn forms are parity** (sessions 7+8): the Badge is a `<div>` with the
focus-ring classes in the cva base and `shadow`/`hover:bg-*` on the
variants (session 7, G-4 — live-measured against the reference's Z1e/W$);
DialogContent uses the classic arbitrary-value positioning
(`left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]`) with the
four slide-in/out animation classes and `sm:rounded-lg`; DialogTitle's
base carries `tracking-tight`; SelectTrigger styles its placeholder via
`ring-offset-background data-[placeholder]:text-muted-foreground` and
SelectContent carries the side `slide-in-from-*` classes (session 8,
G-3 — all live-measured on the reference's dialog/listbox and
e2e-pinned). Do not modernize any of them to the data-slot forms.
recharts is pinned to 2.15.x and lucide-react to 0.475.x (the
reference's measured versions — see §1.2 and the e2e DOM-shape pins).
The Radix enter/exit animations are powered by `@import
"tw-animate-css"` in `globals.css` (session 8, G-1) — the utility
strings were dead CSS before that import.

### 5.4 The Five Tailwind v4 Traps (all applied as code)

Sourced from `docs/Tailwind-V4-Validation-Report.md`; each mitigation is
in the codebase and pinned by tests:

| # | Trap | Mitigation | Pinned by |
|---|---|---|---|
| 1 | Bare-HSL transparent theme: `--background: 0 0% 100%` under `@theme inline` silently resolves to *transparent* | Semantic tokens are full `hsl(…)` values in `globals.css` | CSS inspection (any token) |
| 2 | oklch palette drift: v4's defaults are 1–3 sRGB units/channel off the v3 hexes | The v3 hexes for slate/sky/indigo/blue/green/red/purple/pink/yellow/orange/teal/cyan are pinned in `@theme inline` | e2e gradient assertions (rgb(96,165,250)/rgb(59,130,246) on task blocks) |
| 3 | in-oklab gradient interpolation drifts from v3's sRGB | Quick Action gradients are inline-style `linear-gradient(to right, #hex, #hex)` (the reference's own form); app canvas keeps utility gradients (subtle, acceptable) | Reference hex constants in `domain.ts` unit tests |
| 4 | space-y selector rewrite: v4 emits `:where(.space-y-* > :not(:last-child)) { margin-block-end }` with ZERO specificity — child `mt-*`/`mb-*` wins where v3 overrode it | Repo-wide rule: NO `space-y-*` container carries children with explicit mt/mb utilities (the header menu uses `p-1` + item margins) | `mobile-navigation.spec.ts` geometry assertions |
| 5 | shadow-scale shift: v4's `shadow-sm` = v3's bare shadow (one notch heavier) | `--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)` pinned in `@theme inline` | `mobile-navigation.spec.ts` navbar box-shadow assertions |

Plus the v4 preflight omission: `button, [role="button"] { cursor:
pointer }` is restored in the base layer (migrated apps silently lose
the hand cursor without it).

### 5.5 The Mobile Navigation Menu (highest-regression-risk surface)

The reference app's mobile navigation is **ONLY** the header account
menu — a ghost user-icon Button in `div.md:hidden` opening a Radix
DropdownMenu with `align="end"`:

- **Measured reference geometry @390px**: trigger x=338 right=374
  bottom=50; menu x=182 y=54 w=192 right=374 bottom=218 — the menu's
  right edge anchors to the trigger's right edge, 4px below it.
- **The clone measures identically** (verified with direct DOM queries
  during the build; `mobile-navigation.spec.ts` now pins it).
- **The reference has NO bottom tab bar** — its mobile nav-items array is
  empty (`Y$=[]` in the reference bundle); the clone renders none.
- **Radix hide-others**: while the menu is open, the app root gets
  `aria-hidden="true"` — accessibility-tree queries for the trigger time
  out. Tests measure the trigger BEFORE opening. (The reference has the
  same behavior.)
- Menu content: "My Account" label → Profile (/Profile) → Settings
  (/Settings) → separator → Logout (red, POST /api/logout → /login).

---

## 6. Security Architecture

### 6.1 Security Rules

| Rule | Enforcement |
|---|---|
| Passwords: scrypt (64-byte, 16-byte random salt) | `src/lib/auth.ts`; `verifyPassword` uses `timingSafeEqual` |
| Session tokens: HMAC-SHA256 over `userId.expiry`, `timingSafeEqual` verified | `createSessionToken`/`verifySessionToken`; unit-pinned |
| Cookies: `HttpOnly; SameSite=Lax; Secure` in production | `sessionCookieOptions()` |
| Rate limiting: login/register 10/IP/min, 429 + `Retry-After` | `rateLimit()` in `src/lib/api.ts` (fixed window) |
| Input validation at every write: enum guards, length caps, date parsing | API routes; rejects with `fail("VALIDATION", …)` |
| Ownership scoping: every by-id read/write is `findFirst({ where: { id, userId } })` | tasks/[id], notes/[id] routes — cross-user ids 404 |
| Secrets: never hardcoded; `AUTH_SECRET` env (dev fallback documented, prod required) | `.env.example` contract; no secrets in the repo |
| No SQL concatenation, no `dangerouslySetInnerHTML`, JSON responses only | Prisma parameterization everywhere |
| Open-redirect guard: `fromUrl` must be an in-app path | `/login` (`startsWith("/") && !startsWith("//")`) |
| Z-AI SDK server-side only | `src/lib/ai.ts` is the sole importer |

### 6.2 Threat Model (key vectors)

- **Credential stuffing** → per-IP rate limit + generic auth error (no
  user enumeration); scrypt slows offline attacks if the DB leaks.
- **Session forgery** → HMAC over the full payload; expiry embedded;
  `timingSafeEqual` prevents MAC-comparison oracles.
- **IDOR** → ownership-scoped queries; ids are cuids (non-sequential).
- **CSRF** → SameSite=Lax cookies + JSON-only POST bodies (no form-encoded
  cross-site writes).
- **XSS** → React escaping everywhere; no raw HTML sinks.
- **Prompt-injection via task titles into the AI summary** → the LLM
  output is rendered as TEXT (React-escaped) and only shapes the summary
  card; no tool-calling, no HTML passthrough.

---

## 7. AI Integration Architecture

Two surfaces, both server-side, both with deterministic fallbacks
(ADR-005):

| Surface | Endpoint | Reference prompt (verbatim) | Fallback |
|---|---|---|---|
| Daily Focus | `/api/ai/daily-focus` | "Generate a short inspirational quote for productivity, its author, and a positive affirmation for the day. Return as JSON." | Paul J. Meyer quote + fixed affirmation |
| AI Summary | `/api/ai/summary?date=yyyy-MM-dd` | "Analyze this daily schedule briefly: Tasks for {MMMM d, yyyy}: - {title} ({category}, {priority} priority) … Provide a concise analysis with: 1. Overall mood/theme (1-2 words) 2. Key focus areas (max 3 items) 3. Activity types (max 3 items) 4. Brief insight (max 2 sentences)" | empty day → "planning/Free day/Open schedule/…"; error → "productive/Work tasks/Mixed activities/…" |

Response handling: defensive JSON substring extraction → typed field
guards (`asStringArray`) → fallback on any miss. Observed live: SDK 429s
during the e2e run — both cards rendered their defaults (by design).

---

## 8. Testing Strategy

| Level | Tool | Scope | Key specs |
|---|---|---|---|
| Unit (66) | Vitest | `src/lib` pure seams | `auth.test.ts` (scrypt round-trip, HMAC tamper rejection), `domain.test.ts` (16 slots, 80/60px, enums, reference gradient hexes), `db-path.test.ts` (URL anchoring), `env-example.test.ts` (.env.example contract), `site.test.ts` (site URL helper), `next-config.test.ts` (no build-bypass flags, standalone, dev origins), `rate-limit.test.ts` (fixed window, key isolation, reset, throttled eviction, live-key preservation), `wire-format.test.ts` (serializeTask/serializeNote: snake_case fields, tags as arrays, internal fields off the wire) |
| E2E (63) | Playwright (production standalone :3100) | The four user surfaces + the logged-out surface | `mobile-navigation.spec.ts` (menu geometry parity, navigation, Escape/focus, logout, Trap 5 shadow pin), `auth.spec.ts` (the reference's login chrome: logo img, rounded-2xl card + top bar, slate-900 submit, placeholders, stacked footer; the separate sign-up view with Confirm Password + "Passwords do not match"; the forgot/reset views with the green alert; "Invalid email or password" with no period; post-login landing at "/"; the session guards; the Google notice), `not-found.spec.ts` (the reference's custom 404: text-7xl numeral, divider, echoed path, Go Home → "/"), `dashboard.spec.ts` (calendar hours, task blocks + gradient rgb values, quick action tile geometry, panel-open container morph + header replacement, placeholder-only quick-add with slate-700 submit, minutes-hidden countdown + pause icon + zero-minutes disabled state, read-only Log Activity history, Brainstorm create/edit/confirm-delete, timer countdown, dialog prefill + the "Create Task"/Save-icon submit, the content-sized Refresh button, the decompiled sidebar-card states (status-card locators scoped to the Next Up heading — hour-of-day independent, FS-16), the full-bleed container, day-row spacing), `planning.spec.ts` (week card, chips, dialog flow, and the decompiled reference behaviors: no panel before a day click, the ALWAYS-VISIBLE CARD structure — CardHeader/CardTitle-div/CardContent, no accordion/heading/chevron, static Day Statistics placeholder, selected-day highlight, chip-click bubbling, display-only task items, decorative Filter with its mr-2 icon margin, the header icon margins + no-hover-gradient Add Task, the createdAt-desc chips/list order, the classic DIV category badges), `dashboard.spec.ts` gains the recharts 2.x DOM-shape pin (no zIndex layers / shape wrappers; tooltip wrapper after the svg) + the new-task-first store semantics after a dialog create + the session-8 pins: the dialog's enter animation (computed `animation-name: enter`), the classic DialogTitle `tracking-tight` + SelectTrigger `ring-offset-background`/`data-[placeholder]:` classes, the single `lucide-trash2` class, and the snake_case API response shape; the status-card spec's post-click locator accepts BOTH card states (Next Up OR All caught up! — the state-transition flake, session 7 F-2); the mobile-menu geometry spec settles the enter animation before measuring (session 8, E-C) |

E2E infrastructure: `global-setup.ts` pushes + seeds `db/e2e.db`;
`auth.setup.ts` signs in ONCE (rate-limiter budget) and shares
storageState; one worker (shared SQLite); trusted clicks only (Radix
requires real pointer events — synthetic `el.click()` does NOT open
menus).

---

## 9. Build & Deployment

- **Dev**: `bun run dev` (Turbopack, :3000). `allowedDevOrigins:
  ["127.0.0.1", "localhost"]` in `next.config.ts` is load-bearing — Next
  16's dev-origin protection silently blocks `127.0.0.1` chunks
  (symptom: unhydrated page).
- **Production**: `bun run build` (assembles `.next/standalone` with
  static assets) → `bun run start` (standalone server on :3000,
  `NODE_ENV=production`).
- **Database**: dev uses repo-relative `db/custom.db`; production should
  set `DATABASE_URL` to an **absolute** `file:` path or PostgreSQL (see
  `docs/DEPLOYMENT.md`).
- **Env**: `AUTH_SECRET` required in production (`openssl rand -hex 32`);
  the dev fallback is a documented constant, not a secret.
- **Health**: `GET /api/health` → `{ status, app, database, ts }` (503 if
  the DB is down) — wire it to the load balancer.

---

## 10. Developer Handbook

### 10.1 The gate (run before every push)

```bash
bun run lint && bun run typecheck && bun run test && bun run build && bun run test:e2e
# lint clean · tsc clean · 88/88 unit · build ✓ (self-type-checked) · 64/64 e2e
```

### 10.2 Common tasks

- **Add an enum value** (category/priority/status): update
  `src/lib/domain.ts` (constant + color map) → the API routes validate via
  the guards automatically → add/extend the unit test in
  `tests/domain.test.ts`.
- **Add an API route**: new folder under `src/app/api/`, follow Pattern 1
  (guard → validate → Prisma → `ok()`), add the store action +
  `mapX` if a new entity, never fetch it from a component.
- **Touch the mobile menu / header**: re-read §5.5, run
  `bun run test:e2e -- -g "mobile"` — the geometry spec is the pin.
- **Touch `globals.css`**: re-read §5.4; never introduce var() chains in
  `@theme`, bare HSL triplets, or space-y + mt/mb children.
- **Take fresh screenshots**: dev server up → agent-browser at
  1440×900 / 390×844 → save to `docs/screenshots/`.

### 10.3 Debugging playbook (symptom → first probe)

| Symptom | First probe |
|---|---|
| Styles flat/unstyled | `globals.css` token pins (§5.4 traps 1/2/5); did a refactor re-introduce var() chains? |
| Menu/trigger "not found" in tests | Radix hide-others — query before opening; synthetic clicks don't open Radix |
| Page unhydrated in dev | `allowedDevOrigins` present in next.config.ts? |
| Build fails at `/login` prerender | `useSearchParams` must be inside Suspense |
| 429s from the LLM | Expected under load — the fallbacks fired; check logs for `[ai] … using default` |
| Wrong DB file touched | `db-path` seam + Bun parent-.env auto-loading (§4.3) |

---

## 11. Known Issues & Deferred Work

- ~~`next.config.ts` still ships `typescript.ignoreBuildErrors: true`~~
  **Resolved (session 3):** the flag is removed; the production build
  now fails on type errors itself (verified: the full build + standalone
  e2e suite ran green without it; `tests/next-config.test.ts` pins the
  contract — Next 16 has no eslint-during-builds option at all, so the
  type flag was the only bypass that existed).
- The in-memory rate limiter is per-process (single-instance deployment
  assumption); horizontal scaling needs a shared store. **Session 3 added
  a throttled expired-bucket sweep** (`rateLimit` evicts stale entries at
  most once per window — clock-regression safe) so the map can no longer
  leak forever under a distributed key spray; the live-key semantics are
  unchanged and unit-pinned. A shared store remains deferred deliberately:
  it is architecturally incoherent before a Postgres migration (SQLite is
  single-writer — scaling the limiter without scaling the DB buys nothing).
- `POST /api/auth/register` has no email verification (single-workspace
  self-hosting assumption — the reference's platform handles it with a
  6-digit OTP "Verify your email" view that the clone deliberately does
  not mirror; session 5 live-measured and documented).
- The `/Planning` "Filter" button is decorative — exactly like the
  reference's (no handler in its bundle); a filter drawer was never
  measured and does not exist.
- Dark Mode / Language / Performance cards on `/Settings` are static
  parity surfaces (exactly like the reference's placeholders).
- Unscheduled tasks are not surfaced anywhere in the UI — exactly like
  the reference (no "Unscheduled" section exists in its bundle); they
  remain reachable via the API.
- The Focus Timer's "Please set a valid duration." alert is unreachable
  dead code — the start control is disabled at minutes=0 (the reference's
  own W1e ships both; the clone mirrors the pair faithfully).
- The StatusCard's time row renders `format(d, "MMM d at HH:mm")` — the
  reference's own format-string bug (date-fns reads `a` as AM/PM and `t`
  as the unix timestamp, producing "Oct 6 AM1791284400 11:00"). Bug
  parity by design: the live reference DOM shows the same string, and
  the clone reproduces it byte-identically via the same date-fns call.
- The reference's per-card data fetching is collapsed into the Zustand
  store (the store is the only fetcher): the sidebar cards derive their
  skeletons from `loadingTasks` and re-fetch AI content on the store's
  `taskVersion` counter (mirroring the reference's X1e refresh design).
  Accepted divergence: the clone's calendar Refresh button re-fetches
  the store and flashes the card skeletons; the reference's refreshes
  only its own card.

---

## 12. Verification Ledger

Claims made in this PAD, with evidence (all executed 2026-10-04; session-4
rows re-executed after the sidebar-card/layout-chrome remediation):

| Claim | Status | Evidence |
|---|---|---|
| lint clean | Verified | `bun run lint` → zero errors |
| typecheck clean | Verified | `bun run tsc --noEmit` → clean |
| Unit tests pass | Verified | `bun run test` → 59/59 (44 + next-config + rate-limit + skills-colors/name-transform + ai-defaults fallback contract) |
| Production build succeeds WITHOUT the type-bypass flag | Verified | `bun run build` (typescript.ignoreBuildErrors removed) → 19 routes (8 static incl. `/sitemap.xml` + `/robots.txt`, 11 API) |
| E2E passes | Verified | `bun run test:e2e` → 43/43 (two consecutive full runs) through live SDK 429s (fallbacks by design — the Mark Twain fallback now live-verified) |
| Smoke suite | Verified | `scripts/smoke-test.sh` → 25/25 |
| Mobile menu geometry parity | Verified | Live re-measurement on BOTH apps (2026-10-04 session 4, 390×844): menu right 374 = trigger right 374, y=54, w=192 — byte-identical; the clone trigger measures 374/50/36 |
| Planning page reference parity | Verified | Reference component decompiled from its bundle (`eSe` in `bundle.js`) + live DOM comparison of both apps: null-init selectedDay, selection-following highlight, static Day Statistics placeholder, decorative Filter, display-only chips/task items, no Unscheduled section — all matched; pinned by 9 planning e2e specs |
| Quick Action gradient parity | Verified | Computed-style comparison: byte-identical inline hex gradients (`rgb(14,165,233)→rgb(37,99,235)` etc.) on both apps |
| **Quick Actions open-panel parity** | Verified | **Session 3:** container/tiles/panels decompiled from the reference bundle (`G1e`/`z1e`/`W1e`/`H1e`/`K1e`) + live DOM corroboration on both apps: container `p-4 … overflow-hidden min-h-[280px]` with background morph to the action gradient, tiles `h-24 rounded-2xl p-3 shadow-lg` + icon `w-5 h-5 mb-1.5` + label `text-[11px]`, placeholder-only quick-add with `bg-slate-700` submit, minutes input hidden while running + Pause icon, read-only top-5 history, notes create/edit/confirm-delete — all matched and pinned by 8 dashboard e2e specs; the completion alert verified by a one-off Playwright run |
| **Dashboard sidebar-card parity** | Verified | **Session 4:** `ure`/`Y1e`/`fre`/`g0e` decompiled + live DOM corroboration on both apps: the Next Up card (blob, priority badge, h4 title, Clock row with the reference's format-string bug mirrored — "Oct 6 AM1791284400 11:00" on both apps, 75% progress + "Ready", FUNCTIONAL Mark Complete live round-tripped on both, decorative ArrowRight), the raw-icon "All caught up!" empty state, loading skeletons from first paint, DailyFocus's Mark Twain fallback + vertical text-lg italic layout + Target icon, AISummary's Brain + Sparkles live indicator + purple→pink Mood + blue/green chips + max-h-20, SkillsMap's Award indicator + glass tooltip + m0e hexes + percentage-only legend — pinned by 6 dashboard e2e specs + the ai-defaults/domain unit suites |
| **Dashboard layout chrome parity** | Verified | **Session 4:** page container `p-4 md:p-6 lg:p-8` full-bleed (1440px measured on both apps; the clone's old `max-w-7xl mx-auto` removed), day rows in `space-y-1.5` (6px gap measured on both), default-cursor cells, minute-stacked task blocks, TaskDialog delete `window.confirm`, `.custom-scrollbar` at the reference's live cascade effective values (height 5px / width 3px / radius-2 / hover 0.3) |
| Canvas gradient parity | Verified | Computed-style + pixel sampling: endpoints byte-identical; oklab-vs-sRGB midtone delta measured 0–3 RGB units (documented acceptance, ADR-004) |
| Reference app facts (routes, enums, geometry, gradients, prompts) | Verified | Extracted from the reference's deployed bundle + live authenticated DOM/API probing (sessions recorded in the worklog) |
| LLM fallbacks fire under 429 | Verified | e2e logs: "[ai] daily focus generation failed, using default" + suite green |
| SQLite path seam | Verified | `tests/db-path.test.ts` (15 cases) + dev/e2e/prod all open the same file per environment |
| Screenshots | Verified | 15 captures in `docs/screenshots/` from the running dev server (remediated codebase; incl. the three quick-action open panels, the Next Up card and the task dialog — the Radix/dialog states via `scripts/capture-screenshots.mjs`) |
| Rate-limiter eviction (D-2) | Verified | `tests/rate-limit.test.ts`: 5,000-key spray keeps the map bounded; expired buckets fully evicted on the next window; live keys preserved through a sweep |
| **Login-page parity (session 5)** | Verified | All four view states (sign-in, sign-up, forgot, reset-sent) + the error/mismatch alerts + the guard behavior + the 404 page live-measured on the reference; 13/13 key class strings byte-identical between the apps (JSON diff); 12 new e2e specs pin the chrome, the view transitions, the alerts, the post-login "/" landing, and the guards — 51/51 × 2 |
| **Route guards + root dashboard (session 5)** | Verified | Unauth `/Dashboard`, `/Planning`, `/` → 307 `/login` (curl + e2e); authed `/` renders the dashboard at the root URL (agent-browser live check: pathname stays `/`, "Weekly Schedule" visible — identical to the reference) |
| **Mobile menu re-pin (session 5)** | Verified | Live re-measurement on BOTH apps (390×844): trigger 374/50/36 on both; reference menu 374/54/192 with [Profile, Settings, Logout]; the clone's menu geometry pinned by the e2e spec (51/51 ×2) — no Tailwind v4 regression |
| **Screenshots (session 5)** | Verified | 20 captures in `docs/screenshots/` — 01-login re-captured (new card design) + new 16-login-signup, 17-login-forgot, 18-login-reset-sent, 19-404, 20-login-mobile (all state-gated via `scripts/capture-screenshots.mjs`) |
| **Exhaustive state-matched class-tree parity (session 6)** | Verified | Full `<main>` DOM class-tree dump + element-wise diff on BOTH apps with MATCHED empty data states (the reference account holds 0 tasks / 0 notes — an empty user was registered in the clone): dashboard **761/761** elements (only 2 documented lucide polyline/path internals remain), Planning day-selected **98/98** (was 98/106 pre-fix) — the strongest parity statement to date |
| **Planning selected-day Card structure (session 6, P-1)** | Verified | The clone's two Radix Accordions replaced with the reference's decompiled `tE`/`nE`/`rE`/`iE` Card structure — always visible, no collapse button, CardTitle a `div` (no heading role); the Card merge signature (`text-card-foreground shadow bg-white/60 … rounded-3xl`) byte-identical via the clone's identical cn/twMerge; pinned by the new planning spec |
| **TaskDialog footer parity (session 6, P-2…P-4)** | Verified | Submit label "Create Task"/"Update Task" (was "Add Task"/"Save Changes" — a session-0 inference that had crept into the e2e pin), Save icon `w-4 h-4 mr-2`, no `text-white`, Delete icon `mr-2` + reference class order, right footer `flex gap-3 ml-auto` — all decompiled from the reference bundle and live-verified in both dialog modes |
| **Planning header + Refresh button small-gaps (session 6, P-5…P-7)** | Verified | Filter/Add-Task icons carry `mr-2` (the Filter button now measures 100.7px ≈ the reference's 100.7px), the header Add Task button has no hover-gradient/text-white, and the Refresh Calendar button is content-sized **30×30 on both apps** (the reference's `icon_sm` is a dead variant — no size class; the clone maps `icon_sm: ""`) |
| **Status-card e2e de-flake (session 6, F-1/FS-16)** | Verified | The status-card spec's page-wide `div.rounded-3xl` + hasText locator resolved to BOTH the calendar card and the StatusCard whenever now+5min fell inside the 07:00–22:00 grid (strict-mode violation + impossible count(0); sessions 4/5 passed only because they ran pre-07:00 UTC); re-scoped to the StatusCard via its "Next Up" heading + content assertions — verified green at 09:0x UTC (inside the previously failing window); completed tasks stay on the calendar on BOTH apps (no status filter — decompile-verified `rre`/`are`) |
| **Mobile menu re-pin (session 6)** | Verified | Re-measured on BOTH apps after the remediation: trigger 374/50/36, menu 374/54/192, items [Profile, Settings, Logout] — no Tailwind v4 regression from the session-6 changes |
| Screenshots (session 6) | Verified | 20 captures — 02-dashboard, 03-planning, 10-planning-selected, 15-taskdialog re-captured (the changed surfaces; the capture script gained the desktop 02/03/10 captures) |
| Smoke suite (session 5) | Verified | `scripts/smoke-test.sh` → 30/30 (authed page renders + the unauth guard redirects, incl. "/") |
| **Populated-state parity (session 7)** | Verified | 4 identical tasks created through each app's own TaskDialog; full `<main>` class-tree diff: dashboard 845/838 (the 7-element delta = 3 styled-jsx STYLE nodes + 4 LLM-content chip nodes — the documented divergences), Planning unselected **74/74** and day-selected **132/132** — only the documented filter/funnel icon + day-card div/button differences remain; the mobile populated tree carries the same result |
| **Task ordering parity (session 7, G-1/G-2)** | Verified | The reference's default Task.list() = createdAt desc (live: Alpha→Beta→Gamma→Delta renders [Delta, Gamma, Beta, Alpha]); the clone's GET /api/tasks now matches, and the store's createTask PREPENDS (the reference's save→refetch→newest-first semantics, live-verified without reload); Planning chips + selected-day list render the identical order on both apps |
| **recharts 2.x pin (session 7, G-3)** | Verified | The reference's pie DOM has no recharts-zIndex strings (bundle-verified); recharts downgraded 3.10.1 → 2.15.4; the SkillsMap pie DOM now byte-matches the reference's shape (svg + tooltip-wrapper after, no shape wrappers); e2e-pinned; visual output unchanged (same decompiled props) |
| **Badge classic form (session 7, G-4)** | Verified | badge.tsx rebuilt to the reference's Z1e/W$ (div + focus-ring base + shadow/hover variants); the Planning chips and task items render DIV badges with the identical class strings on both apps (live class-tree diff) |
| **State-transition locator de-flake (session 7, F-2)** | Verified | The status-card spec's post-Mark-Complete locator now accepts BOTH card headings ("Next Up" or "All caught up!") — the app was verified CORRECT first (PATCH landed + the card re-rendered to the empty state within 3s, reproduced on a standalone debug boot); the old "Next Up"-only filter failed with "element(s) not found" whenever no future task remained (Sundays after the 10:00 seed slot; sessions 4–6 passed only pre-slot) |
| Mobile menu re-pin (session 7) | Verified | Live on BOTH apps at 390×844: trigger 338/14/36×36, menu 182/54/192×164, items [Profile, Settings, Logout] — no Tailwind v4 regression |
| Desktop dropdown geometry (session 7) | Verified | First-time measured on BOTH apps at 1440×900: trigger 1252/14/76×36, menu 1136/54/192×164 right-anchored to 1328, items identical — pinned by the existing desktop-menu spec (items) + this measurement |
| Screenshots (session 7) | Verified | 20 captures re-run via `scripts/capture-screenshots.mjs` (the recharts 2.x pie + the ordered chips + the DIV badges render in 02/03/10) |
| **Radix animation parity (session 8, G-1)** | Verified | The reference's stylesheet defines `.animate-in { animation-name: enter; 0.15s }` (its dialog/dropdown/select genuinely animate); the clone's utility classes were DEAD CSS (tw-animate-css installed, never imported — zero rules in the built stylesheet). Fixed: `@import "tw-animate-css"` in globals.css; the dialog's computed animation-name is now `enter` on both apps; e2e pins the computed style; the mobile-menu geometry spec settles animations before measuring |
| **lucide-react 0.475 pin (session 8, G-2)** | Verified | The reference's bundle banner: `lucide-react v0.475.0`, single-class emission (`lucide-${kebab(name)}`); the clone's 0.525.0 emitted dual classes for renamed icons (trash-2) and different icon nodes (LogOut path+path vs polyline+line). Downgraded to ^0.475.0 (React-19-compatible peer range); the edit dialog's trash icon now renders the reference's single `lucide-trash2`; e2e-pinned |
| **Classic dialog/select primitives (session 8, G-3)** | Verified | Live-measured on the reference's edit dialog + open priority listbox: DialogContent `left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]` + 4 slide classes + `sm:rounded-lg`; DialogTitle `tracking-tight`; SelectTrigger `ring-offset-background data-[placeholder]:text-muted-foreground`; SelectContent side slide-ins. All applied; the edit-mode dialog now diffs **0/62** (byte-identical incl. container + input values); e2e-pinned |
| **Wire-format serializer (session 8, G-4)** | Verified | Responses previously returned raw camelCase Prisma objects (with isSample/userId; notes' tags as a JSON string) while requests + 3 docs specified the reference's snake_case entity shape. `src/lib/serialize.ts` added (unit-pinned, 7 tests); all task/note routes serialize; mapTask/mapNote read the snake_case wire; the e2e POST/GET spec pins the response field names |
| **Next-week view parity (session 8, first-time diff)** | Verified | Populated state-matched class-tree diff of the NEXT-week calendar (both apps holding an identical completed task on Tue 11:00): **0 diffs across the entire calendar + Quick Actions region (elements 0–653)**; the task block sits at the identical DOM index [227] with identical classes — the week-navigation surface verified for the first time |
| **Log Activity populated parity (session 8)** | Verified | State-matched entries on both apps ("Live verify scheduled" / "Completed in 2 days") — identical structure, classes, and relative-time formatting |
| Mobile menu re-pin (session 8) | Verified | Live on BOTH apps at 390×844 (trusted clicks, animation settled): trigger 338/14/36×36 both; menu 182/54/192×164, items [Profile, Settings, Logout] — no Tailwind v4 regression; the menu now ANIMATES like the reference's |
| **Reference residue cleanup (session 8, P-3)** | Verified | Session 5's leftover "Live verify scheduled" (completed, Oct 6 11:00) found on the reference's NEXT week — sessions 6/7's "0 tasks" checks only looked at the current week. Deleted via the reference's own dialog (confirm armed); the account is back to the TRUE 0-task baseline |
| Screenshots (session 8) | Verified | All 20 captures re-run on the remediated codebase (the animated dialog + menu settled before capture; the lucide 0.475 icons render in every shot) |
| **Full-gate re-run at base (session 9)** | Verified | Fresh clone (workspace reset) · lint ✓ · typecheck ✓ · 66/66 unit · build (19 routes) · 63/63 e2e · smoke 30/30 — the session-8 remediation held; the account baseline held (0 tasks) |
| **Open Select-listbox item-state parity (session 9, first-time diff)** | Verified | Create-dialog priority Select open on BOTH apps: byte-identical listbox content class (all side slide-ins), all four item class strings, the `absolute right-2 flex h-3.5 w-3.5` indicator spans, and the `checked` state on Medium — the session-8 suggested surface, now pinned by inspection |
| **Dashboard / Profile / Settings / mobile-dashboard class-tree parity (session 9, state-matched)** | Verified | An empty parity user registered in the clone to match the reference's 0-task state: dashboard **761/761** (desktop AND mobile) — only the 3 documented styled-jsx `<style>` nodes differ; Profile **26/26**; Settings **39/39** — byte-identical |
| **db-path v3 — the repo .env authority (session 9, F-1)** | Verified | The workspace harness's ambient `DATABASE_URL=file:/home/z/my-project/db/custom.db` (outside the repo) previously hijacked `db:push`, `db:seed` AND `next dev` (reproduced: the parent file was created/seeded; a polluted dev server fails every query). v3 (`chooseEnvSource` + `repoEnvDatabaseUrl`, 17 new unit tests) makes the repo's own `.env` authoritative; verified live: `db:push`/`db:seed` target `<repo>/db/custom.db` and the dev server serves the seeded repo DB — all in the polluted shell; the e2e isolation (`db/e2e.db`) survives (ambient-inside wins; 64/64 × 2) |
| **prisma-CLI wrapper (session 9, F-1)** | Verified | `scripts/prisma-cli.ts` + package.json (db:push/db:migrate/db:reset) — the CLI applies the v3 rule (5 contract tests); verified live: `bun run db:push` in the polluted shell pushes `<repo>/db/custom.db` |
| **Planning day-card div parity (session 9, F-2)** | Verified | The last remaining live class-tree divergence (sessions 7–8 documented): the clone's `<button … text-left …>` vs the reference's plain `<div …>` (no role/tabindex, cursor-pointer, text-align start). Converted; the Planning class-tree diff is now **63/63 (unselected) and 98/98 (day-selected) — IDENTICAL**; the a11y trees match (`generic … [cursor:pointer, onclick]`); e2e-pinned (the new div-shape spec + the updated `div.p-4.cursor-pointer` locators) |
| Mobile menu re-pin (session 9) | Verified | Live on BOTH apps at 390×844 (trusted clicks, animation settled): trigger 338/14/36×36 both; menu 182/54/192×164, items [Profile, Settings, Logout]; computed `animation-name: enter` on both; navigation round-trip (Profile → /Profile) verified — **no Tailwind v4 regression** |
| Desktop avatar menu re-pin (session 9) | Verified | Live on BOTH apps at 1440×900: trigger 1252/14/76×36, menu 1136/54/192, right 1328, items identical |
| Both LLMs observed LIVE (session 9, P-1) | Verified | The reference's Daily Focus rendered a Paul J. Meyer quote (its InvokeLLM succeeded — the Mark Twain FALLBACK claim from session 4 is about the bundle's catch block and still holds) while the clone's z-ai SDK returned a Walt Disney quote — the first session observing BOTH live LLMs working; content stays non-deterministic by design, the fallback structure unit-pinned |
| Screenshots (session 9) | Verified | All 20 captures re-run on the remediated codebase via `scripts/capture-screenshots.mjs` (the day-card divs render in 03/09/10; the capture script's locator updated to the div shape) |
