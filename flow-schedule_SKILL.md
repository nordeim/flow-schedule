---
name: flow-schedule-skill
description: >
  Comprehensive engineering skill for the FlowSchedule codebase — a
  self-hosted clone of the FlowSchedule reference app (weekly time-grid
  calendar, AI insights, notes) built on Next.js 16 + React 19 + Prisma/
  SQLite + Tailwind CSS v4. Use this when extending, debugging, onboarding,
  or replicating the FlowSchedule architecture. Every claim is
  codebase-verified (sessions 1–22, 2026-10-06).
version: 2.11.0
last_updated: 2026-10-06
project_state: 165/165 unit tests, 94/94 e2e tests, all gates green, build self-type-checks, db-path v3 (repo .env authoritative), zero-data-slot DOM, top-5 slice + Brainstorm no-op/order pinned, the Focus Timer W1e timed-interaction contract pinned to the live-measured reference timeline (pause snap-to-full, resume restart-from-full, the 00:00 terminal completion display, no close/reopen persistence — page.clock-pinned), the framer-motion animation family pinned at FOUR evidence levels (the decompiled G1e/W1e/A_e configs byte-identical; the same WAAPI-hybrid runtime — circOut IS cubic-bezier(0.55, 0, 1, 0.45); the rAF timelines matching; the WAAPI animation metadata byte-identical) with the BL-1 blob mirror (the reference's dead w-100 renders 0×0 — the clone mirrors the RENDERED effect), the Tailwind default-theme drift closed (the reference's v4.0-era --font-sans stack pinned over v4.3.3's v3-compat default — F-1; the 13 used-but-unpinned palette tokens pinned to the reference's measured hexes — C-1, incl. pink-700 #be185d, ONE unit off the v3 hex; the used⊆pinned completeness invariant as a unit pin — PIN-1), the Planning Add Task no-op closed (S21-F1: the reference's eSe ships NO dialog state and NO onClick — the button is decorative like the Filter button; the dialog lives ONLY on the Dashboard calendar, where its W-3/W-4 request-contract pin now lives), the space-y engine drift closed (S22-F1/S22-F2: the v3-compat rules in globals.css — the inline-label margin collapse on the login/dialog field gaps AND the -mb-2 back-link specificity flip — pinned by the computed-geometry e2e family + the source pins; the login + dialog geometry now byte-matches the reference), the matched-data raster diff closed at noise level (/Planning 0.057% — /Dashboard 0.715% ALL inside the Daily Focus LLM region — the login error state 0.098%), wire contract pinned to the CAPTURED live reference wire (created_date/is_sample/created_by, 14/9-key shapes, client-computed end_time, verbatim description, FLOAT-formatted duration tokens, µs date tokens — route-keyed Z, start_time untouched, the CAPTURED key ORDER — Task start_time-first, Note title-first, every response surface — and end_time stored AS SUBMITTED, no server-side derivation), BOTH InvokeLLM prompts pinned byte-for-byte to the captured request bodies (incl. the createdAt-desc task order), the response-parse contract pinned to the PROBED reference render (schema-shape checks, quote-only focus guard), the failure-path (429) render parity confirmed on BOTH apps, the seed re-anchors its sample week across week boundaries
---

# FlowSchedule — Engineering SKILL

> **How to use this document:** sections are self-contained. Start with §1
> for identity, §2 for the locked stack, §3 to bootstrap. When debugging,
> jump to §10. Before shipping, run §11. Every file path exists; every
> version matches `bun pm ls`; every test count matches the runner output.

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [State Management Deep Dive (Zustand)](#6-state-management-deep-dive-zustand)
7. [Data & Domain Model](#7-data--domain-model)
8. [Accessibility Implementation](#8-accessibility-implementation)
9. [Anti-Patterns & Common Bugs](#9-anti-patterns--common-bugs)
10. [Debugging Guide](#10-debugging-guide)
11. [Pre-Ship Checklist](#11-pre-ship-checklist)
12. [Lessons Learnt & How to Avoid Them](#12-lessons-learnt--how-to-avoid-them)
13. [Pitfalls to Avoid](#13-pitfalls-to-avoid)
14. [Best Practices](#14-best-practices)
15. [Coding Patterns](#15-coding-patterns)
16. [Coding Anti-Patterns](#16-coding-anti-patterns)
17. [Responsive Breakpoint Reference](#17-responsive-breakpoint-reference)
18. [Z-Index Layer Map](#18-z-index-layer-map)
19. [Color Reference (Complete)](#19-color-reference-complete)
20. [TypeScript Interface Reference](#20-typescript-interface-reference)
- [Appendix A: ADRs](#appendix-a-adrs)
- [Appendix B: Verification Ledger](#appendix-b-verification-ledger)
- [Appendix C: Session History](#appendix-c-session-history)
- [Appendix D: Post-Deploy Live-Site Validation](#appendix-d-post-deploy-live-site-validation)

---

## 1. Project Identity & Design Philosophy

**One sentence:** FlowSchedule is a self-hosted, pixel-faithful clone of
the base44-hosted FlowSchedule reference app — a weekly schedule planner
with a 16-hour time-grid calendar, AI-generated daily focus and schedule
summaries, quick-capture actions, and notes — rebuilt on Next.js 16 with
cookie-session auth and Prisma/SQLite replacing the base44 platform.

**Design thesis:** *fidelity to the reference is the product*. The
reference's routes (`/Dashboard`, `/Planning` — capitalized), enum
values, gradient hex stops, calendar geometry (16 × 60px slots, 80px
label column), and mobile-menu anchoring are **measured facts, not
preferences**. Anything that "improves" the reference's visuals is a
regression.

**Non-negotiable rules:**

- Route paths keep the reference's exact casing — never lowercase them,
  never merge pages into an SPA.
- The mobile navigation is ONLY the header's account menu (Radix
  DropdownMenu `align="end"`); the reference ships **no bottom tab bar**
  (its mobile nav-items array is empty `[]`).
- The LLM never hard-fails: every AI feature renders a deterministic
  fallback on any SDK error (the reference's own pattern — its catch
  blocks ship canned content).
- The API envelope is `{ ok, data } | { ok, error }` — never throw across
  the boundary, never leak Prisma errors to the client.

**The anti-generic mandate:** no component library kits, no dashboard
templates, no "modern SaaS" styling. Glass cards (`bg-white/60
backdrop-blur-xl rounded-3xl`), the slate→sky→indigo canvas gradient,
and the three drifting framer-motion blobs ARE the design.

## 2. Tech Stack & Environment

Locked versions (from `bun pm ls`, verified 2026-10-04):

| Layer | Technology | Version | Critical Note |
|---|---|---|---|
| Framework | next (App Router, Turbopack) | 16.3.8 | `proxy.ts` era; `allowedDevOrigins` is load-bearing; `params`/`cookies()` async |
| UI runtime | react / react-dom | 19.3.0 | |
| Language | typescript | 5.x (strict) | `tsc --noEmit` is the fast gate; the build self-type-checks too (`ignoreBuildErrors` removed, session 3) |
| Styling | tailwindcss + @tailwindcss/postcss | 4.3.3 | CSS-first `@theme inline`; NO `tailwind.config.*`; v3 token values pinned (§4) |
| Primitives | radix-ui (dialog, dropdown-menu, select, accordion, …) | per-package | Focus trap + Escape come free — never hand-roll |
| Charts | recharts | 2.15.4 | The reference's measured 2.x major — do NOT bump (session 7, G-3) |
| Animations | tw-animate-css | 1.4.0 | The v4-native tailwindcss-animate port — imported in globals.css (session 8, G-1) |
| Motion | framer-motion | 14.0.0 | Background blobs only |
| State | zustand | 5.0.15 | THE single fetcher of `/api/*` (§6) |
| Icons | lucide-react | 0.475.0 | The reference's MEASURED version (single-class emission; session 8, G-2) |
| ORM | prisma + @prisma/client | 6.19.3 | SQLite; relative `file:` URLs anchored by `src/lib/db-path.ts` |
| AI | z-ai-web-dev-sdk | 0.0.18 | Server-side ONLY; deterministic fallbacks |
| Unit tests | vitest | 5.0.3 | `*.test.ts` only (e2e specs never picked up) |
| E2E | @playwright/test | 1.63.0 | Production standalone on :3100, isolated `db/e2e.db` |
| Runtime | bun | 1.3.x | `db:seed` is `bun prisma/seed.ts`; Node ≥ 20 works for the rest |

**Environment variables** (all three read via `process.env` at call time):

| Variable | Read by | Behavior when unset |
|---|---|---|
| `DATABASE_URL` | `src/lib/db-path.ts` (runtime), Prisma CLI | Relative `file:../db/custom.db` resolved against the schema-owning repo → `<repo>/db/custom.db` |
| `AUTH_SECRET` | `src/lib/auth.ts` | Dev-only constant (loud, documented); REQUIRED in production |
| `NEXT_PUBLIC_SITE_URL` | `src/lib/site.ts` | Falls back to `http://localhost:3000`; feeds `metadataBase`, `/sitemap.xml`, `/robots.txt` |

`.env` is git-ignored; `.env.example` is the committed contract and is
**pinned by a unit test** (`tests/env-example.test.ts` — branding, exact
default DB path, all three vars present, no predecessor leftovers).

## 3. Bootstrapping & Configuration

```bash
git clone git@github.com:nordeim/flow-schedule.git
cd flow-schedule
bun install
cp .env.example .env
# generate a session secret:
#   echo "AUTH_SECRET=$(openssl rand -hex 32)" >> .env
bun run db:push && bun run db:seed
bun run dev            # :3000 — health check: curl localhost:3000/api/health
```

Demo credentials (seed): `demo@flowschedule.app` / `demo1234`.

**Commands** (Bun canonical; run from repo root):

| Command | Purpose |
|---|---|
| `bun run dev` | Dev server :3000 (Turbopack), logs tee'd to `dev.log` |
| `bun run build` | Production build + assembles `.next/standalone` |
| `bun run start` | Standalone prod server :3000 |
| `bun run lint` / `bun run typecheck` | ESLint 9 flat / `tsc --noEmit` |
| `bun run test` | Vitest unit — 165 tests |
| `bun run test:e2e` | Playwright — 94 specs; **requires prior `bun run build`** |
| `bun run db:push` / `bun run db:seed` | Schema sync / idempotent seed |
| `scripts/smoke-test.sh` | 30-check curl suite over the standalone server |

**Configuration files:**

- `next.config.ts` — `allowedDevOrigins: ["127.0.0.1", "localhost"]`
  (load-bearing: Next 16's dev-origin protection silently blocks dev
  chunks for `127.0.0.1` otherwise — symptom: unhydrated pages),
  `output: "standalone"`, `typescript.ignoreBuildErrors: true` (the
  typecheck gate replaces it).
- `vitest.config.ts` — `include: ["src/**/*.test.ts", "tests/**/*.test.ts"]`,
  node environment, `@` alias → `src/`.
- `playwright.config.ts` — production standalone webServer on :3100 with
  `DATABASE_URL=file:../db/e2e.db`, one setup project (single login,
  shared storageState — login is rate-limited), `workers: 1` (specs share
  one SQLite file).
- `postcss.config.mjs` — `@tailwindcss/postcss` only.
- `eslint.config.mjs` — flat config; `react-hooks/set-state-in-effect`
  is an ERROR and has caught two real bugs.

**Environment traps** (both hit in practice — both NEUTRALIZED by db-path
v3, session 9):

1. Bun auto-loads `.env` from PARENT directories — a workspace parent
   `.env` with an absolute `DATABASE_URL` used to win over this repo's
   relative one. v3: the repo's own `.env` is authoritative; ambient
   SQLite URLs resolving OUTSIDE the repo are ignored (FS-19).
2. A shell-EXPORTED `DATABASE_URL` beats every `.env` file. Symptom
   (pre-v3): `db:seed` says "Sample tasks already present — skipped"
   while `<repo>/db/custom.db` stays 0 bytes. v3: same rule — the
   export only wins if it resolves INSIDE the repo (the e2e
   isolation) or is a non-SQLite provider URL; the CLI-facing scripts
   apply it via `scripts/prisma-cli.ts`.

## 4. The Design System (Code-First)

All tokens live in `src/app/globals.css` — there is **no
`tailwind.config.*`**. Two blocks matter:

1. `:root { … }` — shadcn semantic tokens as **full `hsl()` values**
   (Trap 1: a bare `0 0% 100%` triplet under `@theme inline` silently
   resolves to *transparent*).
2. `@theme inline { --color-*: var(--*); … }` — maps the semantic vars
   into Tailwind's color namespace, **pins the v3-era slate/sky/indigo
   palette hexes** (Trap 2: v4's oklch defaults drift 1–3 sRGB units per
   channel), and **pins `--shadow-sm` to the v3 value**
   `0 1px 2px 0 rgb(0 0 0 / 0.05)` (Trap 5: v4's default is one notch
   heavier; 21+ `shadow-sm` usages would drift).

Full trap taxonomy and fixes: `docs/Tailwind-V4-Validation-Report.md`
(5 engine-level traps — read before touching `globals.css`).

**Signature styles:**

- Canvas: `min-h-screen bg-gradient-to-br from-slate-50 via-sky-100
  to-indigo-100` + 3 animated framer-motion blobs (sky/blue, indigo/
  purple, cyan/teal; 30/35/40s mirrored loops) — `src/components/layout/
  BackgroundBlobs.tsx`.
- Header: `sticky top-0 z-50 bg-white/60 backdrop-blur-lg shadow-sm`.
- Glass cards: `bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border
  border-white/20`.
- Buttons: `rounded-2xl` pills; primary = `bg-gradient-to-r from-sky-500
  to-blue-600`.
- Quick Action tiles: **inline-style hex gradients** (NOT
  `bg-gradient-to-r` utilities) with the reference's exact stops — this
  also sidesteps v4's in-oklab interpolation drift (Trap 3):
  - Add New Task: `#0ea5e9 → #2563eb`
  - Start Focus Timer: `#10b981 → #14b8a6`
  - Log Activity: `#8b5cf6 → #6366f1`
  - Quick Brainstorm: `#f59e0b → #f97316`

**Typography:** system stack (`font-sans`), `text-3xl font-bold
text-slate-900` page titles, `text-slate-600` subtitles — matches the
reference exactly; do not introduce webfonts.

## 5. Component Architecture & Patterns

**Layer model** (single Next.js app, 28 `.tsx` files, 20 of them
`"use client"`):

```
L1  src/app/**                 — routes: (app) group + /login + 11 API handlers
L2  src/components/**          — client islands (dashboard, planning, layout, ui)
L3  src/store/useFlowStore.ts  — THE only fetcher of /api/*; envelope unwrap
L4  src/lib/**                 — pure seams: auth, api, domain, ai, db, db-path, site
L5  prisma/**                  — schema + idempotent seed
```

Golden rule: data flows **L1 → (render) → L2 → (action) → L3 → (fetch)
→ L1 API → L4 → L5**. A component NEVER fetches directly; a server
component NEVER fetches entity data (pages are client islands over the
store — matching the reference's SPA behavior).

**Directory inventory:**

| Folder | Files | Purpose |
|---|---|---|
| `src/components/ui/` | 12 | shadcn-style primitives: button, input, textarea, label, badge, card, dialog, select, dropdown-menu, accordion |
| `src/components/layout/` | 3 | AppShell, Header (the mobile menu lives HERE), BackgroundBlobs |
| `src/components/dashboard/` | 6 | WeeklySchedule, QuickActions, SkillsMap, StatusCard, DailyFocusCard, AISummaryCard |
| `src/components/planning/` | 1 | TaskDialog (create/edit form) |
| `src/app/api/` | 11 route handlers | auth login/register/me, logout, tasks ×2, notes ×2, ai ×2, health |

**Client/Server decision tree:** a file needs `"use client"` iff it
calls hooks (`useState`, `useFlowStore`), browser APIs, or framer/
recharts. Everything else (layouts, the root page redirect) stays a
server component. `z-ai-web-dev-sdk` is imported ONLY by
`src/lib/ai.ts` (server) — a client import would crash the build.

**The mobile menu** (highest-regression-risk surface, see §9/§10):
`src/components/layout/Header.tsx` — desktop: avatar Button with
initial → DropdownMenu (My Account label + Profile/Settings/Logout);
mobile (`md:hidden`): ghost user-icon Button (`aria-label="Open account
menu"`) → DropdownMenu `align="end"`. Measured parity at 390px viewport
(re-measured against the live reference 2026-10-04): **menu right 374 =
trigger right 374, menu top 54, width 192**. Pinned by
`tests/e2e/mobile-navigation.spec.ts`.

## 6. State Management Deep Dive (Zustand)

`src/store/useFlowStore.ts` is the single client store and the ONLY
fetcher of `/api/*`. Every fetch unwraps the `{ ok, data } | { ok,
error }` envelope and surfaces `error.message` through the store's
`error` field — components render it inline.

Key contract details:

- **snake_case wire format**: the API speaks the reference's entity
  shape (`start_time`, `duration_minutes`, `created_at`,
  `status: "in_progress"`). `mapTask`/`mapNote` in the store are the
  ONLY snake↔camel conversion seams — never sprinkle conversions into
  components.
- Slab pattern: `tasks`, `notes`, `user`, `error`, and async actions
  (`fetchTasks`, `createTask`, `updateTask`, `deleteTask`, `login`,
  …) — each action returns/throws nothing; failures land in `error`.
- Components subscribe with selectors (`useFlowStore((s) => s.tasks)`),
  never whole-store, to avoid re-render storms.

## 7. Data & Domain Model

**Prisma schema** (`prisma/schema.prisma`, SQLite): `User`
(`email` unique, `passwordHash`, `fullName`) · `Task` (title ≤300,
description?, priority, category, status, `startTime`?, `durationMinutes`?,
`endTime`?, `userId`) · `Note` (title, content, tags JSON, `userId`).

**Domain enums and constants** live in `src/lib/domain.ts` — the single
source of truth (pinned by `tests/domain.test.ts`, 13 tests):

- Priorities: `low | medium | high | urgent` (text colors: green/
  yellow/orange/red)
- Categories: `work | personal | health | learning | creative | social |
  planning` (gradients: blue/green/red/purple/pink/yellow/indigo)
- Statuses: `todo | in_progress | completed`
- Calendar: 16 hour slots 07:00–22:00; grid geometry
  `gridTemplateColumns: 80px repeat(16, 60px)`; day rows `EEE` + `MMM d`;
  task blocks absolutely positioned at 1px/minute.
- `SKILL_COLORS` (7 category dot colors), `CATEGORY_BADGES`,
  `PRIORITY_TEXT` maps.

**Server-side validation:** API routes validate writes against
`isPriority/isCategory/isTaskStatus` guards; **enum-invalid values
coerce to the reference's defaults** (priority→medium, category→work,
status→todo) rather than rejecting — mirroring the reference's lenient
behavior. Stored enums are always valid.

**Seed** (`prisma/seed.ts`): idempotent — user upsert + `is_sample:
true` guards; re-running never duplicates. Demo user + 9 tasks + 2
notes. Sample data belongs to the seed, NEVER to the runtime.

**Auth** (`src/lib/auth.ts`): scrypt password hashing + HMAC-signed
session tokens (`userId.expiry.mac`) in an HttpOnly `fs_session`
cookie; login/register rate-limited 10/IP/60s (429 + `Retry-After`,
in-memory fixed window in `src/lib/api.ts`).

**AI** (`src/lib/ai.ts`): z-ai-web-dev-sdk, server-side only.
`dailyFocus()` → quote/author/affirmation JSON (fallback: the Paul J.
Meyer quote); `dailySummary(date)` → mood/focus_areas/activities/
insights JSON. Both wrap every call in try/catch with deterministic
fallbacks and log `[ai] … using default` server-side — a 429 from the
SDK rendering the default is CORRECT behavior, not an incident.

## 8. Accessibility Implementation

- **Radix primitives everywhere** (dialog, dropdown-menu, select,
  accordion) — focus trap, Escape handling, `aria-expanded`, roving
  focus come free; never hand-roll these.
- Icon-only buttons carry `aria-label`s (`Open account menu`,
  `Close Timer`, `Back to Quick Actions`) — including the mobile menu
  trigger (the reference ships it unnamed; the clone's label is a
  deliberate a11y improvement that does NOT change geometry).
- Two `role="status"` live regions (Daily Focus / AI Summary) carry
  **distinct aria-labels** — required when multiple status roles exist.
- `prefers-reduced-motion` is respected globally (blob animation and
  panel transitions degrade).
- Day-card task chips are `div[role=button] tabIndex={0}` with Enter
  handlers — keyboard parity with the reference's clickable chips.
- Focus states are visible (Radix defaults + `focus-visible:ring` on
  inputs/buttons).

## 9. Anti-Patterns & Common Bugs

Numbered from project history (sessions + remediation); each maps to a
test or a pinned convention that prevents recurrence.

### FS-1: Bare-HSL theme triplets (Critical — build-time silent)

**Symptom:** elements styled with semantic tokens render invisible
(transparent). **Root cause:** under `@theme inline`, a bare `0 0% 100%`
triplet resolves to `transparent` in Tailwind v4. **Fix:** all `:root`
semantic tokens are full `hsl()` values in `src/app/globals.css`
(Trap 1). **Lesson:** never "simplify" `hsl(0 0% 100%)` to `0 0% 100%`.

### FS-2: Token value drift (High — visual)

**Symptom:** colors/shadows one notch off vs the reference.
**Root cause:** v4's oklch palette defaults and heavier `shadow-sm`.
**Fix:** v3-era hexes + `--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)`
pinned in `@theme inline` (Traps 2 & 5). Pinned visually by e2e
gradient assertions.

### FS-3: space-y selector rewrite (High — layout)

**Symptom:** spacing collapses or child margins win unexpectedly.
**Root cause:** v4 emits `:where(.space-y-* > :not(:last-child))` with
ZERO specificity — a child's own `mt-*/mb-*` overrides it (Trap 4).
**Fix/convention:** NO `space-y-*` container in this codebase carries
children with explicit mt/mb utilities (the dropdown menu uses `p-1` +
item margins). Keep it that way — the mobile-menu geometry spec fails
if the pattern sneaks back.

### FS-4: set-state-in-effect cascades (High — React)

**Symptom:** ESLint error `react-hooks/set-state-in-effect`; infinite
re-render risk. **Root cause:** resetting state inside effect bodies.
**Fix patterns in-tree:** derive loading states (AISummaryCard's
keyed-result) and reset form state via REMOUNT (TaskDialog's
`key={editingTask?.id ?? "new-task"}` + DialogContent-mounted body).
This rule caught two real bugs — never downgrade it to a warning.

### FS-5: useSearchParams without Suspense (High — build)

**Symptom:** `Error occurred prerendering page "/login"` fails the
build. **Fix:** the login page shell wraps `LoginCard` in
`React.Suspense` (static prerender + client hook contract).

### FS-6: Dev-origin chunk blocking (High — dev only)

**Symptom:** pages render unhydrated; native form GET fallbacks.
**Root cause:** Next 16 dev-origin protection blocks `127.0.0.1` dev
chunks. **Fix:** `allowedDevOrigins: ["127.0.0.1", "localhost"]` in
`next.config.ts` — load-bearing, do not remove.

### FS-7: Day-card center-click interception (Medium — e2e)

**Symptom:** e2e "day statistics" test intermittently opened the Edit
dialog instead of selecting a day. **Root cause:** task chips were
`div[role=button]` with `stopPropagation` INSIDE the day-card `button`;
Playwright clicks the element's center point, which a chip can cover.
**Session-2 resolution (the REAL fix):** the reference's chips are
display-only divs with no handler — clicks bubble to the day card and
select the day. The clone now matches, so the interception is
**structurally impossible**; any click position selects the day. The
header-block click (`div.text-center`) remains in the specs as the
maximally robust variant, and the hydration gate (seeded chip visible
before clicking) is still required. See §10.

### FS-8: Deleting the SQLite file under a live server (Critical — e2e infra)

**Symptom:** every write fails with `SQLITE_READONLY_RECOVERY`
("attempt to write a readonly database"); reads still work.
**Root cause:** the Playwright webServer boots BEFORE globalSetup;
`rmSync` of the db file in globalSetup leaves the running server's
open handle pointing at a dead inode. **Fix:** global-setup NEVER
resets the file (documented in its header); specs clean up what they
create via the API instead. See FS-9.

### FS-9: e2e data residue drift (Medium — e2e infra)

**Symptom:** created-row residue breaks later assertions after N runs.
**Root cause:** specs create tasks and never delete them; a single
`.find()`-then-delete also never converges residue from crashed runs.
**Fix:** cleanup blocks in `planning.spec.ts`/`dashboard.spec.ts`
delete EVERY matching title via `page.request` (shares the session
cookie); verified convergence — after a full run the db holds exactly
the 9 seed tasks. (Session-2 note: the old "3.5h" day-total assertion
was itself a clone-only feature — see FS-11 — and was retired with the
stats data branch.)

### FS-10: Radix menu hide-others in tests (Medium — e2e)

**Symptom:** role queries for elements OUTSIDE an open DropdownMenu
time out. **Root cause:** Radix marks the app root `aria-hidden` while
the menu is open. **Fix:** measure/click the trigger BEFORE opening
(see `tests/e2e/mobile-navigation.spec.ts`). Synthetic `el.click()`
via `page.evaluate` also does NOT open Radix menus — use
`locator.click()` (trusted pointer events).

### FS-11: Inferring reference behavior instead of decompiling it (Critical — parity)

**Symptom:** the clone's /Planning page behaved differently from the
reference on SEVEN counts (today-preselected panel, today-highlight,
real Day Statistics, working Filter cycler, clickable chips, task item
action buttons, an Unscheduled accordion) — none of them caught by the
gate because the specs pinned the WRONG behavior.
**Root cause:** session 0 built the page from the live EMPTY-state
reference (no tasks, no day selected) and inferred "reasonable"
behavior instead of decompiling the component from the bundle.
**Fix + rule:** decompile the reference's minified component
(`bundle.js`: state init, conditional guards, handlers) BEFORE building
a view; the live DOM only corroborates. The corrected behaviors are
pinned by 9 planning specs (`tests/e2e/planning.spec.ts`). When a
parity question is open, the bundle is the ground truth — "the
reference wouldn't do that" is not evidence.

### FS-12: Verifying the resting state, not the interactive states (Critical — parity)

**Symptom:** the Quick Actions card was "verified" for two sessions
while ALL FOUR of its open-panel states diverged from the reference
(container never morphed to the gradient, the "Quick Actions" heading
never got replaced, tiles were h-28/rounded-xl instead of
h-24/rounded-2xl, the quick-add had a visible label + blue-gradient
submit instead of placeholder-only + slate-700, the timer showed the
minutes input while running and a RotateCcw "pause" icon, Log Activity
had clone-only Done buttons, Brainstorm could not edit notes).
**Root cause:** sessions 0–2 verified what the dashboard shows AT REST
(tiles + gradients byte-identical) and never exercised the open-panel
state — the same blind-spot class as FS-11, one interaction deeper.
**Fix + rule:** parity is a claim over the STATE MACHINE, not a
screenshot — for every interactive surface enumerate its states
(resting, open, running, loading, empty, error) and decompile + pin
each one. The corrected panels (decompiled `G1e`/`z1e`/`W1e`/`H1e`/
`K1e`) are pinned by 8 dashboard specs; the completion alert was
verified by a one-off Playwright run. Corollary learned the hard way:
the reference's own dead code (W1e's "Please set a valid duration."
alert, unreachable behind `disabled: minutes<=0`) must be MIRRORED,
not "fixed" — parity includes the dead code.

### FS-13: Playwright getByText matching a textarea's default value (Medium — e2e flake)

**Symptom:** a Brainstorm spec passed in isolation but failed under
full-suite load: `getByText(/E2E QA note/).first().textContent()`
measured the FULL note content (37 chars) instead of the truncated
list preview (33).
**Root cause:** React renders a controlled `<textarea>`'s value into
the DOM as its default-value TEXT NODE, and during the view transition
the still-mounted create-view textarea matches the same pattern —
under suite load the save's await chain hadn't switched the view yet,
so `.first()` resolved to the textarea, not the list `<p>`.
**Fix + rule:** scope list-item assertions by role —
`getByRole("paragraph").filter({ hasText: … })` never matches a
textbox; it also makes `toBeVisible()` correctly WAIT for the view
switch. `getByText` on a page with live form views is a footgun.

### FS-14: Content-presence checks are not parity — fallbacks and chrome are surfaces too (Critical — parity)

**Symptom:** the dashboard sidebar cards were "verified" for three
sessions (headings render, data appears) while: the StatusCard shipped a
minimal "Up Next" instead of the reference's rich "Next Up" state machine
(skeleton, priority badge, 75% progress, a FUNCTIONAL Mark Complete, a
decorative ArrowRight), the DailyFocus fallback quoted Paul J. Meyer
instead of the reference's Mark Twain (user-visible on EVERY SDK 429),
AISummary used a Sparkles header icon where the reference ships Brain +
a Sparkles live indicator, SkillsMap had wrong slice hexes and no Award
indicator, the page container carried a clone-only `max-w-7xl`, the day
rows had no spacing, and the dialog deleted without a confirm.
**Root cause:** "the card renders content" was accepted as a parity
claim — nobody decompiled the cards' STATE MACHINES or the LAYOUT
CHROME, and the deterministic fallback strings were never treated as
UI surfaces.
**Fix + rule:** enumerate the full surface: every state (loading/empty/
loaded/mutating), every string the user can see — including fallback
constants (decompile them; a "reasonable" quote stayed wrong for three
sessions) — and the container/spacing/scrollbar classes. Pin the
fallback content with a unit contract (`tests/ai-defaults.test.ts`) and
the chrome with e2e evaluates. The reference's own format-string bugs
are part of the contract (date-fns "MMM d at HH:mm" renders "Oct 6
AM1791284400 11:00" — mirrored byte-identically).

### FS-15: The logged-out surface is a parity surface too (Critical — parity)

**Symptom:** the login page was "verified" for four sessions while its
ENTIRE design diverged from the reference (the base44 platform screen):
the clone shipped an app-canvas gradient page (the reference is
`from-slate-50 to-slate-100`), a `rounded-3xl border-white/20` card (the
reference is `rounded-2xl border-0` + a slate top gradient bar), an
Activity-icon logo box (the reference ships its real PNG in a ringed
circle), a sky-blue gradient submit (the reference's is **solid
slate-900**), transparent rounded-2xl inputs (the reference:
`bg-slate-50/50 rounded-xl` with `you@example.com` / `••••••••`
placeholders), an inline sign-up toggle with a Name field (the reference
swaps to a SEPARATE view: Back-to-sign-in + Email/Password/Confirm, no
Name), a notice-string forgot-password (the reference has a full
reset-request view + a check-your-email confirmation with a GREEN
alert), a plain red `<p>` error (the reference: the shadcn `[role=alert]`
card), and a "← Back to FlowSchedule" link the reference never shipped.
Also: no auth guard on the (app) routes (the reference redirects to
/login), no `/` dashboard route (the reference renders the dashboard AT
the root and lands there post-login), and Next's default 404 (the
reference ships a custom page).
**Root cause:** sessions 0–4 decompiled every AUTHENTICATED surface and
treated /login as "just the auth card" — a session-0 "reasonable design"
that was never measured, exactly the FS-11/12/14 blind-spot pattern one
surface further: the LOGGED-OUT surface.
**Fix + rule:** parity sweeps must enumerate EVERY route state an
anonymous visitor can see (login views, guards, 404, root) — not just
the authenticated app. Every state of the login card (sign-in, sign-up,
forgot, reset-sent, error, mismatch) is a view to measure; the guard
redirects and the landing URL are functional parity. Pin with
`tests/e2e/auth.spec.ts` + `not-found.spec.ts` (12 specs, session 5;
13/13 class strings byte-identical on the live apps).

### FS-16: Time-of-day-dependent e2e locators (Critical — e2e flake)

**Symptom:** the status-card spec failed at 09:0x UTC in session 6
(50/51) after two consecutive green runs in session 5. The spec created a
task at `now+5min` and asserted the PAGE-WIDE locator
`div.rounded-3xl` + hasText(task-title) — which resolves to BOTH the
WeeklySchedule card (the calendar renders the task block with its title;
there is NO status filter on either app — completed tasks stay on the
grid) AND the StatusCard. Strict-mode violation — but only when
`now+5min` lands inside the 07:00–22:00 calendar grid. Session 4/5's
runs happened pre-07:00 UTC: the task fell before the grid start, the
block was hidden (the pre-07:00 branch returns null), and the locator
resolved to exactly one element. Two consecutive green runs proved
nothing about the other 22 hours of the day.
**Root cause:** a locator whose match SET depends on the wall clock,
plus an assertion (`toHaveCount(0)`) that encodes a fact about the whole
page instead of the component under test.
**Fix + rule:** (1) scope locators to the component under test — the
StatusCard via `.filter({ has: page.getByRole("heading", { name: "Next
Up", exact: true }) })`; (2) assert component CONTENT
(`toContainText` / `not.toContainText`), never page-element COUNTs, for
data that legitimately persists elsewhere; (3) icon-level locators
(`svg.lucide-chevron-down`) must be scoped to `main` — the header ships
its own chevron (the desktop avatar trigger); (4) when a spec creates
time-relative data, ask WHICH rendering windows can contain it at every
hour of the day.

### FS-17: Array ordering is a parity surface — and class-tree diffs cannot see it (Critical — parity)

**Symptom:** six sessions of exhaustive class-tree diffs (761/761!) never
noticed that the clone's `GET /api/tasks` ordered tasks `startTime asc`
while the reference's default `fn.Task.list()` returns them **createdAt
desc**. The gap was user-visible the whole time: the Planning day-card
chips (`slice(0,3)` + "+N more") and the selected-day task list render
the array AS RETURNED — different apps showed different chips behind
"+N more".
**Root cause:** two stacked blind spots. (1) The class-tree diff compares
tag + class strings in document order — a re-ordered list is IDENTICAL
to it, and text content was never compared. (2) Session 6's diff ran on
MATCHED EMPTY states — the populated branches (chips, badges, item
order) simply did not exist.
**Fix + rules:** (1) diff with MATCHED POPULATED data — create the same
entities on both apps through their own UIs; (2) API response ORDER is
contract: pin it (`orderBy: { createdAt: "desc" }`, e2e-pinned); (3) the
store's create-task must PREPEND (the reference's save → refetch →
newest-first); (4) when a component renders `slice(0,N)`, the array
order is a user-visible surface. The same session found the Badge
element type (SPAN vs the reference's classic DIV) and the recharts
major (3.x vs the reference's 2.x DOM) — ALL three were
populated-state-only findings.
**Corollary (F-2, the state-transition locator):** a spec that scopes
via a heading must survive the component CHANGING that heading. The
status-card spec's post-Mark-Complete locator filtered by the "Next Up"
heading — but completing the last upcoming task swaps the h3 to "All
caught up!", the locator resolves to ZERO elements, and the NEGATED
assertion fails with "element(s) not found". Verify the app first
(PATCH landed; the card re-rendered — reproduced on a debug boot), then
accept BOTH headings in the filter. Sessions 4–6 passed only because
their runs predated the day's last seeded task.

### FS-18: Class equality is not CSS existence — and utility libraries are dead weight until imported (Critical — parity)

**Symptom:** the clone's dialog, dropdown menus, and selects carried the
full shadcn animation class set (`data-[state=open]:animate-in …
zoom-in-95 … slide-in-from-top-2`), `tw-animate-css` sat in
devDependencies — and NOTHING animated. Seven sessions of class-tree
diffs (761/761, 132/132!) were blind to it: the classes matched the
reference's exactly, but the built stylesheet contained ZERO rules for
them (grep the built CSS: `animate-in` absent). The reference's dialog
slides/fades/zooms in over 150ms; the clone's snapped instantly.
**Root cause:** class-tree diffs verify the ATTRIBUTE, not the CSS that
backs it; static e2e pins never assert motion; the package was never
imported in `globals.css`. The sibling `tailwindcss-animate` (v3 plugin,
unusable under v4 CSS-first) was equally dead.
**Fix + rules:** (1) importing a utility library is load-bearing — pin
it (an e2e now asserts the dialog's computed `animation-name: enter`);
(2) grep the BUILT stylesheet for a utility's selector before claiming
it works; (3) motion is a parity surface — the reference's own
measurements always waited for the 150ms settle, so
geometry-measuring specs must wait for `getAnimations()` to finish
(Playwright's `boundingBox()` includes transforms — mid-animation reads
the zoomed box).
**The same session's corollaries:** the lucide-react VERSION is parity
data (the reference's bundle banner says v0.475.0 — its factory emits
ONE class per icon; 0.525+ emits two for renamed icons like trash-2
and different icon NODES: LogOut as path+path vs the reference's
polyline+line — the same evidence class as session 7's recharts 2.x
pin); and the edit-mode DIALOG is a populated-only surface (session 6
diffed the create-mode dialog; the Delete button + prefilled values
exist only in edit mode — the classic DialogTitle/SelectTrigger class
gaps hid there). Also: the API's RESPONSE shape is a contract — the
requests spoke snake_case while the responses returned raw camelCase
Prisma objects (with internal fields); a wire serializer
(`serializeTask`/`serializeNote`) closed it, and the docs' claim became
true.

### FS-19: A pass-through env seam is a policy vacuum — pin WHERE the value is consumed (Critical — environment)

**Symptom:** the repo's `.env` said `DATABASE_URL="file:../db/custom.db"`
and every doc claimed the DB lives at `<repo>/db/custom.db` — yet
`bun run db:push` created `/home/z/<parent>/db/custom.db` (OUTSIDE the
repo), the seed populated THAT file, and a dev server started in the
same shell pointed at it too (querying a missing file → "Unable to open
the database file" once the parent file was deleted). Sessions 1–8
documented the parent-.env quirk as an environmental given and let it
win.
**Root cause:** db-path v2.3's "absolute `file:` URLs pass through
untouched" is a pass-through POLICY VACUUM — it answers "how do I
resolve a URL?" but never "whose URL wins?". The workspace injected the
variable twice over: a parent `.env` (Bun auto-loads parent
directories) AND a harness shell export (env vars beat .env files in
both Bun and Prisma's dotenv). Nobody owned the authority question, so
the environment answered it by accident.
**Fix + rules (db-path v3):** the schema-owning repo's OWN `.env` is
authoritative — `chooseEnvSource(ambient, repoEnv, schemaRoot)` decides
with three deliberate exceptions, each unit-pinned: (1) an ambient
SQLite URL resolving INSIDE the repo wins (the e2e suite's
`file:../db/e2e.db` isolation override — otherwise the suite would run
against custom.db!); (2) a non-SQLite ambient URL wins (production
PostgreSQL); (3) no repo `.env` value → ambient wins (the production
env-var flow). Rules: (a) when a config value can arrive from multiple
sources, write the PRIORITY rule down and pin it with tests — "both are
supported" is not a contract, it's a coin flip; (b) CLI tools that load
dotenv with no-override semantics (Prisma!) need a wrapper that applies
the same rule (`scripts/prisma-cli.ts`) — one rule, two enforcement
points; (c) acceptance-test the ENVIRONMENT, not just the code: this
session's gates run in the polluted shell on purpose — the fix must
make the pollution irrelevant, not require `env -u` discipline.
**The locator corollary (same session):** when an e2e locator relies on
a TAG as its discriminator ("the task items are DIVs — the day CARDS
are buttons"), converting the tag silently retargets the locator —
discriminate on a class the reference's own DOM guarantees (the day
cards carry `cursor-pointer`; task items never do).

### FS-20: Class-tree parity has a blind spot — diff the ATTRIBUTE inventory too (Critical — parity)

**Symptom:** after nine sessions of class-tree diffs reading
"identical," a fresh attribute-inventory scan found the clone's DOM
carrying `data-slot="button"`/`"input"`/… on every shadcn primitive —
6 elements on the idle dashboard, 24 in the open TaskDialog — while
the reference renders ZERO `data-slot` attributes in ANY state. The
divergence had been there since session 1, invisible to every audit.
**Root cause:** the class-tree dump extracts `el.className` (and maybe
`style`) — it cannot see any OTHER attribute. The shadcn generator's
data-slot markers are attribute-only: they change no class, fire no
rule, appear in no snapshot the method captures. A diff method that
only compares one attribute is a method with a blind spot — and
"identical" claims inherit it.
**Fix + rules:** remove the attributes (F-1: 24 sites across 9
primitives, nothing depended on them — repo-wide search for selectors
came back empty) and pin with an attribute-count locator
(`[data-slot]` → 0, idle AND dialog). Rules: (a) when a parity method
is built on ONE attribute, periodically run an inventory diff of ALL
attribute NAMES (`new Set([...el.attributes].map(a => a.name)]` on both
DOMs) — the difference set instantly separates framework markers
(remove) from the documented a11y floor (keep: invisible
role/tabindex/aria-label on the calendar cells, icon-button
aria-labels, decorative aria-hidden) and dev-mode artifacts (absent in
the production standalone); (b) third-party generator conventions are
NOT the reference's conventions — the session-7/8 "classic form"
conversions (Badge div, DialogTitle tracking-tight) were the same
lesson in class-space; data-slot was the attribute-space repeat; (c)
the same scan caught F-3 (a `maxLength={300}` the reference's title
input does not carry) — one method, three findings.

### FS-21: "Uses date-fns" is not a formatter contract — pin the VARIANT (High — parity)

**Symptom:** the populated Log Activity diff read "Ended about 3
hours ago" on the clone vs "Ended 3 hours ago" on the reference, and
"Completed in 1 day" vs "in 2 days" — same end_time instants, same
locale, same bundled token set.
**Root cause:** both apps bundle the SAME v3/v4 enUS locale object
(`aboutXHours` AND `xHours` tokens), but the reference calls
`formatDistanceToNowStrict` while the clone called `formatDistanceToNow`.
The non-strict variant picks `aboutXHours` for hour distances ≥ 90 min
and rounds day distances down (1.7 days → "1 day"); the strict variant
picks plain `xHours`/`xDays` and Math.rounds (1.7 days → "2 days").
"Uses date-fns" (or "renders relative times") is a FAMILY claim — the
variant is the contract.
**Fix + rules:** one import + one call site (QuickActions.tsx); pinned
by an e2e spec that seeds a 3h-past end_time and asserts "Ended 3
hours ago" + zero "about" in the panel (the strict variant's invariant
— the distance band is drift-stable). Rules: (a) when a dependency
exposes near-identical variants (strict/non-strict, precise/loose,
UTC/local), decompile which one the reference actually calls — the
minified call site answers it (`GJ(Wc(end_time), {addSuffix: !0})` +
GJ's token table); (b) discriminators for the pin must be
band-stable under test-time drift (3h ± seconds stays "3 hours" in
both variants; 90 min would flap).

### FS-22: A behavior verified live but unpinned is a regression waiting to happen (High — parity process)

**Symptom:** session 11's audit diffed the Log Activity's top-5 slice
live on both apps with a SATURATED 7-item list — identical — while the
e2e suite's Log Activity specs each seeded exactly ONE task. Removing
the `.slice(0, 5)` (or breaking the end_time comparator) would have
passed CI. Same class: the Brainstorm empty-save no-op and the
multi-note newest-first order were live-verified in sessions 4–11 but
never executed together in CI.
**Root cause:** the suite grew by *member-level* seeds (one item, one
assertion), so list-capacity behaviors (slices, sorts, pagination,
dedup) never executed at their boundary. "The code is right today" and
"the code is pinned" are different claims.
**Fix + rules:** three pins (session 11): the saturated top-5 slice
(count 5, end_time-desc DOM order, the 6th/7th cross-week items absent
FROM THE PANEL — they render as calendar blocks page-wide, so the
negation must be panel-scoped), the empty-save no-op (assert from the
LIST view — the create view unmounts the list, so a page-level count
is 0 by construction — a wrong-test trap this session hit), and the
newest-first order (assert DOM indices WITHIN the E2E title family —
`.first()/.last()` collide with the seed's own notes). Pin specs over
live-verified correct behavior take MUTATION evidence, not a RED phase:
break the behavior deliberately (remove the slice, delete the guard,
flip the sort), prove the spec fails, revert, GREEN. Two mutations will
stay green when the behavior is enforced at ANOTHER layer (the
empty-save no-op is server-validated in `/api/notes`; the rendered note
order is the save flow's `refreshNotes()` re-fetch, not the store
prepend) — that is not a weak pin, it is the pin correctly guarding the
BEHAVIOR surface while documenting which seam actually enforces it.

### FS-24: The prompt IS the wire (High — LLM parity process)

**Symptom:** the AI Summary card rendered fine and its e2e specs were
green, but the PROMPT the clone sent to the LLM was a different byte
stream than the reference's: truly-empty blank lines vs the reference's
8-space "blank" lines, no blank line between the date and the first
task, a plain `\n` join (no indent on subsequent tasks) vs the
reference's per-task template + blank-line structure, a missing
trailing space on item 3 — and, invisibly, a different task ORDER
(startTime asc vs the reference's createdAt-desc list feed). No test
could notice: both sides' consumers (the LLM + the defensive parser)
absorb formatting differences.
**Root cause:** an LLM-backed feature's parity surface is not just the
rendered card — it is the REQUEST BODY. Decompile gives you the
template (the reference's `fre` is a template literal whose source
indentation IS the wire); the capture gives you the bytes; the task
ORDER is an input contract decided by the caller (the 2-task capture
lists the NEWEST-created task first — disproving start-time ordering).
**Fix + rules (session 13):** pin the prompt in a PURE module
(`src/lib/ai-prompt.ts`) with byte-for-byte unit pins derived from the
captured InvokeLLM body — the whitespace artifacts (8-space blanks,
per-item templates, the trailing space) are CONTRACT, not noise; wire
it with a mocked-SDK spy pin (`vi.mock("z-ai-web-dev-sdk")`) proving
the exact bytes reach `chat.completions.create` — the only unit-level
evidence for a server-side call the e2e can never intercept; pin the
caller's order at the route source (the file-read precedent) when the
e2e can't see it. Related unlock: the base44 SDK's auth is HEADER-based
(`Authorization: Bearer …` + `X-App-Id` + `X-Origin-URL`) — capturing
`setRequestHeader` enables direct entity round-trips from the logged-in
reference page (probe creation + hygiene cleanup).

### FS-25: "Today"-anchored seeds rot at week boundaries (Medium — e2e determinism)

**Symptom:** the e2e suite passed 67/67 at 23:40 UTC Sunday and failed
12 seeded-task specs 35 minutes later (Monday 00:15 UTC) with zero code
changes: "Team standup" et al. simply vanished from the calendar. The
seed anchors its scheduled samples to the week the DB was FIRST seeded
(`at(dayOffset, …)` from that week's Monday) and the idempotency guard
never revisits them — while the calendar always renders the CURRENT
week.
**Root cause:** the FS-16 hour-of-day flake family, at WEEK granularity:
any seed-relative assertion is calendar-week-dependent, and a guarded
idempotent seed silently freezes "today" at first-seed time.
**Fix + rules (session 13, E-1):** the re-anchor belongs in the SEED —
the layer that owns the anchoring — not in the specs. A pure staleness
seam (`src/lib/sample-week.ts`: `weekMonday` identity comparison)
decides; the seed deletes ONLY `is_sample` rows and re-creates them on
the current week (user rows are never touched; within-week reruns stay
no-ops). The whole suite then self-heals on the next global-setup — no
db-file deletion (the FS-8 SQLITE_READONLY_RECOVERY constraint stays
respected).

### FS-26: The response is the wire too (High — LLM parity process)

**Symptom:** both AI cards' e2e specs were green and the natural LLM
round-trips matched, but the clone's response PARSE fell to the
deterministic fallbacks for schema-VALID-but-empty responses: an LLM
returning `focus_areas: []` rendered the clone's "Work tasks" fallback
chips while the reference rendered ZERO chips; empty mood/insights
fell to the fallback while the reference rendered empty `<p>`s; a
quote-only-valid daily-focus response (`author: ""`,
`affirmation: ""`) fell to Mark Twain while the reference rendered
`"- "` + an empty affirmation.
**Root cause:** the clone's defensive parse (the self-hosted
replacement for the platform's `response_json_schema` validation)
used TRUTHINESS where the platform checks SHAPE — the schema has no
minLength/minItems, so empty strings/arrays/items are VALID and the
reference renders them verbatim; only schema-INVALID shapes trigger
the reference's own catch/fallback. The parse conflated "empty"
(valid, renders) with "invalid" (falls back).
**Fix + rules (session 14):** probe the response side directly — the
XHR response-OVERRIDE harness (`Object.defineProperty` on the XHR
instance's `responseText`/`response`/`status`; the SDK's onload reads
the overridden values) feeds the reference's own card components
arbitrary post-validation JSON, probe by probe. Then pin the parse's
contract with the mocked-SDK pattern (`tests/ai-response.test.ts`):
SHAPE checks only (`isString`/`isStringArray`), NO truthiness, NO
`length > 0` filters, NO parse-level slicing (the render owns the
3-slice), and the daily-focus guard is quote-ONLY (`a && a.quote` —
the Y1e decompile). Same session closed session-12 P-1 the same way:
raw-text token extraction on the reference's entity wire proved the
Python backend emits `"duration_minutes":60.0` (float text) — the
task routes now ship float-formatted duration tokens via `okWire`
(`floatFormatDurations` in `serialize.ts`; regex-safe against
escaped string content because `\"` differs from `"`), pinned by
unit + a raw-response-text e2e assertion.

### FS-27: The server-generated date wire is a Python artifact too (Medium — wire parity)

**Symptom:** the entity wire's KEY SET, the float-formatted durations,
and the field values all matched, but the raw response TEXT still
differed byte-for-byte from the reference's own traffic: the
reference's `created_date` read `"2026-10-05T02:11:34.297127Z"` on
POST responses and `"2026-10-04T21:28:23.793000"` (no Z) on GET/PUT
responses, while the clone emitted `toISOString()` — 3-digit ms + Z
on every route.
**Root cause:** the platform's Python backend serializes its
SERVER-GENERATED datetimes at microsecond precision with a per-route
Z asymmetry (create responses pass the in-memory aware datetime —
µs + Z; list/update responses serialize the stored row — µs, no Z),
while client-supplied dates (start_time/end_time) round-trip as the
JS-style ms+Z strings the client sent. JS has no µs clock and
`toISOString()` emits ms.
**Fix + rules (session 15):** probe all six surfaces (Task/Note ×
POST/GET/PUT) with the full-body XHR capture + the captured auth
headers, then reproduce the FORMS at the okWire text seam —
`formatWireDates(json, mode)` (`src/lib/serialize.ts`) pads the
3-digit ms token to 6 digits and strips/keeps the Z per mode;
`okWire` = read mode (GET/PATCH tasks + notes), `okWireCreate` =
create mode + default 201 (POST tasks + notes). The regex keys on the
`created_date|updated_date` property tokens so start_time/end_time
(ms+Z, already byte-matching) are never touched; escaped string
content is safe (the `\"` before the name breaks the property-token
match — the same mechanism as the duration float). The digits beyond
ms are `.000` — form parity, storage-precision residual (the `60.0`
class: SQLite and the JS clock store milliseconds). The client keeps
the strings opaque — verify ZERO consumers parse them before shipping

### FS-28: The key ORDER is part of the wire contract (Medium — wire parity)

**Symptom:** the key SETS, the value forms (floats, µs dates), and the
request side all matched — but the raw response TEXT still differed:
the reference emitted Task objects start_time-first and Note objects
title-first, while the clone's serializers emitted id-first (its own
construction order).
**Root cause:** the sessions-12 pins asserted the sorted KEY SET (the
inference-era choice — the order had not been captured); the platform's
Python dict serialization preserves its own field order, and the
full-body probes (session 16) revealed it is CONSISTENT across every
response surface (GET/POST/PUT, both entities).
**Fix + rules (session 16):** reorder the `serializeTask`/
`serializeNote` object literals to the captured order —
`JSON.stringify` preserves string-key insertion order for string keys,
and the okWire text transforms are order-agnostic substitutions, so
the literal order IS the wire order. Consumers read by name
(mapTask/mapNote, the sorted-set pins) — the change is
pin-compatible. Pin BOTH layers: the exact-order unit pins
(`tests/wire-order.test.ts`) and the raw-text e2e pins
(`"tasks":[{"start_time":` …). Never add a key-sorting shim or
re-serialize at the route layer.
**Companion ruling (ET-1):** the reference stores end_time AS
SUBMITTED — no server-side derivation (a POST with start+duration but
no end_time stores null; its PUT is partial — Mark Complete sends only
status). A self-hosted affordance is fine while it is INVISIBLE (the
envelope, status codes, method names); when the same input produces a
different observable output than the reference (Log Activity
membership), it is a parity defect. The dialog always sends end_time
client-computed — removing the derivation changes no app flow.
(grep mapTask/mapNote + the components). **Mutation-harness lesson
(the same session): a harness must take ONE canonical backup per file
BEFORE the first mutation — a per-mutation backup lets a second
mutation on the same file capture the first's mutated state and
restore it; after ANY mutation run, re-run the pin suite to prove the
tree was restored (a `git diff --stat` is NOT enough — the corrupted
first run's source pins still passed because they read the corrupted
text, and only the e2e caught the compiled divergence).**

### FS-29: Pin the layout BANDS, not just the mobile breakpoint (Medium — viewport parity)

**Symptom:** the e2e suite pinned 390×844, 1280×800, 1440×900 and the
default 1280×720 — but nothing pinned the 768/1024 TABLET band, and
NOTHING measured horizontal overflow at ANY band. A future edit that
moves the header's `md:` breakpoint (e.g. to `sm:`) or adds a
responsive width class that overflows would pass every existing spec.
**Fix (session 17):** a `viewport-breakpoints.spec.ts` family — at
768×900 (the EXACT md edge — Tailwind md is min-width:768, so 768 pins
the boundary; one pixel below is the mobile band) and 1024×900: the
desktop nav visible + the mobile trigger hidden; at 390/768/1024/1440:
`documentElement.scrollWidth === clientWidth`. **Visibility via
`getComputedStyle().display === "none"`, not `toBeHidden()`** — display
is the exact Tailwind contract under test (a toBeHidden pass has other
causes — zero size, visibility collapse). **The overflow metric sits
on documentElement, NOT body**: the AppShell root is `overflow-hidden`
(the reference's own design — it clips the fixed blob layer), so the
body never scrolls; the document element's scrollWidth is the honest
metric.
**Mutation-design lesson (M-2, the same session): an overflow mutation
that injects a wide element INSIDE the AppShell root SURVIVES — the
root's overflow-hidden clips it, so documentElement never grows. The
honest mutation is a WIDTH EDIT ON THE ROOT ITSELF (`w-[2000px]` on
the top-level container → body's child overflows → the pins go RED at
every band). This also documents the guard's true contract: the
documentElement metric pins TOP-LEVEL width discipline — inner
overflow is invisible by design (verified live on BOTH apps at every
band).
**Companion ruling (BD-1, the same session): the live field-diff must
compare the BODY class too — the reference renders `<body>` with NO
class; the clone had shipped `className="antialiased"` (a macOS-only
font-smoothing hint the reference does not use). RootLayout body stays
classless (pinned: `document.body.className === ""`). An aria-label the
reference lacks (e.g. the clone's "Open account menu" trigger label) is
a sanctioned a11y affordance — zero visual/behavioral footprint — but
a body-level RENDERING-HINT class is a parity defect.**

### FS-30: The display-flip timeline is a parity surface — and the decompile is a hypothesis, the live measurement is the contract (High — timed-interaction parity)

**Symptom (session 18, FT-1):** the Focus Timer's completed display.
The clone's display snapped to the full duration the moment the timer
completed; the reference leaves **00:00** (the terminal state). The
divergence was INVISIBLE to 16 sessions of static/diff passes because
it only manifests at the completion edge — and the session-3 decompile
comment had misread the reference as an "idle effect that snaps
remaining back," which reproduces the PAUSE semantics but not the
COMPLETION semantics (both paths flip `running` false; only the live
timeline separates them).
**Method (the finding tool): an in-page MutationObserver with
performance.now() timestamps** records every display flip at
sub-second precision with zero round-trip latency — cadence (~1000 ms
interval), the pause snap (+99–166 ms), the resume origin (restart from
full), the edit-while-paused follow (+13 ms), the completion alert
timing (~60.2 s), and the terminal display. Drive BOTH apps with the
same sequence and diff the timelines.
**The ruling line (the W1e state machine): the display is the
`remaining` STATE.** The snap-to-full happens ONLY in the TOGGLE
handler (both directions) and the minutes-change handler; the
completion path never touches it — leaving 00:00 as the honest terminal
display. Implement exactly that; cite the MEASUREMENT in the comment,
not the decompile.
**The suite tool: `page.clock`** — `install()` before `page.goto`,
then `runFor(62_000)` (NOT `fastForward` — fastForward fires each due
timer AT MOST ONCE and pauses the clock; an interval must fire
REPEATEDLY, so use runFor). The 60-second interaction path becomes a
<2 s pin; the blocking `window.alert` is dismissed via the dialog
handler. The one-off-real-time-verification era is over.

### FS-31: Motion parity needs FOUR evidence levels — and the WAAPI metadata is the deterministic pin surface (High — animation parity)

**Symptom (session 19, BL-1):** the framer-motion family passed 16
sessions of static diffs and config review — yet the reference's SECOND
background blob had been rendering 0×0 the whole time (its `w-100
h-100` is a DEAD class in the reference's v3-scale build — no `.w-100`
rule in its 863 KB stylesheet — so the content-less absolute div
collapses and never paints), while the clone's `w-[400px]` rendered a
live 400 px blob. The class strings "looked equivalent"; the rendered
states were opposite.
**Method (the four levels, all required):** (1) the CONFIG decompile
(the reference's G1e/W1e/A_e motion configs, byte-extracted from its
bundle); (2) the RUNTIME engine comparison (the reference's
WAAPI-hybrid `motion` easing table vs the clone's framer-motion —
`circOut` is `cubic-bezier(0.55, 0, 1, 0.45)` in BOTH, not the
mathematical circular ease; a version mismatch here silently changes
every curve); (3) the rAF timeline measurement on BOTH apps (the
curves, delays, and sequencing — including engine quirks like the
panel-body opacity lagging its y-offset, which a config read would
never predict); (4) the **WAAPI animation METADATA** —
`el.getAnimations()[0].effect.getComputedTiming()` returns the
animation's DECLARED duration/delay/easing as deterministic data
(no timing race, no jitter) — the overlay's entrance reads exactly
`350 / 0 / cubic-bezier(0.55, 0, 1, 0.45)` on BOTH apps.
**The dead-class-in-v4 ruling (BL-1):** a class that is DEAD in the
reference's v3 scale can be LIVE in the clone's v4 dynamic-spacing
scale (`w-100` → 400 px). Mirroring a dead variant means mirroring
the RENDERED effect (0×0 — no width/height utilities, let the div
collapse), NEVER copying the class string. The icon_sm ruling
(session 6, P-7), generalized.
**The pin tooling:** the metadata surface makes the overlay's timing
byte-pinnable (`tests/e2e/panel-animation.spec.ts`); the initial-state
+ delay-hold pins use an in-page rAF-polled `waitForFunction` that
CAPTURES the state at the detection frame (a locator.waitFor +
evaluate pair lands ~0.5 s late — past the whole 0.2 s delay window);
the exit-delay pin measures the differential on the PAGE's clock
(the overlay's first change marks the handler time; the form-view's
first drop minus that is the delay — zero CDP latency); and the
configs themselves are source-pinned (`tests/panel-motion.test.ts`,
the ai-prompt pattern) so a numeric "cleanup" fails before the e2e
family is the last line of defense.

### FS-32: Tailwind MINOR versions drift the DEFAULT theme — pin every used token, and enforce used ⊆ pinned (High — theme parity)

**Symptom (session 20, F-1/C-1):** the clone passed 19 sessions of
byte-identical geometry pins while its TYPOGRAPHY had never matched —
tailwindcss@4.3.3 (locked since session 0) ships a default
`--font-sans` that differs from the reference's v4.0-era build (the
v3-compat `-apple-system, BlinkMacSystemFont, ...` list vs the
reference's `ui-sans-serif, system-ui, ...`), resolving a DIFFERENT
physical font on fontconfig systems (~15% glyph-width drift, measured).
And 13 palette tokens the app uses were never @theme-pinned — v4.3.3's
oklch conversions render up to 34 G-channel units off the reference's
hexes (its stylesheet emits the v3 values, e.g. `.text-red-700 {
color: rgb(185 28 28) }` vs the clone's rgb(191,0,15)).
**Why 19 sessions missed it:** block-geometry pins are font-metric-
blind (container/padding-sized boxes don't move with glyph widths),
class-string pins are value-blind (the class names don't change when
the TOKEN values do), and the session-0 pinning enumerated the scales
it knew about — no invariant asserted used ⊆ pinned, so 13 tokens
accumulated unpinned across new components.
**Method:** the computed values ARE the parity surface —
`getComputedStyle(el).fontFamily` (a serialized string — deterministic,
no raster) and `.color`/`.backgroundColor` (the rgb(...) serialization
pins the AUTHORED form too: a hex pin serializes rgb(...) like the
reference; an oklch default serializes lab(...) and fails). Dev's
oklch and prod's converted hex render IDENTICALLY (both measured the
same computed lab) — the production standalone stays the pin surface.
**The reference's palette is not byte-v3 everywhere:** its pink-700 is
`#be185d` (rgb(190 24 93), measured live AND in its stylesheet's own
rule) — ONE B-unit off the v3 hex `#be185c`. Every pin is the
REFERENCE's measured value, never an assumed v3 lookup.
**The fix + the guard:** pin `--font-sans` (and `--font-mono` as a
guard — identical in both eras, used by the timer display) + the 13
color tokens in `@theme inline`; add the completeness invariant as a
unit pin (`tests/tailwind-theme-pins.test.ts` scans src/ for
color-class tokens and asserts each is pinned) so a future component
using an unpinned token fails at authoring time, BEFORE the next
minor bump drifts it. e2e pins: `tests/e2e/theme-palette.spec.ts`
(4 tests — the font stack, the mood ramp, the chips, the planning
badges). Mutations M-1..M-4 all RED surgical.

### FS-33: The bundle's MISSING handler is the contract — and a pin on divergent behavior is worse than no pin (High — interaction parity)

**Symptom (session 21, S21-F1):** the clone's Planning "Add Task"
button opened a full create-task dialog for 19 sessions, pinned green
by its own e2e spec — while the reference's button does NOTHING. Three
evidence levels: the decompile (the reference's `eSe` Planning
component has NO dialog state; the button's props carry NO onClick;
its TaskDialog `Xne` mounts ONLY inside `lre`, the Dashboard
calendar), the live trusted click on the reference (no dialog, no DOM
change, no navigation), and the live trusted click on the clone (the
full dialog). Root cause: session-2's remediation plan asserted "the
reference opens it from the Add Task button" — an INFERENCE never
live-verified, and the e2e spec then pinned the DIVERGENCE.
**Why it matters more than a visual miss:** a pin on divergent
behavior makes the divergence regression-proof — every future session
re-verified the bug. When a live probe contradicts an old spec, the
spec is the bug (the ET-1/FT-1 pattern, applied to a handler).
**Fix + rules (session 21):** mirror the reference exactly — remove
the dialog mount + handler; the dialog stays ONLY where the reference
mounts it (the Dashboard calendar). Pin the no-op (click →
`[role=dialog]` count 0, no POST fires, the page survives) and
RELOCATE any request-contract pins that lived at the divergent entry
point to the reference's true entry path (the W-3/W-4 dialog body pin
moved from planning.spec to dashboard.spec's calendar-cell flow).
**Generalized:** when auditing a handler-shaped contract, the
decompile's ABSENT prop IS evidence (no onClick = no handler — React
does not delegate arbitrary buttons), and the probe must be a trusted
CLICK on the live reference, not an inference from the dialog's
existence elsewhere in the bundle. Harness note: main-thread
framer loops (the blobs) cannot be phase-aligned via getAnimations
and reduced-motion does NOT freeze them on either app — for
matched-data raster diffs hide the layer identically on both apps
and phase-align the WAAPI indicators via `currentTime % duration`
windows.

### FS-34: Class parity is not geometry parity — the engine is part of the contract (Critical — Tailwind v4 parity)

**Symptom (session 22, S22-F1/S22-F2):** the clone's login fields and
TaskDialog fields rendered 4px label→input gaps where the reference
measures 10/12px (every field pair, live-measured on both apps), and
the sign-up/forgot view headings rose into the back-link's band —
while every class string was BYTE-IDENTICAL to the reference's
captured DOM. Two engine-level failure modes of the v4 space-y
rewrite: (a) **the inline-label nullification** — v4's
`:where(.space-y-N > :not(:last-child)) { margin-block-end }` lands
the inter-child margin on the `<label>`, and CSS IGNORES vertical
margins on inline boxes, so the gap collapsed to the line-box
leading; v3 emitted margin-top on the FOLLOWING block sibling
(effective). (b) **the negative-margin specificity flip** — the
reference's own `-mb-2` back-link beat v4's `:where()`
zero-specificity margin (v3's margin-top on the FOLLOWING h2 had
margin-COLLAPSED with the -mb-2: 16−8 / 24−8 = 8/16px effective; v4
renders −8 and the heading overlaps the link). A third variant
surfaced mid-fix: Radix's Select appends a visually-hidden native
`<select>` AFTER the trigger, making the trigger `:not(:last-child)`
— v4's margin-block-end inflated each Select field 8px.
**Why class diffs missed it:** the class-tree diffs compare STRINGS;
the rendered layout depends on the engine's selector semantics.
19 sessions of pins never measured the login/dialog field geometry.
**Fix + rules (session 22):** v3-compat rules in globals.css scoped
to the broken patterns (`.space-y-1\.5 > label + *`,
`.space-y-2 > label + *` { margin-block-start },
`.space-y-2 > label + *:not(:last-child)` { margin-block-end: 0 },
`.space-y-4 > .-mb-2 + *` + the `sm:space-y-6` media variant) — the
DOM stays byte-identical (the pinned-cursor/-shadow-sm precedent),
and the margin-SIDE restore reproduces v3's margin-collapsing
arithmetic exactly. Pin with COMPUTED GEOMETRY (label rect bottom →
next-sibling rect top), not class strings — and settle animations
before measuring (getBoundingClientRect includes transforms).
**Generalized:** when the reference and the clone run different
utility-engine generations, every layout surface needs at least one
computed-geometry pin; a class-string match proves only that the
AUTHORING matches, not the rendering. Matched-data raster diffs on
the un-pinned surfaces (the login views) are the cheapest catch-all.

### FS-23: A captured wire beats an inferred wire (High — parity process)

**Symptom:** session 8 named the response fields from repo documentation
("created_at/updated_at — the repo's documented names") and got two of
them WRONG, plus three fields missing (`is_sample`/`created_by`/
`created_by_id`), without any test noticing — every consumer was on the
same side of the seam, so the wrong names round-tripped green for four
sessions. The clone's TaskDialog also derived `end_time` server-side and
nulled empty descriptions while the reference's dialog submits a
client-computed end_time and "" verbatim.
**Root cause:** decompile tells you what the code SENDS; only the wire
tells you what the server RETURNS. When a contract's field names ARE
the deliverable (an API cloning another API), inference from either side
can silently diverge — and unit tests written against the same inference
lock the error in.
**Fix + rules (session 12):** patch the XHR layer inside the logged-in
reference page (`XMLHttpRequest.prototype.open/send` capture) and read
the ACTUAL JSON — then pin the captured shape with exact key-set
assertions (Task 14 / Note 9), field-by-field, and take mutation
evidence. Before renaming any wire field, PROVE zero consumers on both
sides (search both bundles AND both codebases) — the proof is what
turns a scary rename into a mechanical one. The zero-consumer rename is
the cheapest parity win there is; the wire capture is the cheapest
evidence upgrade. Request contracts too: the reference's dialog payload
(7 fields incl. end_time, description verbatim) is now pinned by a
page.route interception spec, and the API accepts an optional
caller-supplied end_time with start+duration derivation as the fallback
for other callers.

## 10. Debugging Guide

| Symptom | Cause | Fix / where to look |
|---|---|---|
| Styles flat/unstyled in prod | `@theme` var() chains dropped or Trap 1/2/5 regressions | Read `docs/Tailwind-V4-Validation-Report.md` FIRST; check `globals.css` against §4 |
| Dev page unhydrated, native form GETs | FS-6 dev-origin block | `next.config.ts` `allowedDevOrigins` |
| Build fails prerendering `/login` | FS-5 | Suspense wrapper in `src/app/login/page.tsx` |
| "attempt to write a readonly database" | FS-8 — someone deleted the db file under the server | Restart the server; keep globalSetup header comment intact |
| e2e "day statistics" flaky | FS-7 chip interception / pre-hydration click | Header-block click + hydration gate (already in spec) |
| Login rejected in tests | Rate limiter (10/IP/60s) after repeated runs | The setup project signs in ONCE and shares storageState; per-test logins are forbidden |
| `db:push`/`db:seed` target a file OUTSIDE the repo | FS-19 — an ambient (parent `.env` or shell-exported) `DATABASE_URL` | db-path v3 makes the repo's own `.env` authoritative; verify with `bun -e 'import("./src/lib/db-path").then(m=>console.log(m.resolveProcessDatabaseUrl()))'` |
| Tasks created in e2e pollute totals | FS-9 | Spec cleanup blocks (already in place) |
| Relative times read "about 3 hours ago" | FS-21 territory — the non-strict formatter | The reference uses `formatDistanceToNowStrict` (plain xHours/xDays, Math.round); swap the import and call site in QuickActions.tsx |
| A DOM attribute the reference lacks appears (data-slot, maxlength, …) | FS-20 — class-tree diffs cannot see attributes | Attribute-inventory diff on both DOMs; remove generator leftovers; pin with an attribute-count locator |
| A list-capacity behavior regresses in CI-passing code (slice/sort/order) | FS-22 — member-level seeds never exercise the boundary | Pin the SATURATED state (7 items for a top-5) with panel-scoped negations; add mutation evidence |
| A relative-word pin flakes near a unit boundary ("24 hours" ↔ "1 day") | The strict formatter's band edge sits at exactly 24 h | Move the seeded distance hours away from any boundary (+40 h, −6 h, −30 h are safe) |
| AI cards show the default quote/summary | SDK 429/error — by design | No action; `dev.log`/`server.log` shows `[ai] … using default` |
| Menu won't open via `page.evaluate(el.click())` | Radix needs trusted events | Playwright `locator.click()` |
| Text assertion matches the form, not the list (flaky under load) | FS-13 — getByText matched the textarea's default-value text node | Scope by role: `getByRole("paragraph").filter({ hasText: … })` |
| Heading locator resolves to 2 elements (strict mode) | FS-14 corollary — role queries SUBSTRING-match; the Next Up h4 task title matches "Skills Map" | `exact: true` on heading lookups near data-driven titles |
| A passing spec fails after another spec failed earlier | e2e residue cascades CROSS-SPEC — leftover tasks shift the planning top-3 chips and the Next Up selection | Wipe the whole `E2E *` family at spec start (converging cleanup, FS-9 extended) |
| agent-browser can't open the clone's Radix menu (but the reference's opens) | React 19 + Radix require trusted pointer events on the dev build; the reference's menu is not Radix | The e2e spec is the pin; screenshots via `scripts/capture-screenshots.mjs` |
| `getByRole("alert")` resolves to 2 elements (strict mode) | Next's route announcer `#__next-route-announcer__` carries role=alert (empty) | Scope with `:not(#__next-route-announcer__)` (FS-15 corollary) |
| `getByLabel("Password")` resolves to 2 elements | Label queries substring-match "Confirm Password" on the sign-up view | `{ exact: true }` on label lookups (FS-15 corollary) |
| A spec passes twice, then fails at a different hour of the day | FS-16 — a page-wide text/class locator whose match set depends on the wall clock (the calendar grid renders the task 07:00–22:00) | Scope to the component (the StatusCard's heading filter); assert content, not page counts |
| An `svg.lucide-chevron-down` count assertion fails on Planning | The HEADER's desktop avatar trigger also ships a chevron-down | Scope icon locators to `main` (FS-16 corollary) |
| A button/label "feels right" but the decompile says otherwise | FS-11 at the string level — "Add Task"/"Save Changes" were session-0 inferences; the reference says "Create Task"/"Update Task" | The decompile wins, including over existing e2e pins — rewrite the spec |
| The Planning chips/list order differs from the reference (or "+N more" hides a different task) | FS-17 — the API response ORDER is parity; the reference returns createdAt desc | `GET /api/tasks` must `orderBy: { createdAt: "desc" }`; the store's createTask PREPENDS |
| The class-tree diff is 100% green but the apps look different | FS-17 — tag+class diffs are BLIND to text content and DOM order | Re-diff with MATCHED POPULATED data and compare text/order too |
| A negated assertion fails with "element(s) not found" | The component CHANGED the heading the locator filters by (e.g. "Next Up" → "All caught up!") | Accept BOTH headings in the filter; verify the app first (debug boot: PATCH + re-render) |
| recharts upgrade makes the e2e DOM-shape pin fail | The reference's pie is the recharts 2.x DOM (no zIndex layers, no shape wrappers, tooltip after svg) | Keep recharts at 2.15.x; re-diff the reference's pie DOM before any major bump |
| The classes match but nothing animates (instant open/close) | FS-18 — the utility library is installed but never imported; the classes are dead strings | `@import "tw-animate-css"` in globals.css; grep the BUILT stylesheet for the selector; pin computed `animation-name` |
| A menu/dialog measurement flakes after adding animations | `boundingBox()` includes transforms — mid-animation reads the zoomed/sliding box | Wait for `getAnimations()` to finish before measuring (mobile-navigation.spec.ts's pattern) |
| An icon renders TWO lucide classes (e.g. `lucide-trash2 lucide-trash-2`) | lucide-react 0.525+ dual-emits for renamed icons; the reference's 0.475.0 emits ONE | Keep lucide at 0.475.x; the e2e pins the single-class contract |
| An API consumer reads `task.start_time` off a POST/GET response and gets undefined | The response shipped raw camelCase Prisma (startTime) while requests + docs speak snake_case | All task/note routes go through `serializeTask`/`serializeNote` (src/lib/serialize.ts) |
| The edit-mode dialog diff shows gaps the create-mode diff never did | The Delete button + prefilled values are populated-only surfaces | Diff BOTH dialog modes (the create-mode footer + the edit-mode full tree) |

Debugging order: reproduce with the exact command → read `dev.log` /
`server.log` → isolate with a minimal repro → fix the root cause → add
a pinning test if the class of bug can recur.

## 11. Pre-Ship Checklist

```bash
bun run lint          # ESLint 9 — must be silent
bun run typecheck     # tsc --noEmit — must be silent (build ignores errors!)
bun run test          # 165/165
bun run build         # green; .next/standalone assembled
bun run test:e2e      # 90/90 on the production standalone :3100
scripts/smoke-test.sh # 30/30 curl checks (auth, CRUD, AI envelopes, guarded pages)
```

Verification categories:

- **Hygiene:** `git ls-files | grep -E '\.env$|\.db$'` → empty (only
  `.env.example` is tracked).
- **Parity spot-checks:** mobile menu geometry (e2e pins it), category
  gradient hexes (§19), route casing.
- **DB state after e2e:** exactly the 9 seed tasks, 0 `E2E*` residue.
- **Docs alignment:** every env var in `.env.example` appears in §2's
  table; test counts in AGENTS.md/README match runner output.

## 12. Lessons Learnt & How to Avoid Them

1. **Measure, don't remember** (session 1). The mobile-menu geometry
   was re-measured against the live reference before declaring parity —
   identical, but only because it was CHECKED. Any "looks the same"
   claim without a bounding-box measurement or a pinned spec is
   worthless.
2. **The test is the pin** (session 0). Byte-level geometry facts
   (right 374 / top 54 / w 192) live in `mobile-navigation.spec.ts`.
   Update them DELIBERATELY, only with a fresh reference measurement.
3. **Resetting state by deleting files breaks live holders** (FS-8).
   SQLite file handles, log tails, watch processes — always ask "who
   holds this resource right now?" before `rm`.
4. **Cleanup must converge** (FS-9). `.find()`-then-delete on a
   possibly-dirty set leaves residue forever; `filter()` + delete-all
   converges to zero.
5. **Env precedence: shell export > parent .env > repo .env** (§3
   traps). "The seed skipped" + "0-byte db" is ALWAYS an env-precedence
   symptom, not a seed bug.
6. **A green gate once proves nothing about determinism** (session 1).
   The e2e flake passed 3 times before failing; three consecutive full
   runs + db-state convergence is the standard of evidence.
7. **The LLM quota is a fact of life** (session 0/1). The reference
   itself 429s; deterministic fallbacks are the product feature, not a
   workaround — never "fix" them into error states.

## 13. Pitfalls to Avoid

- **Don't rename routes** (`/Dashboard` stays capitalized) or collapse
  pages into an SPA — the reference paths are the contract.
- **Don't import `z-ai-web-dev-sdk` in client components** — it is
  server-only (crashes builds / leaks keys).
- **Don't add a bottom tab bar** for mobile "improvement" — the
  reference's mobile nav is the header dropdown, full stop.
- **Don't write Tailwind tokens as bare HSL triplets, var() chains in
  `@theme`, or unpinned palette/shadow values** (Traps 1/2/5).
- **Don't combine `space-y-*` with child `mt-*/mb-*`** (Trap 4).
- **Don't use `bg-gradient-to-r` utilities for Quick Action tiles** —
  inline-style hex stops are the reference form (Trap 3).
- **Don't duplicate enum constants outside `src/lib/domain.ts`**.
- **Don't convert snake_case in components** — `mapTask`/`mapNote` only.
- **Don't reset state in effect bodies** (FS-4) — derive or remount.
- **Don't do per-test real logins in e2e** — the rate limiter WILL trip
  mid-suite; the setup project + storageState is the only sanctioned
  pattern.
- **Don't weaken lint/type gates to pass a build** — `tsc --noEmit` is
  the gate (the build's `ignoreBuildErrors` is scaffold legacy).
- **Don't hand-roll dialogs/menus** — Radix gives focus trap + Escape +
  aria for free.

## 14. Best Practices

- **Server-side validation on every write** — the `isPriority/
  isCategory/isTaskStatus` guards in the API routes are the boundary;
  client enums are convenience only.
- **Envelope discipline** — `ok()/fail()` from `src/lib/api.ts`; never
  throw across the route boundary; never return raw Prisma errors.
- **Idempotent seed** — upserts + `is_sample` guards; safe to re-run.
- **Selector-based store subscription** — `useFlowStore((s) => s.tasks)`
  scopes re-renders.
- **Explicit empty states everywhere** — "All caught up!", "No tasks",
  "Nothing waiting to be scheduled."; every async region renders
  loading/empty/error.
- **Console context at the boundary** — errors caught in components get
  `console.error` with context; silent `catch(() => null)` is a defect.
- **Comments that pin contracts** — the header comments in
  `db-path.ts`, `global-setup.ts`, and `playwright.config.ts` exist to
  stop EXACT regressions; update them when the contract changes.
- **Tests as documentation** — each new seam got a test FIRST
  (env-example, site helper): the red run is the spec, the green run is
  the proof.

## 15. Coding Patterns

### Pattern: API route handler (the envelope contract)

Location: `src/app/api/**/route.ts` (11 handlers).
Purpose: every endpoint returns `{ ok, data } | { ok, error }`, guards
auth + enums server-side, and never throws.

```typescript
// src/app/api/tasks/route.ts (shape)
export async function POST(req: Request) {
  const auth = await requireUser();                    // 1. auth guard
  if ("response" in auth) return auth.response;        //    401 envelope
  const body = await readJson(req);                    // 2. safe parse
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return fail("VALIDATION", "Task title is required.");
  const priority = isPriority(body.priority) ? body.priority : "medium";
  // ^ enum guard with reference-default coercion (never rejects)
  const task = await db.task.create({ data: { /* … */ } });
  return ok({ task });                                 // 3. envelope out
}
```

### Pattern: SQLite URL resolution (CWD-independence)

Location: `src/lib/db-path.ts` (pure, 15 unit tests).
Purpose: a relative `file:` URL resolves against the repo that owns
`prisma/schema.prisma` — for the Prisma CLI, `next dev`, `next build`,
AND the standalone server. Anchor order: standalone detector → module's
own repo root → `process.cwd()` fallback. Absolute URLs and non-SQLite
URLs pass through untouched.

### Pattern: LLM call with deterministic fallback

Location: `src/lib/ai.ts`.
Purpose: the LLM never hard-fails — the catch renders canned content
identical to the reference's fallback.

```typescript
try {
  const res = await zai.chat.completions.create({ /* prompt + JSON schema */ });
  return JSON.parse(res.choices[0].message.content);
} catch (err) {
  console.error("[ai] daily focus generation failed, using default:", err?.message);
  return { quote: "…", author: "Paul J. Meyer", affirmation: "…" };
}
```

### Pattern: Form reset via remount (not reset-effects)

Location: `src/components/planning/TaskDialog.tsx`.
Purpose: `react-hooks/set-state-in-effect` is an ERROR here; state
resets by remounting, not by resetting in an effect.
`<TaskDialog key={editingTask?.id ?? "new-task"} … />` — the key change
mounts a fresh body with fresh form state; the dialog body component is
mounted only while open.

### Pattern: e2e spec cleanup that converges

Location: `tests/e2e/planning.spec.ts`, `tests/e2e/dashboard.spec.ts`.
Purpose: specs delete what they create so the shared db returns to the
seed state — without ever resetting the file (FS-8).

```typescript
const list = await (await page.request.get("/api/tasks")).json();
const residue = (list?.data?.tasks ?? []).filter(
  (t: { title: string }) => t.title === "E2E planned task",
);
for (const t of residue) await page.request.delete(`/api/tasks/${t.id}`);
// page.request shares the browser context's session cookie — no re-login.
```

### Pattern: hydration gate before clicking

Purpose: a pre-hydration click is a silent no-op (no React handler
attached yet). Wait for a data-dependent element first — it only
renders once the store has fetched:

```typescript
await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
// NOW interaction is safe:
await mondayCard.locator("div.text-center").first().click();
```

## 16. Coding Anti-Patterns

| Don't | Do instead | Why |
|---|---|---|
| `fetch("/api/…")` inside a component | go through `useFlowStore` actions | one fetcher, one envelope unwrap, one error surface |
| `any` / untyped `res.json()` | type the envelope, guard fields | tsc strict is the gate |
| `el.click()` in `page.evaluate` for Radix menus | Playwright `locator.click()` | Radix requires trusted pointer events |
| `.find()`-then-delete in cleanup | `filter()` + delete-all | convergence (FS-9) |
| `useState(() => localStorage…)` | SSR-safe read in effect / store init | hydration mismatch |
| center-click on day cards in tests | header-block click | chip interception (FS-7) |
| `db.task.findMany()` in a client component | route handler → store | server-only Prisma |
| per-test logins | setup project + storageState | rate limiter (10/IP/60s) |

## 17. Responsive Breakpoint Reference

Tailwind default scale, no custom config (CSS-first v4). Usage census
(`rg -o "\b(sm|md|lg|xl):"` over `src/`): `sm:` 7 · `md:` 10 · `lg:` 8 ·
`xl:` 1.

| Breakpoint | Where it matters |
|---|---|
| `sm` (640px) | header spacing, login card padding |
| `md` (768px) | **desktop/mobile split**: avatar button visible (`md:flex`) vs user-icon trigger (`md:hidden`); Planning week grid `md:grid-cols-7` |
| `lg` (1024px) | Planning two-column accordions (`lg:grid-cols-2`) |
| `xl` (1280px) | dashboard max-width (`max-w-7xl`) |

**Mobile testing:** the parity viewport is **390×844** (iPhone-class) —
that is what the pinned menu-geometry specs and the reference
measurements use. Always screenshot mobile at 390×844 (see
`docs/screenshots/07-09-*.png`).

## 18. Z-Index Layer Map

Census (`rg -o "z-…"`): `z-50` ×5, `z-20` ×2, `z-10` ×3. Radix portals
render at document end with their own stacking inside `z-50` contexts.

| Layer | Element | Location |
|---|---|---|
| `z-50` | sticky header | `src/components/layout/Header.tsx` |
| `z-50` | Radix Dialog/Menu portals (dropdown, select, dialog) | `src/components/ui/*` |
| `z-20` | quick-action swap panels | `src/components/dashboard/QuickActions.tsx` |
| `z-10` | background blobs, decorative absolutes | `src/components/layout/BackgroundBlobs.tsx` |

Conflict rule: never raise a component above `z-50` — the header and
portals own the top layer; anything needing more is a portal itself.

## 19. Color Reference (Complete)

Semantic tokens (`src/app/globals.css`, `:root` — full hsl values):

| Token | Value |
|---|---|
| `--background` / `--card` / `--popover` | `hsl(0 0% 100%)` |
| `--foreground` / `--card-foreground` / `--popover-foreground` | `hsl(222.2 84% 4.9%)` |
| `--primary` | `hsl(222.2 47.4% 11.2%)` |
| `--secondary` / `--muted` / `--accent` | `hsl(210 40% 96.1%)` |
| `--muted-foreground` | `hsl(215.4 16.3% 46.9%)` |
| `--destructive` | `hsl(0 84.2% 60.2%)` |
| `--border` / `--input` | `hsl(214.3 31.8% 91.4%)` |
| `--ring` | `hsl(222.2 84% 4.9%)` |
| `--radius` | `0.625rem` |

Category gradients (`CATEGORY_GRADIENTS`, calendar task blocks):
work `blue-400→500` · personal `green-400→500` · health `red-400→500` ·
learning `purple-400→500` · creative `pink-400→500` · social
`yellow-400→500` · planning `indigo-400→500`.

Skills Map pie hexes (`SKILL_COLORS`): work `#3b82f6` · personal
`#22c55e` · health `#ef4444` · learning `#a855f7` · creative `#ec4899` ·
social `#eab308` · planning `#6366f1`.

Quick Action tile gradient stops (inline styles — Trap 3):
`#0ea5e9→#2563eb` · `#10b981→#14b8a6` · `#8b5cf6→#6366f1` ·
`#f59e0b→#f97316`.

**Forbidden:** any palette value outside the pinned v3 hexes; oklch
defaults; bare-HSL triplets. The reference build is the ground truth —
hex drift IS a bug (pinned by `tests/domain.test.ts` + e2e gradient
assertions).

## 20. TypeScript Interface Reference

Domain shapes (wire format is snake_case — see §6; TS models camelCase):

```typescript
// src/lib/domain.ts — enums as literal unions
export type Priority = "low" | "medium" | "high" | "urgent";
export type Category = "work" | "personal" | "health" | "learning"
  | "creative" | "social" | "planning";
export type TaskStatus = "todo" | "in_progress" | "completed";
// + constants: CATEGORY_GRADIENTS, CATEGORY_BADGES, PRIORITY_BADGES,
//   PRIORITY_TEXT, SKILL_COLORS, QUICK_ACTIONS, CALENDAR_* geometry

// src/lib/api.ts — the envelope
export type ApiError = { ok: false; error: { code: string; message: string } };
export type ApiOk<T> = { ok: true; data: T };
export type ApiResult<T> = ApiOk<T> | ApiError;
export function ok<T>(data: T, status?: number): NextResponse<ApiOk<T>>;
export function fail(code: string, message: string, status?: number): NextResponse<ApiError>;

// src/lib/auth.ts — session primitives
hashPassword(password: string): string;                 // scrypt
verifyPassword(password: string, hash: string): boolean;
createSessionToken(userId: string): string;             // userId.expiry.mac
verifySessionToken(token: string): { userId: string } | null;
export async function getSessionUser(): Promise<SessionUser | null>;

// src/lib/site.ts — canonical origin
export const SITE_URL_DEFAULT = "http://localhost:3000";
export function siteUrl(): string;                      // NEXT_PUBLIC_SITE_URL, trimmed
export function absoluteUrl(path: string): string;     // safe join

// src/lib/db-path.ts — SQLite URL resolution
export function resolveDatabaseUrl(envUrl: string | undefined, anchors: string[]): string;
export function standaloneRepoRoot(dir: string): string | null;
export function candidateRoots(): string[];
export function resolveProcessDatabaseUrl(): string;

// src/store/useFlowStore.ts — store slice (mapTask/mapNote are the
// ONLY snake↔camel seams)
type Task = { id: string; title: string; description: string | null;
  priority: Priority; category: Category; status: TaskStatus;
  start_time: string | null; duration_minutes: number | null;
  end_time: string | null; created_at: string; updated_at: string };
```

---

## Appendix A: ADRs

The full ADR set with alternatives-rejected lives in
`Project_Architecture_Document.md` (6 ADRs). Summary:

| ADR | Decision | Rationale |
|---|---|---|
| ADR-1 | Real routes, no rewrites | `/Dashboard` etc. are the reference's exact paths; SPA-collapse was the ORBITAL pattern — rejected |
| ADR-2 | Client islands + Zustand as sole fetcher | mirrors the reference SPA; RSC data-fetching would diverge from its loading behavior |
| ADR-3 | Cookie sessions (scrypt + HMAC) | self-hosted replacement for base44 auth; no external IdP dependency |
| ADR-4 | SQLite + Prisma with schema-anchored `file:` resolution | zero-config parity with the base44 entity layer; CWD-independent |
| ADR-5 | Server-side z-ai-web-dev-sdk + deterministic fallbacks | reference's InvokeLLM equivalent; quota-proof |
| ADR-6 | Playwright against the production standalone build | e2e must catch build-output issues (standalone path resolution, static copying) |

## Appendix B: Verification Ledger

Session 4 final gate (2026-10-04, after the sidebar-card + layout-chrome
parity remediation):

| Check | Result |
|---|---|
| `bun run lint` | clean |
| `bun run typecheck` | clean |
| `bun run test` (Vitest) | **102/102** — auth ×8, db-path ×32 (v3: the repo-.env authority rule, the e2e-isolation + provider overrides), domain ×16 (incl. skills colors + name transform), ai-defaults ×3, env-example ×4, site ×4, next-config ×3, rate-limit ×6, wire-format ×7, db-cli-scripts ×5, **ai-prompt ×7 (session 13: the captured InvokeLLM bodies byte-for-byte + the mocked-SDK wiring pins + the route order source contract)**, **sample-week ×6 (session 13, E-1: the stale-week re-anchor decision + the seed source contract)** |
| `bun run build` | green; 19 routes incl. `/robots.txt`, `/sitemap.xml`; **type-checked by the build itself** (`ignoreBuildErrors` removed, session 3) |
| `bun run test:e2e` (Playwright) | **67/67** × 2 consecutive full runs (+5 session-8 pins — the enter animation, the classic DialogTitle/SelectTrigger classes, the single lucide class, the snake_case response shape; +1 session-9 pin — the plain-DIV day cards; +1 session-12 interception pin — the dialog's end_time + verbatim description) |
| `scripts/smoke-test.sh` | 30/30 (incl. authed page renders + unauth guard redirects) |
| Reference parity (mobile menu) | re-measured live on BOTH apps every session; session 8: 182/54/192×164 at 390×844, trigger 338/14/36×36 — identical, now ANIMATED like the reference's |
| Reference parity (sidebar cards) | bundle decompile (ure/Y1e/fre/g0e) + live DOM on both apps: the Next Up state machine (skeleton, priority badge, format-string-bug time row, 75% progress + Ready, FUNCTIONAL Mark Complete round-tripped on both, decorative ArrowRight), Mark Twain fallback, Brain + Sparkles header, Award indicator, m0e hexes, percentage-only legend — all matched |
| Reference parity (layout chrome) | full-bleed `p-4 md:p-6 lg:p-8` (1440px on both), day rows `space-y-1.5` (6px gap), default-cursor cells, minute-stacked blocks, dialog delete confirm, scrollbar cascade values |
| Reference parity (Quick Actions) | session 3: bundle decompile (G1e/z1e/W1e/H1e/K1e) + live DOM on both apps — all matched; completion alert verified by a one-off run |
| Reference parity (Planning) | session 2: bundle decompile + live DOM comparison on both apps: null-init selection, selected-day highlight, static stats placeholder, decorative Filter, chip bubbling, display-only items, no Unscheduled — all matched |
| Reference parity (gradients) | Quick Action tiles byte-identical; canvas endpoints identical, oklab midtone delta measured 0–3 RGB units (accepted) |
| Rate limiter hygiene | throttled expired-bucket sweep unit-pinned (5,000-key spray bounded; live keys preserved) |

## Appendix C: Session History

- **Session 22 (2026-10-06, this skill revision):** the space-y
  engine-parity pass (the session-21 §5 suggested targets executed:
  the /Profile + /Settings raster close — 0.009% both — and the
  login-page populated-state raster diff, which SURFACED the drift).
  **S22-F1 (fixed)**: Tailwind v4's space-y rewrite lands the
  inter-child margin on the INLINE `<label>` of the classic-shadcn
  field pattern, where CSS ignores vertical margins — every
  label→field gap collapsed (login 10px→4px on six fields, TaskDialog
  12px→4px on six) while the class strings stayed byte-identical to
  the reference's captured DOM. **S22-F2 (fixed)**: the
  BackToSignIn's own `-mb-2` (the reference's class) beat v4's
  `:where()` zero-specificity margin — the sign-up/forgot headings
  rose 16/24px into the back-link's band (v3's margin-top on the
  FOLLOWING h2 margin-collapsed with the −mb-2 → 8/16px effective).
  A third variant fixed with them: Radix's hidden native `<select>`
  makes the SelectTrigger `:not(:last-child)` → v4's margin-block-end
  inflated each dialog Select field 8px. The fix: four v3-compat
  rules in globals.css (the DOM untouched); the pins: 3 auth.spec +
  1 dashboard.spec computed-geometry specs + 6 source pins
  (tests/space-y-compat.test.ts). Mutations M-1..M-5 all RED
  surgical. T-4 live: the login cards now byte-match the reference
  (y/h/gaps on all three views); the dialog internals byte-match
  (526 = 526, every element y/h); the login-error raster 2.948% →
  0.098%. Non-findings: the mobile menu byte-identical live on both
  apps (the standing priority — no v4 regression); Planning 0.057%;
  the reset-sent alert text = the documented session-5 ruling. Unit
  159 → 165, e2e 90 → 94 (×2 consecutive). See
  `docs/session_22-review.md` + `docs/remediation-plan-session22.md`.
- **Session 21 (2026-10-05, this skill revision):** the Planning
  handler-parity pass (the session-20 §5 suggested targets (a)+(b)
  executed: the matched-data raster diff and the Planning multi-week
  depth). **S21-F1 (fixed)**: the clone's Planning "Add Task" button
  opened a create-task dialog; the reference's is a NO-OP — no dialog
  state in `eSe`, no onClick on the button (the dialog `Xne` mounts
  only inside `lre`, the Dashboard calendar), live trusted-click
  verified on both apps. The session-2 "the reference opens it from
  the Add Task button" inference retired; the divergent-behavior e2e
  spec replaced by a no-op pin; the dialog's W-3/W-4 request-contract
  pin RELOCATED to dashboard.spec's calendar-cell flow (the
  reference's true entry path). Non-findings closed: the multi-week
  navigation byte-identical across the month boundary; the raster
  diff at matched data (/Planning 0.057%; /Dashboard 0.737% ALL
  inside the Daily Focus LLM region — the reference rendered a live
  InvokeLLM quote, the clone its Mark Twain fallback after a 429);
  the mobile menu byte-identical live on both apps (the standing
  priority — no Tailwind v4 regression). Mutations M-1..M-3 all RED
  surgical (the fix revert, the end_time drop, the description-null
  swap). Unit 159 (unchanged), e2e 89 → 90 (×2 consecutive). See
  `docs/session_21-review.md` + `docs/remediation-plan-session21.md`.
- **Session 20 (2026-10-05, this skill revision):** the Tailwind
  default-theme drift pass (the session-19 §5 suggested targets (a)+(b)
  executed: the Settings/Profile deep-diff — structure byte-identical —
  and the AI Summary card's populated-state diff — structure
  byte-identical). **F-1 (fixed)**: the clone's default font stack was
  v4.3.3's v3-compat `-apple-system` list; the reference renders the
  v4.0-era `ui-sans-serif, system-ui` stack — ~15% glyph-width drift on
  fontconfig systems, invisible to 19 sessions of block-geometry pins.
  **C-1 (fixed)**: 11 of 13 used-but-unpinned palette tokens rendered
  v4.3.3's oklch conversions — up to 34 G-channel units off (the AI
  mood text, the login alert, the planning badges, the weekly bar);
  pink-700 pinned to the reference's OWN `#be185d` (one unit off the
  v3 hex — the rendered contract, not an assumed lookup). **PIN-1**:
  the used ⊆ pinned completeness invariant as a unit pin — the guard
  the 13-token gap proved missing. Pinned:
  `tests/e2e/theme-palette.spec.ts` (4 pins — the computed font stack,
  the mood ramp, the chips, the planning badges) +
  `tests/tailwind-theme-pins.test.ts` (6 source pins incl. the
  invariant). Mutations M-1..M-4 all RED surgical (the font-pin drop,
  the purple-900 drop, the red-700 value regression, the gray-400
  revert). Also: the mobile menu re-measured live on BOTH apps
  (byte-identical — the standing priority); the reference hygiene
  re-list: 9 tasks + 3 notes, 0 leftovers; the h3 glyph-metric closure
  verified live (68.3/312.1 px — byte-matching the reference). Unit
  153 → 159, e2e 85 → 89 (×2 consecutive). See
  `docs/session_20-review.md` + `docs/remediation-plan-session20.md`.
- **Session 19 (2026-10-05, this skill revision):** the framer-motion
  animation-timing pass (the session-18 §5 suggested target (a)) —
  the Quick Actions panel entrance/exit family + the background blobs
  measured at FOUR evidence levels on BOTH apps: the config decompile
  (the reference's G1e/W1e/A_e motion configs byte-identical to the
  clone's source), the runtime engine (the reference's WAAPI-hybrid
  `motion` easing table identical to framer-motion@14.0.0's — circOut
  IS cubic-bezier(0.55, 0, 1, 0.45)), the rAF timelines (every
  semantic matches, including the engine's opacity-lags-y quirk and
  the instant container-height jump), and the WAAPI animation METADATA
  (the overlay's native entrance: 350 ms / delay 0 / the circOut
  bezier — byte-identical). **ONE divergence — BL-1 (fixed)**: the
  reference's second background blob renders 0×0 (its `w-100 h-100`
  is dead in the v3 scale — no .w-100 rule in its stylesheet); the
  clone's `w-[400px]` rendered a live 400 px blob. Fixed by mirroring
  the RENDERED effect (no width/height utilities — the div collapses
  like the reference's dead-class div; the class string is NOT copied
  because v4's dynamic spacing would generate w-100 as 400 px). The
  motion contract pinned: `tests/e2e/panel-animation.spec.ts` (4
  pins — the WAAPI metadata, the translateY(20px)+opacity-0 entrance
  held through the 0.2 s delay, the form-view exit's last-rendered
  0.15 s delay, the blob layer contract) + `tests/panel-motion.test.ts`
  (10 source pins, the ai-prompt pattern). Mutations M-1..M-4 all RED
  surgical (each mutation fails exactly its own pin). Also: the
  mobile menu re-measured live on BOTH apps (byte-identical — the
  standing priority, no Tailwind v4 regression); the PAD §4.2 stale
  end_time-derivation bullet fixed (DOC-1 — the session-16 ET-1
  realignment miss) + the seed bullet's E-1 re-anchor clause (DOC-2);
  the reference hygiene re-list: 9 tasks + 3 notes, 0 leftovers. Unit
  143 → 153, e2e 81 → 85 (×2 consecutive). See
  `docs/session_19-review.md` + `docs/remediation-plan-session19.md`.
- **Session 8 (2026-10-04):** audit of the
  never-diffed surfaces — the NEXT-week calendar view (populated,
  state-matched: **0 diffs across the entire calendar + Quick Actions
  region**) and the EDIT-MODE TaskDialog (populated-only; 0/62 after the
  fixes). Fixed 4 gaps: every Radix animation was DEAD CSS
  (tw-animate-css installed but never imported — the reference's
  dialog/menu/select animate at 0.15s; G-1: `@import "tw-animate-css"`,
  the geometry specs now settle animations), lucide-react 0.525.0 →
  **0.475.0** (the reference's measured version — single-class
  emission; G-2), the classic dialog/select primitive forms
  (DialogContent arbitrary-value positioning + slide classes +
  sm:rounded-lg, DialogTitle tracking-tight, SelectTrigger
  ring-offset-background/data-[placeholder]:, SelectContent side
  slides; G-3), and the API response wire (raw camelCase Prisma → the
  documented snake_case entity shape via `serializeTask`/
  `serializeNote`, tags as arrays, internal fields off the wire; G-4).
  Also: the README's daily-focus fallback row said Paul J. Meyer (the
  code ships the Mark Twain set — docs drift, P-1); session 5's leftover
  "Live verify scheduled" task was found on the reference's NEXT week
  (sessions 6/7's "0 tasks" checks only looked at the current week)
  and deleted (P-3); the dropdown-item class ORDER is a documented
  style-neutral divergence (same class set; P-2). Unit 59 → 66, e2e
  58 → 63 specs; Log Activity populated + mobile menu re-pinned
  (338/14/36 + 182/54/192×164 — identical, now animated). See
  `docs/session_8-review.md` + `docs/remediation-plan-session8.md` (the
  operator's narrative lives in `docs/session_8.md` — the session-7
  execution log).
- **Session 7 (2026-10-04):** audit + POPULATED-state
  parity — the first diff with matched data on both apps (4 identical
  tasks created through each app's own TaskDialog; prior sessions diffed
  empty states). Fixed 4 gaps: the task-list ORDER (the reference's
  default Task.list() is createdAt desc — the clone shipped startTime
  asc; the Planning chips/selected-day list render the array AS
  RETURNED, so the visible chips differed; G-1), the store's createTask
  now PREPENDS (the reference's save → refetch → newest-first, verified
  without reload; G-2), recharts 3.10.1 → **2.15.4** (the reference's
  pie DOM is the 2.x shape — no zIndex layers, no shape wrappers,
  tooltip wrapper after the svg; G-3), and the Badge rebuilt to the
  reference's CLASSIC shadcn div form (focus-ring base + shadow/hover
  variants; G-4). Plus the F-2 de-flake: the status-card spec's
  post-click locator now accepts BOTH card headings (Next Up OR All
  caught up!) — the app was proven correct first (PATCH + re-render
  reproduced on a debug boot), the old filter failed with "element(s)
  not found" whenever no future task remained. First-time measured: the
  desktop dropdown geometry (1136/54/192×164, right-anchored —
  identical). e2e 54 → 58 specs; both apps now diff at Planning
  **74/74** (unselected) and **132/132** (day-selected), dashboard
  845/838 (7 = the documented styled-jsx + LLM-content nodes). Mobile
  menu re-pinned 374/54/192 — no Tailwind v4 regression. See
  `docs/session_7-review.md` + `docs/remediation-plan-session7.md` (the
  operator's narrative lives in `docs/session_7.md`).
- **Session 6 (2026-10-04, this skill revision):** audit + exhaustive
  state-matched class-tree parity — the reference account turned out to
  hold 0 tasks / 0 notes, so an empty user was registered in the clone and
  the FULL `<main>` class tree was dumped and element-wise diffed on both
  apps (dashboard 761/761, Planning day-selected 98/98 after the fix).
  Fixed 8 gaps: the Planning selected-day sections were Radix Accordions
  (the reference ships always-visible Cards — CardTitle is a div, no
  heading role; P-1), the dialog submit label ("Create Task"/"Update
  Task", a session-0 inference that had crept into the e2e pin; P-2),
  the dialog footer family (Save icon mr-2, no text-white, Delete mr-2,
  `flex gap-3 ml-auto`; P-3/P-4), the Planning header icon margins
  (mr-2 on Filter/Plus; P-5) + the Add Task button's clone-only hover
  gradient/text-white (P-6), the content-sized Refresh Calendar button
  (the reference's `icon_sm` is a dead variant — 30×30 vs the clone's
  invented 36×36; P-7), and the status-card e2e time-of-day flake
  (FS-16: page-wide locators that match BOTH the calendar card and the
  StatusCard whenever now+5min is inside the 07:00–22:00 grid; sessions
  4/5 passed only because they ran pre-07:00 UTC; F-1). e2e 51 → 54
  specs. See `docs/session_6-review.md` +
  `docs/remediation-plan-session6.md` (the operator's narrative lives
  in `docs/session_6.md`).
- **Session 0 (2026-10-03/04, commit `96d2dda`):** initial clone build —
  full app (11 API routes, 4 pages, store, auth, AI fallbacks), the 5
  Tailwind v4 trap mitigations, 36 unit + 29 e2e tests, 4 root docs,
  first push via the SSH wrapper.
- **Session 1 (2026-10-04, commit `1742785`):** review + remediation —
  `.env.example` contract (test-pinned), real site metadata
  (`site.ts` + sitemap + robots + `metadataBase`), e2e determinism
  (FS-7/8/9 fixes), 44/44 unit, screenshots refreshed, session + skill
  docs. See `docs/session_1-review.md` +
  `docs/remediation-plan-session1.md` (the operator's build narrative
  lives in `docs/session_1.md`).
- **Session 2 (2026-10-04):** audit + Planning parity — decompiled the
  reference's Planning component from its bundle and fixed 7 behavioral
  gaps (P-1…P-7: null-init selectedDay, selection highlight, static Day
  Statistics placeholder, decorative Filter, display-only chips,
  display-only task items, no Unscheduled section); e2e 29 → 34 specs;
  FS-11 lesson recorded. See `docs/session_2-review.md` +
  `docs/remediation-plan-session2.md` (the operator's narrative lives
  in `docs/session_2.md`).
- **Session 5 (2026-10-04, this skill revision):** audit + login-page/
  routing parity — the last unexamined surface (session_5.md's forward
  pointer). Live-measured the reference's base44 login screen in ALL
  FOUR view states + the error/mismatch alerts + the guards + the 404 +
  the root route, and fixed 21 gaps (L-1…L-22, N-1, G-1, R-1, E-1): the
  slate-50/100 page gradient, the rounded-2xl card with its slate top
  gradient bar, the REAL logo PNG in a ringed circle, the reference's
  Google button classes, `bg-slate-50/50` inputs with `you@example.com`
  / `••••••••` placeholders, the solid **slate-900** submit, the stacked
  footer, the separate sign-up view (Confirm Password, "Create
  account"), the forgot-password + check-your-email views with the
  green alert, the shadcn `[role=alert]` error card ("Invalid email or
  password" — no period), the server-side session guard on the (app)
  group (unauth → /login), the dashboard served at `/` (the reference's
  post-login landing; the root redirect removed), and the custom 404
  page. e2e 43 → 51 specs; FS-15 lesson recorded. See
  `docs/session_5-review.md` + `docs/remediation-plan-session5.md`.
- **Session 4 (2026-10-04):** audit + sidebar-card
  and layout-chrome parity — decompiled `ure`/`Y1e`/`fre`/`g0e`/`X1e`/
  `are`/`rre`/`Xne` from the reference bundle and fixed 26 gaps across 8
  surfaces (S/F/A/K/W/D/T/C/X): the StatusCard's full "Next Up" state
  machine with a FUNCTIONAL Mark Complete and the mirrored format-string
  bug, the Mark Twain fallback (wrong since session 0), Brain/Sparkles/
  Award/Target/ArrowRight icons, the m0e skills hexes, the full-bleed
  `p-4 md:p-6 lg:p-8` container (max-w-7xl removed), day-row
  `space-y-1.5` spacing, minute-stacked task blocks, default-cursor
  cells, the dialog delete confirm, the scrollbar cascade values, and
  the store's `taskVersion` refresh counter. e2e 38 → 43 specs, unit
  53 → 59; FS-14 lesson recorded. See `docs/session_4-review.md` +
  `docs/remediation-plan-session4.md` (the operator's narrative lives
  in `docs/session_4.md`).
- **Session 3 (2026-10-04):** audit + Quick Actions
  open-panel parity — decompiled `G1e`/`z1e`/`W1e`/`H1e`/`K1e` from the
  reference bundle and fixed 9 gaps (Q-1…Q-7 + deferred D-1/D-2):
  gradient container morph + expanding overlay, heading replacement,
  tile geometry, placeholder-only quick-add (slate-700 submit),
  minutes-hidden timer with Play/Pause + completion alert, read-only
  Log Activity history, Brainstorm note editing with confirm-deletes;
  `typescript.ignoreBuildErrors` removed (the build type-checks
  itself); rate-limiter bucket eviction. e2e 34 → 38 specs, unit 44 →
  53; FS-12/FS-13 lessons recorded. See `docs/session_3-review.md` +
  `docs/remediation-plan-session3.md` (the operator's narrative lives
  in `docs/session_3.md`).

- **Session 9 (2026-10-04/05, this skill revision):** environment
  authority + the last class-tree divergence. The audit's new surfaces:
  the OPEN Select listbox item states (byte-identical on both apps —
  session 8's suggestion), Profile/Settings class trees (26/26, 39/39),
  the mobile-dashboard tree (761/761 + the 3 documented style nodes),
  and BOTH LLMs observed live for the first time (the reference's
  InvokeLLM returned a Paul J. Meyer quote — session 4's Mark Twain
  claim is about the FALLBACK and still holds; the clone's z-ai SDK
  returned a Walt Disney quote). Fixed 2 gaps: **F-1 db-path v3** — the
  workspace's parent `.env` + harness shell export hijacked
  `DATABASE_URL` (db:push/seed AND the dev server targeted a file
  OUTSIDE the repo, reproduced twice; the repo's own `.env` is now
  authoritative — `chooseEnvSource` with the e2e-isolation and
  production-provider exceptions, 17 new unit tests; the CLI applies
  the same rule via `scripts/prisma-cli.ts`); **F-2** — the Planning
  day cards converted from `button … text-left` to the reference's
  plain clickable `div` (Planning now diffs 63/63 and 98/98 IDENTICAL;
  the a11y trees match; e2e-pinned — one locator corollary: the
  badge spec's task-item locator had used the button TAG as its
  discriminator and needed the `cursor-pointer` class instead).
  Unit 66 → 88, e2e 63 → 64 (×2 consecutive). FS-19 recorded. See
  `docs/session_9-review.md` + `docs/remediation-plan-session9.md`
  (the operator's narrative lives in `docs/session_9.md`).

- **Session 10 (2026-10-04/05, this skill revision):** the Focus
  Timer's RUNNING state + the POPULATED Log Activity (session 9's two
  suggested never-diffed surfaces) + a NEW audit method. The timer:
  byte-identical class trees running AND paused, pause-snap-to-full
  semantics matched, and the completion alert LIVE-verified on the
  reference (alert hooked, minutes=1, 01:00 → 00:00 → alert → snap).
  The populated Log Activity: structure byte-identical, but the
  relative-time WORDS diverged — **F-2**: the reference calls
  `formatDistanceToNowStrict` (bundle decompile: plain xHours/xDays +
  Math.round) while the clone used the non-strict variant ("about 3
  hours ago"/"in 1 day" vs "3 hours ago"/"in 2 days") — one import +
  one call site fixed it (FS-21). The new method — the
  **attribute-inventory diff** (all attribute NAMES on both DOMs) —
  found what nine sessions of class-tree diffs could not see:
  **F-1** the shadcn `data-slot` markers (24 sites across 9 primitives;
  the reference emits zero; removed + pinned by an attribute-count
  locator — FS-20) and **F-3** the title input's `maxLength={300}`
  (removed client-side; the 300-char write guard stays in the API
  routes). Unit 88 (unchanged), e2e 64 → 66 (×2 consecutive). See
  `docs/session_10-review.md` + `docs/remediation-plan-session10.md`
  (the operator's narrative lives in `docs/session_10.md`).
- **Session 11 (2026-10-05, v2.0.0):** the two surfaces session 10
  suggested — the Log Activity top-5 slice with a **saturated >5-item
  cross-week list** and the Brainstorm note-editing deeper states —
  diffed live on BOTH apps: **full parity, zero code changes needed**.
  The H1e filter re-decompiled (`d.status==="completed" || d.end_time
  && Wc(d.end_time) < l`) — the null-end_time guard and the
  once-per-mount `now` capture match the clone exactly (quick-added
  title-only tasks are excluded on both apps). The deliverable became
  the PIN LAYER: three specs (the saturated slice G-1 with mutation
  evidence; the empty-save no-op G-2 and the newest-first order G-3 —
  both with their enforcement-layer findings: the no-op is
  server-validated, the order is refresh-driven) — e2e 66 → 67 (×2
  consecutive). The 24 h band boundary ("24 hours ago" at 23h59m,
  "1 day ago" at 24h01m — both correct strict behavior, only the
  observation time moved) generalized FS-21's discriminator rule.
  See `docs/session_11-review.md` +
  `docs/remediation-plan-session11.md`.
- **Session 12 (2026-10-05, v2.1.0):** the two surfaces session 11
  suggested — the quick-added null-time task's surfacing (answering
  "where DOES it appear?" — NOWHERE, on either app, every surface
  enumerated incl. the AI Summary's prompt) and the Notes tags
  round-trip (capture-confirmed: `"tags":[]` on the reference's live
  wire; its K1e only ever sends `{content}`) — diffed at FULL parity.
  The session's method upgrade paid the real dividend: **live XHR
  interception of the reference's own base44 traffic** revealed FOUR
  wire-contract divergences session 8's decompile inference had locked
  in — W-1/W-2 the response field names (`created_date`/`updated_date`,
  not created_at/updated_at; `is_sample`/`created_by`/`created_by_id`
  shipped, not stripped) and W-3/W-4 the request payload (the dialog's
  client-computed `end_time`; the description verbatim, "" stays "").
  All four fixed with a zero-consumer proof (both bundles + both
  codebases searched), pin-first (wire-format re-pinned to the exact
  14/9-key sets, 4 RED; the e2e G-4 spec re-pinned; a page.route
  interception pin on the dialog's POST body), mutation evidence for
  every fix, and the live re-capture diff (the clone's wire now matches
  the captured reference wire key-for-key). Unit 88 → 89, e2e 67
  (×2 consecutive, one unrelated timer flake in run 1). See
  `docs/session_12-review.md` +
  `docs/remediation-plan-session12.md`.
- **Session 13 (2026-10-05, v2.2.0):** session 12's suggested target —
  the two InvokeLLM request bodies — diffed via the XHR interception
  UPGRADED with request-HEADER capture (the base44 SDK's auth is
  `Authorization: Bearer …` + `X-App-Id` + `X-Origin-URL`; plain fetch
  CORS-fails without them) + the `fre`/`Y1e` decompile. The Daily Focus
  prompt: byte-identical (and all three fallback constants match). The
  AI Summary: FIVE divergences — L-1..L-4 the prompt bytes (the
  reference's 8-space "blank" lines, the per-task template + `\n` join
  with its blank-line pair between tasks, the trailing space on item
  3) and L-5 the task ORDER (fn.Task.list()'s createdAt-desc,
  capture-proven: the newest-created task listed first — disproving
  startTime ordering). Fixed pin-first: `src/lib/ai-prompt.ts` (pure)
  with byte-for-byte pins + a **mocked-SDK wiring pin (vi.mock — the
  first unit-level evidence for a server-side call the e2e can never
  intercept)** + the route-source order contract; mutations M-1..M-4
  all RED. The gate then found E-1 at the Sunday→Monday UTC rollover
  (the FS-16 family at WEEK granularity): the seed's sample week never
  re-anchored, so 12 seeded-task specs failed 35 minutes after a green
  baseline — fixed in the seed itself (`src/lib/sample-week.ts` +
  delete-and-recreate stale `is_sample` rows; mutation M-5 RED; the
  suite self-heals on the next global-setup). Unit 89 → 102, e2e 67
  (×2 consecutive). See `docs/session_13-review.md` +
  `docs/remediation-plan-session13.md`.
- **Session 14 (2026-10-05, v2.3.0):** session 13's suggested target —
  the InvokeLLM RESPONSE side — probed with the XHR response-OVERRIDE
  harness (Object.defineProperty on the instance's responseText/
  response/status — the reference's own cards fed arbitrary
  post-validation JSON, five edge-case probes). Four response-parse
  divergences (RS-1..RS-4): the reference renders schema-VALID-but-empty
  VERBATIM (empty arrays → zero chips; empty-string items → empty
  chips; empty mood/insights → empty `<p>`s; the focus guard is
  quote-only `a && a.quote`) while the clone's truthiness guards fell
  to the fallbacks. Fixed pin-first: `tests/ai-response.test.ts` (11
  pins, the mocked-SDK pattern) + the schema-SHAPE parse in
  `src/lib/ai.ts`; mutations M-1/M-2/M-4 all RED. PLUS session-12 P-1
  closed: raw-text token extraction on the reference's entity wire
  proved the Python backend emits `"duration_minutes":60.0` (float
  text) — `okWire` (`src/lib/api.ts` + `floatFormatDurations` in
  `serialize.ts`) float-formats the task routes' response tokens
  (verified live; pinned by unit + the raw-text e2e assertion);
  mutations M-3/M-5 RED (the M-3 lesson: a source pin must match the
  CALL, not the import). Unit 102 → 121, e2e 67 (×2 consecutive).
  See `docs/session_14-review.md` +
  `docs/remediation-plan-session14.md`.
- **Session 15 (2026-10-05, v2.4.0):** the session-14 §5a suggested
  target — the failure-path paired probe — CLOSED with parity
  confirmed (the reference's InvokeLLM 429 catch rendered the Mark
  Twain set, byte-identical to the clone's SDK-429 render the same
  morning; the response-override harness on one side, the live SDK
  rate-limit on the other). The full-body XHR capture (with request
  headers) surfaced DW-1: the entity DATE-token wire — the reference's
  Python backend ships server-generated created_date/updated_date at
  6-digit µs (POST WITH Z, GET/PUT WITHOUT Z — six surfaces probed).
  Fixed pin-first: `formatWireDates` (read/create modes) +
  `okWireCreate` in `src/lib/api.ts` + the notes routes joining the
  wire seam; `tests/wire-dates.test.ts` (12 pins) + the raw-text e2e
  date pins; mutations M-1..M-5 all RED — plus the harness-backup
  lesson (the first run corrupted api.ts; a canonical per-file backup
  + a post-run pin re-run is now the rule). The mobile menu
  re-measured LIVE on the reference (Playwright trusted clicks;
  agent-browser has no Linux viewport control): identical to the pins
  — no drift, no Tailwind v4 regression. A structural DOM diff of
  both live dashboards: match (data-driven diffs only). Unit
  121 → 133, e2e 67 (×2 consecutive). See
  `docs/session_15-review.md` + `docs/remediation-plan-session15.md`.
- **Session 16 (2026-10-05, v2.5.0):** the session-15 §5a suggested
  target — the entity wire's KEY ORDER — probed on ALL SIX response
  surfaces + both request flows and RULED (FS-28: match the captured
  order; Task start_time-first, Note title-first; the request side was
  already byte-identical). The same probes surfaced ET-1: the
  reference stores end_time AS SUBMITTED (no server-side derivation;
  its PUT is PARTIAL — Mark Complete captured sending only
  `{"status":"completed"}`) — the clone's POST/PATCH derivations
  removed (the direct-API-caller Log Activity membership now matches).
  Fixed pin-first: `tests/wire-order.test.ts` (10 pins: the exact
  emission orders, the null-form slots, the text-seam order
  preservation, the no-derivation source pins) + the raw-text e2e
  order pins + the end_time-null flip; mutations M-1..M-4 all RED
  (the canonical-backup harness + the post-run pin re-run). The
  mobile menu re-measured LIVE on the reference again (identical to
  the pins — no drift, no Tailwind v4 regression); a structural DOM
  diff of both live dashboards + planning pages: match. Unit
  133 → 143, e2e 67 (×2 consecutive). See
  `docs/session_16-review.md` + `docs/remediation-plan-session16.md`.
- **Session 17 (2026-10-05, v2.6.0):** the session-16 §5 suggested
  target — the fresh multi-viewport diff pass at 390/768/1024/1440 —
  executed on BOTH apps live (structure classes, heading inventories,
  overflow metric, PNG pixel diffs, the mobile-menu geometry
  re-measured): full parity, ZERO code defects, ONE pin-coverage gap
  (VP-1: the tablet band unpinned + no overflow invariant anywhere).
  Fixed pin-first: `tests/e2e/viewport-breakpoints.spec.ts` (the
  band family — the exact md edge at 768, the 1024 tablet band, the
  390/1440 overflow bookends; computed-display visibility, the
  documentElement scrollWidth metric). Mutation phase: M-1
  (`md:hidden`→`sm:hidden`) RED 4; M-2 REDESIGNED after the first
  design survived — an injected wide element inside the AppShell root
  is clipped by its `overflow-hidden` (the lesson: the honest overflow
  mutation is a WIDTH EDIT ON THE ROOT, `w-[2000px]`) — RED 4,
  surgical (band-state pins unaffected). The live T-4 field-diff then
  surfaced BD-1: the reference's `<body>` renders classless; the
  clone shipped `antialiased` — removed and pinned (the body-class
  pin). Reference-account hygiene: the session-16 "S16 MarkComplete
  Probe" leftover found + deleted (the verify-don't-trust rule). Unit
  143 (unchanged), e2e 67 → 76 (×2 consecutive). See
  `docs/session_17-review.md` + `docs/remediation-plan-session17.md`.
- **Session 18 (2026-10-05, v2.7.0):** the session-17 §5 suggested
  target — the timed-interaction pass (the Focus Timer countdown at
  sub-second precision on both apps) — executed via an in-page
  MutationObserver + performance.now() timeline across five sequences
  (start/pause/resume/reset, pause-then-edit, close/reopen, the real
  60-second completion path, the parse edges): 13 of 14 semantics
  byte-identical; ONE divergence (FT-1: the completed display — the
  reference leaves 00:00 as the terminal state; the clone's derived
  display snapped to full). Root cause: session-3's decompile misread
  the reference's display as derived (the "idle effect" claim) — the
  measured truth is the `remaining` STATE with the snap in the TOGGLE
  handler (both directions). Fixed state-driven + pinned the whole W1e
  timed contract in `tests/e2e/focus-timer.spec.ts` (5 pins incl. the
  completion path via `page.clock` `runFor` — the session-3 ~65 s
  one-off is now a <2 s suite pin; runFor not fastForward: intervals
  must fire repeatedly). Mutations M-1/M-2/M-3 all RED (M-1 the derived
  revert → the completion pin, surgical; M-2/M-3 the toggle-reset
  removals → the pause-family pins); restore verified green + checksum.
  Reference hygiene re-listed: 9 parity tasks, 0 leftovers. Unit 143
  (unchanged), e2e 76 → 81 (×2 consecutive). See
  `docs/session_18-review.md` + `docs/remediation-plan-session18.md`.

## Appendix D: Post-Deploy Live-Site Validation

- **Smoke path:** `curl $SITE/api/health` → `{"status":"ok",…,"database":"up"}`;
  register → login → task CRUD → AI endpoints return the envelope (or
  the documented fallback content) → logout → pages render.
- **agent-browser methodology** (used for parity verification): load
  saved auth state (`agent-browser state load auth.json`) →
  `set viewport 390 844` → open the app → click the mobile trigger →
  measure `document.querySelector('[role=menu]').getBoundingClientRect()`
  and compare against the reference measurement — the ONLY trustworthy
  parity check for the mobile menu.
- **What live-site testing catches that CI cannot:** the deployed
  origin's `metadataBase`/sitemap URLs, LLM quota behavior from a
  production IP, and cookie flags behind a real TLS terminator
  (see `docs/DEPLOYMENT.md` §4 for the absolute-path database
  requirement in production).
