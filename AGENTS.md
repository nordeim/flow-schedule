# AGENTS.md

Instructions for AI coding agents working in this repository. Every line here
answers: "would an agent likely get this wrong without being told?" —
verified against the toolchain on 2026-10-04.

## Commands

Run from the repo root unless noted. Bun 1.3+ is the canonical runtime
(the `db:seed` script is `bun prisma/seed.ts`); Node ≥ 20 works for
everything else.

| Command | What it does |
|---|---|
| `bun run dev` | Dev server on :3000 (Turbopack), logs tee'd to `dev.log` |
| `bun run build` | Production build + assembles `.next/standalone` (static assets copied in) |
| `bun run start` | Standalone prod server on :3000 (`bun .next/standalone/server.js`) |
| `bun run lint` / `bun run typecheck` | ESLint 9 flat / `tsc --noEmit` |
| `bun run test` | Vitest unit suites (44 tests: auth crypto, domain constants, db-path, .env.example contract, site URL helper) |
| `bun run test:e2e` | Playwright (29 specs): boots the **production standalone** on :3100 with its own `db/e2e.db` — requires a prior `bun run build` |
| `bun run db:push` | Prisma `db push` (dev schema sync, `--accept-data-loss`) |
| `bun run db:seed` | Idempotent seed: demo user `demo@flowschedule.app` / `demo1234`, 9 tasks, 2 notes |
| `bunx prisma generate` | Regenerate the Prisma client after schema edits |

Clean-check order: `bun run lint && bun run typecheck && bun run test &&
bun run build && bun run test:e2e`. The e2e global setup pushes + seeds
`db/e2e.db` itself; it does NOT touch `db/custom.db`.

## Architecture invariants

- **Real routes, not rewrites**: the pages live at `/Dashboard`, `/Planning`,
  `/Profile`, `/Settings` (capitalized — the reference app's exact paths)
  inside the `(app)` route group, plus a standalone `/login`. The root `/`
  redirects to `/Dashboard`. Do not "fix" the casing and do not collapse
  them into one SPA page.
- **Data flow**: client components read the Zustand store
  (`src/store/useFlowStore.ts`); the store is the ONLY fetcher of `/api/*`
  and unwraps the `{ ok, data } | { ok, error }` envelope. Server
  components do not fetch entity data — the pages are client islands over
  the store (matching the reference's SPA behavior).
- **API envelope discipline**: every route handler returns
  `ok(data)` / `fail(code, message, status)` from `src/lib/api.ts`. Never
  throw across the boundary; never return raw Prisma errors.
- **Auth**: scrypt password hashes + HMAC-signed session tokens
  (`userId.expiry.mac`) in an HttpOnly `fs_session` cookie — see
  `src/lib/auth.ts`. Login/register are rate-limited (10/IP/min, 429 +
  `Retry-After`); keep total per-suite real logins well under the budget
  (the Playwright setup project signs in ONCE and shares storageState).
- **LLM never hard-fails**: `src/lib/ai.ts` wraps every z-ai-web-dev-sdk
  call in try/catch with deterministic fallbacks (the reference does the
  same — its catch blocks ship canned content). The SDK is server-side
  ONLY; never import it in a client component.
- **Entity enums live in `src/lib/domain.ts`** (4 priorities, 7 categories,
  3 statuses, 16 calendar hours, 80px/60px grid geometry, gradient maps).
  The API routes validate writes against these guards; don't duplicate the
  constants in components.

## Framework quirks (verified the hard way)

- **Tailwind v4 is CSS-first**: there is no `tailwind.config.*`. All tokens
  live in `src/app/globals.css` `@theme inline`. Two repo-critical pins:
  1. Semantic tokens are **full `hsl()` values** — a bare `0 0% 100%`
     triplet under `@theme inline` silently resolves to *transparent*
     (Trap 1 in `docs/Tailwind-V4-Validation-Report.md`).
  2. `--shadow-sm` is **pinned to the v3 value**
     `0 1px 2px 0 rgb(0 0 0 / 0.05)` — v4's default is one notch heavier
     and every `shadow-sm` in the app (header, cards, buttons) would drift
     (Trap 5). The slate/sky/etc. palette hexes are likewise pinned v3
     values (Trap 2 — v4's oklch defaults drift 1–3 sRGB units/channel).
- **space-y selector rewrite (Trap 4)**: v4 emits
  `:where(.space-y-* > :not(:last-child)) { margin-block-end }` with ZERO
  specificity — a child's own `mt-*`/`mb-*` WINS where v3 overrode it.
  This app keeps **no `space-y-*` container with children that carry
  explicit mt/mb utilities** (the header's dropdown menu deliberately uses
  `p-1` + item margins). Keep it that way; the mobile-menu geometry spec
  will fail if the pattern sneaks back in.
- **Quick Action gradients are inline-style hex** (not
  `bg-gradient-to-r` utilities) — the reference's own form, which also
  sidesteps v4's in-oklab gradient interpolation drift (Trap 3).
- **Next 16 dev-origin protection** silently blocks dev chunks for the
  `127.0.0.1` origin (symptom: unhydrated page, native form GET fallbacks) —
  `allowedDevOrigins: ["127.0.0.1", "localhost"]` in `next.config.ts` is
  load-bearing.
- **`useSearchParams` must sit inside `<Suspense>`** or the static
  prerender of `/login` fails the build.
- **react-hooks/set-state-in-effect is an ERROR in this ESLint setup** —
  derive loading states instead of resetting them in effect bodies
  (AISummaryCard's keyed-result pattern), and use remounts to reset form
  state (TaskDialog's DialogContent-mounted body), never reset-effects.
- **Radix menu hide-others**: while a DropdownMenu is open, Radix marks the
  app root `aria-hidden` — role queries for elements OUTSIDE the menu time
  out. Measure/click the trigger BEFORE opening (see
  `tests/e2e/mobile-navigation.spec.ts`).
- **Radix menus need trusted pointer events**: synthetic
  `el.click()` via `page.evaluate` does NOT open them. Use Playwright
  `locator.click()`.
- **Bun auto-loads `.env` from parent directories too** — a workspace
  parent `.env` with an absolute `DATABASE_URL` wins over this repo's
  relative one. Both are supported: `src/lib/db-path.ts` passes absolute
  `file:` URLs through untouched and anchors relative ones to the repo that
  owns `prisma/schema.prisma` (pinned by `tests/db-path.test.ts`).
- **`typescript.ignoreBuildErrors: true` ships in `next.config.ts`** (the
  scaffold's setting) — the gate is `bun run typecheck` instead. Do not let
  that lull you: `tsc --noEmit` must be clean.

## Conventions that differ from defaults

- The task/note JSON wire format is **snake_case** (`start_time`,
  `duration_minutes`, `created_at`) — the reference app's entity shape —
  while Prisma models and TS types are camelCase. The mapping lives in ONE
  place (`mapTask`/`mapNote` in the store); don't sprinkle conversions.
- Task `status: "in_progress"` (snake), but priorities/categories are bare
  words — mirror the reference enums exactly; no synonyms, no casing games.
- The seed is idempotent via `is_sample: true` guards + user upsert;
  re-running never duplicates. Sample data belongs to the seed, never to
  the runtime.
- Screenshots for docs live in `docs/screenshots/` and are captured from
  the dev server at 1440×900 (desktop) and 390×844 (mobile).
- ESLint config intentionally relaxes several rules for AI-generated code
  ergonomics, but `react-hooks/set-state-in-effect` remains an ERROR —
  it has caught two real cascading-render bugs in this codebase.

## Mobile navigation (the highest-regression-risk surface)

The reference app's mobile navigation is **ONLY** the header's account
menu — a ghost user-icon Button (`div.md:hidden`) opening a Radix
DropdownMenu `align="end"`. The reference ships **no bottom tab bar**
(its mobile nav-items array is empty). Measured parity at a 390px
viewport: menu right 374 = trigger right 374, menu top 54 (4px
sideOffset below the 50px trigger bottom), width 192. Any change to the
header layout, the menu classes, or the trigger padding will fail
`tests/e2e/mobile-navigation.spec.ts` — that spec is the pin, update it
deliberately if the reference re-measures differently.

## Reference

- `Project_Architecture_Document.md` — the full engineering reference
  (ADRs, layer model, all five Tailwind v4 traps with fixes, the
  verification ledger).
- `flow-schedule_SKILL.md` — the distilled engineering skill (20
  sections + appendices: anti-patterns FS-1…FS-10, debugging guide,
  pre-ship checklist, color/z-index references).
- `docs/session_1.md` (build narrative) + `docs/session_1-review.md` +
  `docs/remediation-plan-session1.md` — the session-1 review/remediation
  record (the e2e determinism lessons FS-7/8/9 came from there).
- `docs/Tailwind-V4-Validation-Report.md` — the source for the trap
  taxonomy; read it before touching `globals.css`.
- `docs/DEPLOYMENT.md` — production deployment (absolute DB path, env
  hardening).
- `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` — the SSH push
  runbook for this repository.
