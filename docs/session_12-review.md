# Session 12 Review — FlowSchedule (2026-10-05)

Review + remediation session over base `main @ c414774` (the session-11
remediation `d29b480` plus the operator's docs/session_12.md narrative
commit) on a `git pull`-refreshed workspace (`.env` and the seeded `db/`
intact from the documented setup; the ambient-polluted shell — a
harness-exported parent-workspace `DATABASE_URL` — exercised the db-path
v3 protection again and the repo's own DB was served). The reviewer's
plan for this session: `docs/remediation-plan-session12.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the full gates re-executed green at base
  (lint ✓ · typecheck ✓ · 88/88 unit · build ✓ (19 routes) · **67/67
  e2e** in 3.1 m).
- The session-11 remediation commit (`d29b480`) — every pin held at
  base; the quick-added-task and Brainstorm behaviors the session-11
  review suggested as this session's targets.
- **The method upgrade this session: live XHR interception of the
  reference app's own base44 entity traffic** (a patched
  `XMLHttpRequest.prototype.open/send` inside the logged-in reference
  page). First-hand WIRE evidence — stronger than decompile inference,
  and it immediately paid off.

## 2. The findings

1. **Target 1 (the quick-added null-time task's surfacing): FULL PARITY.**
   Quick-added "NullSurf S12 Probe" through the reference's own z1e
   panel, then enumerated EVERY surfacing surface on the reference: no
   calendar block (no start_time), no Planning day-card chip, StatusCard
   stays "All caught up!", Log Activity excludes it (the H1e null
   guard), and — read from the intercepted InvokeLLM request — the AI
   Summary prompt lists only TODAY's scheduled tasks, so the probe never
   reaches the LLM either. The task IS stored (intercepted entity GET
   confirms `start_time:null, duration_minutes:null, end_time:null,
   description:null, priority:"medium", category:"work", status:"todo"`)
   — the quick-add defaults match the clone byte-for-byte. **A
   quick-added task is invisible everywhere on BOTH apps** — the
   reference's own (surprising) behavior, mirrored.
2. **Target 2 (the Notes tags round-trip): parity, now capture-verified.**
   The reference's live `GET entities/Note?sort=-created_date` response
   carries `"tags":[]` on every note — session 8's decompile inference
   ("tags are an ARRAY on the wire") is confirmed first-hand. The
   reference's K1e create/update only ever sends `{content}` (no
   title/tags editor exists in its UI), matching the clone's Brainstorm
   flow.
3. **The real findings — 4 wire-contract divergences** (the captured
   reference Task/Note shapes vs the clone's):
   - **W-1:** the reference's timestamps are `created_date`/
     `updated_date` — NOT the clone's `created_at`/`updated_at`.
     Session 8's serializer comment said "the repo's documented names"
     — an honest admission it had no reference evidence for the names;
     the capture now provides it.
   - **W-2:** the reference's responses carry `is_sample`,
     `created_by` (the author's email), and `created_by_id` — the
     clone stripped all three.
   - **W-3:** the reference's TaskDialog submits 7 fields INCLUDING a
     client-computed `end_time` (its decompiled `f` function:
     `end = start + duration*60000`); the clone's dialog submitted 6
     (no end_time — the API derived it).
   - **W-4:** the reference's dialog submits the description VERBATIM
     (`""` stays `""` — captured on Top5 Parity G); the clone coerced
     `""`→null.
   - Decisive context: **the reference's own front-end never consumes
     any of these fields** (bundle search: `created_at`×0,
     `is_sample`×0, `created_by`×0 — only `created_date`×1, the
     Note.list sort argument), and the clone likewise had zero
     `created_at` consumers outside the store mapper/serializer. The
     fix was a pure wire-contract rename with zero UI blast radius.
4. **Standing pins:** the mobile menu (390×844: trigger 338/14/36×36
   right 374; menu 182/54/192×164; items [Profile, Settings, Logout];
   `animation-name: enter`) and the desktop avatar menu (1440×900:
   trigger 1252/14/76×36; menu 1136/54/192×164) — pinned green inside
   every full e2e run of the session. **No Tailwind v4 regression.**

## 3. Remediation (TDD: pin → mutation → green)

- **Pin phase (RED):** `tests/wire-format.test.ts` re-pinned to the
  captured shapes — `created_date`/`updated_date`, `is_sample`,
  `created_by`/`created_by_id`, exact key sets (Task 14 / Note 9), the
  `serializeTask(task, author)` signature — 4 tests failed against the
  pre-change build. The e2e G-4 spec re-pinned the same contract
  end-to-end; the planning "Add Task dialog" spec gained a
  `page.route` POST-body interception pinning W-3/W-4 (end_time =
  start+45 min, description "").
- **GREEN:** `serializeTask`/`serializeNote` (+`WireAuthor`), the store
  types/mappers (`created_date`/`updated_date`), the 6 route call
  sites passing the session user as author, the TaskDialog's
  client-computed `end_time` + verbatim description, and the API's
  optional-`end_time` acceptance (caller-supplied wins; derivation
  from start+duration remains the fallback for every other caller).
- **Mutation (RED) evidence:** M-1+M-2 (serializer reverted to
  `created_at`, author/sample fields dropped) → 3 wire-format pins
  FAIL; M-3+M-4 (dialog stops sending end_time, description
  trim→null) → the interception spec FAILS. Reverted, rebuilt.
- **Gate after:** lint ✓ · typecheck ✓ · **89/89 unit** (88→89) ·
  build ✓ · **67/67 e2e — one Focus Timer countdown timing flake in
  run 1 (spec 129 — the W1e timer code was never touched; machine was
  rebuilding during that run), then two consecutive full green runs**.
- **Live wire re-capture diff:** the clone's `/api/tasks` now returns
  EXACTLY the captured 14-key set and `/api/notes` the 9-key set —
  including `is_sample: true` on seeded rows and `created_by` = the
  session user's email. Byte-level wire parity with the reference.
- Screenshots: all 20 captures re-run on the remediated codebase.

## 4. Environment notes

- The polluted-shell protection held again: the harness exports
  `DATABASE_URL=file:/home/z/my-project/db/custom.db` (resolves
  OUTSIDE the repo) — db-path v3 ignored it; the dev server served
  `<repo>/db/custom.db` (`database: "up"`, login + CRUD green).
- The reference app's account carries the session-11 parity tasks plus
  this session's "NullSurf S12 Probe" quick-add probe and one S12 note
  (reference data is disposable by convention).
- The z-ai SDK 429'd during the e2e runs (the documented pattern — the
  deterministic fallbacks fired); the reference's own InvokeLLM calls
  were observed live (its Daily Focus rendered a Walt Disney quote —
  captured mid-session).

## 5. Knowledge carried forward

- **FS-23 (new): a captured wire beats an inferred wire.** Session 8
  named the response fields from repo documentation ("created_at —
  the repo's documented names") and got two of them wrong — plus three
  missing fields — without any test ever noticing, because every
  consumer was on the same side of the seam. When a contract's field
  NAMES are the deliverable (an API cloning another API), the evidence
  source must be the traffic itself: patch the XHR layer inside the
  logged-in reference page and read the actual JSON. Decompile tells
  you what the code SENDS; only the wire tells you what the server
  RETURNS.
- **The zero-consumer rename is the cheapest parity win there is** —
  but only after you've PROVEN zero consumers (both bundles searched,
  both codebases searched). The proof is what turns a scary rename
  into a mechanical one.
- **Quick-added tasks are invisible by the reference's own design** —
  documented acceptance now: the quick-add captures the task (work/
  medium/todo, no times, no description) and NOTHING surfaces it
  until it is edited from... nowhere (no UI path exists). An odd but
  genuine reference behavior, mirrored.
- Test counts moved to **89 unit / 67 e2e / 20 screenshots**; the
  SKILL doc moves to v2.1.0 (FS-23).

- **Suggested session-13 targets:** the reference's InvokeLLM request
  bodies are now interceptable the same way — a full prompt/schema
  diff of the two LLM routes (the Daily Focus prompt was captured this
  session; the AI Summary prompt's task-list formatting can be diffed
  against the clone's builder), and the `duration_minutes: 30.0`
  float formatting on the reference's wire (P-1 — semantically null,
  worth a look only if a byte-diff tool ever lands).
