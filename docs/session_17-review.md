# Session 17 Review — FlowSchedule (2026-10-05)

Review + remediation session over base `main @ c86d0e4` (the session-16
remediation `8bd3a48` plus the operator's docs/session_17.md narrative
commit) on a `git pull`-refreshed workspace (`.env` and the seeded `db/`
intact from the documented setup). The reviewer's plan for this session:
`docs/remediation-plan-session17.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the full gates re-executed green at base
  (lint ✓ · typecheck ✓ · 143/143 unit · build ✓ (19 routes) · **67/67
  e2e** in 3.2 m).
- The session-16 remediation commit (`8bd3a48`) — every seam audited at
  source level: `serializeTask`/`serializeNote` emit the captured key
  orders (start_time-first / title-first); the POST route carries no
  end_time derivation (an omitted value stores null); the PATCH route
  keeps partial-update semantics with no recompute block; the
  `okWire`/`okWireCreate` text seams unchanged.
- **The session-16 §5 suggested target (a) executed: the fresh
  multi-viewport screenshot/structure diff pass at 390/768/1024/1440.**
  Both apps driven live (reference logged in with the operator's
  account; the clone's dev server on 127.0.0.1:3000 with the
  db-path-v3-protected `db/custom.db`), capturing header/main/container
  classes, the heading inventory, the horizontal-overflow metric, and
  PNG screenshots at every band.
- The standing user priority — the mobile navigation menu — re-measured
  live on the reference (390×844, Playwright trusted clicks,
  animation-settled) and on the clone.
- The reference's entity wire re-observed on the fresh login traffic
  (key order, float durations, µs date forms — the session-14/15/16
  pin families).
- The scandihaven tech-stack reference repo cloned and its
  AGENTS/CLAUDE/PAD/SKILL reviewed — the flow-schedule codebase already
  follows the same pattern family (Next 16 + React 19 + Tailwind v4
  CSS-first + ActionResult-shaped envelope + Vitest/Playwright + the
  strict-gate discipline); no adoption gaps found.

## 2. The findings

1. **VP-1 (Medium — the tablet viewport band is UNPINNED): the one
   gap the multi-viewport pass found.** Structural parity is perfect at
   every band (header/main/container classes byte-identical, heading
   inventories identical modulo data-driven StatusCard state,
   horizontal overflow 0px on both apps at 390/768/1024/1440, and the
   768 breakpoint flips both apps the same way: desktop nav visible,
   mobile trigger hidden). But the e2e suite only pins 390×844
   (mobile-navigation.spec.ts), 1280×800 (its desktop-menu describe),
   1440×900 (the dashboard full-bleed describe), and the default
   1280×720 — **nothing pins the 768/1024 tablet band or the
   no-horizontal-overflow invariant**. A future edit that moves the
   header's `md:` breakpoint (e.g. to `sm:`) or introduces an
   overflowing element would pass every existing spec. The fix: a
   viewport-breakpoints spec family pinning the band edges.
2. **The mobile menu: NO DRIFT, NO Tailwind v4 regression** (the
   standing user priority, re-verified live on both apps this
   session): trigger 338/14/36×36 right 374; menu 182/54/192×164
   right 374, top 54; items [Profile, Settings, Logout];
   `animation-name: enter` — byte-identical to the clone's e2e pins
   (green inside the 67/67 base run).
3. **The visual pixel-diff of the fresh captures**: mean abs diff
   5.9–11.2 per band, concentrated exclusively in the data-driven
   regions (the right-sidebar StatusCard/AI cards — the reference
   account's "All caught up!" state vs the demo seed's "Next Up" +
   different task/LLM content). The header row and calendar regions
   diff at 0.3–4.7 — styling parity. (A supplementary VLM pass was
   attempted twice and rate-limited 429 both times; the objective
   structural + pixel-grid evidence stands on its own.)
4. **Reference account hygiene: one leftover found and cleaned.** The
   session-16 narrative claimed 0 S16 leftovers, but the account still
   carried the "S16 MarkComplete Probe" task (completed, work) —
   deleted this session via the captured auth (DELETE → 200); the
   account is back to the 9 parity tasks + 3 notes.
5. **The wire surfaces re-confirmed live**: the reference's GET list
   emits `start_time`-first with `duration_minutes:60.0` floats and µs
   date forms — every session-14/15/16 pin family re-observed on the
   fresh traffic.
6. **Zero code defects found.** The session-16 remediation is clean at
   source level and at runtime; the base gate is green; the audit
   frontier remains closed (entity wire: names, forms, order, request
   + response, both entities, all routes).
7. **BD-1 (Low — found by the T-4 live field-diff, after the audit):
   the clone's `<body>` shipped `className="antialiased"`; the
   reference's body is CLASSLESS.** A field the prior sessions'
   formal diffs never compared (they diffed header/main/container
   classes, headings, buttons). `antialiased` is a macOS-only
   font-smoothing hint — no visual effect on the pinned Linux/Windows
   Chromium — but it is a body-level rendering-hint class the
   reference does not ship, so it is a parity defect by the
   measured-facts rule. Fixed pin-first (§3). The same field-diff
   re-ruled two known classes of diff as data-driven or sanctioned:
   the StatusCard heading state ("All caught up!" vs "Next Up" —
   account data) and the trigger's aria-label (the reference's
   icon-only trigger has NO accessible name; the clone's
   `aria-label="Open account menu"` is a sanctioned a11y affordance
   with zero visual/behavioral footprint).

## 3. Remediation (TDD: pin → mutation → green)

- **Target 1: VP-1 — the viewport-band pin family.** A new
  `tests/e2e/viewport-breakpoints.spec.ts` pinning, at 768×900 and
  1024×900: the desktop nav visible + the mobile trigger hidden (the
  md-breakpoint contract, asserted via computed display — not
  toBeHidden), and the no-horizontal-overflow invariant
  (`scrollWidth === clientWidth` on the document element — the
  Tailwind v4 responsive-class regression guard); plus the 390 and
  1440 band edges of the same invariant (the bookends). 8 pins,
  green against the current build (nothing to fix — the audit
  confirmed the behavior; the pins lock it).
- **Mutation phase (harness outside the repo, canonical per-file
  backups, production rebuilds per mutation):** M-1 flips the header's
  mobile container `md:hidden` → `sm:hidden` → **RED 4** (the 768 and
  1024 band-state pins + their overflow pins — the header
  double-render at ≥640 overflows); M-2 (REDESIGNED — see §5) puts
  `w-[2000px]` on the AppShell root → **RED 4, surgical** (all four
  overflow pins; the band-state pins unaffected — the media queries
  are viewport-based). Tree restored; post-restore rebuild + pin
  re-run green (9/9 incl. the auth setup); `git diff` empty.
- **Target 2: BD-1 — the classless body.** Pin-first: the body-class
  pin (`document.body.className === ""`) → RED (the `antialiased`
  class caught) → `src/app/layout.tsx` body now classless → GREEN;
  verified live on the dev server (empty on the login surface AND the
  authenticated shell). The RED phase is the mutation evidence for a
  one-class change (the pin fails exactly while the class is
  present).
- Gate after: 143/143 unit · **76/76 e2e × 2 consecutive** · the live
  multi-viewport re-diff + the screenshot re-capture (now including
  the 768/1024 tablet captures 21/22 as documentation of the new pin
  family).

## 4. Environment notes

- The db-path v3 protection held: the dev server served
  `<repo>/db/custom.db` (`/api/health` → `database: "up"`).
- The dev server must be launched and measured within one shell
  invocation (the harness reaps background processes between
  commands) — the multi-viewport captures ran that way.
- Playwright's `localhost` resolution can hit an IPv6/IPv4 mismatch
  against the dev server — ad-hoc scripts use `http://127.0.0.1:3000`
  (the e2e suite's webServer already resolves correctly).
- The reference's mobile trigger carries NO aria-label — live-probe
  scripts locate it via the `div.md\:hidden button` DOM path (the
  clone's trigger does carry `aria-label="Open account menu"`, a
  self-hosted a11y affordance consistent with the repo's floor).

## 5. Knowledge carried forward

- **The multi-viewport pass is a first-class parity surface** (the
  session-16 §5 suggestion, now executed): class-level structure +
  heading inventory + overflow + breakpoint behavior at
  390/768/1024/1440 — all matching live. The pins added this session
  lock the tablet band; the 390/1440 bookends were already pinned.
- **The reference-account hygiene claim needs verification, not
  trust**: session-16's narrative said "0 S16 leftovers" but one
  probe task survived (the Mark Complete probe itself — created to
  probe, completed to verify, then missed by the cleanup list). The
  rule: ALWAYS re-list the reference entities at session start and
  re-verify at session end; the account's standing state is 9 parity
  tasks + 3 notes.
- **Breakpoint parity is data-independent**: the 768 band behaves
  identically on both apps because it is decided by the header's
  `md:` utilities, not by the data — which is exactly why it is a
  good pin (cheap, stable, regression-sensitive).
- **The M-2 mutation-design lesson (FS-29): an overflow mutation that
  injects a wide element INSIDE the clipping layer SURVIVES.** The
  AppShell root's `overflow-hidden` (the reference's own design) clips
  inner overflow, so `documentElement.scrollWidth` never grows — the
  first M-2 design (a 3000px element in the DashboardView container)
  left every pin green. The honest mutation is a WIDTH EDIT ON THE
  ROOT ITSELF (`w-[2000px]` → RED 4 at every band). This documents
  the guard's true contract: the documentElement metric pins
  TOP-LEVEL width discipline — inner overflow is invisible by design
  (verified live on both apps at every band).
- **Diff the BODY class in the live field-diff (BD-1):** the formal
  structural diff compared header/main/container — the body element's
  own class list was a blind spot for 16 sessions. A body-level
  RENDERING-HINT class (`antialiased`) is a parity defect (remove it);
  an aria-label the reference lacks is a sanctioned a11y affordance
  (keep it) — the ruling line is zero visual/behavioral footprint.

**Suggested session-18 targets:** the audit frontier remains closed
on the entity wire and the layout bands. Remaining candidates:
(a) a timed-interaction pass (the Focus Timer countdown at
sub-second precision on both apps), (b) any surface the operator
prefers.
