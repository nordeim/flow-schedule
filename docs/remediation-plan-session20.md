# Remediation Plan — Session 20 (2026-10-05)

Session-20 review of the FlowSchedule clone (base commit `ab8ddc8` — the
session-19 remediation `30bb684` plus the operator's docs/session_20.md
narrative commit; the carried-forward workspace re-verified per
`docs/session_20-review.md` §4). The `skills/` folder is excluded from
code checking, testing and compilation per the operating instructions
(eslint ignores `skills`, tsconfig excludes `skills`, vitest includes
only `src/` + `tests/` — re-verified via the green base gate).

Skills used this session: `agent-browser` (the reference login + live
driving pattern), `clone-app-pat-pro` (measured facts — the computed
font-family and the computed color values are the ground truth),
`tdd` / `tdd-workflow` (red → green → mutation evidence),
`code-review-and-audit` (the tiered review pipeline), and
`tailwind-patterns` (the @theme pin pattern — the CSS-first token
override documented as THE v4 tool for pinning drift-prone defaults).

## 1. Audit scope and method

Session-19's closing suggestion set this session's primary targets —
(a) the Settings/Profile deep-diff and (b) the AI-summary card's
populated-state diff — plus the standing discipline (the base gate at
the carried-forward workspace, the session-19 remediation audit, the
reference-account hygiene re-list, the mobile-menu live re-measure).
The h3 text-width divergence found during (a) triggered a **Tailwind
default-theme drift audit** across every theme namespace the app uses
(spacing, text, breakpoints, tracking, radius, shadows, blur, easing,
fonts, colors), diffing `tailwindcss@4.3.3`'s shipped defaults against
the reference's own stylesheet values and live computed styles.

| Surface | Method | Result |
|---|---|---|
| Workspace (carried forward) | Full base gate | ✅ lint ✓ · typecheck ✓ · 153/153 unit · build ✓ (19 routes) · **85/85 e2e** (2.9 m) |
| The session-19 remediation commit (`30bb684`) | Source-level audit (the BL-1 seam + the pin families) | ✅ clean |
| **Settings/Profile deep-diff (the session-19 §5 target (a))** | Full DOM walk on BOTH apps (structure + geometry + text) | ✅ structure byte-identical; ⚠️ **F-1** exposed via content-sized h3 widths (~15% drift) |
| **The AI Summary card (the §5 target (b))** | Populated-state side-by-side (structure + computed colors) | ✅ structure byte-identical; ⚠️ **C-1** live on the mood text |
| The font stack | `getComputedStyle` on both apps + the reference stylesheet rule + `node_modules/tailwindcss/theme.css` | ❌ **F-1**: the clone renders v4.3.3's v3-compat default; the reference renders the v4.0-era `ui-sans-serif` stack |
| The palette completeness | used-token scan (`src/**`) ⊆ pinned-token scan (`@theme inline`) + the reference's stylesheet values per token | ❌ **C-1**: 13 used tokens unpinned; 11 of them drift (max Δ 34 G-channel) |
| The mobile menu (standing priority) | Live re-measure on BOTH apps at 390×844 | ✅ byte-identical (trigger 338/14/36×36 right 374; menu 182/54/192×164; items [Profile, Settings, Logout]; `animation-name: enter`) |
| The reference-account hygiene | Full entity re-list at session START | ✅ 9 parity tasks + 3 notes, 0 leftovers |

## 2. Issues, bugs and gaps found

The audit found ONE font-stack defect (F-1, High), ONE palette defect
(C-1, Medium), and one guard gap (PIN-1). Zero functional code defects —
the base gate green, the session-19 seams clean, the wire surfaces
unchanged, the mobile menu byte-identical.

### F-1 (High): the app's default font stack diverges from the reference's

`tailwindcss@4.3.3`'s shipped default `--font-sans` is the v3-compat
stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
"Helvetica Neue", "Noto Sans", Arial, sans-serif, ...`); the reference
(a v4.0-era base44 build) renders `ui-sans-serif, system-ui, sans-serif,
"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color
Emoji"`. On fontconfig systems the two stacks resolve DIFFERENT physical
fonts (measured ~15% glyph-width drift on content-sized text). The
clone has carried the v3-compat default since session 0 (the lockfile
pinned 4.3.3 from the start) — never caught because block-geometry pins
are font-metric-blind.

**The fix**: pin the reference's measured stack in `@theme inline`
(`globals.css`): `--font-sans: ui-sans-serif, system-ui, sans-serif,
"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color
Emoji"`. The preflight's `--default-font-family: var(--font-sans)`
resolves the pin; every font-inheriting element matches the reference.
`--font-mono` is byte-identical across v4.0/v4.3.3 AND the reference's
resolution — pinned as a guard (the timer display uses it), not a fix.
`--font-serif` is unused — not pinned.

### C-1 (Medium): 11 of 13 used-but-unpinned palette tokens drift

The session-0 trap-2 pinning covered 58 tokens but missed 13 that the
app's components actually use. v4.3.3's oklch palette (converted at build
AND at render — dev and production measured identical) renders values up
to 34 G-channel units off the reference's v3 hexes: red-700 on the login
error alert, purple-700/800/900 + blue-100 on the AI Summary card and
the planning badges, pink-700/yellow-700/indigo-700 on the planning
badges (CATEGORY_BADGES), gray-400/500 on the WeeklySchedule "other"
bar, green-200/red-200 on the login alerts + the TaskDialog delete
border, pink-50 on the mood gradient stop.

**The fix**: pin all 13 to the reference's measured hexes in
`@theme inline` (blue-100 #dbeafe, gray-400 #9ca3af, gray-500 #6b7280,
green-200 #bbf7d0, indigo-700 #4338ca, pink-50 #fdf2f8, pink-700
#be185d, purple-700 #7e22ce, purple-800 #6b21a8, purple-900 #581c87,
red-200 #fecaca, red-700 #b91c1c, yellow-700 #a16207; pink-700 is the
reference's own #be185d — ONE B-unit off the v3 hex #be185c, the
rendered-contract ruling) — the two that
already match (blue-100, pink-50) are locked against the NEXT minor
bump, per the repo's pin philosophy.

### PIN-1: the completeness guard

No test asserted used-color-tokens ⊆ pinned-tokens — the 13-token gap
accumulated across 19 sessions of new components. The remediation adds
the invariant as a unit pin: scan `src/**` for color-class tokens
(`(bg|text|border|from|to|via|ring|fill|stroke|divide|accent|placeholder)-(
scale)-(step)`), extract the set, assert every token has a
`--color-<scale>-<step>:` pin in globals.css. A future component using
an unpinned token fails the unit gate at authoring time.

## 3. The remediation — TDD execution plan

### Target 1: F-1 + C-1 — the theme pins (a red → green fix)

**The e2e pins (land FIRST, must be RED at base):
`tests/e2e/theme-palette.spec.ts` (4 tests):**
1. **the font-stack pin**: after the dashboard loads,
   `getComputedStyle(documentElement).fontFamily` and the body's equal
   the reference's measured stack —
   `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
   "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"` (asserted as
   the exact serialized string — deterministic, no raster, no timing);
   RED at base (the v3-compat string renders);
2. **the AI Summary mood ramp**: the mood label's computed color ===
   `rgb(88, 28, 135)` (purple-900) and the mood body's ===
   `rgb(107, 33, 168)` (purple-800) — gated on the loaded state (the
   mood gradient block only renders with data — the established
   dashboard.spec pattern); RED at base (lab/oklch conversions render);
3. **the AI Summary chips**: the focus chip's computed bg ===
   `rgb(219, 234, 254)` (blue-100) and text === `rgb(29, 78, 216)`
   (blue-700 — already pinned, a cross-check), the activities chip bg
   `rgb(220, 252, 231)`/text `rgb(21, 128, 61)`; RED at base only via
   the blue-100 oklch (blue-100 matches today — this pin is the lock
   side; the RED evidence comes from the mood ramp + the font pin);
4. **the Planning badges**: the CATEGORY_BADGES chips on the current
   week's day cards — learning `rgb(126, 34, 206)`, creative
   `rgb(190, 24, 93)`, social `rgb(161, 98, 7)`, planning
   `rgb(67, 56, 202)`; RED at base.

**The unit source pins (`tests/tailwind-theme-pins.test.ts`, the
wire-order/ai-prompt readFileSync pattern — 6 tests):**
1. `--font-sans` pinned to the reference's exact stack (the byte-form
   with the quoted emoji names);
2. `--font-mono` pinned to the v4.0-form stack (the guard);
3. the purple ramp pins (purple-700/800/900 + purple-50);
4. the red/green login-alert tokens (red-700, red-200, green-200);
5. the badge/bar tokens (indigo-700, pink-700, yellow-700, pink-50,
   gray-400, gray-500, blue-100);
6. **PIN-1 — the completeness invariant**: used-color-tokens ⊆
   pinned-tokens (the src/ scan vs the globals.css scan — the scan is
   re-implemented in the test, not imported, so a domain-map regression
   can't hide behind a shared helper).

**The fix**: `src/app/globals.css` `@theme inline` — add the two font
pins + the 13 color pins, with the trap comment (Trap 6: minor-version
default drift; the mechanism; the measured deltas; the completeness
invariant that guards the NEXT one).

**GREEN:** the pins pass; the full gate re-runs.

### T-2 MUTATION (the sensitivity evidence, harness outside the repo)

One canonical per-file backup; production rebuild per mutation; the pin
suite re-run after the harness proves the tree restored:
- **M-1**: drop the `--font-sans` pin → the font e2e pin RED + the unit
  font pin RED;
- **M-2**: drop the purple-900 pin → the mood-ramp e2e pin RED + the
  unit purple-ramp pin RED;
- **M-3**: change red-700's pin to v4.3.3's `#bf000f` → the unit
  login-alert pin RED (the token is asserted by exact hex; the e2e alert
  pin is intentionally NOT part of the family — wrong-credential logins
  are rate-limited 10/IP/15min and the mutation harness runs the suite
  repeatedly);
- **M-4**: restore gray-400 to `#99a1af` → the unit bar-token pin RED +
  the completeness invariant stays green (the token remains pinned —
  asserting the VALUE pins, not just the presence).

### T-3 GATE: the full consecutive gate

lint · typecheck · unit (153 + 6 = 159) · build (19 routes) · e2e × 2
consecutive (85 → 89 with the 4 theme-palette pins).

### T-4 LIVE: the re-measure on the clone's dev server

The html font-family byte-matches the reference; the AI card's mood
label/body computed colors byte-match (`rgb(88, 28, 135)` /
`rgb(107, 33, 168)`); the Settings h3 text widths match the reference's
(≈68.3 px for "Theme" at 18 px/600 — the glyph-metric closure).

### T-5 SCREENSHOTS: the 22-capture family re-run on the remediated
codebase (the login alert + the AI card + the planning badges shift
color; the typography metrics shift subtly on font-metric-dependent
surfaces).

### T-6 DOCS: SKILL v2.9.0 (FS-32 — the minor-version default-theme
drift: the font-stack + palette pins + the completeness invariant + the
counts), README (the pin family + the counts), CLAUDE (the theme-drift
contract), AGENTS (the counts + the new pin family), PAD (the §4.x
theme-drift ruling + the session-20 ledger rows + §8 counts), the
Tailwind-V4-Validation-Report (the Trap 6 discovery section), the
session_20-review.md, this plan's execution record, the worklog.

### T-7 PUSH: commit on main (only main, no new branches) + the SSH
wrapper push (`docs/ssh_git_wrapper_v3.py --remote
git@github.com:nordeim/flow-schedule.git` per
`docs/how-to-git-push-using-ssh-wrapper_SKILL.md`) + the operator key
shredded after.

## 4. Validation of this plan against the codebase

- The F-1 seam verified: `src/app/globals.css` `@theme inline` (lines
  53–146) carries NO font pins today — the defaults flow from
  `tailwindcss@4.3.3`'s theme.css (`--font-sans: -apple-system, ...`,
  verified in the shipped file); the preflight emits
  `font-family: var(--default-font-family, <the v3-compat list>)` and
  `--default-font-family: var(--font-sans)` (verified in the built CSS)
  — a `@theme inline` `--font-sans` pin flows to the html rule; the
  built output re-verified post-fix (T-1 GREEN includes a built-CSS
  assertion via the dev-server computed style).
- The C-1 seam verified: the 13 tokens' reference values extracted from
  the reference's own stylesheet (the raw utility rules, e.g.
  `.text-red-700 { color: rgb(185 28 28) }`); the clone's rendered
  values measured live on BOTH the dev (oklch) and the production
  standalone (hex) — identical computed lab values, so the production
  build is the valid pin surface.
- The e2e surfaces verified: the AI Summary mood block renders the
  loaded state (the dashboard.spec wait pattern — the mood gradient
  only renders with data); the Planning day-card badges render the
  CATEGORY_BADGES chips for all 7 seeded categories (the seed creates
  work/personal/health/learning/creative/social/planning tasks on the
  current week — E-1 re-anchor); the e2e server boots the production
  standalone (the same surface the audit measured).
- The unit pattern verified: `tests/wire-order.test.ts` reads sources
  via `readFileSync` + `path.resolve(import.meta.dirname, "..")` — the
  same pattern applies to globals.css; the used-token scan (the audit's
  grep) re-implemented in the test.
- The rate-limiter constraint verified: the auth spec performs ONE
  wrong-credential login per suite run; the new theme-palette family
  performs ZERO (the login-alert tokens are pinned at the SOURCE level
  only — the alert's e2e assertions already exist in auth.spec as
  class-string pins, green).
- The mobile menu, the viewport bands, the panel-animation family, and
  every existing pin family are untouched by the fix (the @theme pins
  only override default token VALUES — class generation is unchanged;
  the existing 85 e2e must stay green, which T-3 proves).
- The db-path v3 contract untouched: no route, schema, or store change.

## 5. Execution record (2026-10-05, appended after T-7 prep)

*(appended after execution)*

## 6. Execution record (2026-10-05, appended after T-7 prep)

Every step of §3 executed and verified:

- **T-1 RED**: `tests/e2e/theme-palette.spec.ts` (4 pins) +
  `tests/tailwind-theme-pins.test.ts` (6 source pins) landed FIRST.
  All 6 unit pins failed at base exactly as predicted — the
  completeness invariant listing exactly the 13 missing tokens
  (blue-100, gray-400/500, green-200, indigo-700, pink-50/700,
  purple-700/800/900, red-200/700, yellow-700); all 4 e2e pins failed
  at base (the v3-compat font string; the lab/oklch color
  serializations). Two pin-engineering lessons folded in during the RED
  phase: (a) the mood-box locator needed the `from-purple-50`
  discriminator — the calendar's learning-task tooltip
  (`from-purple-400`) precedes the AI card in document order and
  matched the looser selector; (b) the planning-badges pin caught a
  REAL 1-unit transcription divergence that became a finding: the
  reference's pink-700 is `#be185d` (rgb(190 24 93), measured live AND
  in its stylesheet's own rule) — ONE B-unit off the v3 hex `#be185c`;
  the pin uses the reference's measured value (the rendered contract
  wins over the assumed v3 lookup).
- **The F-1/C-1 fix (GREEN)**: `src/app/globals.css` `@theme inline` —
  `--font-sans` pinned to the reference's v4.0-era stack,
  `--font-mono` pinned as the guard, the 13 color tokens pinned to the
  reference's measured hexes (pink-700 `#be185d` with the nuance
  comment). The built CSS re-verified: the theme block carries the
  pinned values; the computed styles serialize rgb(...)/the ui-sans
  stack exactly like the reference. Unit GREEN 6/6; e2e GREEN 4/4.
- **T-2 MUTATION** (harness outside the repo at
  `/home/z/my-project/scripts/mutate-theme-pins.mjs`, ONE canonical
  backup, production rebuild per mutation):
  - M-1 (drop the --font-sans pin): RED 1 e2e (the font-stack pin) +
    1 unit — surgical;
  - M-2 (drop the purple-900 pin): RED 1 e2e (the mood-ramp pin) +
    2 unit (the ramp pin + the completeness invariant — the token
    becomes unpinned AND used) — surgical;
  - M-3 (red-700 → v4.3.3's #bf000f): RED 1 unit (the value pin) —
    surgical, no e2e by design (the rate-limited alert surface is
    pinned at source level);
  - M-4 (gray-400 → #99a1af): RED 1 unit — surgical;
  - restore verification: checksum identical + rebuild + 6/6 unit +
    5/5 e2e.
- **T-3 GATE**: the full consecutive gate — lint ✓ · typecheck ✓ ·
  **159/159 unit** (153 → 159: +6 theme source pins) · build (19
  routes) · **89/89 e2e × 2 consecutive** (3.0 m + 2.9 m; 85 → 89).
- **T-4 LIVE** (the glyph-metric closure): the clone's live typography
  re-measured on the dev server — html/body font-family byte-matching
  the reference's stack; the Settings h3 "Theme" text width **68.3 px**
  (was 58 at base; the reference 68.3); the "Customize…" paragraph
  **312.1 px** (the reference 312.1); the AI mood label/body colors
  `rgb(88, 28, 135)`/`rgb(107, 33, 168)` byte-matching the reference;
  the focus chip bg `rgb(219, 234, 254)` + text `rgb(29, 78, 216)`
  byte-matching.
- **T-5 SCREENSHOTS**: all 22 captures re-run on the remediated
  codebase (`scripts/capture-screens.mjs` persisted in
  /home/z/my-project/scripts/ — the quickaction tiles addressed by
  their real labels "Add New Task"/"Log Activity"/"Quick Brainstorm",
  fresh navigation per panel).
- **T-6 DOCS**: SKILL v2.9.0 (FS-32 + the session-20 changelog + the
  counts), README (159/89 + the theme-palette families in both pyramid
  rows), CLAUDE (the counts + the family), AGENTS (the counts + the
  source-pin family), PAD (§5.1 the pinned stack, §5.2 the 13 tokens +
  the invariant, §5.4 Trap 6 row — "The Six Tailwind v4 Traps", §8 the
  E2E row + the tailwind-theme-pins unit row, the seven session-20
  ledger rows), the Tailwind-V4-Validation-Report (the Trap 6
  discovery section), session_20-review.md (§2's pink-700 nuance +
  the measured-table correction), this execution record, the worklog.
- **T-7 PUSH**: commit on main + the SSH wrapper push.

Reference-account state at session end: 9 parity tasks + 3 notes (the
hygiene re-list ran at session START — 9 tasks + 3 notes, 0 leftovers;
this session's probes created no entities).
