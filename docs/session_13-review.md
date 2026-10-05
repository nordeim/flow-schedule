# Session 13 Review — FlowSchedule (2026-10-05)

Review + remediation session over base `main @ 9485de5` (the session-12
remediation `0a7f7f6` plus the operator's docs/session_13.md narrative
commit) on a `git pull`-refreshed workspace (`.env` and the seeded `db/`
intact from the documented setup; the ambient-polluted shell — a
harness-exported parent-workspace `DATABASE_URL` — exercised the db-path
v3 protection again and the repo's own DB was served). The reviewer's
plan for this session: `docs/remediation-plan-session13.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the full gates re-executed green at base
  (lint ✓ · typecheck ✓ · 89/89 unit · build ✓ (19 routes) · **67/67
  e2e** in 3.2 m).
- The session-12 remediation commit (`0a7f7f6`) — every pin held at
  base; the session-12 review's suggested target (the two InvokeLLM
  request bodies) became this session's audit focus.
- **The method carried forward: live XHR interception of the reference
  app's own base44 traffic** (session 12's upgrade), this session
  extended with **request-HEADER capture** (the base44 SDK sends
  `Authorization: Bearer …` + `X-App-Id` + `X-Origin-URL`; plain fetch
  from the logged-in page CORS-fails without them) — enabling direct
  entity round-trips (probe creation + cleanup) through the reference's
  own API — plus **the `fre`/`Y1e` decompile** from the live bundle to
  reconstruct the prompt-builder source.

## 2. The findings

1. **The Daily Focus route (Y1e): FULL PARITY.** The captured
   InvokeLLM prompt is byte-identical to the clone's
   ("Generate a short inspirational quote for productivity, its author,
   and a positive affirmation for the day. Return as JSON."), the
   fallback `j1` matches `DEFAULT_FOCUS` byte-for-byte (the Mark Twain
   set), and the `a && a.quote ? n(a) : n(j1)` guard matches the clone's
   field-presence check. The reference's live response (a Walt Disney
   quote, session 12; the platform returns schema-validated JSON)
   corroborates the response shape the clone's defensive parser
   produces.
2. **The AI Summary route (fre): 5 divergences, all fixed.** The
   captured InvokeLLM body + the decompiled template revealed:
   - **L-1..L-4 (prompt format):** the reference's template literals are
     indented inside their function, so its "blank" lines carry 8
     spaces (after "briefly:" and after the task list), there is an
     8-space line between the date and the first task, each task
     renders as `\n        - title (category, priority priority)\n        `
     joined by `\n` (an 8-space line AND an empty line between
     consecutive tasks; every task indented), item 3 carries a trailing
     space, and the prompt ends with a 6-space line. The clone's
     re-implemented prompt (truly-empty blanks, plain-`\n` join, no
     indent on subsequent tasks, no trailing space) was semantically
     equivalent but NOT byte-identical.
   - **L-5 (task order):** the reference builds the list from
     `fn.Task.list()`'s default order — **createdAt desc** — and the
     capture proves it: the API-created newest task (start 16:00,
     created last) is listed FIRST, before "Log Activity Parity B"
     (start 14:10, created earlier), which disproves start-time
     ordering. The clone's `/api/ai/summary` queried `startTime asc` —
     a different task order in the prompt (different LLM input).
3. **The fallback constants: FULL PARITY** (all three — j1, fre's
   empty-day branch, fre's catch block — byte-identical to
   `src/lib/ai-defaults.ts`).
4. **E-1 (found by the gate mid-session): the seed's sample week never
   re-anchors.** The baseline e2e passed 67/67 at 23:40 UTC Sunday; the
   post-change runs at 00:15 UTC Monday failed 12 seeded-task specs —
   the seed anchors its scheduled samples to the week the DB was first
   seeded, the idempotency guard never revisits them, and the calendar
   (always the current week) renders none of them after a week
   rollover. Pre-existing (the FS-16 hour-of-day flake family, at week
   granularity — nothing in this session's LLM work touches calendar
   rendering), reproduced live at the exact boundary, and fixed
   pin-first.
5. **Standing pins:** the mobile menu (390×844: trigger 338/14/36×36
   right 374; menu 182/54/192×164; items [Profile, Settings, Logout];
   `animation-name: enter`) and the desktop avatar menu (1440×900:
   trigger 1252/14/76×36; menu 1136/54/192×164) — pinned green inside
   every full e2e run of the session. **No Tailwind v4 regression.**

## 3. Remediation (TDD: pin → mutation → green)

- **Pin phase (RED):** `tests/ai-prompt.test.ts` — the two captured
  prompts pinned BYTE-FOR-BYTE (the whitespace IS the wire), the join
  structure, order preservation, the route-source contract
  (createdAt-desc, the next-config/db-cli file-read precedent), and —
  new evidence class — **SDK-wiring spy assertions via `vi.mock`** that
  verify the exact prompt bytes reach `chat.completions.create`.
  `tests/sample-week.test.ts` — weekMonday identity, the staleness
  decision, the seed source contract. Module-not-found at first, then
  granular RED (the route pin + the wiring pin against the pre-change
  code).
- **GREEN:** `src/lib/ai-prompt.ts` (the decompiled fre template,
  source-for-source) + `DAILY_FOCUS_PROMPT`; `ai.ts` wired to both;
  `/api/ai/summary` → `orderBy: { createdAt: "desc" }`;
  `src/lib/sample-week.ts` + the seed's stale-week re-anchor (delete
  `is_sample` rows only; within-week reruns stay no-ops — verified live
  on the dev DB: re-anchor fired once, then "already present (9) —
  skipped").
- **Mutation (RED) evidence:** M-1 (builder reverted to the old format)
  → 3 pins FAIL; M-2 (route order flipped) → the route pin FAILS; M-3
  (item template loses its leading newline) → 3 pins FAIL; M-4 (ai.ts
  inline prompt) → the wiring pin FAILS; M-5 (seed re-anchor removed) →
  the seed pin FAILS. Reverted, re-verified.
- **Gate after:** lint ✓ · typecheck ✓ · **102/102 unit** (89 → 96 →
  102) · build ✓ (19 routes) · **67/67 e2e ×2 consecutive** (3.3 m +
  3.1 m, through live SDK 429s — the fallbacks by design). The dev
  server's `/api/ai/summary` round-tripped live (the 429 fallback —
  the documented class).
- Screenshots: all 20 captures re-run on the remediated codebase.

## 4. Environment notes

- The polluted-shell protection held again: the harness exports
  `DATABASE_URL=file:/home/z/my-project/db/custom.db` (resolves
  OUTSIDE the repo) — db-path v3 ignored it; the dev server served
  `<repo>/db/custom.db` (`database: "up"`, login + summary route
  green).
- The reference app's account carries the session-11/12 parity tasks;
  this session's probes ("LLMCap S13 Probe", "LLMCap S13 Multi",
  "LLMTrigger S13") were deleted through the reference's own API with
  the captured auth headers (reference data is disposable by
  convention, but the LLM-capture probes are noise for future audits).
- The z-ai SDK 429'd throughout the e2e runs (the documented pattern —
  the deterministic fallbacks fired); the reference's own InvokeLLM
  calls were observed live both sessions.

## 5. Knowledge carried forward

- **FS-24 (new): the prompt IS the wire.** An LLM-backed feature's
  parity surface is not just the rendered card — it is the request
  body: the prompt text (byte-for-byte, including the source code's
  indentation artifacts: 8-space "blank" lines, per-item templates,
  trailing spaces) and the input's ORDER. Decompile tells you the
  template; the capture tells you the bytes; pin them together
  (builder pins + a mocked-SDK wiring pin — the mock IS the seam
  evidence for server-side calls the e2e can never intercept).
- **The week-rollover flake (E-1) generalizes FS-16 to week
  granularity:** a "today"-anchored seed plus an idempotency guard
  that never re-anchors means every seeded-task assertion is
  calendar-week-dependent. The fix belongs in the SEED (the layer that
  owns the anchoring), not the specs — re-anchor `is_sample` rows on
  staleness, and the whole suite self-heals on the next global-setup.
- **The base44 SDK's auth is header-based** (`Authorization: Bearer …`
  + `X-App-Id` + `X-Origin-URL`, cookies alone CORS-fail) — capturing
  `setRequestHeader` is the unlock for direct entity round-trips from
  the logged-in reference page (probe creation, verification reads,
  and hygiene cleanup).
- Test counts moved to **102 unit / 67 e2e / 20 screenshots**; the
  SKILL doc moves to v2.2.0 (FS-24 + E-1).

- **Suggested session-14 targets:** the InvokeLLM RESPONSE side — both
  cards' success paths were observed live (the Walt Disney quote, the
  "Focused" summary) but never diffed against the clone's parsed
  output on the same task set (a paired-probe run: same tasks on both
  apps, compare the rendered card DOM); and the `duration_minutes:
  30.0` float formatting on the reference's entity wire (session-12
  P-1 — semantically null, worth a look only if a byte-diff tool ever
  lands).
