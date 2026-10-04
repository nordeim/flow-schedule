# Remediation Plan — Session 9 (2026-10-04/05)

Session-9 review of the FlowSchedule clone (base commit `e4c66e8` — the
session-8 remediation `8a6d9f7` plus the operator's "update prompts" commit)
after a fresh `git clone` (the workspace was reset). The `skills/` folder is
excluded from code checking, testing and compilation per the operating
instructions (eslint ignores `skills`, tsconfig excludes `skills`, vitest
includes only `src/` + `tests/` — all three verified this session).

Skills used this session: `agent-browser` (login + live state-matched
class-tree diffing on BOTH apps — dashboard/planning/profile/settings at
desktop AND mobile, the open Select listbox item states, the mobile + desktop
menu re-pins), `clone-app-pat-pro` (the parity method: measured facts, not
preferences), `tdd`/`tdd-workflow` (red → green), and
`verification-and-review-protocol` (executed evidence only).

## 1. Audit scope and method

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | fresh `git clone` (workspace reset); `bun install`; `.env` + `db/` recreated per the operator's instruction; `db:push` + `db:seed` | ✅ clean tree, main @ e4c66e8 |
| Docs ↔ code alignment | Re-read the five root docs + session_8-review.md + remediation-plan-session8.md + worklog.md + session_9.md; full gates re-executed at base | ✅ aligned — lint ✓ · typecheck ✓ · 66/66 unit · build ✓ (19 routes) · **63/63 e2e** · smoke 30/30 |
| Session-8 remediation (`8a6d9f7`) | Code spot-check: `@import "tw-animate-css"` in globals.css, lucide-react ^0.475.0, classic DialogContent/DialogTitle/SelectTrigger/SelectContent, `src/lib/serialize.ts` wired into all 4 task/note routes | ✅ all in place; the 5 session-8 e2e pins held (63/63) |
| Reference login | agent-browser trusted clicks on `…/login` (`sepnetflix2023@outlook.com`) | ✅ session held; the account is at the TRUE 0-task baseline (session 8's cleanup held) |
| **Dashboard (desktop 1440×900)** | State-matched class-tree diff (an empty `parity-empty@flowschedule.app` user registered in the clone to match the reference's 0-task state) | ✅ **761/761** — only the 3 documented styled-jsx `<style>` nodes differ (reference-only, effective values carried in globals.css since session 4) |
| **Dashboard (mobile 390×844)** | Same dump at the mobile viewport | ✅ 761/761 + the same 3 style nodes |
| **Planning (unselected)** | Class-tree diff | ⚠️ 63/63 modulo **F-2** (7 day-cards: reference `div` vs clone `button` + `text-left`) |
| **Planning (day-selected)** | Day-card click on both apps, dump, diff | ⚠️ 98/98 modulo the same F-2 (all 7 day-cards, both highlight states) |
| Profile / Settings | Class-tree diffs | ✅ **26/26** and **39/39** — byte-identical |
| **Mobile menu (highest regression risk)** | Live re-measurement on BOTH apps at 390×844 (trusted clicks, animation settled) + navigation round-trip (Profile → /Profile) | ✅ trigger 338/14/36×36 both; menu 182/54/192×164, right 374; items [Profile, Settings, Logout]; computed `animation-name: enter` on both — **no Tailwind v4 regression** |
| Desktop avatar menu | Live re-measurement on BOTH apps at 1440×900 | ✅ trigger 1252/14/76×36, menu 1136/54/192, right 1328 — identical (session-7 measurements hold) |
| **Open Select listbox item states (never diffed — session 8's suggestion)** | Create-dialog → priority Select open on BOTH apps; full item/indicator class + data-state dump | ✅ **byte-identical** — listbox content, all 4 item class strings, the `absolute right-2 flex h-3.5 w-3.5` indicator spans, `checked` on Medium |
| AI cards | Live probe on BOTH apps | ✅ both apps' LLMs are LIVE (reference: a Paul J. Meyer quote — LLM content, not the fallback; clone: a Walt Disney quote via the z-ai SDK); the reference's empty-day summary fallback renders verbatim (`planning/Free day/Open schedule/…`); content is non-deterministic by design — the fallback STRUCTURE stays the unit-pinned contract |
| globals.css trap pins | Read + repo-wide Trap 4 scan (space-y with mt/mb children) | ✅ tw-animate-css import present; hsl() tokens; the flagged spots are false positives (grandchildren/siblings, not direct children) |
| Test configs (vitest + playwright) | Config read + full runs | ✅ vitest picks up `*.test.ts` only (src/ + tests/); playwright boots the production standalone on :3100 with `db/e2e.db`; 63/63 green |
| Env contract | `.env` = `DATABASE_URL="file:../db/custom.db"`; `db/` at the repo root (custom.db seeded + e2e.db); `.env.example` present | ⚠️ **F-1** — the environment hijacks the resolution (below) |

## 2. Issues, bugs and gaps found

### F-1 (High — environment/infrastructure): the repo's database location is not authoritative in a parent-workspace environment

The operator's instruction this session: "Edit `.env` so that
`DATABASE_URL="file:../db/custom.db"` — the `db/` folder should be placed
at the root folder of the flow-schedule repo codebase; then change the
relevant code files to reference the database in the right folder."

The repo's `.env` and every code reference (db-path.ts's default,
prisma/seed.ts, the e2e global-setup, playwright.config.ts's
`file:../db/e2e.db`) already point at `<repo>/db/`. But the RUNTIME
resolution is hijackable: this workspace injects
`DATABASE_URL=file:/home/z/my-project/db/custom.db` (absolute, pointing
OUTSIDE the repo) into every shell, and Bun's parent-directory `.env`
auto-loading (documented in AGENTS.md since session 1) does the same in any
workspace that carries a parent `.env`. Under the current db-path contract
("absolute `file:` URLs pass through untouched"), that ambient URL WINS for
`bun run dev` (Next.js env priority: process.env > .env), `bun run db:push`
(Prisma's dotenv never overrides an existing process var) and
`bun run db:seed` — all three were reproduced this session: the first
`db:push`/`db:seed` created and seeded `/home/z/my-project/db/custom.db`
(the parent), NOT `<repo>/db/custom.db`, and a dev server started without
`env -u DATABASE_URL` points at the parent path (a missing file → Prisma
"Unable to open the database file" on every query).

Consequences (all reproduced):
1. The dev DB silently lives outside the repo — exactly what the operator's
   instruction now forbids — and is lost on every workspace reset.
2. `db:push` and `db:seed` disagree with the e2e suite (which passes an
   explicit in-repo URL and therefore works): one repo, two database files.
3. A dev server booted in a polluted shell fails every API query.

**Fix (db-path v3 — the repo's own `.env` is authoritative):** when the
schema-owning repo has its own `.env` defining `DATABASE_URL`, that value
takes precedence over an ambient process-env URL that resolves OUTSIDE the
repo (the parent-workspace hijack). An ambient URL that resolves INSIDE the
repo still wins (the e2e suite's deliberate `file:../db/e2e.db` isolation
override). When the repo `.env` does not define `DATABASE_URL`, the ambient
value wins unchanged (the production env-var flow). Absolute URLs still
pass through for whichever value wins. The prisma CLI path gets the same
rule via a small bun wrapper (`scripts/prisma-cli.ts`) that resolves the
URL with db-path and spawns `prisma <args>` with the corrected environment
(`db:push`, `db:migrate`, `db:reset` in package.json point at the wrapper);
`db:seed` already self-resolves (it imports db-path).

### F-2 (Medium — byte parity): the Planning day-card is a `button` with `text-left`; the reference renders a plain `div`

The last remaining live class-tree divergence (session 7 documented it as
"the day-card div/button difference"; it survived because a button buys
keyboard access). Measured this session on BOTH apps:

- REFERENCE: `<div class="p-4 rounded-2xl border cursor-pointer
  transition-all duration-200 bg-white/50 border-slate-200
  hover:bg-slate-50">` — `onclick`, **no** role/tabindex/aria,
  `cursor: pointer`, `text-align: start`.
- CLONE: `<button class="p-4 rounded-2xl border cursor-pointer
  transition-all duration-200 **text-left** bg-white/50 …">` — the extra
  `text-left` compensates the button's default centering.

The divergence is visible in every class-tree dump (7 day-cards × unselected
+ selected states) and in the a11y tree (button vs generic). Per the
project's own constitution ("fidelity to the reference is the product";
AGENTS.md "Anything that 'improves' the reference's visuals is a
regression") and the calendar-cell precedent (the reference's cells are
default-cursor divs with the handler on the parent; the clone mirrors the
visible DOM and keeps only invisible role/aria), the day-card becomes the
reference's exact div form — `cursor-pointer` class + onClick, no
`text-left`, no role/tabindex (the a11y tree then matches the reference's
`generic … [cursor:pointer, onclick]` exactly). Keyboard parity is the
reference's own behavior (none) — an accepted, documented consequence, same
evidence class as the reference's decorative Filter button.

Scope: `src/app/(app)/Planning/page.tsx` (the day-card element) +
`tests/e2e/planning.spec.ts` (the `button.p-4` locators → the reference's
div shape; 6 locator sites).

### F-3 (Low — docs): the parent-.env narrative inverts with F-1

AGENTS.md ("Bun auto-loads `.env` from parent directories too — a workspace
parent `.env` … wins"), README's Environment Variables table, PAD §4.3 and
DEPLOYMENT.md all describe the OLD behavior (ambient/absolute wins). After
db-path v3 the repo's own `.env` is authoritative; the docs must say so and
the production guidance becomes "put the absolute path IN the repo's `.env`
(or unset DATABASE_URL there and use the env var)".

### P-1 (observed, no action): the reference's Daily Focus shows LLM content, not the fallback

The reference currently renders a Paul J. Meyer quote — its InvokeLLM is
LIVE (the session-4 "Mark Twain fallback" claim is about the bundle's catch
block, which still holds; the LLM simply succeeded). The clone's SDK also
responded (a Walt Disney quote) — the first session where BOTH live LLMs
were observed working. No code change: content is non-deterministic by
design; the fallback structure stays unit-pinned. Recorded for the ledger.

## 3. TDD execution order

**unit/e2e (RED) → implementation (GREEN) → gate → live parity → docs.**

### E-A unit pins (extend `tests/db-path.test.ts`)

New cases for the v3 priority rule (pure, fixture-based — the resolution
function gains an optional repo-env source):
1. "the repo's own .env DATABASE_URL wins over an ambient absolute URL that
   resolves outside the repo" (RED: v2.3 passes the absolute through).
2. "an ambient URL resolving inside the schema repo still wins (e2e
   isolation)" (RED: v2.3 has no repo-env concept; assert the SAME pass
   -through behavior so the e2e contract cannot regress).
3. "no repo .env DATABASE_URL → the ambient value wins (production flow)".
4. "repo .env DATABASE_URL present + no ambient → the repo value resolves
   (relative anchored to the schema repo)".
5. The wrapper contract: `scripts/prisma-cli.ts` exists and package.json's
   db:push/db:migrate/db:reset route through it (a package.json content
   test in the next-config/env-example family).

### E-B e2e pins (extend `tests/e2e/planning.spec.ts`)

1. "day cards are the reference's clickable divs (F-2)": seven
   `div.p-4.rounded-2xl.cursor-pointer` day-cards exist; ZERO `button.p-4`
   day-cards; a sample card's class attribute contains exactly the
   reference's class string (no `text-left`, has
   `cursor-pointer`+`transition-all`+`duration-200`); the card has no
   role="button" (a11y-tree parity). RED: the current build renders buttons.
2. The existing day-card interaction specs (selection, highlight, chip
   bubbling) keep passing after the locator updates — the coverage net for
   the div conversion.

### GREEN (implementation)

1. `src/lib/db-path.ts` (v3): add `repoEnvDatabaseUrl(repoRoot)` (a tiny
   `.env` reader — no new dependency: split lines, match `^DATABASE_URL=`,
   strip quotes/comments) + the priority rule in
   `resolveProcessDatabaseUrl()`; `resolveDatabaseUrl` stays pure (the
   priority decision is computed from explicit args so the unit tests stay
   fixture-based).
2. `scripts/prisma-cli.ts` + `package.json`: `db:push` / `db:migrate` /
   `db:reset` run through the wrapper (`bun scripts/prisma-cli.ts db push
   --accept-data-loss` etc.); the wrapper resolves the URL via db-path v3
   and spawns `bunx prisma …` with the corrected env. `db:seed` is already
   self-resolving.
3. `src/app/(app)/Planning/page.tsx`: the day-card `button` → the
   reference's `div` (drop `text-left`, keep onClick + the highlight
   conditional classes).
4. `tests/e2e/planning.spec.ts`: `button.p-4` locators →
   `div.p-4.rounded-2xl` (scoped to main; hasText EEE as today).

### Gate

`bun run lint && bun run typecheck && bun run test && bun run build &&
bun run test:e2e` + `scripts/smoke-test.sh` (30/30) — with the DB
environment now self-correcting, the gates run WITHOUT `env -u DATABASE_URL`
(the v3 rule must make the polluted shell irrelevant — that is the point).

### Live parity re-verification (agent-browser, both apps)

- The Planning class-tree re-diff (unselected + day-selected): the day-card
  diff count drops to ZERO (expect 63/63 and 98/98 clean, modulo nothing).
- The dashboard re-diff stays 761/761 + 3 style nodes.
- The mobile menu re-pin (338/14/36×36 + 182/54/192×164) after the changes.
- The dev server boots in a POLLUTED shell and serves the seeded repo DB
  (login + /api/health + a task round-trip) — the F-1 acceptance.
- `bun run db:push` / `db:seed` in a polluted shell target `<repo>/db/`
  (file mtimes + counts) — the F-1 CLI acceptance.

### Screenshots

Re-capture the full set via `scripts/capture-screenshots.mjs` (the
Planning captures 03/09/10 show the day-card divs).

### Docs

README (env-var table + db/ + counts), AGENTS.md (the parent-.env quirk
rewrite → the v3 authority rule + the day-card note + session-9
references), CLAUDE.md (stack + counts), PAD (§4.3 rewrite, §12 ledger
rows), flow-schedule_SKILL.md v1.8.0 (the env-authority lesson + FS-19:
"environment contracts must be pinned where they are consumed — a pass-
through seam is a policy vacuum"), `.env.example` (the v3 contract), this
plan's execution record, `docs/session_9-review.md`, worklog.

### Deliver

Single commit on `main`, pushed via `docs/ssh_git_wrapper_v3.py` per
`docs/how-to-git-push-using-ssh-wrapper_SKILL.md`. No new branches.

## 4. Non-goals (deliberately not changed)

- The three reference-only styled-jsx `<style>` nodes (documented
  equivalence since session 4 — effective values live in globals.css).
- The LLM content non-determinism (by design; both LLMs live this session —
  P-1 records the observation).
- The dropdown-item class ORDER (session 8 P-2 — same set, style-neutral).
- The Focus Timer completion alert ("Focus session complete!" — decompile +
  one-off-Playwright verified, session 3; ~65s is too slow for the suite).
- The reference's `created_date` Note sort-field naming (wire ships
  `created_at`, the repo's documented contract).
- The keyboard-accessibility loss on the day-card (the reference's own
  behavior — accepted, documented, same class as its decorative Filter).
- `skills/` folder — excluded from checking/testing/compilation.

## 5. Execution record

| Item | Outcome |
|---|---|
| E-A (RED) | 21 failing: `chooseEnvSource`/`repoEnvDatabaseUrl` "is not a function" (17 v3 cases) + 4 wrapper-contract failures (`db:push` not routed through the wrapper, `scripts/prisma-cli.ts` absent) — the predicted red |
| E-B (RED) | The new "day cards are the reference's clickable divs, not buttons (session 9, F-2)" e2e spec failed against the pre-fix build exactly as predicted (the day cards rendered as `button` elements: count 0 divs / strict-mode violation) |
| F-1 (GREEN — db-path v3) | `src/lib/db-path.ts`: `chooseEnvSource` (the pure priority rule), `repoEnvDatabaseUrl` (the dependency-free repo-.env reader), `findSchemaRoot` (extracted, now exported); `resolveProcessDatabaseUrl` applies the rule. Verified live in the POLLUTED shell (ambient `file:/home/z/my-project/db/custom.db`): resolves to `file:<repo>/db/custom.db`; `db:push` pushes the repo file; `db:seed` reads the repo file; a dev server booted with NO `env -u` serves the seeded repo DB (login + health + CRUD green) |
| F-1 (GREEN — CLI wrapper) | `scripts/prisma-cli.ts` (resolves via v3, spawns `bunx prisma …` with the corrected env) + package.json `db:push`/`db:migrate`/`db:reset` rerouted; `tests/db-cli-scripts.test.ts` (5 contract tests). The e2e isolation SURVIVES: the webServer's explicit `file:../db/e2e.db` resolves inside the repo → ambient wins → `db/e2e.db` (64/64 × 2 proves it — the suite would have failed against custom.db's seeded demo state) |
| F-2 (GREEN) | `src/app/(app)/Planning/page.tsx`: the day-card `button … text-left` → the reference's plain `div` (onclick, no role/tabindex, no text-left). One cascade fix: the badge spec's task-item locator had used the button TAG as its discriminator — retargeted to `:not([class*="cursor-pointer"])` (the FS-19 locator corollary). 10 day-card locator sites + the capture script updated to `div.p-4.cursor-pointer` |
| Gate | lint clean · typecheck clean · **88/88 unit** (66 → 88: +17 db-path v3, +5 db-cli-scripts) · build green (19 routes) · **64/64 e2e × 2 consecutive full runs** (63 → 64: +1 day-card div pin) · smoke **30/30** — all in the polluted shell (the point of F-1) |
| Live parity | Planning unselected **63/63 IDENTICAL** (was 7 div/button diffs) and day-selected **98/98 IDENTICAL** (was 7) — the class trees are now 100% matched; dashboard re-diff 761/761 + the 3 documented style nodes (unchanged); the mobile menu re-pinned (trigger 338/14/36×36, menu 182/54/192×164, items [Profile, Settings, Logout], computed `animation-name: enter` — navigation round-trip verified); the desktop avatar menu re-pinned (1252/14/76×36 + 1136/54/192, right 1328) |
| Screenshots | All 20 captures re-run via `scripts/capture-screenshots.mjs` on the remediated dev server (03/09/10 show the day-card divs; the script's locator updated to the div shape) |
| Docs | README (env-var table + the v3 authority + 88/64 counts + the day-card row), AGENTS.md (the parent-.env quirk REWRITTEN to the v3 authority + the db:push wrapper row + the day-card div convention + session-9 references + counts), CLAUDE.md (new "Database URL authority" section + counts), PAD (§4.3 rewritten with the v3 priority table, §10.1 gate line, 10 new §12 ledger rows), flow-schedule_SKILL.md v1.8.0 (**FS-19** + the env-trap rewrite + the debugging-row update + the session-9 history entry), `.env.example` (the v3 contract + production guidance), DEPLOYMENT.md §4 (where to put the absolute path), this execution record, `docs/session_9-review.md`, worklog |
| Push | Single commit on `main` via `docs/ssh_git_wrapper_v3.py` (no new branches) |
