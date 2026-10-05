# Remediation Plan — Session 13 (2026-10-05)

Session-13 review of the FlowSchedule clone (base commit `9485de5` —
the session-12 remediation `0a7f7f6` plus the operator's
docs/session_13.md narrative commit; `git pull` workspace with `.env` +
seeded `db/` intact). The `skills/` folder is excluded from code
checking, testing and compilation per the operating instructions
(eslint ignores `skills`, tsconfig excludes `skills`, vitest includes
only `src/` + `tests/` — re-verified via the green base gate).

Skills used this session: `agent-browser` (login + live probing + XHR
interception + bundle decompile on the reference app), `clone-app-pat-pro`
(measured facts, not preferences — the InvokeLLM request body IS the
ground truth), `tdd` (red → green → mutation evidence),
`code-review-and-audit` (the tiered review pipeline), and the Tailwind
v4 trap knowledge in `skills/nextjs16-tailwind4` (re-checked: no
regression, see §1).

## 1. Audit scope and method

Session 12's closing suggestion set this session's target — **a full
prompt/schema diff of the two InvokeLLM routes** (the Daily Focus
prompt was captured session 12; the AI Summary prompt's task-list
formatting was flagged as diffable) — plus the standing per-session
re-pins. Method: the session-12 XHR interception (patched
`XMLHttpRequest.prototype.open/send` inside the logged-in reference
page) upgraded with **request-HEADERS capture** (the base44 SDK sends
`Authorization: Bearer …` + `X-App-Id` + `X-Origin-URL` — plain fetch
from the page CORS-fails without them) so entity round-trips and
probe cleanup could run through the reference's own API, plus **the
`fre`/`Y1e` decompile** from the live bundle to reconstruct the exact
prompt-builder source.

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull` (main `0a7f7f6` → `9485de5`, adds docs/session_13.md); `.env` re-verified (`DATABASE_URL="file:../db/custom.db"` + AUTH_SECRET); `db/` at the repo root; full base gate re-executed | ✅ lint ✓ · typecheck ✓ · **89/89 unit** · build ✓ (19 routes) · **67/67 e2e** (3.2 m) — the codebase matches its documented state exactly |
| **Mobile + desktop menus (user's standing priority)** | The full e2e suite includes the geometry pins (mobile 390×844 trigger 338/14/36×36 right 374; menu 182/54/192×164; desktop trigger 1252/14/76×36; menu 1136/54/192×164) — all green at base | ✅ **no Tailwind v4 regression** (the pins are animation-settled, re-verified inside the green run) |
| **Target: the two InvokeLLM request bodies** | XHR-patched the logged-in reference; triggered both LLM re-fetches with a client-side quick-add mutation (direct API POSTs do NOT bump the reference's refreshTrigger — the mutation counter is client-state); captured 4 bodies (2× daily-focus, 2× summary — the 2-task one after an API-created second today-scheduled task); decompiled `fre` + `Y1e` from the live bundle | ⚠️ **5 divergences** (§2): the daily-focus prompt is byte-identical; the AI-summary prompt's formatting (4 issues) + the task ORDER differ |
| Fallback constants | `j1` (Y1e) + fre's empty-day branch + catch block vs `src/lib/ai-defaults.ts` | ✅ all three byte-identical (Mark Twain set; planning/Free day; productive/Work tasks) |
| Task-order ground truth | The captured 2-task prompt lists the API-created task (created LAST, start 16:00) BEFORE "Log Activity Parity B" (created earlier, start 14:10) — consistent with `fn.Task.list()`'s createdAt-desc default (session 7, G-1) and DISPROVING startTime ordering | ⚠️ the clone's `/api/ai/summary` queries `startTime asc` — the prompt's task order differs from the reference's |
| Reference account hygiene | Probe cleanup via the captured auth headers (DELETE entities/Task/:id) | ✅ "LLMCap S13 Probe", "LLMCap S13 Multi", "LLMTrigger S13" removed; session-11/12 parity data untouched |

## 2. Issues, bugs and gaps found

The audit found **zero visual/behavioral regressions** (menus pinned
green, base gate green). The findings are all in the **AI-summary
request construction** — the prompt is a documented parity surface
(PAD §7: "Reference prompt (verbatim)"), and the captured InvokeLLM
bodies now give it the same ground-truth status session 12 gave the
entity wire.

### L-1 (Medium — prompt format): the "blank" lines carry 8 spaces

The reference's template literal is indented inside its function, so
its "blank" lines are **8 spaces of trailing whitespace**, not empty
lines: after `Analyze this daily schedule briefly:` and after the
task list. The clone's truly-empty blank lines produce a different
byte stream. Cosmetic to an LLM, but the prompt is the contract.

### L-2 (Medium — prompt format): the line between date and first task

The reference's captured prompt has an 8-space line between
`Tasks for October 4, 2026:` and the first task line (the template's
`        ${taskList}` line closed by the item's leading `\n`). The
clone renders the first task directly on the next line after the
date line.

### L-3 (Medium — prompt format): the per-task template + join

The reference maps each task as
`` `\n        - ${title} (${category}, ${priority} priority)\n        ` ``
and joins with `\n` — so between consecutive tasks there is one
8-space line AND one empty line, and EVERY task line carries the
8-space indent. The clone joins plain task lines with `\n` (no blank
lines between tasks, no indent on subsequent tasks).

### L-4 (Low — prompt format): trailing space on item 3

The reference's `3. Activity types (max 3 items) ` carries a single
trailing space (source-code artifact). The clone's has none.

### L-5 (Medium — request contract): the prompt's task ORDER

The reference builds the list from `fn.Task.list()`'s default order —
**createdAt desc** (newest first; capture-confirmed: the
newest-created task is listed first despite a LATER start_time, which
disproves startTime ordering). The clone's `/api/ai/summary` queries
`orderBy: { startTime: "asc" }` → different task order in the prompt
→ different LLM input. Fix: `orderBy: { createdAt: "desc" }` (same as
`GET /api/tasks`, session 7 G-1).

### P-3 (observed, no action): the `response_json_schema`

Both captured InvokeLLM bodies carry a `response_json_schema`
(object with quote/author/affirmation — all strings; mood/
focus_areas/activities/insights). This is base44 platform
infrastructure: the platform validates the LLM output server-side.
The self-hosted equivalent is the clone's defensive JSON extraction +
typed field guards + deterministic fallbacks (ADR-005) — and the
z-ai SDK's chat.completions body has no documented response_format
param (only TTS does), so passing one would be an unsupported
gamble. The PARITY surface is the prompt + the rendered result; the
schema is the platform's validation seam. No action; documented.

### P-4 (observed, no action): SDK sampling parameters

The clone passes `temperature`/`max_tokens` (self-hosted choices);
the reference's InvokeLLM body carries only prompt + schema. No
action (the SDK call is the self-hosted replacement, ADR-005).

### P-5 (observed, no action): the `?date=` query param

The reference's fre always uses `f = new Date()` (today). The clone's
card also always sends today (DashboardView passes `day={today}`) —
the route's `?date=` param is a self-hosted API affordance, not a
behavior divergence. No action.

### E-1 (found by the gate mid-session — Medium, e2e determinism): the seed's sample week never re-anchors

The seed anchors its 8 scheduled sample tasks to the CURRENT week at
seed time (`at(dayOffset, …)` offsets from the week's Monday) and its
idempotency guard (`existingSamples === 0`) never revisits them — so a
database seeded last week keeps its samples on the previous week
forever while the calendar always renders the current week.
**Reproduced live at the Sunday→Monday UTC boundary this session**: the
baseline e2e passed 67/67 at 23:40 UTC (Sunday, week Sep 28–Oct 4);
the post-change runs at 00:15 UTC (Monday, week Oct 5–11) failed 12
seeded-task specs (`Team standup` et al. invisible on the calendar).
Pre-existing (nothing in session 12's changes or this session's LLM
work touches calendar rendering) — the FS-16 hour-of-day flake
family, at week granularity. Fix (R-3): a pure staleness seam
(`src/lib/sample-week.ts`) + the seed re-anchoring stale `is_sample`
rows to the current week (the user's own rows are never touched;
within a week the seed stays a no-op).

## 3. Remediation (TDD: red → green → mutation)

All five fixes are request-construction changes with ZERO UI impact
(the cards render whatever the LLM/fallback returns). The TDD
evidence per fix: (a) the pin is written from the CAPTURED InvokeLLM
body (not inferred — FS-23's discipline extended to the LLM wire),
(b) RED against the pre-change build, (c) mutation evidence, (d) the
full gate re-runs clean.

### R-1 — the byte-exact prompt builder (`src/lib/ai-prompt.ts`, NEW)

- RED first: `tests/ai-prompt.test.ts` pins
  - `DAILY_FOCUS_PROMPT` === the captured daily-focus prompt string
    (byte-exact);
  - `buildAiSummaryPrompt(day, [1 task])` === the captured
    single-task prompt (byte-exact, incl. the 8-space blank lines and
    the trailing space);
  - `buildAiSummaryPrompt(day, [2 tasks])` === the captured two-task
    prompt (byte-exact, incl. the join structure: 8-space line +
    empty line between tasks, indent on every task);
  - order preservation: the builder renders the input array AS GIVEN
    (no re-sort) — the route owns the order;
  - the route-contract pin (the next-config/db-cli file-read
    precedent): `src/app/api/ai/summary/route.ts` contains
    `orderBy: { createdAt: "desc" }`.
- GREEN: the pure module (no SDK import — the ai-defaults pattern)
  with `DAILY_FOCUS_PROMPT` + `buildAiSummaryPrompt` reconstructed
  VERBATIM from the decompiled fre template (the blank lines carry 8
  spaces; the item template + `\n` join; the trailing space on item
  3; the 6-space final line).
- Wire `src/lib/ai.ts`: `generateDailyFocus` sends
  `DAILY_FOCUS_PROMPT`; `generateAiSummary` builds via
  `buildAiSummaryPrompt(day, tasks)`.

### R-2 — the summary route's task order (`src/app/api/ai/summary/route.ts`)

- `orderBy: { startTime: "asc" }` → `orderBy: { createdAt: "desc" }`
  (fn.Task.list()'s default — the GET /api/tasks contract, session 7
  G-1; capture-confirmed by the 2-task prompt's order). The isSameDay
  filter + the {title, category, priority} projection stay.

### R-3 — the seed's stale-week re-anchor (`src/lib/sample-week.ts` NEW + `prisma/seed.ts`)

- RED first: `tests/sample-week.test.ts` — weekMonday identity (the
  seed's own `at()` formula, extracted), the staleness decision
  (null → create; same-week → no-op; previous-week → re-anchor), and
  the seed source contract (imports the seam; deleteMany scoped to
  `is_sample: true` rows only — the db-cli/next-config file-read
  precedent).
- GREEN: the pure module + the seed's re-anchor block — when the
  earliest scheduled sample's Monday ≠ the current Monday, delete the
  `is_sample` task rows and re-create them on the current week.
  Within-week reruns stay a no-op ("already present — skipped"); user
  rows (is_sample: false) are never deleted. The e2e global-setup's
  seed call re-anchors `db/e2e.db` on the next run — no db-file
  deletion (the documented SQLITE_READONLY_RECOVERY constraint stays
  respected).

### Mutation (RED) evidence

- M-1: builder reverted to the old format (empty blanks, plain join,
  no trailing space) → the byte pins FAIL.
- M-2: route order flipped back to `startTime asc` → the route-source
  pin FAILS.
- M-3: the item template loses its leading `\n` (first task renders
  on the 8-space line) → the byte pins FAIL.

### Gate after (in the ambient-polluted shell, on purpose)

`bun run lint && bun run typecheck && bun run test && bun run build
&& bun run test:e2e` — expected 89 → 92 unit (the new ai-prompt pins)
and 67/67 e2e (the prompt is server-side; the visible card behavior
is unchanged — the e2e suite's AI specs already accept both the LLM
and the fallback renderings), plus a second consecutive full e2e run
(the session convention).

## 4. Deliverables

- `docs/remediation-plan-session13.md` (this file) + execution record.
- `docs/session_13-review.md` (the session review).
- Screenshots re-captured (dev server, 1440×900 + 390×844 set) into
  `docs/screenshots/`.
- Docs realigned: README (AI parity note + counts), AGENTS.md (the
  session-13 conventions + Reference), CLAUDE.md (the prompt
  contract), PAD (§7 prompts + §8 counts + §12 ledger),
  flow-schedule_SKILL.md v2.2.0 (FS-24: the prompt IS the wire),
  worklog.md (Task 29).
- `.env.example` — unchanged (contract test green).
- Commit on `main` + push via `docs/ssh_git_wrapper_v3.py`.

## 5. Execution record (2026-10-05)

Executed as planned — pin-first (RED), GREEN implementation, mutation
(RED) evidence, the full gate ×2 — PLUS one unplanned fix (E-1) found
by the gate itself at the Sunday→Monday UTC rollover.

| Step | Result |
|---|---|
| Audit (the InvokeLLM targets + standing pins) | ✅ the daily-focus prompt is byte-identical on both apps; the AI-summary prompt + task order carry the 5 divergences (§2); the three fallback constants byte-identical; the menus pinned green inside the 67/67 base run |
| **E-1 discovered by the gate** | ⚠️ the post-change e2e run failed 12 seeded-task specs at 00:15 UTC Monday — the baseline had passed 67/67 at 23:40 UTC Sunday. Root cause: the seed anchors its scheduled samples to the week the DB was FIRST seeded; the idempotency guard never re-anchors, so after a week rollover the calendar (always the current week) renders none of them. NOT caused by the session-13 changes (prompt/order only) — a pre-existing week-granularity flake in the FS-16 family |
| R-1 RED: tests/ai-prompt.test.ts (7 pins — the 2 captured prompts byte-for-byte, the join structure, order preservation, the route-source contract, the SDK-wiring spy assertions via vi.mock) | ✅ module-not-found at first, then granular: the builder pins GREEN after creating the module, the route pin + the summary-wiring pin RED against the pre-change route/ai.ts |
| R-1 GREEN: src/lib/ai-prompt.ts (the decompiled fre template, source-for-source: 8-space "blank" lines, per-task `\n        - …\n        ` items joined by `\n`, the trailing space on item 3, the 6-space final line) + ai.ts wiring | ✅ 7/7; the daily-focus message now ships DAILY_FOCUS_PROMPT |
| R-2 GREEN: /api/ai/summary `orderBy: { createdAt: "desc" }` (fn.Task.list()'s default — session 7 G-1; capture-confirmed) | ✅ the route-source pin green |
| E-1 RED: tests/sample-week.test.ts (weekMonday identity, the staleness decision ×4, the seed source contract) | ✅ module-not-found → created |
| E-1 GREEN: src/lib/sample-week.ts (pure) + the seed's re-anchor (stale → deleteMany is_sample rows → re-create on the current week; the user's own rows never touched) | ✅ 6/6; the dev seed re-anchored live ("Sample tasks re-anchored to the current week — Seeded 9 sample tasks"); re-running within the week is a no-op ("already present (9) — skipped") |
| MUTATION M-1 (builder reverted to the old format) | ✅ 3 pins FAIL (both byte pins + the wiring pin) |
| MUTATION M-2 (route order flipped to startTime asc) | ✅ the route pin FAILS |
| MUTATION M-3 (item template loses its leading newline) | ✅ 3 pins FAIL |
| MUTATION M-4 (ai.ts reverts to the inline prompt) | ✅ the wiring pin FAILS |
| MUTATION M-5 (seed re-anchor block removed) | ✅ the seed source pin FAILS |
| Full gate | ✅ lint ✓ · tsc ✓ · **102/102 unit** (89 → 96 ai-prompt → 102 sample-week) · build ✓ (19 routes) · **67/67 e2e ×2 consecutive** (3.3 m + 3.1 m, through live SDK 429s — the fallbacks by design) |
| Live route check (dev server, ambient-polluted shell) | ✅ /api/health up (the repo's own db served); login + /api/ai/summary round-trip green (the fallback rendered — the 429 class) |
| Screenshots | ✅ all 20 re-captured on the remediated codebase (00:27–00:28, the re-anchored seed week visible) |
| Reference account hygiene | ✅ the 3 session-13 probe tasks deleted via the captured auth headers |

### Test-count movement

- Unit: 89 → **102** (+7 ai-prompt, +6 sample-week)
- E2e: **67** (unchanged — the prompt/seed changes are server-side;
  the visible card behavior and the e2e contracts are untouched)
