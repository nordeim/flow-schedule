# Remediation Plan — Session 19 (2026-10-05)

Session-19 review of the FlowSchedule clone (base commit `9c1272b` —
the session-18 remediation `0d39f09` plus the operator's
docs/session_19.md narrative commit; a fresh `git clone` workspace
bootstrapped per `docs/session_19-review.md` §4). The `skills/` folder
is excluded from code checking, testing and compilation per the
operating instructions (eslint ignores `skills`, tsconfig excludes
`skills`, vitest includes only `src/` + `tests/` — re-verified via the
green base gate).

Skills used this session: `agent-browser` (the reference login + live
driving pattern), `clone-app-pat-pro` (measured facts, not preferences
— the rAF timeline + the WAAPI metadata are the ground truth),
`tdd` / `tdd-workflow` (red → green → mutation evidence),
`code-review-and-audit` (the tiered review pipeline), and
`evidence-driven-testing` (the pin family as the recorded evidence).

## 1. Audit scope and method

Session-18's closing suggestion set this session's primary target —
the framer-motion animation-timing pass (the panel entrance/exit
curves at frame precision) — plus the standing discipline (the base
gate at a freshly bootstrapped workspace, the session-18 remediation
audit, the reference-account hygiene re-list, the mobile-menu live
re-measure). Method: an in-page rAF sampler recorded the
container/overlay/form-view/panel-body geometry, opacity, and
transform matrices on BOTH apps (the reference logged in with the
operator's account; the clone's dev server, spawn-per-the-harness
rules); the reference's motion configs were decompiled from its
bundle (`G1e`/`W1e`/`A_e` in `index-BNgAatKl.js`); the runtime engines
were compared via their easing tables; and the WAAPI animation
metadata (`getAnimations()`) was probed on both apps.

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | Fresh `git clone`; `cp .env.example .env`; `bun install`; `bun run db:push` + `db:seed`; full base gate | ✅ lint ✓ · typecheck ✓ · 143/143 unit · build ✓ (19 routes) · **81/81 e2e** (2.8 m) — the codebase matches its documented state exactly |
| The session-18 remediation commit (`0d39f09`) | Source-level audit of the FT-1 seam (the `remaining`-state display, the two-direction toggle reset) + the 5 pins green in the base run | ✅ clean |
| **The animation-timing pass (session-18 §5 target (a))** | The four evidence levels (decompile / engine / timeline / WAAPI metadata) on BOTH apps | ✅ **FULL PARITY** — every config byte-identical, the same runtime family, the measured timelines match, the WAAPI metadata byte-identical — **one rendered divergence: BL-1 (§2)** |
| The background blobs | The `A_e` decompile + the live computed geometry on both apps + the reference stylesheet rule check | ⚠️ **BL-1**: the reference's second blob is INVISIBLE (the dead `w-100 h-100` in its v3 scale); the clone renders it at 400 px |
| The mobile menu (standing priority) | Live re-measure on BOTH apps at 390×844 (trusted clicks, animation settled) | ✅ byte-identical (trigger 338/14/36×36 right 374; menu 182/54/192×164; items [Profile, Settings, Logout]; `animation-name: enter`) |
| The reference-account hygiene | Full entity re-list at session START | ✅ 9 parity tasks + 3 notes, 0 leftovers |

## 2. Issues, bugs and gaps found

The audit found ONE rendered-parity defect, TWO documentation
defects, and one pin gap (zero functional code defects — the base
gate green, the session-18 seams clean, the wire surfaces unchanged).

### BL-1 (Medium): the second background blob renders visible on the clone — INVISIBLE on the reference

The reference's blob layer ships three `motion.div` blobs; the second
carries `w-100 h-100` — classes its Tailwind v3-scale build NEVER
GENERATES (the reference's 863 KB stylesheet has `.w-96{width:24rem}`
but no `.w-100` rule; v3's default scale stops at 96). An
absolutely-positioned, content-less div at auto width renders **0×0 —
invisible** (measured live: the reference blob's rect is 0×0; the
indigo/purple 35 s blob never paints). The clone's
`w-[400px] h-[400px]` renders a live 400 px drifting blob — a visual
the reference does not show. Per the icon_sm dead-variant ruling
(session 6, P-7): the dead class is mirrored by its RENDERED effect.
The class string CANNOT be copied — the clone's Tailwind v4
dynamic-spacing scale WOULD generate `w-100` as 400 px (a v4
headline feature), so copying the string keeps the divergence. The
mirror: the clone's second blob renders 0×0 (no width/height
utilities; the div collapses exactly like the reference's dead-class
div), with the source comment citing the measurement.

### DOC-1 (docs): the PAD §4.2 "end_time derivation" bullet is stale

`Project_Architecture_Document.md` §4.2 still says "both the create
and patch handlers recompute `endTime = startTime + durationMinutes`
whenever either input changes — the reference computes it in the form;
the clone computes it server-side (one source of truth)". That text
predates session-16's ET-1, which REMOVED the server-side derivation
(the reference's POST without end_time stores null; its PUT is
partial — probed live; the code at `src/app/api/tasks/route.ts` +
`[id]/route.ts` stores end_time AS SUBMITTED). §4.1 carries the
CORRECT post-ET-1 text; §4.2's bullet was missed in the session-16
docs realignment. Fix: rewrite the bullet to the as-submitted
contract (or fold it into §4.1's statement).

### DOC-2 (docs, minor): the PAD §4.2 seed bullet predates E-1

§4.2's seed bullet ("upserts the user by unique email and guards
sample rows with `is_sample: true` counts — re-running is a no-op")
predates session-13's E-1 week re-anchor: across a week boundary the
seed DELETES and re-creates the sample rows on the current week (the
calendar always renders the current week). Within a week reruns stay
no-ops. Fix: one clause noting the re-anchor.

### The pin gap (no defect, but unlocked): the animation-timing family

The measured motion contract (the 350 ms circOut overlay expansion,
the panel-body y-offset entrance with its 0.2 delay, the exit's
last-rendered 0.15 delay, the buttons-view re-entrance) is unpinned —
a future edit to `QuickActions.tsx`'s motion configs would pass every
existing spec (the same class as session-17's VP-1 and session-18's
FT-1). The `getAnimations()` metadata surface makes the overlay's
timing pin deterministic (duration 350, easing
`cubic-bezier(0.55, 0, 1, 0.45)` — byte-identical on both apps).

## 3. The remediation — TDD execution plan

### Target 1: BL-1 — the invisible second blob (a red → green fix)

**The pin (lands FIRST, must be RED at base):** a new
`tests/e2e/panel-animation.spec.ts` pin — the blob layer's contract:
the fixed overlay host renders exactly **two** blobs with non-zero
area (w-96 and w-80); the second child's bounding rect is **0×0**
(the dead-`w-100` mirror). RED at base (the clone's blob2 renders
~400 px — the measured live state).

**The fix:** `src/components/layout/BackgroundBlobs.tsx` — the second
`motion.div` drops `w-[400px] h-[400px]` (no width/height utilities;
the div collapses to 0×0 like the reference's dead-class div); the
comment cites the measurement (the reference's stylesheet has no
`.w-100` rule — v3-scale dead class; the rendered contract is 0×0;
the class string is deliberately NOT copied because v4's dynamic
spacing would generate `w-100` as 400 px).

**GREEN:** the pin passes; the full gate re-runs.

### Target 2: AN-1 / FS-31 — the panel-animation pin family (locking the verified parity)

**e2e pins (`tests/e2e/panel-animation.spec.ts`, 4 tests):**
1. the overlay's WAAPI metadata: clicking a tile mounts the
   expanding overlay with a native animation whose computed timing is
   `duration: 350, easing: "cubic-bezier(0.55, 0, 1, 0.45)"`
   (deterministic — no timing race);
2. the panel body's entrance initial state: immediately after the
   panel mounts, the body's transform is `translateY(20px)` and its
   opacity is 0 (the 0.2 s delay window — the measured initial
   values);
3. the exit's last-rendered delay: within ~100 ms of the back click,
   the form-view's opacity is still exactly 1 and the panel body's
   transform is still identity (the 0.15 s exit delay measured on
   BOTH apps — the AnimatePresence last-rendered-transition
   semantics);
4. the blob layer contract (Target 1's pin — two visible blobs, the
   second at 0×0).

**unit source pins (`tests/panel-motion.test.ts`, the ai-prompt /
wire-order pattern):** the motion configs byte-pinned from the
decompiled reference — `QuickActions.tsx`'s `panelMotion`
(`{opacity: 0/1/0, y: 20/0/-20}` + `{duration: 0.3, ease: "circOut",
delay: 0.2}`), the container transition (`{duration: 0.4, ease:
"circOut"}` + `layout`), the overlay transitions (0.35 circOut /
exit 0.3 circIn + the opacity .6→1 keyframes), the form-view fade
(0.3 + the `activeId ? 0.15 : 0` delay), the buttons-view fade
(`{delay: 0.2}` + 0.2), the tiles' whileHover/whileTap
(1.07 / .93 + the hover boxShadow), and `BackgroundBlobs.tsx`'s
three configs (the 30/35/40 s mirror loops with their keyframe
arrays, delays 0/5/10, easeInOut) + the second blob's 0×0 mirror.
A future "cleanup" of any motion value fails the source pin.

### Target 3: DOC-1 + DOC-2 — the PAD §4.2 realignment

Rewrite the stale end_time bullet to the as-submitted contract
(ET-1) and add the E-1 re-anchor clause to the seed bullet. No other
PAD text touches (the §4.1/§8/ledger rows are current).

### T-2 MUTATION (the sensitivity evidence, harness outside the repo)

One canonical per-file backup; production rebuild per mutation; the
pin suite re-run after the harness proves the tree restored:
- **M-1**: restore `w-[400px] h-[400px]` on blob2 → the blob pin RED
  (the BL-1 regression caught);
- **M-2**: change the overlay's entrance `duration: .35` → `.45` →
  the WAAPI-metadata pin RED (the timing regression caught);
- **M-3**: change `panelMotion`'s delay `.2` → `0` → the
  entrance-initial pin RED + the source pin RED (the y-offset/delay
  regression caught);
- **M-4**: change the form-view's exit path to fire instantly (drop
  the last-rendered delay by hardcoding `delay: 0`) → the
  exit-persistence pin RED.

### T-3 GATE: the full consecutive gate
lint · typecheck · unit (143 + the source pins) · build (19 routes) ·
e2e × 2 consecutive (81 → 85 with the 4 new pins).

### T-4 LIVE: the blob layer re-verified on the clone's dev server
(the second blob at 0×0; the other two drifting — matching the
reference's rendered state).

### T-5 SCREENSHOTS: the 22-capture family re-run on the remediated
codebase (the canvas background loses the purple blob — the
02-dashboard.png family re-captured).

### T-6 DOCS: SKILL v2.8.0 (FS-31 — the four-level motion-parity
method + the BL-1 dead-class-in-v4 ruling + the counts), README (the
e2e count + the blob note), AGENTS (the pin-family note), CLAUDE (the
W1e/G1e motion contract), PAD (§4.2 DOC-1/DOC-2 + the session-19
ledger rows), the session_19-review.md, this plan's execution record,
the worklog.

### T-7 PUSH: commit on main (only main, no new branches) + the SSH
wrapper push (`docs/ssh_git_wrapper_v3.py --remote
git@github.com:nordeim/flow-schedule.git` per
`docs/how-to-git-push-using-ssh-wrapper_SKILL.md`) + the operator key
shredded after.

## 4. Validation of this plan against the codebase

- The BL-1 seam verified: `src/components/layout/BackgroundBlobs.tsx`
  lines 18–22 — the second blob carries `w-[400px] h-[400px]`; the
  fix touches only that class list + the comment (the animate
  keyframes and transition stay byte-identical to the decompiled
  reference — the x/y/scale animation of a 0×0 box is the reference's
  own rendered behavior).
- The reference's rendered state verified live: the blob2 rect 0×0;
  the stylesheet rule check (`.w-96` present, `.w-100` absent) pins
  the mechanism; blob1 (w-96) and blob3 (w-80) rules present in both
  stylesheets — untouched by the fix.
- The e2e conventions verified: the blob layer is reachable as
  `div.fixed.inset-0.pointer-events-none` (the host; `aria-hidden` on
  the clone — a sanctioned a11y affordance, not pinned); per-test
  navigation like the focus-timer family; the production standalone
  on :3100 renders the same framer runtime (the WAAPI metadata probe
  ran on the dev build; the metadata surface is engine-declared, not
  build-dependent — validated by T-3's spec run).
- The WAAPI metadata pin design verified: `getAnimations()` on the
  overlay returns the native animation with
  `effect.getComputedTiming()` — `duration: 350, easing:
  "cubic-bezier(0.55, 0, 1, 0.45)"` — probed identical on both apps;
  the animation persists after completion (fill: both), so the pin
  reads it without a timing race.
- The unit source-pin pattern verified: `tests/wire-order.test.ts`
  reads route sources via `readFileSync` + `path.resolve(import.meta.dirname, "..")`
  — the same pattern applies to the two component files.
- The exit-persistence pin's timing margins verified: the exit delay
  is 150 ms; a post-click evaluate lands in ~20–60 ms; the mutation
  (M-4) moves the measured opacity to <1 at that instant — the
  margin is ~90 ms wide.
- The db-path v3 contract untouched: no route, schema, or store
  change — BL-1 is a client-side rendering mirror; the unit suite
  (143) is unaffected except the new source pins.

## 5. Execution record (2026-10-05, appended after T-7 prep)

Every step of §3 executed and verified:

- **T-1 RED**: `tests/e2e/panel-animation.spec.ts` (4 pins) +
  `tests/panel-motion.test.ts` (10 source pins) landed FIRST. The blob
  pin failed at base exactly as predicted (blob2.w = 480 ≠ 0 — the
  BL-1 divergence caught); 1/10 source pins failed (the BL-1 blob-2
  mirror); the other three e2e pins and nine source pins passed
  (verified parity, now locked). Two pin-engineering lessons folded
  in during the RED phase: (a) a `locator.waitFor` + `evaluate` pair
  lands ~0.5 s AFTER the mount (past the whole 0.2 s delay window) —
  the entrance pin reads via an in-page rAF-polled `waitForFunction`
  that CAPTURES the computed state at the detection frame; (b) the
  build typechecks e2e specs — window-attached probe state needs a
  typed cast (TS2339 on untyped `window.__*` access).
- **The BL-1 fix (GREEN part 1)**: `BackgroundBlobs.tsx`'s second
  `motion.div` drops `w-[400px] h-[400px]` — the div collapses to
  0×0 exactly like the reference's dead-`w-100` div; the module
  comment cites the measurement (the stylesheet rule check, the
  0×0 rect, the v4 dynamic-spacing reason the class string is not
  copied).
- **T-2 MUTATION** (harness outside the repo at
  `/home/z/my-project/scripts/mutate-panel-motion.mjs`, ONE canonical
  per-file backup, production rebuild per mutation, the unit source
  pins + the e2e family per mutation):
  - M-1 (the `w-[400px]` restore): RED 1 e2e (the blob pin) + unit —
    surgical;
  - M-2 (the overlay duration .35→.45): RED 1 e2e (the WAAPI
    metadata pin) + unit — surgical;
  - M-3 (the panelMotion delay .2→0): RED 1 e2e (the entrance pin —
    after the +100 ms delay-hold read was added; the mount-frame read
    alone was INSENSITIVE, framer applies the initial transform
    synchronously and the delay is only observable on later frames) +
    unit;
  - M-4 (the exit delay hardcoded to 0): RED 1 e2e (the exit pin —
    the differential measurement on the PAGE's clock: the overlay's
    first change marks the handler time, the form-view's first drop
    minus that is the delay; measured ~150 ms normal / ~0–30 ms
    mutated, threshold 60 ms for frame-drop margin) + unit;
  - restore verification: checksums identical + rebuild + 10/10 unit
    + 5/5 e2e (4 pins + setup).
- **T-3 GREEN + GATE**: the full consecutive gate — lint ✓ ·
  typecheck ✓ · **153/153 unit** (143 → 153: +10 panel-motion source
  pins) · build (19 routes) · **85/85 e2e × 2 consecutive** (2.9 m +
  3.0 m; 81 → 85).
- **T-4 LIVE**: the clone's dev-server blob layer re-measured — blob1
  w-96 drifting (~346 px mid-scale), blob2 **0×0** (was 331–400 px),
  blob3 w-80 drifting (~393 px) — byte-matching the reference's
  rendered state (two visible blobs, the second invisible).
- **T-5 SCREENSHOTS**: all 22 captures re-run on the remediated
  codebase (the canvas family re-captured — the purple blob is gone,
  matching the reference).
- **T-6 DOCS**: SKILL v2.8.0 (FS-31 + the session-19 changelog + the
  counts + the stale §11 checklist counts fixed), README (153/85 + the
  panel-animation family in the pyramid row + the blob-layer design
  note), CLAUDE (the motion contract section + the counts + the E2E
  row), AGENTS (the counts + the pin-family notes + the session-19
  reference), PAD (§4.2 DOC-1/DOC-2 fixed + §8 counts + the six
  session-19 ledger rows), this execution record, the worklog entry.
- **T-7 PUSH**: commit on main + the SSH wrapper push.

Reference-account state at session end: 9 parity tasks + 3 notes (the
hygiene re-list ran at session START — 9 tasks + 3 notes, 0 leftovers;
this session's probes created no entities).
