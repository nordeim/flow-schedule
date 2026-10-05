# Session 16 Review — FlowSchedule (2026-10-05)

Review + remediation session over base `main @ 2ea6c34` (the session-15
remediation `74c8eb4` plus the operator's docs/session_16.md narrative
commit) on a `git pull`-refreshed workspace (`.env` and the seeded `db/`
intact from the documented setup). The reviewer's plan for this session:
`docs/remediation-plan-session16.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the full gates re-executed green at base
  (lint ✓ · typecheck ✓ · 133/133 unit · build ✓ (19 routes) · **67/67
  e2e** in 2.0 m).
- The session-15 remediation commit (`74c8eb4`) — every seam audited at
  source level (`formatWireDates`, `okWire`/`okWireCreate`, the route
  switches) and re-verified live (the clone's GET/POST wire text carries
  the µs no-Z / µs+Z forms and the `45.0`-style float durations).
- **The session-15 §5 suggested targets taken in order**: (a) the entity
  wire's KEY ORDER — the deliberate ruling this session delivers, with
  fresh live probes on ALL six response surfaces plus the dialog request
  body; (b) the fresh multi-surface live re-measures (mobile menu,
  desktop dashboard, Planning page).
- The method carried forward: the full-body XHR capture +
  request/response-header capture (the Bearer/X-App-Id auth), direct API
  probes (POST/PUT/DELETE on both entities — probe entities cleaned up),
  a Playwright trusted-click pass for the mobile-menu re-measure, and a
  structural DOM diff of the two live dashboards + planning pages.

## 2. The findings

1. **KO-1 (Medium — the entity wire KEY ORDER): the last unpinned
   byte class on the entity wire, now ruled.** Fresh live probes on the
   reference's own traffic (GET list + POST create + PUT update, Task
   AND Note, plus the dialog's save request) show the platform emits a
   CONSISTENT key order on every response surface:
   - Task (all routes): `start_time, duration_minutes, end_time,
     description, title, priority, category, status, id, created_date,
     updated_date, created_by_id, created_by, is_sample`
   - Note (all routes): `title, content, tags, id, created_date,
     updated_date, created_by_id, created_by, is_sample`
   The clone's `serializeTask`/`serializeNote` emit the same 14/9 key
   SETS but in their own construction order (id-first). The request
   side already matches byte-for-byte (the dialog PUT body probed:
     `title, description, priority, category, start_time, end_time,
     duration_minutes` — integer duration — the clone's TaskDialog
     emits the identical order).
   **The ruling (FS-23 — a captured wire beats an inferred wire):**
   match the captured order. The sessions-12 sorted-set emission was
   the inference-era choice (before full-body captures existed);
   sessions 14/15 established the RAW RESPONSE TEXT as the parity
   surface (the float + date token forms); the key order is the last
   byte class on that surface. JSON key order is semantically null and
   every consumer reads by name — the change is pin-compatible by
   construction (the existing key pins assert the SORTED set; the new
   pins assert the exact order).
2. **ET-1 (Medium — the server-side end_time derivation): a
   behavior divergence for direct API callers, probed live.** The
   reference's platform stores end_time AS SUBMITTED — a POST with
   `start_time` + `duration_minutes` but NO `end_time` stores
   `end_time: null` (probed directly; the task renders on the calendar
   but is EXCLUDED from Log Activity by the H1e null guard). The
   reference's app never hits the path (its dialog always submits
   end_time client-computed — decompile + captured request). The
   clone's POST derives end_time from start+duration when absent, and
   its PATCH recomputes end_time when start/duration change without an
   explicit end_time — both documented as self-hosted conveniences,
   but they make direct-API-created tasks behave DIFFERENTLY on the
   two apps (the clone's derived-end_time task APPEARS in Log
   Activity; the reference's does not). **The ruling: match the
   reference** — remove both derivations. The app-level flows are
   unaffected (the dialog's client-computed end_time is e2e-pinned;
   the quick-add sends no times; Mark Complete sends only status).
   Two e2e seed sites relied on the derivation as a fixture
   convenience (the strict-time + top-5 slice specs) — they move to
   explicit end_time values; the wire pin flips from `toBeTruthy()`
   to `toBeNull()`.
3. **The mobile menu (the standing user priority): NO DRIFT.**
   Re-measured live on the reference at 390×844 with Playwright
   trusted clicks (animation-settled): trigger 338/14/36×36 right 374;
   menu 182/54/192×164 right 374; items [Profile, Settings, Logout];
   `animation-name: enter` — **identical to the clone's e2e pins**
   (green inside the 67/67 base run). No Tailwind v4 regression on
   either side.
4. **The structural DOM diff (1440×900, both apps live): MATCH.**
   Dashboard: page container `p-4 md:p-6 lg:p-8`, header `sticky
   top-0 z-50 bg-white/60 backdrop-blur-lg shadow-sm`, main `relative
   z-10`, heading inventory and button inventory identical — the only
   diffs are data-driven (the reference account shows the "All caught
   up!" empty state; the demo seed shows "Next Up" + Mark Complete —
   both states are the pinned state machine). Planning: H1 + week
   heading, Filter/Add Task/prev/next buttons, 7 plain-DIV day cards
   (`div.cursor-pointer`) — match.
5. **The transport layer (observed, ruled out of scope — documented
   self-hosted design):** the reference's platform entity API returns
   a RAW array/object with HTTP 200 on creates and uses PUT (partial
   semantics — Mark Complete probed: `PUT {"status":"completed"}`);
   the clone's public API ships the `{ok, data}` envelope with
   201-on-create and PATCH. The update SEMANTICS are identical
   (partial, only-provided-fields-change); the method names and the
   envelope are the clone's documented transport design (AGENTS.md
   "API envelope discipline", the README API table) — the store's
   unwrap contract and every route pin are built on it. Not a defect.
6. **The date/float/duration forms re-confirmed live on the fresh
   probes**: µs no-Z on reads/updates, µs+Z on creates (Task AND
   Note), `30.0`/`45.0` float durations on POST/PUT responses, ms+Z
   client-supplied start_time/end_time, integer duration on the
   dialog REQUEST. Every session-14/15 pin re-observed.
7. **Reference account hygiene:** this session's probe entities (2
   direct-probe tasks were created + deleted inline; 1 dialog task
   created + deleted; 1 Mark Complete task created + deleted; 1 note
   created + deleted) — the account is back to 9 parity tasks + 3
   notes, 0 S16 leftovers.

## 3. Remediation (TDD: pin → mutation → green)

- **Target 1: KO-1 — the key order.** Reorder the object literals in
  `serializeTask`/`serializeNote` (`src/lib/serialize.ts`) to the
  captured order. Pins: exact-order assertions in the serializer unit
  suite + raw-text order pins in the e2e wire spec (the first task
  token after `{"tasks":[` is `{"start_time":`; the POST's `{"task":{`
  likewise; the Note equivalents). The existing sorted-set pins stay
  green (they assert the set, not the order).
- **Target 2: ET-1 — the derivation removal.** Delete the POST
  else-derivation in `src/app/api/tasks/route.ts` and the PATCH
  `recomputeEnd` block in `src/app/api/tasks/[id]/route.ts` (an
  omitted end_time stays null on create / unchanged on update).
  Pins: the e2e wire spec's create-assertion flips to
  `expect(task.end_time).toBeNull()`; the strict-time and top-5
  seed sites add explicit `end_time` values (fixture changes, same
  assertions).
- Mutation phase (harness outside the repo): M-1 (serializeTask
  reverts to id-first), M-2 (serializeNote reverts), M-3 (the POST
  derivation restored), M-4 (the PATCH recompute restored). All must
  turn the pins RED; tree restored and verified by a pin re-run (the
  session-15 harness lesson).
- Gate after: the full ×2 convention + the live dev-server wire check
  (key order + end_time null on a no-end_time POST) + the
  screenshot re-capture.

## 4. Environment notes

- The db-path v3 protection held again: the dev server served
  `<repo>/db/custom.db` (`/api/health` → `database: "up"`).
- The dev server must be launched and measured within one shell
  invocation (the harness reaps background processes between
  commands) — the structural captures ran that way; the e2e suite's
  own webServer (production standalone on :3100) is unaffected.
- agent-browser's Linux build has no viewport control — the mobile
  re-measure used Playwright (the trusted-click requirement anyway).
- Playwright's `localhost` resolution hit an IPv6/IPv4 mismatch
  against the dev server — use `http://127.0.0.1:3000` in ad-hoc
  scripts (the e2e suite already uses 127.0.0.1).

## 5. Knowledge carried forward

- **FS-28 (new): the key order is part of the wire contract.** Once
  the full-body capture exists, the emission order is a captured fact
  like any other token form — reproduce it at the serializer literal
  (JSON.stringify preserves insertion order for string keys; object
  spread does NOT reorder). The pins layer two forms: the exact-order
  unit pins (the serializer) and the raw-text e2e pins (the response
  seam).
- **The end_time derivation was the last self-hosted "convenience"
  that changed observable behavior.** The ruling principle: a
  self-hosted affordance is fine while it is INVISIBLE (the envelope,
  the status codes, the method names); when it makes the same input
  produce a different observable output than the reference (Log
  Activity membership for a no-end_time task), it is a parity defect.
- **The reference's PUT is partial** (probed: Mark Complete sends
  `PUT {"status":"completed"}` and nothing else changes) — the
  clone's PATCH semantics match exactly; only the method name
  differs, and that is transport-layer.
- **The request-side key order already matched** — the clone's
  TaskDialog was built from the session-12 captured request shape
  and its field order happened to match the reference's dialog PUT
  byte-for-byte (probed this session, no action needed).

**Suggested session-17 targets:** the audit frontier is now fully
closed on the entity wire (names, forms, order — request and
response, both entities, all routes). Remaining candidates: (a) a
fresh screenshot diff pass at more viewports (390/768/1024/1440),
(b) any surface the operator prefers.
