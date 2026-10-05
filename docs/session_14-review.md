# Session 14 Review — FlowSchedule (2026-10-05)

Review + remediation session over base `main @ 5d1b32c` (the session-13
remediation `55904a1` plus the operator's docs/session_14.md narrative
commit) on a `git pull`-refreshed workspace (`.env` and the seeded `db/`
intact from the documented setup; the ambient parent-workspace
`DATABASE_URL` pollution exercised the db-path v3 protection again and
the repo's own DB was served). The reviewer's plan for this session:
`docs/remediation-plan-session14.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the full gates re-executed green at base
  (lint ✓ · typecheck ✓ · 102/102 unit · build ✓ (19 routes) · **67/67
  e2e** in 1.9 m).
- The session-13 remediation commit (`55904a1`) — every pin held at
  base; the session-13 review's suggested target (the InvokeLLM
  RESPONSE side) became this session's audit focus.
- **The method carried forward and extended: the XHR
  response-OVERRIDE harness** — `Object.defineProperty` on the XHR
  instance's `responseText`/`response`/`status` after matching the
  request body, so the reference's own card components (the SDK's
  `onload` readers) receive ARBITRARY post-validation JSON, probe by
  probe. Where sessions 12/13 captured what the reference SENDS and
  RECEIVES, session 14 controls what it RECEIVES — the response-side
  paired probe session 13 proposed, realized as five edge-case probes.
  Plus a raw-text token extraction of the reference's Task entity list
  (the byte-diff tool session-12 P-1 said would be needed).

## 2. The findings

1. **The natural response shapes: FULL PARITY.** The three captured
   InvokeLLM round-trips (two Walt Disney daily-focus quotes, the
   "Focused" summary) parse identically on both apps; the rendered
   card DOM (probe-extracted) matches the clone class-for-class — the
   literal-quote pattern, the "- " author prefix, the vertical icon
   blocks, the gradient mood card with `capitalize`, the max-h-20
   insights, the decorative blob.
2. **RS-1..RS-3 (the summary parse): three divergences, all fixed.**
   The probed reference contract is schema-INVALID → the
   catch/fallback, schema-VALID-but-empty → rendered VERBATIM (the
   platform's `response_json_schema` has no minLength/minItems):
   - empty `focus_areas`/`activities` arrays render ZERO chips (the
     clone's `asStringArray` returned null → the whole summary fell to
     FALLBACK_SUMMARY);
   - empty-string items render as EMPTY chips (the clone filtered
     `x.length > 0`);
   - empty mood/insights render empty `<p>`s (the clone's truthiness
     guard fell to the fallback).
3. **RS-4 (the focus parse): the guard is quote-ONLY.** Probed:
   `{quote: "A real quote", author: "", affirmation: ""}` renders the
   quote + **"- "** + an empty affirmation `<p>` on the reference —
   the decompiled `a && a.quote ? n(a) : n(j1)` guard checks quote
   ONLY. The clone required all three fields truthy → DEFAULT_FOCUS.
   (The clone's card-side check was already quote-only — the
   divergence was server-side only.)
4. **Slice-to-3 confirmed at the RENDER**: 5-item arrays → 3 chips on
   the reference; the clone's render slices identically, so the parse
   now passes arrays through verbatim (no parse-level slicing).
5. **Non-string items (observed, no action)**: `["act", null, 42]`
   renders "act" + empty + "42" — the reference's client does NO type
   checking, but that class is platform-rejected before the client
   ever sees it; the clone's schema check stays (the documented
   self-hosted validation equivalent).
6. **Session-12 P-1 CONFIRMED and CLOSED: the duration float wire.**
   Raw-text token extraction on the reference's own Task entity list:
   `"duration_minutes":60.0` / `30.0` / `null` — the platform's Python
   backend serializes floats; the clone's JS emitted `60`. Fixed:
   `okWire` (`src/lib/api.ts`) + `floatFormatDurations`
   (`src/lib/serialize.ts`) — the three task-serializing responses now
   ship float-formatted integer duration tokens (verified live on the
   dev server: `30.0/120.0/60.0/90.0/45.0/null`); null and
   already-fractional tokens pass through; escaped string content is
   regex-safe (the `\"` escaping differs from the property token).
7. **Standing pins:** the mobile menu (390×844: trigger 338/14/36×36
   right 374; menu 182/54/192×164; items [Profile, Settings, Logout];
   `animation-name: enter`) and the desktop avatar menu (1440×900:
   trigger 1252/14/76×36; menu 1136/54/192×164) — pinned green inside
   every full e2e run of the session. **No Tailwind v4 regression.**

## 3. Remediation (TDD: pin → mutation → green)

- **Pin phase (RED):** `tests/ai-response.test.ts` — 11 pins in the
  mocked-SDK pattern (`vi.mock("z-ai-web-dev-sdk")`, the
  ai-prompt.test.ts precedent): RS-1/RS-2/RS-3 verbatim-empty pins,
  the un-sliced-arrays pin, the RS-4 quote-only pins (positive +
  negative + missing-keys), the natural-capture regression pins, and
  the schema-invalid-still-falls-back pins. `tests/wire-float.test.ts`
  — 8 pins: the pure transform (60→60.0, null untouched, 60.5
  untouched, escaped-content safety, list form, other-number-field
  safety) + the `okWire` seam source pins. RED confirmed: 7/11
  response pins + all wire-float pins failed against the pre-change
  code.
- **GREEN:** the schema-SHAPE parse in `src/lib/ai.ts`
  (`isString`/`isStringArray`, quote-only focus guard) + `okWire` +
  the three task routes' call-site switch + the raw-text e2e assertion
  folded into the existing G-4/W-1/W-2 wire spec.
- **Mutation (RED) evidence — M-1..M-5 all RED** (the harness lives
  outside the repo, the session-13 convention): M-1 (summary parse
  reverts to a truthiness guard) → 2 pins FAIL; M-2 (focus parse
  reverts to the three-field guard) → 2 pins FAIL; M-3 (okWire drops
  the float-format call) → 1 pin FAIL — **after the pin was
  strengthened to match the CALL, not the import** (the first
  mutation run SURVIVED because `toContain("floatFormatDurations")`
  matched the import line alone — a pin-strength lesson captured in
  FS-26's orbit); M-4 (the parse slices/filters again) → 2 pins FAIL;
  M-5 (the task route reverts to plain ok) → 1 pin FAIL. All reverted,
  tree verified byte-identical.
- **Gate after:** lint ✓ · typecheck ✓ · **121/121 unit** (102 → 121:
  +11 ai-response, +8 wire-float) · build ✓ (19 routes) · **67/67 e2e
  ×2 consecutive** (2.0 m + 2.0 m, incl. the new raw-text float pin).
  The dev server's routes round-tripped live: the raw wire now
  float-formatted; both AI routes on the documented 429 fallback
  class.
- Screenshots: all 20 captures re-run on the remediated codebase.

## 4. Environment notes

- The polluted-shell protection held again: the harness exports
  `DATABASE_URL=file:/home/z/my-project/db/custom.db` (resolves
  OUTSIDE the repo) — db-path v3 ignored it; the dev server served
  `<repo>/db/custom.db` (`database: "up"`, login + routes green).
- The reference app's account carries the session-11/12 parity tasks
  (9 tasks); this session's probes (8 tasks: the dialog-created
  "S14 Paired Probe A" + seven quick-added triggers) were deleted
  through the reference's own API with the captured auth headers
  (verified: 0 leftovers).
- The z-ai SDK 429'd on the dev-server AI route checks (the documented
  pattern — the deterministic fallbacks fired); the reference's own
  InvokeLLM calls were observed live (the natural captures).

## 5. Knowledge carried forward

- **FS-26 (new): the response is the wire too.** An LLM-backed
  feature's parity surface extends past the request body (FS-24) to
  the RESPONSE-PARSE contract: the platform validates SHAPE
  (response_json_schema — no minLength/minItems), so schema-valid
  emptiness (empty strings, empty arrays, empty-string items) renders
  VERBATIM and only schema-invalid shapes fall to the fallbacks. A
  defensive parse that checks truthiness conflates "empty" with
  "invalid". The probe method: the XHR response-OVERRIDE harness
  (defineProperty on the instance — the SDK's onload reads your
  values), the same session-13 header-capture family.
- **The M-3 lesson: a source pin must match the CALL, not the
  import.** `toContain("floatFormatDurations")` survived a mutation
  that dropped the call but kept the import;
  `toMatch(/floatFormatDurations\(\s*JSON\.stringify/)` does not.
  File-read source pins should assert the syntactic FORM that
  execution actually exercises.
- **Session-12 P-1 closed the same way P-classes close: build the
  byte-diff tool, then fix.** The raw-text token extraction on the
  reference's entity wire turned a "semantically null" observation
  into a measurable contract — and the fix (a text-level float
  formatter at the response seam) is deterministic and
  parser-transparent (JSON 60.0 === 60).
- Test counts moved to **121 unit / 67 e2e / 20 screenshots**; the
  SKILL doc moves to v2.3.0 (FS-26).

- **Suggested session-15 targets:** the remaining P-class observations
  are thin — candidates: (a) a **429/failure-path paired probe** (the
  reference's InvokeLLM failure rendering vs the clone's fallback —
  both sides' catch blocks were observed but never on the SAME
  controlled failure), (b) the **AI route's `?date=` affordance**
  (P-5 — the reference always uses today; a self-hosted API
  affordance, low value), or (c) any surface the operator prefers.
  The response-side seam is now fully pinned; the audit frontier is
  elsewhere.
