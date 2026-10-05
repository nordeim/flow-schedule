# Remediation Plan — Session 16 (2026-10-05)

Session-16 review of the FlowSchedule clone (base commit `2ea6c34` —
the session-15 remediation `74c8eb4` plus the operator's
docs/session_16.md narrative commit; `git pull` workspace with `.env` +
seeded `db/` intact). The `skills/` folder is excluded from code
checking, testing and compilation per the operating instructions
(eslint ignores `skills`, tsconfig excludes `skills`, vitest includes
only `src/` + `tests/` — re-verified via the green base gate).

Skills used this session: `agent-browser` (login + the full-body XHR
capture with request/response headers + the direct API probes on the
reference app), `clone-app-pat-pro` (measured facts, not preferences —
the probed key orders and the no-derivation end_time behavior are the
ground truth), `tdd` / `tdd-workflow` (red → green → mutation
evidence), `code-review-and-audit` (the tiered review pipeline),
`testing-patterns` (the seam-pinning conventions), and the Tailwind v4
trap knowledge in `skills/nextjs16-tailwind4` (re-checked: no
regression — the mobile menu geometry re-measured live on the
reference at 390×844 matches the clone's e2e pins exactly).

## 1. Audit scope and method

Session 15's closing suggestion set this session's primary target —
the entity wire's KEY ORDER (§5a) — and the standing user priority
(the mobile menu) plus the structural DOM diff round out the surfaces.
Method: the sessions-12–15 XHR family upgraded with request-BODY
capture (the dialog save + Mark Complete flows), request-header
capture (the Bearer/X-App-Id auth — reused for the direct API probes),
POST/PUT/DELETE probes on both entities (all probe entities deleted),
a Playwright trusted-click mobile-menu re-measure, and structural DOM
diffs of the two live dashboards + planning pages.

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull` (main `74c8eb4` → `2ea6c34`, adds docs/session_16.md); `.env` re-verified (`DATABASE_URL="file:../db/custom.db"` + AUTH_SECRET); `db/` at the repo root; full base gate re-executed | ✅ lint ✓ · typecheck ✓ · **133/133 unit** · build ✓ (19 routes) · **67/67 e2e** (2.0 m) — the codebase matches its documented state exactly |
| **Mobile menu (user's standing priority)** | Live re-measure on the REFERENCE at 390×844 (Playwright trusted clicks, animation-settled) + the clone's geometry pins inside the 67/67 base run | ✅ **no drift, no Tailwind v4 regression** — reference: trigger 338/14/36×36 right 374, menu 182/54/192×164 right 374, items [Profile, Settings, Logout], `animation-name: enter`; identical to the pins |
| **Target 1: the entity wire KEY ORDER** (session-15 §5a) | Full-body key extraction on the reference's own Task/Note traffic: GET list, POST create, PUT update — both entities (6 response surfaces) + the dialog save request + the Mark Complete request | ⚠️ **KO-1**: the reference emits a CONSISTENT captured order (Task: start_time-first, 14 keys; Note: title-first, 9 keys) on EVERY response surface; the clone emits the same key sets id-first; the REQUEST side already matches byte-for-byte (§2) |
| **Target 2: the end_time derivation** | Direct API probes: POST with start_time + duration_minutes but NO end_time (the response + the stored value); the Mark Complete PUT capture (partial-update semantics) | ⚠️ **ET-1**: the reference stores end_time null when omitted (no server-side derivation); the clone derives on POST and recomputes on PATCH — a direct-API-caller divergence (Log Activity membership differs) (§2) |
| The structural DOM parity | Playwright DOM diff of both live dashboards at 1440×900 + both planning pages (card inventory, headings, geometry, container/header/main classes) | ✅ MATCH — identical container/header/main classes and heading/button inventories; only data-driven diffs (StatusCard state per account data) |
| The session-15 remediation commit (74c8eb4) | Line-level audit of `formatWireDates`, `okWire`/`okWireCreate`, the route switches, the 12 pins; live re-verification of the clone's wire forms | ✅ clean — every pin held at base; the µs/float forms re-observed on the fresh reference probes |
| The transport-layer ruling | The reference's raw-array/200/PUT vs the clone's envelope/201/PATCH — observed on the same probes | ✅ documented self-hosted design (the {ok,data} envelope, REST conventions); the update SEMANTICS are identical (partial — probed via Mark Complete); no action |
| Reference account hygiene | Probe cleanup via the captured auth headers (4 tasks + 1 note created + deleted this session) | ✅ 9 parity tasks + 3 notes remain, 0 S16 leftovers |

## 2. Issues, bugs and gaps found

The audit found **zero visual/behavioral regressions** (the base gate
and every geometry pin green; the reference re-measured identical).
Two real wire-level divergences — both in the sessions-12–15 family
(the byte-level parity surface), and both now closed by this plan.

### KO-1 (Medium): the entity wire key order

Probed live on the reference's own entity traffic (all six response
surfaces + both captured request flows):

| Surface | Reference key order (captured) | Clone emission today |
|---|---|---|
| Task — GET/POST/PUT | `start_time, duration_minutes, end_time, description, title, priority, category, status, id, created_date, updated_date, created_by_id, created_by, is_sample` | same 14-key SET, id-first |
| Note — GET/POST/PUT | `title, content, tags, id, created_date, updated_date, created_by_id, created_by, is_sample` | same 9-key SET, id-first |
| Dialog REQUEST (Task save) | `title, description, priority, category, start_time, end_time, duration_minutes` (integer duration) | **byte-identical already** |
| Mark Complete REQUEST | `PUT {"status":"completed"}` (partial) | PATCH, same partial semantics |

Consumer impact of the response order: ZERO (mapTask/mapNote read by
name; JSON.parse consumers read by name; the e2e key pins assert the
SORTED set). The ruling: **match the captured order** — FS-23 (a
captured wire beats an inferred wire); the sessions-12 sorted-set
emission predates the full-body captures. The fix is the object
literal order in `serializeTask`/`serializeNote`; JSON.stringify
preserves insertion order for string keys.

### ET-1 (Medium): the server-side end_time derivation

Probed live: the reference's platform stores end_time AS SUBMITTED —
a POST carrying `start_time` + `duration_minutes` but no `end_time`
returns and stores `end_time: null` (the task renders on the
calendar; it is EXCLUDED from Log Activity by the H1e null guard).
The clone's POST derives `end_time = start + duration` when omitted,
and its PATCH recomputes end_time when start_time/duration_minutes
change without an explicit end_time. App-level flows are unaffected
on both apps (the dialog always submits end_time client-computed —
e2e-pinned; the quick-add sends no times; Mark Complete sends only
status). But the same direct-API input produces different observable
output on the two apps (Log Activity membership), which is a parity
defect under the FS-23 principle. The fix: remove both derivations;
update the two e2e seed sites that used the derivation as a fixture
convenience + the one wire pin that asserted it.

### Confirmed parity (no action)

- **The mobile menu**: re-measured live on the reference — identical
  to the clone's pins (no drift, no Tailwind v4 regression; the
  standing user priority).
- **The structural DOM**: dashboards + planning pages — match (only
  data-driven diffs).
- **The date/float forms**: every session-14/15 pin re-observed on
  the fresh probes (µs no-Z reads, µs+Z creates, float durations,
  ms+Z client dates, integer request durations).
- **The request-side key order**: byte-identical already (probed).
- **The transport layer** (envelope, status codes, method names):
  the documented self-hosted design; the update semantics (partial)
  are identical — probed.

## 3. Remediation (TDD: red → green → mutation)

### ToDo list

- [x] T-1 (RED): `tests/wire-order.test.ts` — the exact-order pins:
      `serializeTask` emits the captured 14-key order;
      `serializeNote` emits the captured 9-key order; the okWire
      text seam preserves the emission order (the serialized task's
      first token is `"start_time":`); the create-mode seam likewise.
- [x] T-2 (RED): the e2e wire-spec addendum — the GET /api/tasks raw
      text's first task object starts `{"start_time":`; the POST
      response's task object likewise; the notes equivalents; and
      the ET-1 flip: a POST without end_time returns
      `end_time: null` (the derived-`toBeTruthy()` assertion flips
      to `toBeNull()`).
- [x] T-3 (GREEN): reorder `serializeTask`/`serializeNote` object
      literals in `src/lib/serialize.ts` to the captured orders
      (same key sets, same values, same types — only the emission
      order changes; the internal TaskRow/NoteRow types and the
      WireTask/WireNote types stay as-is — TS object types are
      order-independent).
- [x] T-4 (GREEN): remove the POST end_time derivation
      (`src/app/api/tasks/route.ts` — an omitted end_time stays
      null) and the PATCH recompute block
      (`src/app/api/tasks/[id]/route.ts` — an omitted end_time stays
      unchanged; a supplied one still validates; start_time/
      duration still update independently).
- [x] T-5 (GREEN, fixtures): the strict-time + top-5 slice e2e seeds
      send explicit `end_time` values (the same instants the
      derivation used to compute — the assertions are unchanged).
- [x] T-6 (MUTATION, harness outside the repo): M-1 serializeTask
      reverts to id-first; M-2 serializeNote reverts; M-3 the POST
      derivation restored; M-4 the PATCH recompute restored. All
      must turn the pins RED; ONE canonical per-file backup; the
      pin suite re-runs after the harness to prove the restore
      (the session-15 harness lesson).
- [x] T-7 (GATE): `bun run lint && bun run typecheck && bun run
      test && bun run build && bun run test:e2e` ×2 consecutive
      (the session convention).
- [x] T-8 (LIVE): the dev-server raw-wire check — the GET text's
      first task key is start_time; a POST without end_time ships
      `end_time:null` + the µs+Z create dates; the dialog save flow
      still round-trips end_time (the client-computed seam).
- [x] T-9 (SCREENSHOTS): the 20 captures re-run on the remediated
      codebase (`scripts/capture-screenshots.mjs`).
- [x] T-10 (DOCS): README (the key-order + no-derivation notes,
      counts), AGENTS.md (FS-28 + the end_time ruling), CLAUDE.md
      (the wire contract), PAD (§4.1 wire + counts + ledger),
      flow-schedule_SKILL.md (version bump, FS-28), the worklog,
      this plan's execution record.
- [x] T-11 (PUSH): commit on `main` + push via
      `docs/ssh_git_wrapper_v3.py` (the runbook).

### Design decisions (validated against the codebase)

- **The reorder lives in the serializer literals, not a key-sort
  shim.** `JSON.stringify` preserves string-key insertion order; the
  literal order IS the wire order — no post-processing needed (the
  float/date transforms stay text-level and order-agnostic).
- **The WireTask/WireNote types stay unchanged.** TypeScript object
  types are order-independent; only the runtime literals move. The
  store's mapTask/mapNote read by name — zero consumer impact.
- **The derivation removal keeps validation.** A SUPPLIED end_time
  still validates (invalid dates fail); only the silent fallback
  disappears. The PATCH keeps its partial-update semantics (the
  probed reference behavior: only provided fields change).
- **The e2e fixture updates preserve assertion semantics.** The
  strict-time spec's "3 hours ago" and the top-5 slice's ordering
  pins keep asserting the same rendered outcomes; only the seed
  payloads gain explicit end_time values (the same instants the
  derivation produced).
- **The envelope/status/method rulings stay.** The {ok,data}
  envelope, 201-on-create, and PATCH-for-update are the documented
  transport design; the entity PAYLOAD wire (names, forms, ORDER)
  is the parity surface — this session closes its last class.

## 4. Deliverables

- `docs/remediation-plan-session16.md` (this file) + execution record.
- `docs/session_16-review.md` (the session review).
- Screenshots re-captured (dev server, 1440×900 + 390×844 set) into
  `docs/screenshots/`.
- Docs realigned (README, AGENTS, CLAUDE, PAD, SKILL, worklog).
- `.env.example` — re-verified by the contract test (expected
  unchanged).
- Commit on `main` + push via `docs/ssh_git_wrapper_v3.py`.

## 5. Execution record (2026-10-05)

Executed as planned — pin-first (RED), GREEN implementation, mutation
(RED) evidence with the canonical-backup harness + the post-run pin
re-run, the full gate ×2, and the live dev-server wire check.

| Step | Result |
|---|---|
| Audit (the key-order probes on all six response surfaces + both request flows; the end_time direct probes; the mobile menu live re-measure; the structural DOM diffs) | ✅ KO-1 confirmed (the consistent captured order, every surface); ET-1 confirmed (the reference stores end_time as submitted — the partial-PUT semantics probed via Mark Complete); the mobile menu re-measured live on the reference — identical to the pins; the DOM diffs — match |
| RED: tests/wire-order.test.ts (10 pins — the exact emission orders ×2, the null-form slots ×2, the text-seam order preservation ×3, the no-derivation route source pins ×3) | ✅ 9/10 failed against the pre-change code (the 10th guards the supplied-end_time validation — green at base by design) |
| GREEN T-3: the serializer literal reorders (src/lib/serialize.ts) | ✅ the captured orders emitted; the same key sets, values, and types; JSON.stringify preserves insertion order |
| GREEN T-4: the derivation removals (src/app/api/tasks/route.ts + tasks/[id]/route.ts) | ✅ an omitted end_time stores null (POST) / stays unchanged (PATCH); a supplied one still validates; the PATCH keeps its partial semantics |
| T-5: the e2e fixture updates (the strict-time + top-5 seeds send explicit end_time; the wire pin flips to `end_time:null`) | ✅ the same rendered outcomes, the same assertions — only the seed payloads gained explicit values |
| T-2: the e2e raw-text order pins (task `{"start_time":` / note `{"title":` on GET and POST, + the no-derivation flip) folded into the existing wire spec | ✅ the task + note orders pinned on both routes; `end_time:null` on the no-end_time POST |
| MUTATION M-1 (serializeTask reverts to id-first) | ✅ 4 pins FAIL |
| MUTATION M-2 (serializeNote reverts to id-first) | ✅ 3 pins FAIL |
| MUTATION M-3 (the POST end_time derivation restored) | ✅ 1 pin FAIL |
| MUTATION M-4 (the PATCH recompute block restored) | ✅ 1 pin FAIL |
| Tree restore | ✅ ONE canonical per-file backup; byte-identical restore verified; the post-run pin re-run 10/10 green (the session-15 harness rule) |
| Full gate ×2 | ✅ lint ✓ · tsc ✓ · **143/143 unit** (133 → 143: +10 wire-order) · build ✓ (19 routes) · **67/67 e2e ×2 consecutive** (3.1 m + 3.1 m) |
| Live route check (T-8, dev server) | ✅ GET `{"ok":true,"data":{"tasks":[{"start_time":null,"duration_minutes":null,"end_time":null,…` (start_time-first, µs no-Z dates); POST without end_time: `end_time:null` + `"duration_minutes":30.0` + µs+Z create dates; PATCH full-form round-trip (end_time ms+Z, `60.0`); PATCH without end_time — unchanged (`16:00:00.000Z`, not recomputed); the notes title-first on GET/POST — all forms byte-matching the probes |
| Screenshots (T-9) | ✅ all 20 re-captured on the remediated codebase |
| Reference account hygiene | ✅ all 5 probe entities (4 tasks + 1 note) deleted via the captured auth headers (verified: 9 parity tasks + 3 notes remain, 0 S16 leftovers) |
| Docs (T-10) | ✅ README (the key-order + no-derivation notes + counts), AGENTS.md (FS-28 + the end_time ruling + the Reference section), CLAUDE.md (the wire contract), PAD (§4.1 wire + §8 counts + 8 ledger rows), flow-schedule_SKILL.md v2.5.0 (FS-28 + the session-16 history), this execution record, the worklog (Task 32) |

### Test-count movement

- Unit: 133 → **143** (+10 wire-order)
- E2e: **67** (unchanged count — the order + no-derivation pins folded
  into the existing wire spec's assertions)
