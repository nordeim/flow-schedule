# Session 18 Review — FlowSchedule (2026-10-05)

Review + remediation session over base `main @ bf2e3c8` (the session-17
remediation `024b59f` — the viewport-band pin family + the classless
body — plus the operator's two docs/session_18.md narrative commits) on a
fresh `git clone` workspace (the review environment had been reset;
`.env` recreated from `.env.example`, `db/` re-seeded via
`bun run db:push && bun run db:seed`, `bun install`). The reviewer's
plan for this session: `docs/remediation-plan-session18.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL
  v2.6.0) against the tree — aligned; the full gates re-executed green
  at base (lint ✓ · typecheck ✓ · 143/143 unit · build ✓ (19 routes) ·
  **76/76 e2e** in 2.1 m) on the freshly rebuilt workspace.
- The session-17 remediation commit (`024b59f`) — the two seams audited
  at source level: `tests/e2e/viewport-breakpoints.spec.ts` (the 9-pin
  viewport-band family — all green inside the 76/76 base run) and
  `src/app/layout.tsx` (the classless body, BD-1 — verified present).
  The two doc commits (`9653cf6`, `bf2e3c8`) add only
  docs/session_18.md (the operator's session-17 narrative) — no code.
- **The session-17 §5 suggested target (a) executed: the
  timed-interaction pass — the Focus Timer's full interaction matrix
  measured live on BOTH apps at sub-second precision** (in-page
  MutationObserver + performance.now(), no round-trip latency). The
  reference driven with the operator's account; the clone's dev server
  on 127.0.0.1:3000 with the db-path-v3-protected `db/custom.db`.
- The reference-account hygiene re-list at session start (the
  session-17 rule — verify, don't trust): **9 parity tasks, 0
  leftovers** (the standing state; no probe residue — this session's
  Focus Timer probes create no entities).

## 2. The timed-interaction findings

The Focus Timer (the Quick Actions W1e panel) measured across FIVE
sequences on both apps: (A) start → pause → resume → reset, (B) pause →
edit minutes → resume, (C) close/reopen while running, (D) the full
completion path (the real 60-second run), and the input-parse edges.

**Thirteen of fourteen measured semantics MATCH (byte-level):**

| Semantic | Reference (measured) | Clone (measured) |
|---|---|---|
| Initial panel state | 25:00 · input "25" · `text-5xl font-mono text-slate-700 tabular-nums` | identical |
| Display follow on minutes edit (idle) | immediate (+13–34 ms) | immediate (+34 ms) |
| First flip after Start | +1076–1114 ms (the first interval tick) | +1130 ms |
| Cadence | 1000–1002 ms, interval-based integer decrement | 979–1020 ms (jitter) |
| PAUSE display | snaps to full 01:00 (+159–166 ms) | snaps to full (+99 ms) |
| Minutes input on pause | reappears | reappears |
| RESUME origin | RESTARTS from full (00:59 next, not 00:5x) | identical |
| Edit while paused | display follows to 05:00 (+13 ms) | follows (+34 ms) |
| Resume after edit | counts from the NEW minutes | identical |
| RESET | full duration | identical |
| Close/reopen while running | FRESH 25:00, idle toggle (no persistence) | identical |
| Parse edges | fill "0" rejected by `min="1"` (value stays); "2.7" → 2 → 02:00 | identical |
| Completion alert | `alert("Focus session complete!")` at 60.15 s | identical (60.20 s) |
| Post-completion controls | Play icon back · input visible "1" | identical |

**One divergence — FT-1 (Medium): the completed display state.** After
the completion alert is dismissed, the reference's display reads
**00:00** — the terminal state. The clone's display snaps to the full
duration (**01:00**) the moment `running` flips false. Root cause: the
clone derived the display (`running ? remaining : minutes * 60`) to
reproduce the reference's pause-snap without an effect-body setState —
session-3's decompile read the reference as an idle effect that snaps
`remaining` back. The live sub-second measurement proves the reference's
display is the `remaining` STATE, and the snap-to-full happens ONLY in
the TOGGLE handler (both directions) and the minutes-change handler —
the completion path never touches it, leaving 00:00 as the honest
terminal display. The old comment's claim ("the reference's idle effect
snaps remaining back") was a decompile misread; the measured behavior is
the ground truth (the clone-app-pat-pro rule).

No other defects: the base gate green, the session-17 seams clean, the
wire surfaces unchanged since session 16 (the LLM 429 fallback lines in
the e2e log are the pinned mocked-SDK fallback contract working as
designed), the mobile-menu pins green inside the base run (the standing
user priority — no drift, no Tailwind v4 regression, re-verified
session 17 live).

## 3. Remediation (TDD: pin → mutation → green)

- **Target 1: FT-1 — the terminal 00:00 display.** Pin-first: a new
  `tests/e2e/focus-timer.spec.ts` (the W1e timed-interaction family —
  5 pins: the pause snap + resume restart, the edit-while-paused follow,
  the completion terminal display via `page.clock` (the fake clock runs
  the 60-second countdown instantly — the real-65s path was a session-3
  one-off, too slow for the suite), and the close/reopen reset). The
  completion pin RED against the base (01:00 ≠ 00:00); the fix makes
  the display the `remaining` state (the toggle now resets on BOTH
  directions — the measured semantics); GREEN after.
- **Mutation phase (harness outside the repo, canonical per-file
  backups, production rebuilds per mutation):** M-1 reverts the display
  to the derived form → **RED 1, surgical** (the completion pin alone —
  the FT-1 regression class caught); M-2 removes the pause snap from
  the toggle (start reset kept) → **RED 3** (the pause/resume/edit
  pins — each carries the pause assertion); M-3 removes both toggle
  resets (the continue-from-paused class) → **RED 3** (the same
  pause-family pins). Restore verified: rebuild + the full spec 6/6
  green + the src file checksum-identical to the canonical backup.
- Gate after: 143/143 unit · **81/81 e2e × 2 consecutive** (76 → 81
  with the 5 new pins) · the live re-verification of the completion
  path on the clone's dev server (00:00 terminal, matching the
  reference).

## 4. Environment notes

- The review workspace was RESET between sessions — the fresh clone
  needs the documented bootstrap: `cp .env.example .env` · `bun
  install` (retry once if a tarball extract fails — transient) · `bun
  run db:push` · `bun run db:generate` · `bun run db:seed`. The db-path
  v3 contract holds (the repo's own `.env` is authoritative).
- The reference's control buttons are ICON-ONLY (no aria-labels — the
  same reference pattern as the mobile trigger); live-probe scripts
  locate them via `button:has(svg.lucide-play)` / `lucide-pause` /
  `lucide-rotate-ccw`. The clone's aria-labels are sanctioned a11y
  affordances (the BD-1 ruling).
- `locator.fill("abc")` on `input[type=number]` is browser-rejected —
  the NaN branch of the parse rule is unreachable via fill on BOTH apps
  (the number input's own validation); the "0" and "2.7" edges are the
  reachable probes (both pinned by the existing suite's empty-input pin
  plus the new parse-edge evidence).
- The dev-server spawn must kill the whole process group
  (`process.kill(-pid, "SIGKILL")` with `detached: true`) — a plain
  SIGKILL on the `bun run dev` wrapper leaves the `next dev` child
  holding port 3000.
- `page.clock.install()` must precede `page.goto` in the completion pin
  (the fake timers replace the page's clock before the app scripts
  load); framer-motion animations run on real rAF and are unaffected.

## 5. Knowledge carried forward

- **FS-30 (the timed-interaction method): the display-flip timeline is
  a first-class parity surface.** An in-page MutationObserver with
  performance.now() timestamps measures display semantics at sub-second
  precision with zero round-trip latency — the pause snap, the resume
  origin, the cadence, and the completion terminal state are all
  observable this way. The method found what 16 sessions of static
  diffs could not: a DERIVED-vs-STATE display divergence that only
  manifests at the completion edge.
- **The decompile is a hypothesis; the live measurement is the
  contract.** Session-3's W1e comment ("the reference's idle effect
  snaps remaining back") was a plausible misread — the pause and
  completion paths both flip `running` to false, and only the live
  timeline separates them (pause → snap-to-full; completion → 00:00
  terminal). The fix implements the measured state machine, and the new
  comment cites the measurement, not the decompile.
- **`page.clock` makes 60-second interaction paths suite-testable.**
  The session-3 one-off (~65 s real wait, excluded from the suite) is
  now a <2 s pin: install the fake clock before navigation, fast-forward
  the countdown, dismiss the alert via the dialog handler. The timed
  family no longer needs a real-time one-off for its completion edge.
- **The reference's W1e display is the `remaining` STATE** — the
  snap-to-full is a TOGGLE-handler behavior (both directions), not an
  idle-effect behavior; only the completion path leaves the 00:00
  terminal state. This is the FT-1 ruling line.

**Suggested session-19 targets:** the audit frontier remains closed on
the entity wire, the layout bands, and (after this session) the Focus
Timer's timed interactions. Remaining candidates: (a) the framer-motion
animation-timing pass (the panel entrance/exit curves at frame
precision), (b) any surface the operator prefers.
