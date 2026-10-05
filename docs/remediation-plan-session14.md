# Remediation Plan — Session 14 (2026-10-05)

Session-14 review of the FlowSchedule clone (base commit `5d1b32c` —
the session-13 remediation `55904a1` plus the operator's
docs/session_14.md narrative commit; `git pull` workspace with `.env` +
seeded `db/` intact). The `skills/` folder is excluded from code
checking, testing and compilation per the operating instructions
(eslint ignores `skills`, tsconfig excludes `skills`, vitest includes
only `src/` + `tests/` — re-verified via the green base gate).

Skills used this session: `agent-browser` (login + live probing + the
XHR response-override harness on the reference app), `clone-app-pat-pro`
(measured facts, not preferences — the probed RENDER behavior is the
ground truth), `tdd` (red → green → mutation evidence),
`code-review-and-audit` (the tiered review pipeline), and the Tailwind
v4 trap knowledge in `skills/nextjs16-tailwind4` (re-checked: no
regression — the menu geometry pins are green inside the 67/67 base
e2e run).

## 1. Audit scope and method

Session 13's closing suggestion set this session's target — **the
InvokeLLM RESPONSE side**: both cards' success paths had been observed
live (the Walt Disney quote, the "Focused" summary) but never diffed
against the clone's parsed output on the same input. Method: the
session-12/13 XHR interception upgraded with a **response-override
harness** — `Object.defineProperty` on the XHR instance's
`responseText`/`response`/`status` lets the audit feed the reference's
OWN card components arbitrary post-validation JSON and observe their
render, probe by probe (the request still goes to the platform; the
SDK's `onload` reads the overridden values). Plus a raw-text token
extraction of the reference's Task entity list (the byte-diff tool
session 12's P-1 said would be needed).

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull` (main `55904a1` → `5d1b32c`, adds docs/session_14.md); `.env` re-verified (`DATABASE_URL="file:../db/custom.db"` + AUTH_SECRET); `db/` at the repo root; full base gate re-executed | ✅ lint ✓ · typecheck ✓ · **102/102 unit** · build ✓ (19 routes) · **67/67 e2e** (1.9 m) — the codebase matches its documented state exactly |
| **Mobile + desktop menus (user's standing priority)** | The full e2e suite includes the geometry pins (mobile 390×844 trigger 338/14/36×36 right 374; menu 182/54/192×164; desktop trigger 1252/14/76×36; menu 1136/54/192×164) — all green at base | ✅ **no Tailwind v4 regression** (the pins are animation-settled, re-verified inside the green run) |
| **Target: the InvokeLLM response side** | Logged into the reference; installed the response-override patch; triggered the re-fetch chain with a dialog-created scheduled task (real pointer events on the calendar slot → the task dialog → "Create Task") + quick-add mutations; ran **5 edge-case probes** with controlled response JSON | ⚠️ **4 response-parse divergences** (§2): the reference renders schema-valid-but-empty values VERBATIM; the clone's defensive parse conflates "empty" with "invalid" and falls to the fallbacks |
| The natural response shapes | Captured 3 real InvokeLLM round-trips (2× daily-focus, 1× summary): the platform returns schema-validated JSON; the Walt Disney quote set; the "Focused" summary | ✅ the clone's parsed output for these shapes is identical (the divergence only appears in the empty-value classes) |
| The render seams | Extracted the reference's rendered card DOM for both cards (probe 0/4) | ✅ the card DOM structure, the `capitalize` mood CSS, the slice-to-3 chips, the literal-quote/author-dash patterns — all match the clone |
| **Session-12 P-1: `duration_minutes: 30.0`** | Raw-text token extraction on the reference's Task entity list (the SDK-auth XHR fetch — the "byte-diff tool" P-1 asked for) | ⚠️ confirmed: the reference's Python backend emits `"duration_minutes":60.0` as raw JSON FLOAT text; the clone emits `60`. Semantically null for every JSON parser — but a real byte-level wire difference, now measurable and fixable (R-3) |
| Reference account hygiene | Probe cleanup via the captured auth headers (DELETE entities/Task/:id) | ✅ all 8 S14 probe tasks removed; the session-11/12 parity data (9 tasks) untouched |

## 2. Issues, bugs and gaps found

The audit found **zero visual/behavioral regressions** (menus pinned
green, base gate green). The findings are all in the **LLM
response-parse layer** — the seam where the clone replaces the
platform's server-side `response_json_schema` validation with its own
defensive checks. The probes show the reference's contract precisely:
**schema-invalid → the catch/fallback; schema-valid-but-empty →
rendered verbatim.** The clone's parse uses TRUTHINESS where the
reference uses schema SHAPE — so empty-but-valid values (allowed by
the platform's schema, which has no minLength/minItems) wrongly fall
to the deterministic fallbacks.

### RS-1 (Medium — summary parse): empty arrays

Probe: `{"mood":"calm","focus_areas":[],"activities":[],"insights":"…"}`
→ the reference renders mood "calm" + **zero chips** + the insight,
verbatim. The clone's `asStringArray` returns `null` for an empty
array → the whole summary falls to FALLBACK_SUMMARY ("productive /
Work tasks / Keep up the good work!"). Wrong rendering for a
schema-valid response.

### RS-2 (Low — summary parse): empty-string array items

Probe: `{"focus_areas":["", "real area"]}` → the reference renders an
**empty chip + "real area"** (no filtering). The clone's
`asStringArray` filters `x.length > 0` → renders only "real area".
(Also probed: `["act", null, 42]` renders as "act" + empty + "42" —
the reference's client does NO type checking; unreachable in
production because the platform schema enforces strings, so the
clone's schema check stays — documented, no action for the
non-string class.)

### RS-3 (Medium — summary parse): empty mood / insights

Probe: `{"mood":"","focus_areas":["fa"],"activities":["ac"],"insights":""}`
→ the reference renders an **empty `<p class="text-purple-800
capitalize…">`** and an empty insight `<p>` — no fallback. The clone's
guard `if (mood && focusAreas && activities && insights)` treats "" as
invalid → FALLBACK_SUMMARY.

### RS-4 (Medium — focus parse): the guard checks all three fields

Probe: `{"quote":"A real quote","author":"","affirmation":""}` → the
reference renders the quote + **"- "** (dash, space, empty author) +
an empty affirmation `<p>` — verbatim, because the decompiled guard
is `a && a.quote ? n(a) : n(j1)` — **quote only**. The clone's
`if (quote && author && affirmation)` requires all three truthy →
DEFAULT_FOCUS (the Mark Twain set). The clone's card-side check
(`body.data.focus?.quote`) is already quote-only ✓ — the divergence
is in the server-side parse only.

### R-3 target (Low — session-12 P-1): `duration_minutes` float text

The reference's entity wire carries `"duration_minutes":60.0` (the
platform's Python backend serializes floats; probed live: `60.0`,
`30.0`, `null` for quick-added tasks). The clone's JS
`JSON.stringify(60)` emits `60`. Every JSON parser reads both as 60
(semantically null — session 12's ruling), but the byte-diff tool
landed this session, and the project's parity discipline (FS-23/FS-24:
the WIRE is the contract, whitespace included) extends to number
formatting. Fix: float-format the integer duration tokens in the task
routes' response text (a pure text-level transform — safe against
escaped string content because escaped quotes differ from the property
token's quotes).

### Confirmed parity (no action)

- The **slice-to-3** render: 5-item `focus_areas` → 3 chips on the
  reference; the clone's render slices identically.
- The **`capitalize` mood CSS**: the reference renders "planning"
  (fallback) and "Focused" (LLM) through the same class the clone
  uses.
- The **card DOM**: probe-extracted Daily Focus + AI Summary card HTML
  matches the clone's structure class-for-class (the literal-quote
  pattern, the "- " author prefix, the vertical icon blocks, the
  gradient mood card, the max-h-20 insights, the decorative blob).
- The **fallback content**: the reference's InvokeLLM failure path
  rendered "productive / Work tasks / Keep up the good work!" —
  byte-identical to FALLBACK_SUMMARY (re-confirmed live via a
  CORS-broken route mock).
- The **request side** of both InvokeLLM calls: byte-pinned in
  session 13; unchanged.

## 3. Remediation (TDD: red → green → mutation)

All four response-parse fixes and the wire-text fix have ZERO UI
impact for the normal LLM path (non-empty, schema-valid responses
parse identically). The TDD evidence per fix: (a) the pin is written
from the PROBED reference render (not inferred), (b) RED against the
pre-change build, (c) mutation evidence, (d) the full gate re-runs
clean.

### R-1 — the summary parse becomes a schema-shape check (`src/lib/ai.ts`)

- RED first: `tests/ai-response.test.ts` (the vi.mock SDK pattern from
  `tests/ai-prompt.test.ts`) pins:
  - RS-1: empty arrays → verbatim `{mood, focus_areas: [],
    activities: [], insights}` (NOT FALLBACK_SUMMARY);
  - RS-2: `["", "real area"]` → verbatim, no filtering;
  - RS-3: empty mood/insights → verbatim empties;
  - slice semantics: a 5-item array passes through the parse VERBATIM
    (the render owns the 3-slice — the reference's fre decompile);
  - schema-invalid still falls back: `mood: 42`, `focus_areas:
    "not-array"`, missing fields, unparseable content.
- GREEN: replace `asStringArray` + the truthiness guard with
  shape checks — mood/insights `typeof === "string"`,
  focus_areas/activities `Array.isArray && every(typeof ===
  "string")` — return the verbatim object; anything else →
  FALLBACK_SUMMARY (the platform-validation equivalent: schema-invalid
  → the reference's own catch → fallback).

### R-2 — the focus parse's guard becomes quote-only (`src/lib/ai.ts`)

- RED: RS-4 pins — `{quote:"A real quote", author:"", affirmation:""}`
  → verbatim (NOT DEFAULT_FOCUS); `{quote:"", …}` → DEFAULT_FOCUS
  (the `a && a.quote` decompile — quote truthiness only); missing
  author/affirmation keys → "" render-equivalents.
- GREEN: `if (quote)` where quote is a non-empty string; author/
  affirmation default "" when not strings (React renders "- " + "" —
  the probed reference output).

### R-3 — the float-formatted duration wire (`src/lib/api.ts` + the task routes)

- RED first: `tests/wire-float.test.ts` —
  - the pure transform: `"duration_minutes":60` → `"duration_minutes":
    60.0`; `null` untouched; `60.5` untouched (already fractional);
    escaped string content containing the literal token untouched;
  - route-source pins (the file-read precedent): the 3 task-serializing
    responses (GET/POST /api/tasks, PATCH /api/tasks/[id]) route
    through the new `okWire` helper; `ok()` stays for every other
    route;
  - the e2e addendum (the existing G-4/W-1/W-2 wire spec): the RAW
    response text of GET /api/tasks matches
    `/"duration_minutes":\d+\.0/` after creating a 45-minute task.
- GREEN: `okWire(data, status)` in `src/lib/api.ts` — JSON.stringify
  the envelope, apply the float-format regex
  `/("duration_minutes":)(-?\d+)([,}\]])/g → $1$2.0$3`, return the
  text as an `application/json` NextResponse. Only the 3 task routes
  switch to it (the Note wire has no number fields; auth/AI routes
  carry no task payloads).

### Mutation (RED) evidence planned

- M-1: the summary parse reverts to the truthiness guard → the RS-1/2/3
  pins FAIL.
- M-2: the focus parse reverts to the three-field guard → the RS-4
  pins FAIL.
- M-3: `okWire` drops the float-format call (or the routes revert to
  `ok`) → the wire-float pins FAIL.
- M-4: the parse slices/filters arrays again → the RS-2 + slice pins
  FAIL.

### Gate after (in the ambient-polluted shell, on purpose)

`bun run lint && bun run typecheck && bun run test && bun run build
&& bun run test:e2e` — expected 102 → ~112 unit (the response-parse +
wire-float pins) and 67/67 e2e (+ the raw-text wire assertion folded
into the existing wire spec), plus a second consecutive full e2e run
(the session convention).

## 4. Deliverables

- `docs/remediation-plan-session14.md` (this file) + execution record.
- `docs/session_14-review.md` (the session review).
- Screenshots re-captured (dev server, 1440×900 + 390×844 set) into
  `docs/screenshots/`.
- Docs realigned: README (the response-parse parity note + counts),
  AGENTS.md (the session-14 conventions), CLAUDE.md (the response-parse
  contract), PAD (§7 + §8 counts + §12 ledger),
  flow-schedule_SKILL.md (FS-26: the response is the wire too),
  worklog.md (Task 30).
- `.env.example` — re-verified by the contract test (expected
  unchanged).
- Commit on `main` + push via `docs/ssh_git_wrapper_v3.py`.

## 5. Execution record (2026-10-05)

Executed as planned — pin-first (RED), GREEN implementation, mutation
(RED) evidence, the full gate ×2 — with one pin-strength lesson found
by the mutation phase itself (M-3's first run survived; the pin was
strengthened and the mutation re-confirmed RED).

| Step | Result |
|---|---|
| Audit (the InvokeLLM response side + standing pins) | ✅ the natural responses parse identically; five probes found the four divergences (§2); the raw-text token extraction confirmed the duration float wire (session-12 P-1); the menus pinned green inside the 67/67 base run |
| RED: tests/ai-response.test.ts (11 pins — RS-1/2/3 verbatim-empty, the un-sliced arrays, RS-4 quote-only ×3, the natural-capture regressions, the schema-invalid fallbacks) | ✅ 7/11 failed against the pre-change code (the exact regression classes) |
| RED: tests/wire-float.test.ts (8 pins — the pure transform ×6, the okWire seam ×2) | ✅ all failed (the module/helpers did not exist) |
| GREEN R-1/R-2: the schema-SHAPE parse in src/lib/ai.ts (isString/isStringArray; no truthiness, no length filters, no parse-level slicing; the quote-only focus guard) | ✅ 19/19 new pins green |
| GREEN R-3: okWire (src/lib/api.ts) + floatFormatDurations (src/lib/serialize.ts) + the three task-route call sites + the raw-text e2e assertion | ✅ the live dev-server wire now ships 30.0/120.0/60.0/90.0/45.0/null |
| MUTATION M-1 (summary parse reverts to a truthiness guard) | ✅ 2 pins FAIL |
| MUTATION M-2 (focus parse reverts to the three-field guard) | ✅ 2 pins FAIL |
| MUTATION M-3 (okWire drops the float-format call) | ✅ 1 pin FAIL — after the pin was strengthened from `toContain` (the import) to `toMatch(/floatFormatDurations\(\s*JSON\.stringify/)` (the call); the first run SURVIVED (the pin-strength lesson) |
| MUTATION M-4 (the parse slices/filters the arrays again) | ✅ 2 pins FAIL |
| MUTATION M-5 (the task route reverts to plain ok) | ✅ 1 pin FAIL |
| Full gate | ✅ lint ✓ · tsc ✓ · **121/121 unit** (102 → 121: +11 ai-response, +8 wire-float) · build ✓ (19 routes) · **67/67 e2e ×2 consecutive** (2.0 m + 2.0 m) |
| Live route check (dev server, ambient-polluted shell) | ✅ /api/health up (the repo's own db served); login green; the raw GET /api/tasks wire float-formatted; both AI routes round-trip (the 429 fallback class) |
| Screenshots | ✅ all 20 re-captured on the remediated codebase |
| Reference account hygiene | ✅ the 8 S14 probe tasks deleted via the captured auth headers (verified: 0 leftovers, the 9 parity tasks untouched) |

### Test-count movement

- Unit: 102 → **121** (+11 ai-response, +8 wire-float)
- E2e: **67** (unchanged count — the raw-text float assertion folded
  into the existing G-4/W-1/W-2 wire spec)
