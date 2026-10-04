---
name: flow-schedule-skill
description: >
  Comprehensive engineering skill for the FlowSchedule codebase — a
  self-hosted clone of the FlowSchedule reference app (weekly time-grid
  calendar, AI insights, notes) built on Next.js 16 + React 19 + Prisma/
  SQLite + Tailwind CSS v4. Use this when extending, debugging, onboarding,
  or replicating the FlowSchedule architecture. Every claim is
  codebase-verified (sessions 1–8, 2026-10-04).
version: 1.7.0
last_updated: 2026-10-04
project_state: 66/66 unit tests, 63/63 e2e tests, all gates green, build self-type-checks
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
| `bun run test` | Vitest unit — 44 tests |
| `bun run test:e2e` | Playwright — 34 specs; **requires prior `bun run build`** |
| `bun run db:push` / `bun run db:seed` | Schema sync / idempotent seed |
| `scripts/smoke-test.sh` | 25-check curl suite over the standalone server |

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

**Environment traps** (both hit in practice):

1. Bun auto-loads `.env` from PARENT directories — a workspace parent
   `.env` with an absolute `DATABASE_URL` wins over this repo's relative
   one.
2. A shell-EXPORTED `DATABASE_URL` beats every `.env` file. Symptom:
   `db:seed` says "Sample tasks already present — skipped" while
   `<repo>/db/custom.db` stays 0 bytes. Fix: `unset DATABASE_URL`.

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

## 10. Debugging Guide

| Symptom | Cause | Fix / where to look |
|---|---|---|
| Styles flat/unstyled in prod | `@theme` var() chains dropped or Trap 1/2/5 regressions | Read `docs/Tailwind-V4-Validation-Report.md` FIRST; check `globals.css` against §4 |
| Dev page unhydrated, native form GETs | FS-6 dev-origin block | `next.config.ts` `allowedDevOrigins` |
| Build fails prerendering `/login` | FS-5 | Suspense wrapper in `src/app/login/page.tsx` |
| "attempt to write a readonly database" | FS-8 — someone deleted the db file under the server | Restart the server; keep globalSetup header comment intact |
| e2e "day statistics" flaky | FS-7 chip interception / pre-hydration click | Header-block click + hydration gate (already in spec) |
| Login rejected in tests | Rate limiter (10/IP/60s) after repeated runs | The setup project signs in ONCE and shares storageState; per-test logins are forbidden |
| `db:seed` says "skipped" but `db/custom.db` is 0 bytes | Stale shell-exported or parent `.env` `DATABASE_URL` | `unset DATABASE_URL`; see §3 traps |
| Tasks created in e2e pollute totals | FS-9 | Spec cleanup blocks (already in place) |
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
bun run test          # 66/66
bun run build         # green; .next/standalone assembled
bun run test:e2e      # 63/63 on the production standalone :3100
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
| `bun run test` (Vitest) | **66/66** — auth ×8, db-path ×15, domain ×16 (incl. skills colors + name transform), ai-defaults ×3, env-example ×4, site ×4, next-config ×3, rate-limit ×6, wire-format ×7 |
| `bun run build` | green; 19 routes incl. `/robots.txt`, `/sitemap.xml`; **type-checked by the build itself** (`ignoreBuildErrors` removed, session 3) |
| `bun run test:e2e` (Playwright) | **63/63** × 2 consecutive full runs (58 after session 7; +5 session-8 pins — the enter animation, the classic DialogTitle/SelectTrigger classes, the single lucide class, the snake_case response shape) |
| `scripts/smoke-test.sh` | 30/30 (incl. authed page renders + unauth guard redirects) |
| Reference parity (mobile menu) | re-measured live on BOTH apps every session; session 8: 182/54/192×164 at 390×844, trigger 338/14/36×36 — identical, now ANIMATED like the reference's |
| Reference parity (sidebar cards) | bundle decompile (ure/Y1e/fre/g0e) + live DOM on both apps: the Next Up state machine (skeleton, priority badge, format-string-bug time row, 75% progress + Ready, FUNCTIONAL Mark Complete round-tripped on both, decorative ArrowRight), Mark Twain fallback, Brain + Sparkles header, Award indicator, m0e hexes, percentage-only legend — all matched |
| Reference parity (layout chrome) | full-bleed `p-4 md:p-6 lg:p-8` (1440px on both), day rows `space-y-1.5` (6px gap), default-cursor cells, minute-stacked blocks, dialog delete confirm, scrollbar cascade values |
| Reference parity (Quick Actions) | session 3: bundle decompile (G1e/z1e/W1e/H1e/K1e) + live DOM on both apps — all matched; completion alert verified by a one-off run |
| Reference parity (Planning) | session 2: bundle decompile + live DOM comparison on both apps: null-init selection, selected-day highlight, static stats placeholder, decorative Filter, chip bubbling, display-only items, no Unscheduled — all matched |
| Reference parity (gradients) | Quick Action tiles byte-identical; canvas endpoints identical, oklab midtone delta measured 0–3 RGB units (accepted) |
| Rate limiter hygiene | throttled expired-bucket sweep unit-pinned (5,000-key spray bounded; live keys preserved) |

## Appendix C: Session History

- **Session 8 (2026-10-04, this skill revision):** audit of the
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
