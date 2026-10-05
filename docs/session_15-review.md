# Session 15 Review — FlowSchedule (2026-10-05)

Review + remediation session over base `main @ 89b9c7d` (the session-14
remediation `8378b85` plus the operator's docs/session_15.md narrative
commit) on a `git pull`-refreshed workspace (`.env` and the seeded `db/`
intact from the documented setup). The reviewer's plan for this session:
`docs/remediation-plan-session15.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the full gates re-executed green at base
  (lint ✓ · typecheck ✓ · 121/121 unit · build ✓ (19 routes) · **67/67
  e2e** in 2.0 m).
- The session-14 remediation commit (`8378b85`) — every pin held at base
  (the schema-shape AI parse, the quote-only focus guard, the
  float-formatted duration wire); the session-14 review's suggested
  target (the failure-path paired probe) became this session's first
  audit focus, and the entity DATE wire — surfaced by the same XHR
  capture family — became the second.
- **The method carried forward: the full-body XHR capture + the
  response-override harness** (sessions 12–14), now with request-header
  capture (the Bearer/X-App-Id auth the SDK round-trips), direct API
  probes (POST/PUT on both entities), a Playwright trusted-click pass
  for the mobile-menu re-measure, and a structural DOM diff of the two
  live dashboards.

## 2. The findings

1. **The failure-path paired probe (session-14 §5a): PARITY CONFIRMED,
   no action.** Forcing the reference's own Daily Focus InvokeLLM XHR to
   429 (the response-override harness) renders the reference's Mark
   Twain fallback — `"The secret of getting ahead is getting started." /
   - Mark Twain` — while the clone's dev server, on the z-ai SDK's live
   429, rendered the byte-identical DEFAULT_FOCUS the same morning. Both
   sides' catch blocks ship the same canned content under the SAME
   controlled failure class, closing the last unpinned AI surface. (The
   summary's failure content was already byte-confirmed in session 14
   via the CORS-broken route mock; this session's summary card had no
   scheduled tasks, so no InvokeLLM fired — the reference's own
   empty-day no-call behavior, matching the clone's
   `tasks.length === 0 → EMPTY_DAY_SUMMARY` seam.)
2. **DW-1 (Medium — the entity DATE wire form): a new byte-level
   divergence, same family as session-12 P-1.** Full-body token
   extraction of the reference's own entity traffic shows the platform's
   Python backend serializes its SERVER-GENERATED datetimes at
   microsecond precision, with a per-route Z asymmetry (all six surfaces
   probed live this session):
   - POST create (Task AND Note): `"created_date":
     "2026-10-05T02:11:34.297127Z"` — 6-digit µs, **WITH Z**;
   - GET list (Task AND Note) + PUT/PATCH update (Task AND Note):
     `"created_date":"2026-10-05T02:11:34.297000"` — 6-digit µs,
     **NO Z** (the PUT's `updated_date` carries fresh true µs
     `.833721`; `created_date` re-reads the ms-truncated store form).
   The clone's `toISOString()` emits 3-digit ms + Z on every route.
   `start_time`/`end_time` (CLIENT-supplied dates) are 3-digit ms + Z on
   the reference too — **already byte-matching**. Consumer impact: ZERO
   (mapTask/mapNote keep both strings opaque; no UI, store, or test
   consumer parses them — verified by grep).
3. **The mobile menu (the standing user priority): NO DRIFT.**
   Re-measured live on the reference at 390×844 with Playwright trusted
   clicks (agent-browser has no Linux viewport control): trigger
   338/14/36×36 right 374; menu 182/54/192×164 right 374; items
   [Profile, Settings, Logout]; `animation-name: enter` — **identical to
   the clone's e2e pins** (green inside the 67/67 base run). No Tailwind
   v4 regression on either side.
4. **The structural DOM diff (1440×900, both apps live): MATCH.** Card
   inventory 6/6, day rows 7/7, page container `p-4 md:p-6 lg:p-8`,
   header `sticky top-0 z-50 bg-white/60 backdrop-blur-lg shadow-sm`,
   Quick Action tiles 4/4, badge counts 0/0. The only diffs are
   data-driven (the reference account's StatusCard shows "All caught
   up!" with 1 task block today; the demo seed shows "Next Up" with 3 —
   both states are the pinned state machine).
5. **Reference account hygiene:** this session's probe entities (2
   tasks, 1 note) deleted via the captured auth headers; 9 parity tasks
   + 3 notes remain, 0 S15 leftovers.

## 3. Remediation (TDD: pin → mutation → green)

- **Target: DW-1 — the date-token wire form.** `formatWireDates(json,
  mode)` (`src/lib/serialize.ts`): a text-level transform keyed on the
  `"created_date"`/`"updated_date"` property tokens (the
  `floatFormatDurations` pattern) that pads the 3-digit ms token to 6
  digits and — per the probed per-route contract — keeps the Z on
  create responses (`okWireCreate`, the POST routes) and strips it on
  read responses (`okWire`, the GET/PATCH routes). The notes routes
  switch from `ok()` to the wire helpers (their wires carry the same
  date tokens). The 6th-digit µs values are `.000` (the clone's clock
  and SQLite store ms — the same precision class as the duration float
  fix: form parity, value at storage precision).
- Pin phase: `tests/wire-dates.test.ts` (the pure transform + the
  okWire/okWireCreate seam + the route call sites, the M-3
  call-not-import pin-strength lesson applied) + the e2e raw-text date
  assertions folded into the existing G-4/W-1/W-2 wire spec.
- Mutation phase (harness outside the repo): M-1 (transform reverts to
  identity), M-2 (okWire drops the date call), M-3 (okWireCreate emits
  read mode), M-4 (POST tasks reverts to plain ok/okWire), M-5 (notes
  routes revert to ok).
- Gate after: the full ×2 convention + the live dev-server wire check +
  the 20-screenshot re-capture.

## 4. Environment notes

- The db-path v3 protection held: the harness shell's ambient
  `DATABASE_URL` was again a parent-workspace URL; the dev server
  served `<repo>/db/custom.db` (`/api/health` → `database: "up"`).
- The z-ai SDK 429'd on the clone's AI routes during the live checks
  (the documented class — the deterministic Mark Twain fallback fired,
  which is exactly what made the failure-path paired probe possible on
  the same morning).
- agent-browser's Linux build has no viewport/device command — the
  mobile-menu re-measure used Playwright (the same trusted-click
  requirement the Radix menus need anyway); the window-size launch arg
  is clamped by the WM (780×437 observed).

## 5. Knowledge carried forward

- **FS-27 (new): the server-generated date wire is a Python artifact
  too.** The reference's entity wire carries THREE date serialization
  forms: client-supplied dates (start_time/end_time) as JS-style
  ms+Z (stored verbatim), server-generated create-response dates as
  µs+Z, and server-generated read/update dates as µs with NO Z. The
  byte-parity seam (okWire) can reproduce the FORMS exactly (pad ms →
  µs, route-keyed Z) but not the µs digits themselves (no µs clock
  upstream of SQLite) — the same form-vs-value distinction as the
  duration float fix. Pin the forms; document the precision class.
- **The failure-path frontier is closed.** Every AI surface — request
  bytes (session 13), response parse (session 14), and now the
  failure/catch path — is pinned from live probes on both apps.
- The Z/no-Z asymmetry is per-ROUTE, not per-entity: POST responses
  (both Task and Note) keep the Z; GET/PUT responses (both entities)
  strip it. A single response helper per mode covers it.
- Test counts move to 121 → ~131 unit / 67 e2e (the date pins fold into
  the existing wire spec's raw-text assertions).

**Suggested session-16 targets:** the audit frontier is now the wire's
last unpinned byte classes — candidates: (a) the entity wire's KEY
ORDER (the reference emits start_time-first; the clone id-first —
JSON-order is semantically null and the session-12 pins chose the
sorted-set form, so this needs a deliberate ruling), (b) a fresh
screenshot diff pass at more viewports (390/768/1024/1440), or (c) any
surface the operator prefers.
