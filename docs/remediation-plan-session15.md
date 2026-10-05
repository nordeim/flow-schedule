# Remediation Plan — Session 15 (2026-10-05)

Session-15 review of the FlowSchedule clone (base commit `89b9c7d` —
the session-14 remediation `8378b85` plus the operator's
docs/session_15.md narrative commit; `git pull` workspace with `.env` +
seeded `db/` intact). The `skills/` folder is excluded from code
checking, testing and compilation per the operating instructions
(eslint ignores `skills`, tsconfig excludes `skills`, vitest includes
only `src/` + `tests/` — re-verified via the green base gate).

Skills used this session: `agent-browser` (login + the full-body XHR
capture with request headers + the 429 response-override probe on the
reference app), `clone-app-pat-pro` (measured facts, not preferences —
the probed wire forms are the ground truth), `tdd` / `tdd-workflow`
(red → green → mutation evidence), `code-review-and-audit` (the tiered
review pipeline), `testing-patterns` (the seam-pinning conventions),
and the Tailwind v4 trap knowledge in `skills/nextjs16-tailwind4`
(re-checked: no regression — the mobile menu geometry re-measured live
on the reference at 390×844 matches the clone's e2e pins exactly).

## 1. Audit scope and method

Session 14's closing suggestion set this session's first target — the
**failure-path paired probe** (§5a) — and the full-body XHR capture
surfaced a second, unplanned target: the **entity date-token wire
form**. Method: the sessions-12–14 XHR family upgraded with full-body
capture + request-header capture (the Bearer/X-App-Id auth), direct
API probes (POST/PUT on both entities with the captured auth), the
response-override harness for the controlled 429, a Playwright
trusted-click mobile-menu re-measure (agent-browser has no Linux
viewport control), and a structural DOM diff of the two live
dashboards at 1440×900.

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull` (main `8378b85` → `89b9c7d`, adds docs/session_15.md); `.env` re-verified (`DATABASE_URL="file:../db/custom.db"` + AUTH_SECRET); `db/` at the repo root; full base gate re-executed | ✅ lint ✓ · typecheck ✓ · **121/121 unit** · build ✓ (19 routes) · **67/67 e2e** (2.0 m) — the codebase matches its documented state exactly |
| **Mobile + desktop menus (user's standing priority)** | Live re-measure on the REFERENCE at 390×844 (Playwright trusted clicks, animation-settled) + the clone's geometry pins inside the 67/67 base run | ✅ **no drift, no Tailwind v4 regression** — reference: trigger 338/14/36×36 right 374, menu 182/54/192×164, items [Profile, Settings, Logout], `animation-name: enter`; identical to the pins |
| **Target 1: the failure-path paired probe** (session-14 §5a) | The response-override harness forced the reference's Daily Focus InvokeLLM to 429; the clone's dev server hit the z-ai SDK's live 429 the same morning; both cards' renders extracted | ✅ **PARITY CONFIRMED** — both apps render the byte-identical Mark Twain DEFAULT_FOCUS under the SAME failure class; the summary fallback was already byte-confirmed (session 14); no action |
| **Target 2: the entity date-token wire** | Full-body token extraction on the reference's own Task/Note traffic: POST create, GET list, PUT update — both entities (6 surfaces), with the captured auth headers | ⚠️ **DW-1**: server-generated `created_date`/`updated_date` ship as 6-digit µs — POST with Z, GET/PUT with NO Z — while the clone emits 3-digit ms + Z (§2) |
| The structural DOM parity | Playwright DOM diff of both live dashboards at 1440×900 (card inventory, headings, geometry, container/header classes) | ✅ MATCH — 6/6 cards, 7/7 day rows, identical container/header classes, 4/4 tiles; only data-driven diffs (StatusCard state per account data) |
| The session-14 remediation commit (8378b85) | Line-level audit of `src/lib/ai.ts` (the schema-shape parse + the quote-only guard), `okWire` + `floatFormatDurations`, the task routes, and the 19 new pins | ✅ clean — every pin held at base; the M-3 call-not-import lesson is applied to this session's new pins |
| Reference account hygiene | Probe cleanup via the captured auth headers (2 tasks + 1 note deleted) | ✅ 9 parity tasks + 3 notes remain, 0 S15 leftovers |

## 2. Issues, bugs and gaps found

The audit found **zero visual/behavioral regressions** (the base gate
and every geometry pin green; the reference re-measured identical).
One real byte-level wire divergence — the same family as session-12
P-1 (the duration float, closed session 14): a **Python-vs-JS
serialization artifact on the server-generated date tokens**.

### DW-1 (Medium): the created_date/updated_date wire form

Probed live on the reference's own entity traffic (all six surfaces):

| Surface | Reference wire (byte-extracted) | Clone wire today |
|---|---|---|
| POST create — Task | `"created_date":"2026-10-05T02:11:34.297127Z"` | `"created_date":"2026-10-05T02:11:34.297Z"` |
| POST create — Note | `"created_date":"2026-10-05T02:17:04.141420Z"` | same class (ms+Z) |
| GET list — Task | `"created_date":"2026-10-04T21:28:23.793000"` (no Z) | ms+Z |
| GET list — Note | `"created_date":"2026-10-04T22:45:30.795000"` (no Z) | ms+Z |
| PUT update — Task | `created` µs no-Z (ms-truncated) + `updated` µs no-Z (fresh) | ms+Z |
| PUT update — Note | same pattern | ms+Z |
| start_time/end_time (client-supplied) | `2026-09-22T21:00:00.000Z` (ms+Z) | **ms+Z — already matching** |

The contract: 6-digit fractional seconds on the server-generated
tokens, WITH Z on create responses, WITHOUT Z on read/update
responses. The clone's `toISOString()` emits 3-digit ms + Z on every
route. Consumer impact is ZERO — mapTask/mapNote keep both strings
opaque (verified: no UI, store, or test consumer parses them; the e2e
asserts truthiness only). The fix mirrors session-14's duration-float
ruling: the byte-form is a documented parity surface (FS-23/FS-24),
reproducible at the same `okWire` text seam — pad the ms token to 6
digits, route-keyed Z. The digits beyond ms are `.000` (the clone's
upstream clock and SQLite store milliseconds) — the same
form-vs-value precision class as `60.0`: the FORM byte-matches, the
storage-precision residual is documented.

### Confirmed parity (no action)

- **The failure-path render (session-14 §5a target):** the reference's
  InvokeLLM 429 catch renders the Mark Twain DEFAULT_FOCUS; the clone's
  SDK-429 class renders the byte-identical set — both observed live
  this session, same failure class, same morning.
- **The reference's no-call empty-day behavior:** with no scheduled
  tasks today the reference's summary card made NO InvokeLLM call (the
  capture shows only the daily-focus request) — matching the clone's
  `tasks.length === 0 → EMPTY_DAY_SUMMARY` seam.
- **The request side of both InvokeLLM calls + the response parse:**
  byte-pinned in sessions 13/14; re-verified at base.
- **The key-ORDER question (observed, ruled out of scope):** the
  reference's wire orders keys start_time-first; the clone id-first.
  JSON key order is semantically null, and the session-12 pins
  deliberately chose the sorted-set form — kept (documented as a
  possible future ruling, not a defect).
- **`?date=` on /api/ai/summary (session-14 §5b):** left as the
  documented self-hosted affordance (low value, per the session-14
  review).

## 3. Remediation (TDD: red → green → mutation)

### ToDo list

- [x] T-1 (RED): `tests/wire-dates.test.ts` — the pure-transform pins
      (read/create modes, start_time/end_date untouched, escaped-content
      safety, list payloads, defensive fail-open) + the seam source pins
      (okWire routes through `formatWireDates(..., "read")`,
      okWireCreate exists and routes `"create"`, both keep the
      `floatFormatDurations(JSON.stringify(...))` CALL form) + the route
      source pins (POST tasks/notes → okWireCreate; GET/PATCH
      tasks/notes → okWire; the notes routes stop returning plain `ok`
      for entity payloads) — the M-3 lesson: pins match the CALL, not
      the import.
- [x] T-2 (RED): the e2e addendum — fold the raw-text date assertions
      into the existing G-4/W-1/W-2 wire spec: GET /api/tasks raw text
      matches `/"created_date":"\d{4}-…\.\d{6}"/` (no Z) and never
      `\.\d{3}Z"` on that token; the POST response text matches
      `\.\d{6}Z"`; start_time keeps its `\.\d{3}Z` form.
- [x] T-3 (GREEN): `formatWireDates(json, mode)` in
      `src/lib/serialize.ts` — the property-keyed regex transform
      (`"created_date"|"updated_date"` tokens; pad `\.\d{3}` → `\.\d{6}`;
      read mode strips the Z, create mode keeps it; escaped string
      content is backslash-separated and cannot match — the same safety
      mechanism as floatFormatDurations).
- [x] T-4 (GREEN): `okWireCreate` in `src/lib/api.ts` (create mode,
      default status 201) + `okWire` composes the read-mode date
      transform AROUND the existing `floatFormatDurations(JSON.stringify(
      ...))` call (the session-14 source pin keeps matching).
- [x] T-5 (GREEN): the route switches — POST /api/tasks and POST
      /api/notes → `okWireCreate`; GET /api/notes and PATCH
      /api/notes/[id] → `okWire` (the notes wires carry the same date
      tokens); GET/PATCH /api/tasks already on `okWire` (read mode is
      the default); the DELETE routes keep `ok` ({deleted} — no
      entity).
- [x] T-6 (MUTATION, harness outside the repo): M-1 transform →
      identity; M-2 okWire drops the date call; M-3 okWireCreate emits
      read mode; M-4 POST tasks reverts to ok/okWire; M-5 notes routes
      revert to ok. All must turn the pins RED; tree restored
      byte-identical after.
- [x] T-7 (GATE): `bun run lint && bun run typecheck && bun run test &&
      bun run build && bun run test:e2e` ×2 consecutive (the session
      convention).
- [x] T-8 (LIVE): the dev-server raw-wire check — GET /api/tasks text
      (`.mmm000`, no Z, `60.0` floats), POST create (`.mmm000Z`), PATCH
      (both forms), GET /api/notes + POST /api/notes (same forms); the
      AI routes' 429 fallback class.
- [x] T-9 (SCREENSHOTS): all 20 captures re-run on the remediated
      codebase (`scripts/capture-screenshots.mjs`).
- [x] T-10 (DOCS): README (the date-wire parity note + counts),
      AGENTS.md (the FS-27 convention + the route-mode table), CLAUDE.md
      (the date-wire contract), PAD (§4.1 wire + §7/§8 counts + §12
      ledger), flow-schedule_SKILL.md (v2.4.0, FS-27), the worklog
      (Task 32), this plan's execution record.
- [x] T-11 (PUSH): commit on `main` + push via
      `docs/ssh_git_wrapper_v3.py` (the runbook).

### Design decisions (validated against the codebase)

- **The transform lives at the okWire text seam, NOT in the
  serializers.** `serializeTask`/`serializeNote` keep emitting typed
  `toISOString()` values (the existing `tests/wire-format.test.ts`
  pins stay valid — they pin the SERIALIZER, not the response text);
  the per-route form difference (create vs read) is a RESPONSE-level
  concern, exactly like the float format.
- **One helper per mode, not a mode flag.** `okWire` (read, default)
  and `okWireCreate` (create, 201) are greppable and source-pinnable;
  keying the date mode off the status code would be untraceable magic.
- **The regex keys on property names** — `start_time`/`end_time`
  tokens (client-supplied, already ms+Z) are never touched, in either
  mode; escaped string content (a description quoting the token) is
  backslash-separated and cannot match.
- **The notes routes join okWire.** Session 14 left them on `ok()`
  ("the Note wire has no number fields") — with the date tokens in
  scope they now need the same seam (their µs/no-Z and µs/Z forms were
  probed on the reference's own Note traffic).

## 4. Deliverables

- `docs/remediation-plan-session15.md` (this file) + execution record.
- `docs/session_15-review.md` (the session review).
- Screenshots re-captured (dev server, 1440×900 + 390×844 set) into
  `docs/screenshots/`.
- Docs realigned (README, AGENTS, CLAUDE, PAD, SKILL v2.4.0, worklog).
- `.env.example` — re-verified by the contract test (expected
  unchanged).
- Commit on `main` + push via `docs/ssh_git_wrapper_v3.py`.

## 5. Execution record (2026-10-05)

Executed as planned — pin-first (RED), GREEN implementation, mutation
(RED) evidence, the full gate ×2 — with one harness-hygiene lesson
found BY the gate itself (the first mutation run corrupted api.ts via
its per-mutation backup; the e2e caught the compiled divergence, the
harness was fixed to a canonical per-file backup, and the mutation
phase re-confirmed RED with a clean restore).

| Step | Result |
|---|---|
| Audit (the failure-path paired probe + the standing pins + the full-body wire capture) | ✅ the failure-path parity CONFIRMED (the reference's 429 → Mark Twain, the clone's SDK-429 → the byte-identical set, same morning); the date-wire divergence DW-1 confirmed on six surfaces; the mobile menu re-measured live on the reference — identical to the pins; the DOM structural diff — match |
| RED: tests/wire-dates.test.ts (12 pins — the pure transform ×7, the okWire/okWireCreate CALL-form seams ×2, the route call sites ×3) | ✅ 11/12 failed against the pre-change code (the 12th guards the task routes' pre-existing okWire — green at base by design) |
| GREEN T-3: formatWireDates (src/lib/serialize.ts) | ✅ the pure transform — read/create modes, property-keyed regex, idempotent by construction |
| GREEN T-4: okWireCreate + okWire's read-mode composition (src/lib/api.ts) | ✅ the session-14 float CALL-form pin still matches (floatFormatDurations(JSON.stringify(…))) |
| GREEN T-5: the route switches (POST tasks/notes → okWireCreate; GET/PATCH notes → okWire) | ✅ 12/12 pins green |
| T-2: the e2e raw-text date pins folded into the G-4/W-1/W-2 wire spec | ✅ µs no-Z on the GET text, µs+Z on the POST text, ms+Z start_time, no double-formatting |
| MUTATION M-1 (formatWireDates → identity) | ✅ 6 pins FAIL |
| MUTATION M-2 (okWire drops the date call) | ✅ 7 pins FAIL |
| MUTATION M-3 (okWireCreate emits read mode) | ✅ 7 pins FAIL |
| MUTATION M-4 (POST tasks reverts to okWire-201) | ✅ 8 pins FAIL |
| MUTATION M-5 (notes GET reverts to plain ok) | ✅ 9 pins FAIL |
| **The harness-backup lesson** | ⚠️→✅ the FIRST harness run corrupted api.ts (its per-mutation backup captured M-2's mutated state when M-3 re-backed-up the same file; `git diff --stat` did not flag it; the unit source-pins read the corrupted-but-plausible text and PASSED; only the e2e caught the compiled divergence — okWire shipped floats but not dates). Fixed: ONE canonical per-file backup before any mutation + a mandatory post-run pin re-run; the mutations were re-confirmed RED with a clean, verified restore |
| Full gate | ✅ lint ✓ · tsc ✓ · **133/133 unit** (121 → 133: +12 wire-dates) · build ✓ (19 routes) · **67/67 e2e ×2 consecutive** (1.9 m + 1.9 m, incl. the raw-text date pins) |
| Live route check (T-8, dev server) | ✅ GET: `"created_date":"2026-10-05T00:20:32.982000"` (µs no Z) + `30.0/120.0/60.0/90.0` floats + ms+Z start_time; POST: `"…02:40:01.498000Z"` (µs + Z) + `25.0`; PATCH: created `.498000` (ms-truncated, the reference's exact re-read form) + updated `.543000` (fresh); POST/GET notes: `.582000Z` / `.582000` — all six forms byte-matching the probes |
| Screenshots (T-9) | ✅ all 20 re-captured on the remediated codebase |
| Reference account hygiene | ✅ the 3 S15 probe entities (2 tasks + 1 note) deleted via the captured auth headers (verified: 9 parity tasks + 3 notes remain, 0 S15 leftovers) |
| Docs (T-10) | ✅ README (the date-wire + counts), AGENTS.md (FS-27 + the harness lesson + the Reference section), CLAUDE.md (the date-wire contract), PAD (§4.1 wire table + §8 counts + 10 ledger rows), flow-schedule_SKILL.md v2.4.0 (FS-27 + the session-15 history), this execution record, the worklog (Task 31) |

### Test-count movement

- Unit: 121 → **133** (+12 wire-dates)
- E2e: **67** (unchanged count — the raw-text date assertions folded
  into the existing G-4/W-1/W-2 wire spec)
