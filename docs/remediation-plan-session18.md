# Remediation Plan — Session 18 (2026-10-05)

Session-18 review of the FlowSchedule clone (base commit `bf2e3c8` —
the session-17 remediation `024b59f` plus the operator's two
docs/session_18.md narrative commits; a fresh `git clone` workspace
bootstrapped per `docs/session_18-review.md` §4). The `skills/` folder
is excluded from code checking, testing and compilation per the
operating instructions (eslint ignores `skills`, tsconfig excludes
`skills`, vitest includes only `src/` + `tests/` — re-verified via the
green base gate).

Skills used this session: `agent-browser` (the reference login + live
driving pattern), `clone-app-pat-pro` (measured facts, not preferences —
the display-flip timeline is the ground truth), `tdd` /
`tdd-workflow` (red → green → mutation evidence),
`code-review-and-audit` (the tiered review pipeline),
`testing-patterns` (the seam-pinning conventions), and
`evidence-driven-testing` (the page.clock completion-path pin).

## 1. Audit scope and method

Session-17's closing suggestion set this session's primary target —
the timed-interaction pass (the Focus Timer countdown at sub-second
precision on both apps) — plus the standing discipline (the base gate
at a freshly bootstrapped workspace, the session-17 remediation
audit, the reference-account hygiene re-list). Method: Playwright
drove BOTH apps live (the reference logged in with the operator's
account; the clone's dev server on 127.0.0.1:3000), with an IN-PAGE
MutationObserver + performance.now() timestamps recording every
display flip at sub-second precision (no round-trip latency). Five
sequences: (A) start → pause → resume → reset; (B) pause → edit
minutes → resume; (C) close/reopen while running; (D) the full
60-second completion path; (E) the input-parse edges.

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | Fresh `git clone` (the review environment was reset); `cp .env.example .env`; `bun install`; `bun run db:push` + `db:generate` + `db:seed`; full base gate | ✅ lint ✓ · typecheck ✓ · 143/143 unit · build ✓ (19 routes) · **76/76 e2e** (2.1 m) — the codebase matches its documented state exactly |
| The session-17 remediation commit (`024b59f`) | Source-level audit of the 9-pin viewport family (green in the base run) + the classless body (present in layout.tsx) + the two doc commits (docs only) | ✅ clean |
| **The timed-interaction pass (session-17 §5 target (a))** | The 5-sequence sub-second display-flip timeline on BOTH apps (§2 table in the review doc) | ✅ 13/14 semantics byte-identical — **one divergence: FT-1 (§2)** |
| The reference-account hygiene | Full entity re-list at session start (the session-17 rule) | ✅ 9 parity tasks, 0 leftovers |
| The mobile menu (standing priority) | The pins green inside the 76/76 base run (re-measured live session 17; no code change since) | ✅ no drift, no Tailwind v4 regression |

## 2. Issues, bugs and gaps found

The audit found ONE parity defect and zero code defects (base gate
green; the session-17 seams clean; the wire surfaces unchanged).

### FT-1 (Medium): the Focus Timer's completed display state

After the focus session's completion alert is dismissed, the
reference's display reads **00:00** — the terminal state (the
reference's display is the `remaining` STATE; only the toggle and the
minutes-change handler reset to the full duration). The clone's
display snaps to the full duration (**01:00**) the instant `running`
flips false, because session-3 derived the display
(`running ? remaining : minutes * 60`) from a decompile misread ("the
reference's idle effect snaps remaining back"). Both paths flip
`running` false — pause (→ snap-to-full, CORRECT) and completion
(→ 00:00 terminal, WRONG in the clone) — and only the live timeline
separates them. The completion alert itself, its message, its ~60 s
timing, the Play-icon return, and the minutes-input reappearance all
match; the display text is the sole divergence.

**Unpinned (no defect, but unlocked):** the pause snap, the resume
restart, the edit-while-paused follow, the close/reopen reset, and
the completion terminal state were ALL unpinned in the e2e suite
(the existing pins cover the open/countdown/input-hidden/icon/zero-
minutes contract only; the completion alert was a session-3 one-off,
too slow at ~65 s). A future edit to the FocusTimerPanel state
machine would pass every existing spec — the same class of gap as
session-17's VP-1.

## 3. The remediation — TDD execution record

### Target 1: FT-1 + the W1e timed-interaction pin family

**The fix (the measured state machine):**
`src/components/dashboard/QuickActions.tsx` — the FocusTimerPanel's
display becomes the `remaining` STATE (the JSX renders
`fmt(remaining)`; the derived `display` line is deleted); the toggle
resets `remaining` to `minutes * 60` on BOTH directions (starting
already did; pausing now does — the measured snap); the effect, the
reset handler, and the minutes-change handler are unchanged (their
measured semantics already match). The comment block is rewritten to
cite the live measurement (the pause snap is a TOGGLE behavior, the
completion path leaves 00:00 — the decompile's "idle effect" claim
was a misread).

**The pins (new `tests/e2e/focus-timer.spec.ts`, 5 tests):**
1. pause → the display snaps to the full duration + the minutes input
   reappears; resume → the countdown RESTARTS from full (the next flip
   is 00:59 again, not the paused continuation);
2. edit minutes while paused → the display follows immediately;
   resume → counts from the NEW minutes;
3. the completion path via `page.clock` (install before goto,
   fast-forward the 60 s countdown, dismiss the alert): the alert
   message "Focus session complete!", the terminal display **00:00**,
   the Play toggle back, the minutes input visible — the FT-1 pin;
4. close/reopen while running → the fresh 25:00 idle state (no
   persistence).

**TDD order (the discipline):**
- **T-1 RED**: the new spec lands FIRST; the completion pin FAILS
  against the base (`01:00` ≠ `00:00`) — the honest RED; the other
  four pins pass (they pin verified parity — the session-17 VP-1
  pattern: the audit proves the behavior, the pins lock it).
- **T-2 MUTATION** (harness outside the repo, ONE canonical per-file
  backup, production rebuild per mutation — the e2e suite runs against
  the production standalone build):
  - M-1: revert the display to the derived form → the completion pin
    RED (the FT-1 regression caught);
  - M-2: remove the pause snap from the toggle → the pause pin RED;
  - M-3: break the resume origin (continue from the paused value) →
    the resume pin RED;
  - restore: rebuild + the full new spec green + `git diff` empty.
- **T-3 GREEN + GATE**: the fix applied; the full consecutive gate
  (lint · typecheck · 143/143 unit · build (19 routes) · **81/81 e2e
  ×2 consecutive** (76 → 81)).
- **T-4 LIVE**: the clone's dev server completion path re-measured
  (the terminal 00:00 display matching the reference's §2 measurement).
- **T-5 SCREENSHOTS**: the dev-server captures re-run
  (scripts/capture-screenshots.mjs — the 22-shot family; no visual
  surface changed (the timer's completed state is a transient), so the
  captures document the standing parity).
- **T-6 DOCS**: SKILL v2.7.0 (FS-30 + the FT-1 ruling + the counts),
  README (the e2e count + the timed-interaction note), AGENTS (the
  pin-family note + the reference-hygiene standing rule),
  CLAUDE.md (the W1e timed contract), PAD (§8 counts + ledger rows),
  this plan's execution record, the session_18-review.md, the worklog.
- **T-7 PUSH**: commit on main (only main, no new branches) + the SSH
  wrapper push (`docs/ssh_git_wrapper_v3.py --remote
  git@github.com:nordeim/flow-schedule.git` per
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`) + the operator
  key shredded after.

## 4. Validation of this plan against the codebase

- The FocusTimerPanel seam verified: `src/components/dashboard/
  QuickActions.tsx` lines 285–394 — the derived display at line 296,
  the toggle at 313, the effect at 298, the reset at 322, the parse
  at 329 — the fix touches only the display derivation + the toggle
  reset + the comment.
- The e2e conventions verified: per-test navigation (no beforeEach
  conflict with `page.clock.install()`), the aria-label locators
  match the clone's sanctioned affordances ("Start timer" /
  "Pause timer" / "Timer minutes" / "Close Timer" — used by the
  existing dashboard.spec.ts pins), the display locator
  `div.font-mono` filtered by `/^\d{2}:\d{2}$/` (the same element the
  harness measured).
- `page.clock` availability verified: Playwright 1.63 (the repo's
  pinned @playwright/test) — install/fastForward supported; the
  dialog handler pattern required for the in-alert window.alert.
- The production-build rule honored: every mutation phase rebuilds
  (`bun run build`) before the spec run — the session-17 lesson.
- The db-path v3 contract untouched: no route, schema, or store
  change — the fix is a client-side state-machine correction only;
  the unit suite (143) is unaffected (no unit-level seam changed).

## 5. Execution record (2026-10-05, appended after T-7 prep)

Every step of §3 executed and verified:

- **T-1 RED**: `tests/e2e/focus-timer.spec.ts` landed first — 5 pins.
  The completion pin failed against the base build EXACTLY as
  predicted (Expected "00:00", Received "01:00"); the other four pins
  passed (verified parity, now locked). One tooling lesson folded into
  the pin: `page.clock.fastForward` fires each due timer AT MOST ONCE
  and pauses the clock (the first run's failure mode: the countdown
  advanced one tick then continued in real time) — `runFor(62_000)`
  is the correct call for interval-driven countdowns.
- **T-2 MUTATION** (harness outside the repo at
  `/home/z/my-project/scripts/mutate-focus-timer.mjs`, ONE canonical
  per-file backup, production rebuild per mutation):
  - M-1 (the derived-display revert): **RED 1** — the completion pin
    only, surgical (the FT-1 regression class caught);
  - M-2 (the pause snap removed, start reset kept): **RED 3** — the
    pause/resume/edit pins (each contains the pause assertion);
  - M-3 (both toggle resets removed — the continue-from-paused class):
    **RED 3** — the same pause-family pins;
  - restore verification: rebuild + the full spec 6/6 green + the src
    file checksum-identical to the canonical backup (the `git diff`
    shows only the intended FT-1 fix).
- **T-3 GREEN + GATE**: the fix applied
  (`display = remaining` state; the toggle resets on both directions;
  the comment cites the live measurement). Full consecutive gate:
  lint ✓ · typecheck ✓ · **143/143 unit** (unchanged — no unit seam
  touched) · build (19 routes) · **81/81 e2e × 2 consecutive**
  (2.8 m + 2.9 m; 76 → 81).
- **T-4 LIVE**: the clone's dev-server completion path re-measured —
  alert "Focus session complete!" at 60.2 s, displayAfterDismiss
  **"00:00"** (was "01:00"), Play icon back, minutes input visible
  "1" — byte-matching the reference's live measurement. (Harness
  lessons folded in: drain the spawn pipes — an unread stdout pipe
  blocks the dev server mid-compile; kill the whole process group —
  the `next dev` child survives a SIGKILL on the wrapper.)
- **T-5 SCREENSHOTS**: all 22 captures re-run on the remediated
  codebase; `06-focus-timer.png` dimension-identical to HEAD (the
  fix touches no standing visual surface). The supplementary VLM pass
  was rate-limited (429 ×2 — stopped per the retry discipline); the
  timeline + pin + structural evidence stands on its own.
- **T-6 DOCS**: SKILL v2.7.0 (FS-30 + the session-18 changelog +
  counts), README (the e2e count + the timed-interaction family in
  the pyramid row + the tree + the E2E table), CLAUDE (the count +
  the family), AGENTS (the count + the seam note), PAD (the §8 counts
  + the session-18 ledger rows), the session_18-review.md, this
  execution record, the worklog entry.
- **T-7 PUSH**: commit on main + the SSH wrapper push.

Reference-account state at session end: 9 parity tasks + 3 notes (the
hygiene re-list ran at session START — 9 tasks, 0 leftovers; the
session's probes created no entities).
