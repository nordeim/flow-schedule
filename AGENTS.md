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
| `bun run test` | Vitest unit suites (59 tests: auth crypto, domain constants incl. the skills color map, AI fallback content, db-path, .env.example contract, site URL helper, next.config contract, rate-limit window/eviction) |
| `bun run test:e2e` | Playwright (54 specs): boots the **production standalone** on :3100 with its own `db/e2e.db` — requires a prior `bun run build` |
| `bun run db:push` | Prisma `db push` (dev schema sync, `--accept-data-loss`) |
| `bun run db:seed` | Idempotent seed: demo user `demo@flowschedule.app` / `demo1234`, 9 tasks, 2 notes |
| `bunx prisma generate` | Regenerate the Prisma client after schema edits |

Clean-check order: `bun run lint && bun run typecheck && bun run test &&
bun run build && bun run test:e2e`. The e2e global setup pushes + seeds
`db/e2e.db` itself; it does NOT touch `db/custom.db`. The production build
fails on type errors by itself (`typescript.ignoreBuildErrors` was removed
in session 3 — `tests/next-config.test.ts` pins that it stays gone).

### FS-16 (time-of-day flake — added session 6)

A spec that creates a task at `now + N minutes` and asserts PAGE-WIDE
text/class locators changes behavior with the wall clock: the calendar
renders the task block (title included — no status filter on either app)
whenever now+N lands inside the 07:00–22:00 grid, so a
`div.rounded-3xl` + hasText locator resolves to TWO cards (calendar +
StatusCard) and strict mode fails; two green runs pre-07:00 UTC prove
nothing about the rest of the day. Rules: (1) scope locators to the
component under test (the StatusCard via its "Next Up" heading filter);
(2) assert component CONTENT (`toContainText` / `not.toContainText`),
never page-element COUNTs, for data that legitimately persists elsewhere
(completed tasks stay on the calendar on BOTH apps — decompile-verified);
(3) icon-level locators like `svg.lucide-chevron-down` must be scoped to
`main` — the HEADER ships its own chevron (the desktop avatar trigger).

## Architecture invariants

- **Real routes, not rewrites**: the pages live at `/Dashboard`, `/Planning`,
  `/Profile`, `/Settings` (capitalized — the reference app's exact paths)
  inside the `(app)` route group, plus a standalone `/login`. The group
  ALSO serves the dashboard at `/` (`(app)/page.tsx` — the reference's
  authenticated root and post-login landing; the old root redirect was
  removed in session 5). The `(app)` layout is a **server-side session
  guard**: no valid `fs_session` cookie → `redirect("/login")`, exactly
  like the reference. Unknown paths render the custom `not-found.tsx`
  (the reference's 404 design). Do not "fix" the casing, do not collapse
  the pages into one SPA, and do not remove the guard or the root route.
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
- **`typescript.ignoreBuildErrors` is GONE from `next.config.ts`** (removed
  in session 3 — the production build now fails on type errors itself;
  `tests/next-config.test.ts` pins the contract). `bun run typecheck`
  remains the fast gate — keep it clean.
- **Playwright text matching hits textarea default-value text nodes**: a
  controlled `<textarea>`'s React-rendered default value lives in the DOM
  as a text node, so `getByText(/pattern/)` can match the STILL-MOUNTED
  create-view textarea instead of the list item you meant (suite-load
  timing decides which resolves first — a real flake, session 3).
  Scope list-item assertions with `getByRole("paragraph").filter(...)`
  (see the Brainstorm specs).
- **Playwright heading queries substring-match** (session 4): the Next
  Up card's h4 TASK TITLE makes `getByRole("heading", { name: "Skills
  Map" })` resolve to TWO elements (strict-mode violation). Use `exact:
  true` for heading lookups near data-driven titles; scope legend/list
  queries with `:scope > span` (`span:last-child` happily matches a
  last-child of an INNER wrapper).
- **e2e residue cascades CROSS-SPEC** (session 4): a failed spec's
  un-cleaned tasks push the planning page's top-3 chips and the
  StatusCard's Next Up selection around, failing specs that run LATER.
  Dashboard specs wipe the whole `E2E *` task family at start, not just
  their own title (FS-9 taken to its conclusion).
- **agent-browser cannot open Radix menus on the dev build** (session 4):
  its eval/CDP clicks do not dispatch the trusted pointer events React 19
  + Radix require there (the reference app's menu opened via eval — that
  made it look like a clone regression; it is not). The e2e spec
  (Playwright trusted clicks on the production standalone) is the pin.
- **Next's route announcer carries `role="alert"`** (session 5): every
  App-Router page ships an (always empty) `#__next-route-announcer__`
  div, so `getByRole("alert")` resolves to TWO elements on the clone
  while the reference (a Vite SPA) has only the card's alert. Scope
  alert locators with `:not(#__next-route-announcer__)`.
- **`getByLabel("Password")` substring-matches "Confirm Password"**
  (session 5): the sign-up view renders both fields; use
  `{ exact: true }` on label lookups when sibling labels overlap.
- **The TaskDialog footer is decompiled reference behavior** (session 6,
  Xne): the submit is `<Save className="w-4 h-4 mr-2" />` +
  `{editing ? "Update Task" : "Create Task"}` with NO `text-white` (the
  default Button variant's `text-primary-foreground` styles it — do not
  re-add), the Delete icon carries `mr-2` with classes ordered
  `border-red-200 text-red-600 hover:bg-red-50`, and the right footer
  group is `flex gap-3 ml-auto` (NOT gap-2). The dialog submit's hover
  gradient (`hover:from-sky-600 hover:to-blue-700`) exists ONLY here —
  the Planning header's Add Task button has none.
- **`icon_sm` is a DEAD variant in the reference** (session 6, P-7): the
  reference's Refresh Calendar button passes `size:"icon_sm"` but its
  size map has no such key — cva emits NO size class and the button is
  content-sized (svg 16px via `[&_svg]:size-4` + `p-1.5` = 30×30,
  measured on both apps). The clone maps `icon_sm: ""` to mirror that
  exactly; do NOT "fix" it back to a real size class.

## Conventions that differ from defaults

- The task/note JSON wire format is **snake_case** (`start_time`,
  `duration_minutes`, `created_at`) — the reference app's entity shape —
  while Prisma models and TS types are camelCase. The mapping lives in ONE
  place (`mapTask`/`mapNote` in the store); don't sprinkle conversions.
- Task `status: "in_progress"` (snake), but priorities/categories are bare
  words — mirror the reference enums exactly; no synonyms, no casing games.
- **The /Planning page is decompiled reference behavior, not inferred
  design** (session 2; re-verified session 6): `selectedDay` starts
  `null` — the whole selected-day section (task list + Day Statistics)
  renders ONLY after a day-card click; the card highlight follows the
  SELECTION (no today-marker); Day Statistics is a static placeholder (the
  reference's bundle has no data branch); the Filter button is decorative
  (no handler in the reference); day-card chips are display-only (clicks
  bubble to select the day); task items have no action buttons (editing
  happens ONLY from the Dashboard calendar task blocks); and there is no
  Unscheduled section (the string is absent from the reference bundle).
  **The selected-day sections are plain Cards** (session 6, P-1 — the
  reference's `tE`/`nE`/`rE`/`iE`): Card/CardHeader/CardTitle/CardContent,
  always visible — NO accordion, no collapse button, and CardTitle is a
  `div` (the date title has NO heading role; the e2e pins text-based
  locators + `div.tracking-tight`). The header's Filter/Add-Task icons
  carry `mr-2` ON TOP of the Button's gap-2 (measured 100.7px vs 89.1px
  without). `tests/e2e/planning.spec.ts` pins all of it.
- **The Quick Actions OPEN-PANEL state is decompiled reference behavior,
  not inferred design** (session 3, `G1e`/`z1e`/`W1e`/`H1e`/`K1e` in the
  reference bundle): opening a tile morphs the whole card container into
  the action's gradient (`relative backdrop-blur-xl rounded-3xl p-4
  shadow-xl border border-white/20 overflow-hidden min-h-[280px]` + a
  motion expanding overlay from the clicked tile) and REPLACES the
  "Quick Actions" heading with the panel header. Panels: Add Task is
  placeholder-only (no label) with a `bg-slate-700` submit; the Focus
  Timer hides the minutes input while running (Play/Pause toggle,
  "Focus session complete!" alert at 0, start disabled at minutes=0 —
  the reference's duration alert is unreachable dead code, mirrored);
  Log Activity is a READ-ONLY top-5 completed/past list (relative
  end_time, no action buttons); Brainstorm supports note EDITING with
  30-char truncated clickable previews and window.confirm deletes.
  `tests/e2e/dashboard.spec.ts` pins all of it.
- **The dashboard SIDEBAR CARDS are decompiled reference behavior, not
  inferred design** (session 4, `ure`/`Y1e`/`fre`/`g0e` in the reference
  bundle): the StatusCard is a state machine — loading skeleton, the rich
  "Next Up" card (priority badge map, h4 title, optional description,
  relative time, 75% progress + "Ready", FUNCTIONAL Mark Complete via
  `completeTask`, decorative ArrowRight button) or the raw-icon "All
  caught up!" empty state. The time formatter MIRRORS the reference's
  format-string bug: `format(d, "MMM d at HH:mm")` renders
  "Oct 6 AM1791284400 11:00" (date-fns `a`=AM/PM, `t`=unix seconds) —
  bug parity, verified byte-identical on the live reference. DailyFocus's
  fallback is the reference's Mark Twain set (NOT Paul J. Meyer —
  `src/lib/ai-defaults.ts`, unit-pinned); its quote/affirmation are
  VERTICAL blocks (icon mb-1 above, text below) with a Target affirmation
  icon. AISummary's header is Brain + a Sparkles live indicator; its Mood
  block is the purple→pink gradient with purple-800 body; chips are
  bg-blue-100 / bg-green-100. SkillsMap carries an Award indicator, a
  custom glass tooltip ("Xh Ym" / "Z% of day"), the m0e hex map
  (#10B981/#8B5CF6/#F59E0B, fallback #64748B) and a capitalize legend
  with percentage-only right column. `tests/e2e/dashboard.spec.ts` pins
  all of it.
- **The dashboard layout chrome is parity** (session 4): the page
  container is full-bleed `p-4 md:p-6 lg:p-8` (NO max-w — the reference
  measures 1440px at a 1440 viewport); day rows sit in `space-y-1.5`
  (6px gap); calendar cells are default-cursor (the click handler is on
  the parent grid in the reference; the clone keeps invisible role/aria);
  task blocks stack by start-minute. The TaskDialog delete asks
  `window.confirm("Are you sure you want to delete this task?")`. The
  `.custom-scrollbar` globals carry the reference's live cascade
  effective values (height 5px, width 3px, radius-2 track/thumb,
  hover rgba(0,0,0,0.3)) — its three styled-jsx blocks resolve last-rule
  per property.
- **The LOGIN page is live-measured reference behavior, not inferred
  design** (session 5 — the base44 platform screen, all four view states
  DOM-extracted + corroborated): the page canvas is `from-slate-50
  to-slate-100` (NOT the app canvas gradient); the card is `rounded-2xl`
  with a slate top gradient bar (`h-1 from-slate-200 via-slate-300
  to-slate-200`), `backdrop-blur-sm`, `border-0`, and responsive padding
  `p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10`; the logo is the reference's
  real PNG (`public/logo.png`) in a `rounded-full h-20 w-20 sm:h-24
  sm:w-24 ring-4 ring-white/50` circle with a blur halo; the Google
  button is a custom `gap-3 px-5 py-3.5 rounded-xl text-[16px]` button
  (click → self-hosted notice, ADR-002); inputs are `h-11 sm:h-12
  bg-slate-50/50 rounded-xl` with `you@example.com` / `••••••••`
  placeholders; the submit is **`bg-slate-900`** (dark — NOT a sky
  gradient); the footer stacks `flex-col sm:flex-row`; sign-up and
  forgot-password are SEPARATE VIEW states (Back-to-sign-in + h2 +
  smaller `h-10 sm:h-11` inputs, Confirm Password field, "Create
  account" / "Send reset link" / "Check your email" + green alert); all
  errors render the shadcn-style `[role=alert]` card (`bg-red-50/70
  border-red-200 rounded-xl` + `text-red-700`), "Invalid email or
  password" with NO trailing period; below the card sits an empty
  mobile-only spacer. `tests/e2e/auth.spec.ts` pins all of it. Post-login
  lands at `/` (the reference's root dashboard); the reference's email-OTP
  verification view after sign-up is platform email infrastructure and is
  deliberately NOT mirrored (self-hosted: registration completes
  directly).
- **The store carries a `taskVersion` counter** (session 4, mirrors the
  reference's X1e refresh design): bumped by createTask/updateTask/
  deleteTask so the AI sidebar cards re-fetch on mutations; deliberately
  NOT bumped by `completeTask` (the reference's Mark Complete re-fetches
  only itself). `loadingTasks` starts `true` so the sidebar cards
  skeleton from the first paint (bootstrap drops it when
  unauthenticated).
- The seed is idempotent via `is_sample: true` guards + user upsert;
  re-running never duplicates. Sample data belongs to the seed, never to
  the runtime.
- Screenshots for docs live in `docs/screenshots/` and are captured from
  the dev server at 1440×900 (desktop) and 390×844 (mobile) — interactive
  Radix/dialog states need `scripts/capture-screenshots.mjs` (Playwright
  trusted clicks; agent-browser's clicks cannot open Radix on the dev
  build).
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
  sections + appendices: anti-patterns FS-1…FS-16, debugging guide,
  pre-ship checklist, color/z-index references).
- `docs/session_1.md` (build narrative) + `docs/session_1-review.md` +
  `docs/remediation-plan-session1.md` — the session-1 review/remediation
  record (the e2e determinism lessons FS-7/8/9 came from there).
- `docs/session_2.md` (remediation narrative) + `docs/session_2-review.md`
  + `docs/remediation-plan-session2.md` — the session-2 record (the
  Planning decompile lessons: infer-vs-decompile, chip bubbling).
- `docs/session_3-review.md` + `docs/remediation-plan-session3.md` +
  `docs/session_3.md` — the session-3 record (the Quick Actions
  open-panel decompile: FS-12, the textarea default-value locator flake,
  the dead-code alert mirroring, build-bypass removal).
- `docs/session_4-review.md` + `docs/remediation-plan-session4.md` +
  `docs/session_4.md` — the session-4 record (the sidebar-card decompile:
  FS-14, the Mark Twain fallback fix, the format-string bug mirroring,
  the full-bleed container, the residue-cascade lesson).
- `docs/session_5-review.md` + `docs/remediation-plan-session5.md` — the
  session-5 record (the login-page decompile: FS-15, the route guard, the
  root-dashboard route, the 404 page).
- `docs/session_6-review.md` + `docs/remediation-plan-session6.md` — the
  session-6 record (the exhaustive state-matched class-tree diff: the
  Planning Card-vs-Accordion structure, the "Create Task" dialog label,
  the icon-margin family, the icon_sm dead variant, the FS-16
  time-of-day flake).
- `docs/Tailwind-V4-Validation-Report.md` — the source for the trap
  taxonomy; read it before touching `globals.css`.
- `docs/DEPLOYMENT.md` — production deployment (absolute DB path, env
  hardening).
- `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` — the SSH push
  runbook for this repository.
