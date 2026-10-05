# AGENTS.md

Instructions for AI coding agents working in this repository. Every line here
answers: "would an agent likely get this wrong without being told?" —
verified against the toolchain on 2026-10-04/05.

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
| `bun run test` | Vitest unit suites (153 tests: auth crypto, domain constants incl. the skills color map, AI fallback content, db-path v3 — the repo-.env authority rule, .env.example contract, site URL helper, next.config contract, rate-limit window/eviction, wire-format serializers — **pinned to the CAPTURED live reference wire (session 12): created_date/updated_date/is_sample/created_by, 14-key Task / 9-key Note shapes** — and **the duration float-format wire (session 14): integer duration tokens ship as `60.0`, byte-matching the reference's Python-backed entity wire (session-12 P-1 closed)** — **and the date-token wire (session 15, DW-1): server-generated date tokens ship as 6-digit µs — no Z on reads (okWire), Z on creates (okWireCreate) — with start_time/end_time untouched**, the prisma-CLI wrapper contract, **the AI prompt wire (session 13): both InvokeLLM prompts pinned byte-for-byte against the captured request bodies + mocked-SDK wiring pins + the summary route's createdAt-desc order**, **the AI response-parse contract (session 14): the probed schema-shape checks — empty arrays/strings render verbatim, non-string shapes fall back, the quote-only focus guard (RS-1..RS-4)**, **the key-ORDER wire (session 16, KO-1/FS-28): the exact captured emission order — Task start_time-first, Note title-first, all six response surfaces — pinned by `tests/wire-order.test.ts` + the raw-text e2e order pins**, and the seed's sample-week re-anchoring (E-1), **the panel-motion config source pins (session 19, FS-31: the decompiled G1e/W1e/A_e motion contract — durations, eases, delays, keyframes — byte-pinned in QuickActions.tsx + BackgroundBlobs.tsx, incl. the BL-1 0×0 blob mirror)**)) |
| `bun run test:e2e` | Playwright (85 specs): boots the **production standalone** on :3100 with its own `db/e2e.db` — requires a prior `bun run build` |
| `bun run db:push` | Prisma `db push` via `scripts/prisma-cli.ts` (the v3 URL resolution applied; dev schema sync, `--accept-data-loss`) |
| `bun run db:seed` | Idempotent seed: demo user `demo@flowschedule.app` / `demo1234`, 9 tasks, 2 notes |
| `bunx prisma generate` | Regenerate the Prisma client after schema edits |

Clean-check order: `bun run lint && bun run typecheck && bun run test &&
bun run build && bun run test:e2e`. The e2e global setup pushes + seeds
`db/e2e.db` itself; it does NOT touch `db/custom.db`. The production build
fails on type errors by itself (`typescript.ignoreBuildErrors` was removed
in session 3 — `tests/next-config.test.ts` pins that it stays gone).

### The task-list ORDER is parity (session 7, G-1)

The reference's default `fn.Task.list()` returns tasks **createdAt desc**
(newest first — live-verified: creating Alpha→Beta→Gamma→Delta renders
[Delta, Gamma, Beta, Alpha]). The clone's `GET /api/tasks` matches with
`orderBy: { createdAt: "desc" }` — do NOT "fix" it to startTime asc: the
Planning day-card chips (`slice(0,3)` + "+N more") and the selected-day
task list render the array AS RETURNED, so the order decides which chips
are visible. Order-independent by design: the StatusCard sorts by
start_time itself, the Log Activity panel sorts by end_time desc, and the
calendar blocks are absolutely positioned. The store's `createTask`
**prepends** (the reference's dialog save refetches → newest first);
`updateTask`/`deleteTask` are position-neutral.

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
- **Bun auto-loads `.env` from parent directories too, and harness shells
  can export `DATABASE_URL` directly** — either one used to win over this
  repo's relative value (the session-1..8 quirk: the dev DB silently lived
  OUTSIDE the repo, at the parent path). **db-path v3 (session 9) made the
  repo's own `.env` authoritative**: an ambient SQLite `file:` URL that
  resolves outside the repo is IGNORED; an ambient URL resolving INSIDE
  the repo (the e2e suite's `db/e2e.db`) or a non-SQLite URL (production
  PostgreSQL) still wins. `src/lib/db-path.ts` implements the rule
  (`chooseEnvSource`/`repoEnvDatabaseUrl`, pinned by `tests/db-path.test.ts`);
  the CLI-facing db scripts (db:push/db:migrate/db:reset) apply it via
  `scripts/prisma-cli.ts` (prisma's own dotenv never overrides an
  existing process-env value).
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
- **The ui primitives carry NO `data-slot` attributes** (session 10,
  F-1): the reference's DOM never emits them (attribute-inventory-
  verified on its idle dashboard, open TaskDialog, and open menus) — the
  shadcn generator's data-slot markers are inert leftovers of the modern
  generator and were removed from all 9 primitives (24 sites; the badge
  was already the classic form). A dashboard e2e spec pins
  `[data-slot]` count 0 on the idle page AND the open dialog. Do not
  re-add them when pulling new shadcn components — and note the
  evidence method: the class-tree diffs extract only `class`, so
  ATTRIBUTE-level divergences need attribute-inventory diffs
  (FS-20).
- **Log Activity's relative times use `formatDistanceToNowStrict`**
  (session 10, F-2): the reference's H1e calls the STRICT date-fns
  variant (decompile: its token table picks plain `xHours`/`xDays` with
  Math.round) — "3 hours ago"/"in 2 days", never the non-strict
  "about 3 hours ago"/"in 1 day". Same evidence discipline as the
  session-4 format-string bug: the reference's exact formatter IS the
  contract; an e2e spec pins the strict wording (a 3h-past end_time).
- **The TaskDialog title input carries NO `maxLength`** (session 10,
  F-3): the reference's inputs are uncapped client-side; the clone's
  300-char title guard lives ONLY in the API routes (self-hosted write
  validation — the login-rate-limiter evidence class). The e2e pins
  `#title` has no maxlength attribute.
- **Log Activity's top-5 slice is a PIN, not a suggestion** (session 11,
  G-1): the reference's H1e filter is `d.status==="completed" ||
  d.end_time && Wc(d.end_time) < l` — decompile-verified, including the
  NULL guard (a quick-added task has no end_time and is excluded on BOTH
  apps) and the once-per-mount `now` capture. Live-diffed with 7
  qualifying items: both apps render exactly the newest 5 and cut the
  6th/7th (cross-week included). The e2e pins the SATURATED list (count
  5, end_time-desc DOM order, the cut items absent from the panel) —
  a member-level seed can never catch a slice regression.
- **The Brainstorm no-op + ordering are pinned behavior** (session 11,
  G-2/G-3): the empty-content save is a no-op on both apps (live), and
  the multi-note list is newest-first on both. Mutation evidence: the
  clone's empty-save no-op is enforced SERVER-side (`/api/notes`
  VALIDATION) — the client `content.trim()` guard is defense-in-depth —
  and the rendered note order is server-driven (the save flow's
  `refreshNotes()` re-fetch); the pins guard the BEHAVIOR surface, which
  is the parity contract, not the implementation seam.
- **Relative-word pins must sit far from unit boundaries** (session 11,
  P-1): a 23h59m-past end renders "24 hours ago" (the hour band rounds
  23.98 → 24) and flips to "1 day ago" one minute later — both STRICT
  behavior; only the OBSERVATION TIME moved. Pin distances ≥ hours from
  a band edge (the G-1 spec uses +40h/−6h/−30h…).
- **recharts is PINNED to 2.15.x** (session 7, G-3): the reference's
  SkillsMap DOM is the recharts 2.x shape (its bundle contains ZERO
  `recharts-zIndex` strings; the tooltip wrapper is a sibling AFTER the
  svg; no `g.recharts-shape` wrappers). recharts 3 emits 12 empty zIndex
  layer groups + shape wrappers + a pre-svg tooltip + an extra wrapper
  DIV — visually identical, DOM-different. A dashboard e2e spec pins the
  2.x shape; do NOT bump the major without re-diffing the reference's pie
  DOM.
- **The Badge primitive is the CLASSIC shadcn form** (session 7, G-4): a
  `<div>` (forwardRef) with `focus:ring-2 focus:ring-ring
  focus:ring-offset-2` in the base and `shadow`/`hover:bg-*` on the
  variants — the reference's Z1e/W$. Do NOT modernize it to the
  data-slot `<span>` form; the Planning chips and task items render DIV
  badges with exactly those classes (live-measured).
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
- **The animate utility classes are LIVE CSS, not decoration** (session 8,
  G-1): `globals.css` imports `tw-animate-css` right after Tailwind — the
  dialog/dropdown/select `data-[state=open]:animate-in …
  slide-in-from-top-[48%]` classes were previously DEAD STRINGS (the
  package was installed but never imported; the built stylesheet carried
  zero rules for them, so nothing animated). The reference's dialog
  animates (0.15s enter). Removing the import silently reverts to
  instant-open — the e2e pins the computed `animation-name: enter`.
- **lucide-react is PINNED to 0.475.x** (session 8, G-2): the reference's
  bundle banner says `lucide-react v0.475.0` and its factory emits exactly
  ONE class per icon. 0.525+ emits TWO for renamed icons (the clone
  rendered `lucide lucide-trash2 lucide-trash-2` vs the reference's
  `lucide lucide-trash2`), and its icon NODES differ (LogOut as
  path+path vs the reference's polyline+line). Do NOT bump lucide without
  re-diffing the reference's icon DOM.
- **The dialog/select primitives are the CLASSIC shadcn forms** (session
  8, G-3 — the session-7 Badge family continued): DialogContent uses
  `left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]` + the four
  slide-in/out classes + `sm:rounded-lg`; DialogTitle's base carries
  `tracking-tight`; SelectTrigger's placeholder styling is
  `ring-offset-background data-[placeholder]:text-muted-foreground` (NOT
  the modern `placeholder:` variant); SelectContent carries the side
  `slide-in-from-*` classes. Do not "modernize" any of them.
- **Geometry-measuring specs must settle animations first** (session 8,
  E-C): Playwright's `boundingBox()` includes transforms, and the Radix
  open-state elements animate for 150ms. `mobile-navigation.spec.ts`
  waits for `getAnimations()` to finish before measuring — keep that
  pattern for any new animated-surface measurement (the reference's own
  measurements always settled via its waits).

## Conventions that differ from defaults

- **The task/note wire format is the reference's CAPTURED entity shape in
  BOTH directions** (session 12, W-1..W-4 — XHR-intercepted from the live
  reference's own base44 traffic): responses ship
  `created_date`/`updated_date` (NOT created_at/updated_at — session 8's
  inferred names were wrong and got renamed), plus `is_sample`,
  `created_by` (the session user's email) and `created_by_id`
  (`serializeTask(task, author)`/`serializeNote(note, author)` in
  `src/lib/serialize.ts` — the 14-key Task / 9-key Note shapes are
  unit-pinned with exact key sets). Requests: the TaskDialog submits
  `end_time` CLIENT-COMPUTED (the reference's decompiled f function:
  end = start + duration*60000) and the description VERBATIM ("" stays
  "" — a null description means the field was absent, i.e. quick-added);
  the API accepts an optional caller-supplied `end_time` (validated —
  invalid dates fail) and falls back to deriving it from start+duration
  for callers that send none. Notes' `tags` are an ARRAY on the wire
  (capture-confirmed: the reference's responses carry `"tags":[]`);
  the storage JSON string is unwrapped by `serializeNote`. The
  clone-internal camelCase fields (isSample/userId) NEVER cross to the
  wire. The store's `mapTask`/`mapNote` consume the wire shape directly
  — they remain the only conversion seam (wire → typed client).
- **A captured wire beats an inferred wire (FS-23)**: when a contract's
  field NAMES are the deliverable, patch the XHR layer inside the
  logged-in reference page and read the actual JSON — decompile tells
  you what the code SENDS; only the wire tells you what the server
  RETURNS. The proof of zero consumers (bundle + repo searched) is
  what makes a field rename safe.
- **The prompt IS the wire (FS-24, session 13)**: the two InvokeLLM
  request bodies are parity surfaces pinned BYTE-FOR-BYTE in
  `src/lib/ai-prompt.ts` (`DAILY_FOCUS_PROMPT` +
  `buildAiSummaryPrompt`) — the reference's template literals are
  indented inside their functions, so the "blank" lines carry 8
  spaces, every task line is indented, consecutive tasks are joined
  `\n        - …\n        `-style (an 8-space line AND an empty line
  between), item 3 carries a trailing space, and the prompt ends with
  a 6-space line. Do NOT "clean up" the whitespace —
  `tests/ai-prompt.test.ts` pins the exact captured bytes and a
  mocked-SDK wiring pin verifies the bytes reach
  `chat.completions.create`. The summary route feeds the builder
  fn.Task.list()'s default order (createdAt desc — capture-proven:
  the newest-created task is listed first, NOT the earliest start).
- **The seed re-anchors its sample week (E-1, session 13)**: the
  calendar always renders the CURRENT week, so a database seeded last
  week has invisible sample tasks — the seed deletes and re-creates
  the `is_sample` rows when their week went stale
  (`src/lib/sample-week.ts`, unit-pinned; user rows never touched;
  within-week reruns stay no-ops). Any new "seed-relative" assertion
  must be week-rollover-aware (the FS-16 family, week granularity).
- **The response is the wire too (FS-26, session 14)**: the LLM
  response-parse seam checks SHAPE, not truthiness — the reference's
  contract (probed live with the XHR response-override harness) is
  schema-INVALID → the catch/fallback, schema-VALID-but-empty →
  rendered VERBATIM: empty mood/insights render empty `<p>`s, empty
  focus_areas/activities arrays render ZERO chips, empty-string items
  render empty chips, and the daily-focus guard is quote-ONLY
  (`a && a.quote` — empty author renders "- "). `tests/ai-response.test.ts`
  pins all five probed classes with the mocked-SDK pattern. Do NOT
  re-tighten the parse with truthiness or `length > 0` filters —
  that conflates "empty" (valid, renders) with "invalid" (falls
  back).
- **The duration wire is float-formatted (session 14, session-12
  P-1 closed)**: the reference's Python backend emits
  `"duration_minutes":60.0` as raw JSON float text (token-extracted
  from its own Task list). The task routes' responses serialize via
  `okWire` (`src/lib/api.ts`) — `floatFormatDurations`
  (`src/lib/serialize.ts`) post-processes the envelope text; null and
  already-fractional tokens pass through; escaped string content is
  regex-safe (the `"` escaping differs from the property token).
  Parsed JSON reads 60.0 and 60 identically — the e2e pins the RAW
  text form. Do NOT switch other routes to `okWire`.
- **The date-token wire is µs-formatted, route-keyed (session 15,
  DW-1 / FS-27)**: the reference's Python backend serializes its
  SERVER-GENERATED datetimes (created_date/updated_date) at 6-digit
  microsecond precision — POST create responses WITH Z
  (`"created_date":"…297127Z"`), GET list + PUT/PATCH update
  responses WITHOUT Z (`"created_date":"…297000"`, the PUT's
  updated_date carrying fresh µs) — probed on all six Task/Note
  surfaces. The clone reproduces the FORMS at the same okWire text
  seam: `formatWireDates(json, mode)` pads the 3-digit ms token to 6
  digits and strips/keeps the Z per mode. `okWire` = read mode (GET /
  PATCH tasks + notes); `okWireCreate` = create mode + default 201
  (POST tasks + notes). start_time/end_time (client-supplied dates —
  ms+Z on the reference too) are NEVER touched — the regex keys on
  the property names. The digits beyond ms are `.000` (SQLite and the
  JS clock store milliseconds — form parity, storage-precision
  residual, the `60.0` class). The client keeps the strings opaque
  (mapTask/mapNote pass them through; zero consumers parse them).
  A mutation-harness lesson from this session: after ANY mutation
  run, re-run the pin suite to prove the tree was restored — a
  `git diff --stat` is NOT enough (the first harness's per-mutation
  backup corrupted api.ts when two mutations touched the same file;
  the build compiled the corrupted tree and the e2e caught it).
- **The KEY ORDER is part of the wire contract (FS-28, session 16)**: the
  reference's platform emits a CONSISTENT captured order on every entity
  response surface (GET/POST/PUT, both entities — probed live):
  Task `start_time, duration_minutes, end_time, description, title,
  priority, category, status, id, created_date, updated_date,
  created_by_id, created_by, is_sample`; Note `title, content, tags, id,
  created_date, updated_date, created_by_id, created_by, is_sample`.
  `serializeTask`/`serializeNote` emit in that order (JSON.stringify
  preserves string-key insertion order; the okWire transforms are
  order-agnostic substitutions). Consumers read by name — the order is
  a byte-parity surface, not a behavioral one; the existing sorted-set
  pins stay green, the exact-order pins live in
  `tests/wire-order.test.ts`, and the e2e pins the raw text
  (`"tasks":[{"start_time":` …). Do NOT "helpfully" re-sort or
  re-serialize the literals.
- **end_time is stored AS SUBMITTED (session 16, ET-1)**: the reference
  does NOT derive it server-side — a POST with start_time + duration
  but no end_time stores `end_time: null` (probed live; the task is
  EXCLUDED from Log Activity by the H1e null guard, exactly like a
  quick-added task), and its PUT is PARTIAL (Mark Complete probed:
  `PUT {"status":"completed"}` — nothing else changes; a start/duration
  change without end_time does NOT recompute it). The clone's POST/PATCH
  routes match: an omitted end_time stays null (create) / unchanged
  (update); a supplied one still validates. The dialog ALWAYS sends
  end_time client-computed (the W-3 pin) — no app flow changes; do NOT
  re-add a "convenient" server-side derivation.
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
  **The day cards are plain clickable DIVs** (session 9, F-2 — live-measured:
  `p-4 rounded-2xl border cursor-pointer transition-all duration-200 …`
  with onclick and NO role/tabindex/aria, NOT buttons, NO `text-left`):
  keyboard access is the reference's own behavior (none) — documented
  acceptance, same class as its decorative Filter button. The e2e pins
  the div shape (`div.p-4.cursor-pointer` locators).
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
  end_time via `formatDistanceToNowStrict` — session 10 F-2 — no
  action buttons); Brainstorm supports note EDITING with
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
- The seed is idempotent via `is_sample: true` guards + user upsert
  WITHIN a week; across a week boundary it RE-ANCHORS (session 13,
  E-1): the scheduled sample rows are deleted and re-created on the
  current week (the calendar always renders the current week — a
  stale sample week means invisible seeds and 12 failing e2e specs;
  `src/lib/sample-week.ts` decides, unit-pinned). User rows
  (is_sample: false) are never touched. Sample data belongs to the
  seed, never to the runtime.
- Screenshots for docs live in `docs/screenshots/` and are captured from
  the dev server at 1440×900 (desktop) and 390×844 (mobile) — interactive
  Radix/dialog states need `scripts/capture-screenshots.mjs` (Playwright
  trusted clicks; agent-browser's clicks cannot open Radix on the dev
  build).
- ESLint config intentionally relaxes several rules for AI-generated code
  ergonomics, but `react-hooks/set-state-in-effect` remains an ERROR —
  it has caught two real cascading-render bugs in this codebase.
- The e2e's Mark Complete spec must scope its post-click locator to
  EITHER StatusCard state (session 7, F-2): after completing the last
  upcoming task the card's heading CHANGES from "Next Up" to "All caught
  up!" — a "Next Up"-only filter makes the locator vanish and the negated
  assertion fails with "element(s) not found" (a state-transition flake
  that only bites after the day's last seeded task has started; sessions
  4–6 passed because their runs predated it). The mobile menu is pinned at
  390×844: trigger 338/14/36×36, menu 182/54/192×164, items [Profile,
  Settings, Logout] (re-pinned every session — no Tailwind v4 regression
  has ever been found; the measurement waits for the menu's enter
  animation to finish, session 8 E-C).

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

**Viewport bands (session 17, VP-1/FS-29):** the band flip itself is
pinned by `tests/e2e/viewport-breakpoints.spec.ts` — at the EXACT md
edge (768×900) and at 1024×900 the desktop nav must be visible and the
mobile trigger container `display:none` (asserted via computed style,
NOT toBeHidden — display is the Tailwind contract under test), and
`documentElement.scrollWidth === clientWidth` must hold at
390/768/1024/1440 (the no-horizontal-overflow invariant — the Tailwind
v4 responsive-class regression guard). The body-class pin in the same
file locks the reference's classless `<body>` (BD-1: no rendering-hint
utilities like `antialiased` on the RootLayout body).

**Focus Timer timed interactions (session 18, FT-1/FS-30):** the W1e
timed contract is pinned by `tests/e2e/focus-timer.spec.ts` — the
pause display SNAPS to the full duration + the minutes input
reappears; resume RESTARTS from full (not the paused continuation);
an edit while paused moves the display immediately; the completion
path (via `page.clock` `runFor` — NOT `fastForward`, which fires each
due timer at most once and pauses the clock; install BEFORE goto)
ends at the TERMINAL 00:00 display with the alert "Focus session
complete!"; close/reopen resets to the fresh 25:00 idle state. The
implementation seam: the display is the `remaining` STATE in
`QuickActions.tsx`'s FocusTimerPanel (the snap-to-full lives in the
TOGGLE handler, both directions — never in the completion path; a
derived `running ? remaining : minutes*60` display reintroduces FT-1
at the completion edge).

**Reference-account hygiene (the verify-don't-trust rule):** re-list
the reference account's entities at every session START (a prior
session's cleanup claim is not evidence) and re-verify after probes;
the standing state is 9 parity tasks + 3 notes.

## Reference

- `Project_Architecture_Document.md` — the full engineering reference
  (ADRs, layer model, all five Tailwind v4 traps with fixes, the
  verification ledger).
- `flow-schedule_SKILL.md` — the distilled engineering skill (20
  sections + appendices: anti-patterns FS-1…FS-18, debugging guide,
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
- `docs/session_7-review.md` + `docs/remediation-plan-session7.md` — the
  session-7 record (the POPULATED-state diff: the createdAt-desc task
  ordering, the store prepend, the recharts 2.x pin, the classic Badge
  form, the state-transition locator flake).
- `docs/session_8-review.md` + `docs/remediation-plan-session8.md` — the
  session-8 record (the edit-mode dialog diff: the dead animate classes
  + the tw-animate-css import, the lucide 0.475 pin, the classic
  DialogTitle/SelectTrigger/DialogContent forms, the snake_case response
  serializer).
- `docs/session_9-review.md` + `docs/remediation-plan-session9.md` — the
  session-9 record (the environment-authority fix: db-path v3 — the
  repo's own .env wins over parent-workspace/harness ambient URLs, the
  prisma-CLI wrapper; the day-card div conversion — Planning is now
  100% class-tree identical; the open-Select-listbox item-state diff;
  both LLMs observed live).
- `docs/session_10-review.md` + `docs/remediation-plan-session10.md` —
  the session-10 record (the Focus Timer running-state + populated Log
  Activity diffs; F-1 the data-slot removal + the FS-20
  attribute-inventory method; F-2 the strict relative-time formatter;
  F-3 the title-input maxLength removal; the completion alert
  live-verified on the reference).
- `docs/session_11-review.md` + `docs/remediation-plan-session11.md` —
  the session-11 record (the >5-item Log Activity top-5-slice live diff +
  the H1e null-guard decompile; the Brainstorm deeper-state diffs; the
  three pin specs G-1/G-2/G-3 with mutation evidence; the enforcement-
  layer lesson; the 24 h band-boundary lesson).
- `docs/session_12-review.md` + `docs/remediation-plan-session12.md` —
  the session-12 record (the quick-added-task surfacing parity — the
  probe is invisible on BOTH apps, every surface enumerated; the
  capture-verified tags array; the four wire-contract fixes W-1..W-4
  from the live XHR interception: created_date/updated_date,
  is_sample/created_by/created_by_id, the dialog's client-computed
  end_time, the verbatim description; FS-23).
- `docs/session_13-review.md` + `docs/remediation-plan-session13.md` —
  the session-13 record (the InvokeLLM prompt/schema diff: the
  daily-focus prompt byte-identical, the AI-summary prompt + order
  fixed from the captured request bodies — L-1..L-5; the SDK-auth
  header capture unlocking direct entity round-trips; the seed's
  stale-week re-anchor E-1 found by the gate at the Sunday→Monday UTC
  rollover; FS-24).
- `docs/session_14-review.md` + `docs/remediation-plan-session14.md` —
  the session-14 record (the InvokeLLM RESPONSE-side paired-probe
  audit via the XHR response-override harness: the five probes, the
  RS-1..RS-4 schema-shape parse fixes, the quote-only focus guard;
  session-12 P-1 closed — the float-formatted duration wire via
  `okWire`; FS-26).
- `docs/session_16-review.md` + `docs/remediation-plan-session16.md` —
  the session-16 record (the entity wire KEY ORDER closed — KO-1/FS-28:
  the captured emission order on every response surface, the exact-order
  serializer pins + the raw-text e2e order pins; the end_time derivation
  removed — ET-1: the reference stores it as submitted, the partial-PUT
  semantics probed via Mark Complete; the mobile menu re-measured live
  again — identical; the transport-layer ruling: the envelope/status/
  method names are the documented self-hosted design, the update
  SEMANTICS are identical).
- `docs/session_15-review.md` + `docs/remediation-plan-session15.md` —
  the session-15 record (the failure-path paired probe closing the
  last AI surface — the reference's 429 catch renders the same Mark
  Twain set; the entity DATE-token wire — DW-1/FS-27: µs forms,
  route-keyed Z — closed via `formatWireDates`/`okWireCreate`; the
  mutation-harness backup lesson; the live mobile-menu re-measure
  matching the pins exactly).
- `docs/Tailwind-V4-Validation-Report.md` — the source for the trap
  taxonomy; read it before touching `globals.css`.
- `docs/session_19-review.md` + `docs/remediation-plan-session19.md` —
  the session-19 record (the framer-motion animation-timing pass at
  four evidence levels; BL-1 — the dead `w-100` blob mirrored by its
  rendered 0×0; the panel-animation pin family; FS-31).
- `docs/DEPLOYMENT.md` — production deployment (absolute DB path, env
  hardening).
- `docs/how-to-git-push-using-ssh-wrapper_SKILL.md` — the SSH push
  runbook for this repository.
