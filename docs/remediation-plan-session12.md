# Remediation Plan — Session 12 (2026-10-05)

Session-12 review of the FlowSchedule clone (base commit `c414774` — the
session-11 remediation `d29b480` plus the operator's docs/session_12.md
narrative commit; `git pull` workspace with `.env` + seeded `db/` intact).
The `skills/` folder is excluded from code checking, testing and
compilation per the operating instructions (eslint ignores `skills`,
tsconfig excludes `skills`, vitest includes only `src/` + `tests/` — all
re-verified via the green base gate).

Skills used this session: `agent-browser` (login + live probing + XHR
interception on the reference app), `clone-app-pat-pro` (measured facts,
not preferences — the network capture IS the ground truth), `tdd`
(red → green → mutation evidence), `code-review-and-audit` (the tiered
review pipeline), and the Tailwind v4 trap knowledge in
`skills/nextjs16-tailwind4` (re-checked: no regression, see §1).

## 1. Audit scope and method

Session 11's closing suggestions set this session's two targets — the
**quick-added null-time task's surfacing** (where DOES a quick-added task
appear on the reference?) and the **Notes tag-array round-trip** — plus
the standing per-session re-pins. This session's method upgrade: **live
XHR interception of the reference's own base44 API traffic** (captured
with a patched `XMLHttpRequest.prototype.open/send` inside the logged-in
reference page) — first-hand WIRE evidence, stronger than decompile
inference.

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull` (main `d29b480` → `c414774`, adds docs/session_12.md); `.env` re-verified (`DATABASE_URL="file:../db/custom.db"` + AUTH_SECRET); `db/` at the repo root (custom.db + e2e.db); full base gate re-executed | ✅ lint ✓ · typecheck ✓ · **88/88 unit** · build ✓ (19 routes) · **67/67 e2e** (3.1 m) — the codebase matches its documented state exactly |
| **Mobile + desktop menus (user's standing priority)** | The full e2e suite includes the geometry pins (mobile 390×844 trigger 338/14/36×36 right 374; menu 182/54/192×164; desktop trigger 1252/14/76×36; menu 1136/54/192×164) — all green at base | ✅ **no Tailwind v4 regression** (the pins are animation-settled, re-verified inside the green run) |
| **Target 1: quick-added task surfacing** | Quick-added "NullSurf S12 Probe" through the reference's own z1e panel; then inspected EVERY surfacing surface on the reference: calendar grid, Planning day cards, StatusCard, Log Activity panel, AI Summary prompt (read from the intercepted InvokeLLM request body) | ✅ **PARITY — invisible everywhere, exactly like the clone**: no calendar block (no start_time), no day-card chip, StatusCard stays "All caught up!", Log Activity excludes it (H1e null guard, session 11), and the AI Summary prompt lists only TODAY's tasks (the probe is unscheduled). The task IS stored (intercepted the entity GET: `start_time:null, duration_minutes:null, end_time:null, description:null, priority:"medium", category:"work", status:"todo"`) — the quick-add defaults match the clone's `createTask({title, category:"work", priority:"medium", status:"todo"})` byte-for-byte |
| **Target 2: Notes tag-array round-trip** | Patched XHR on the reference; reopened its Brainstorm panel; captured the live `GET entities/Note?sort=-created_date` response | ✅ **tags ARE an array on the reference's wire** (`"tags":[]` on every live note) — session 8's decompile inference now CAPTURE-verified. The reference's K1e create/update only ever sends `{content}` (UI never edits tags/title), matching the clone's Brainstorm `createNote({content})` |
| **NEW: full Task/Note wire capture** | The same interception captured `GET entities/Task` and `GET entities/Note` full JSON bodies | ⚠️ **4 real wire-contract divergences** (§2) — the reference's entity shape is `created_date`/`updated_date` (+ `is_sample`/`created_by`/`created_by_id` on the wire), NOT the clone's `created_at`/`updated_at` with internal fields stripped |
| TaskDialog payload decompile | Extracted the reference's Xne save logic from the live bundle: form state `{title, description, priority, category, start_time, end_time, duration_minutes}` (NO status); `f=(start,dur)=>end_time=start+dur*60000` recomputed on start/duration changes | ⚠️ divergences W-3/W-4 (below): the reference's dialog SENDS `end_time` (client-computed) and sends description verbatim (`""` stays `""`); the clone's dialog sends neither |
| UI consumption of timestamp fields | Bundle search: `created_at`×0, `updated_at`×0, `created_date`×1 (only the Note.list sort arg), `is_sample`×0, `created_by`×0 — plus repo-side search: no `created_at` consumer outside the store mapper/serializer | ✅ the wire rename is a ZERO-UI-impact change (both apps' front-ends never read these fields) |

## 2. Issues, bugs and gaps found

The audit found **zero visual/behavioral regressions** (both suggested
targets are full parity). What it found instead — via first-hand wire
capture — is that **the response/request wire contract drifts from the
reference in 4 measurable ways**. Session 8's serializer work inferred
`created_at/updated_at` ("the repo's documented names" — its own comment)
without live wire evidence; the captured ground truth now says otherwise.

### W-1 (High — wire contract): timestamp field names

Reference (captured, both entities):
`"created_date":"2026-10-04T22:45:30.795000","updated_date":"..."`
Clone (serializeTask/serializeNote): `created_at` / `updated_at`.
The API envelope is an explicit parity surface in this project (session 8
G-4's whole point; README: "Both directions speak the reference's
snake_case entity shape"). Affected: `src/lib/serialize.ts`,
`src/store/useFlowStore.ts` (RawTask/RawNote + client Task/Note types +
mapTask/mapNote), `tests/wire-format.test.ts`, `tests/e2e/dashboard.spec.ts`
(G-4). Zero UI consumers (verified §1) — a mechanical, test-pinned rename.

### W-2 (Medium — wire contract): missing entity fields

Reference Task/Note responses carry `is_sample` (bool), `created_by`
(the author's EMAIL string), `created_by_id` (the author's user id).
Clone: all three absent (session 8 deliberately stripped isSample/userId).
Fix: ship `is_sample` (from `isSample`), `created_by` (session user's
email), `created_by_id` (session user's id) — the self-hosted semantic
equivalents of base44's platform-injected fields. The serializers take an
`author` argument; every route handler already holds `auth.user`.

### W-3 (Medium — request contract): the dialog's `end_time`

Reference dialog submits 7 fields INCLUDING `end_time` (client-computed
`start + duration` per the decompiled `f`); the clone's TaskDialog
submits 6 (no end_time — the API derives it). Stored results are
equivalent, but the REQUEST wire differs, and the clone's API ignores a
client-supplied `end_time`. Fix: TaskDialog computes and sends `end_time`
(the exact `f` logic); POST/PATCH accept an optional valid `end_time`
(self-hosted validation stays — invalid dates are rejected, the same
class as the 300-char title guard) and fall back to deriving it from
start+duration when absent (backward compatible with every other caller).

### W-4 (Low — request contract): description verbatim

Reference dialog sends the form value as-is — an empty description is
`""` (captured: `Top5 Parity G` has `description:""`); quick-added tasks
have `description:null` (field simply absent). The clone's dialog does
`description.trim() || null` and its API coerces `""`→null, so a
dialog-created empty description reads `null` on the wire instead of `""`.
Fix: TaskDialog sends `form.description` verbatim; the API stores
string values as-is (null only when the field is absent/null). Title
keeps its trim+validation (HTML `required` parity plus the documented
self-hosted write-validation class — AGENTS.md's login-rate-limiter
evidence class).

### P-1 (observed, no action): `duration_minutes: 30.0`

The reference's wire ships SQLite floats (`30.0`); JSON numbers are
IEEE doubles on both sides and `30 === 30.0` in JS — no observable
difference. No action.

### P-2 (observed, no action): base44's `app-logs` beacon

The reference fires `POST /api/app-logs/.../log-user-in-app/<page>` on
navigation — base44 analytics infrastructure, deliberately not mirrored
(platform lock-in replaced, ADR-002's class). No action.

## 3. Remediation (TDD: red → green → mutation)

All four fixes are wire-contract changes with ZERO UI impact (§1's
consumption search). The TDD evidence per fix: (a) the pin is written
from the CAPTURED reference wire (not inferred), (b) RED against a
reverted/mutated build (mutation check), (c) the full gate re-runs clean.

### R-1 — the timestamp rename + author fields (`src/lib/serialize.ts`)

- RED first: `tests/wire-format.test.ts` re-pinned to the captured shape —
  `created_date`/`updated_date`, `is_sample`, `created_by`,
  `created_by_id` on BOTH entities; `serializeTask(task, author)` /
  `serializeNote(note, author)` signatures; exact key-set assertions
  (Task: 14 keys, Note: 9 keys).
- `WireTask`/`WireNote` types updated; routes pass
  `{ id: auth.user.id, email: auth.user.email }`
  (tasks GET/POST, tasks/[id] PATCH/DELETE, notes GET/POST, notes/[id]
  PATCH/DELETE — 6 call sites).
- `src/store/useFlowStore.ts`: RawTask/RawNote + client Task/Note types
  renamed to `created_date`/`updated_date`; mapTask/mapNote read the new
  names (the sole conversion seam — unchanged design).
- e2e `dashboard.spec.ts` G-4 spec: `task.created_at` →
  `task.created_date`, plus `is_sample`/`created_by` assertions.

### R-2 — the dialog's `end_time` + description verbatim (`TaskDialog.tsx` + `api/tasks*`)

- RED first: extend `tests/e2e/planning.spec.ts`'s "Add Task dialog
  creates a scheduled task" with a `page.route` interception asserting
  the POST body ships `end_time` (== start + 45 min) and the API response
  echoes `created_date`; assert a dialog-created empty description is
  `""` on the wire (not null).
- TaskDialog: `end_time = start && duration ? start + duration*60000 :
  null` (the reference's `f` function, verbatim); `description:
  form.description` (verbatim, no trim/coalesce).
- API POST/PATCH: accept optional `end_time` (valid-ISO gate —
  invalid → VALIDATION fail, the documented self-hosted class);
  fall back to start+duration derivation when absent; description
  stored as-is when a string (null when absent).
- Unit seam: `tests/wire-format.test.ts` covers the response side; the
  request side is e2e-pinned (interception) + the existing
  enum-coercion unit pins stay green.

### Mutation (RED) evidence

- M-1: serializer reverted to `created_at` → wire-format pins FAIL.
- M-2: drop `is_sample`/`created_by*` from a serializer → key-set pin
  FAILS.
- M-3: TaskDialog stops sending `end_time` → the interception spec FAILS.
- M-4: dialog restores `trim() || null` → the `""`-description pin FAILS.

### Gate after (in the ambient-polluted shell, on purpose)

`bun run lint && bun run typecheck && bun run test && bun run build &&
bun run test:e2e` — expected 88/88 unit and 67/67 e2e (the same spec
count: the new assertions extend existing specs, no new spec files),
plus a second consecutive full e2e run (the session convention).

### Live parity re-verification

Re-capture the clone's `/api/tasks` + `/api/notes` JSON (curl with the
session cookie) and diff the KEY SETS against the reference's captured
wire (Task: 14 keys; Note: 9 keys) — the final byte-level confirmation.

## 4. Deliverables

- `docs/remediation-plan-session12.md` (this file) + execution record.
- `docs/session_12-review.md` (the session review).
- Screenshots re-captured (dev server, 1440×900 + 390×844 set) into
  `docs/screenshots/`.
- Docs realigned: README (wire/API tables), AGENTS.md (session-12
  conventions + Reference), CLAUDE.md (wire contract), PAD (§4.1 + §8
  counts + §12 ledger), flow-schedule_SKILL.md (FS-23: captured wire
  beats inferred wire), worklog.md (Task 28).
- `.env.example` — unchanged (contract test green).
- Commit on `main` + push via `docs/ssh_git_wrapper_v3.py`.

## 5. Execution record (2026-10-05)

Executed as planned — pin-first (RED against the pre-change build), GREEN
implementation, mutation (RED) evidence, full gate ×2, and the live wire
re-capture diff.

| Step | Result |
|---|---|
| Audit (both targets + standing pins) | ✅ target 1 full parity (the quick-added "NullSurf S12 Probe" is invisible on BOTH apps — every surface enumerated: calendar, Planning day cards, StatusCard, Log Activity, the AI Summary prompt); target 2 parity confirmed by live capture (tags:[] on the reference's wire; the K1e create/update only ever sends {content}); menus pinned green inside the 67/67 base run |
| W-1..W-4 identified via XHR interception | ✅ captured reference Task/Note JSON + the TaskDialog Xne/f decompile; UI-consumption search proved zero UI impact (bundle: created_at×0 / is_sample×0 / created_by×0; repo: no created_at consumer outside the store mapper/serializer) |
| R-1 RED: wire-format.test.ts re-pinned (14/9-key sets, author arg, created_date) | ✅ 4 failed against the pre-change build (the exact assertions for the new contract) |
| R-1 GREEN: serializer + store + 6 route call sites | ✅ wire-format 8/8; tsc clean (no other consumer existed — the zero-UI-impact prediction held) |
| R-2 RED: planning spec interception pins (end_time, description "") | ✅ extended "Add Task dialog creates a scheduled task" with a page.route POST-body capture + the W-3/W-4 assertions |
| R-2 GREEN: TaskDialog (end_time + verbatim description) + API accepts optional end_time | ✅ spec green; quick-add/completeTask callers unchanged (they send no end_time — the derivation fallback covers them) |
| e2e G-4 spec re-pinned (created_date, is_sample, created_by, 14-key set) | ✅ updated + green |
| MUTATION M-1+M-2 (serializer reverted to created_at, is_sample/created_by dropped) | ✅ 3 wire-format pins FAIL — the pins catch the exact regression class |
| MUTATION M-3+M-4 (dialog stops sending end_time, description trim→null) | ✅ the interception spec FAILS ("1 failed") |
| Mutations reverted, tree verified (git status: the 10 intended files + the plan doc), rebuilt | ✅ |
| Full gate | ✅ lint · tsc · **89/89 unit** (88→89: the new author/shape pins) · build (19 routes) · **67/67 e2e — one Focus Timer countdown timing flake in run 1 (spec 129, unrelated to the wire changes: the W1e timer code was never touched), then two consecutive full green runs** · smoke via /api/health |
| Live wire re-capture diff | ✅ clone `/api/tasks` = 14 keys, `/api/notes` = 9 keys — key sets IDENTICAL to the reference's captured wire (incl. is_sample: true on seeded rows, created_by = the session user's email, created_by_id = the user id) |
| Screenshots | ✅ all 20 re-captured on the remediated codebase (dev server, 1440×900 + 390×844) |
| Docs | ✅ README, AGENTS.md, CLAUDE.md, PAD (§4.1 wire contract + §8 counts + §12 ledger), flow-schedule_SKILL.md v2.1.0 (FS-23), session_12-review.md, this execution record, worklog Task 28 |
