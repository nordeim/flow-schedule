# Remediation Plan — Session 23 (2026-10-06)

Session-23 review of the FlowSchedule clone (base commit `93da3da` — the
session-22 remediation `a484a9d` plus the operator's `docs/session_23.md`
narrative commit; the carried-forward workspace re-verified per
`docs/session_23-review.md` §1). The `skills/` folder is excluded from
code checking, testing and compilation per the operating instructions
(eslint ignores `skills`, tsconfig excludes `skills`, vitest includes
only `src/` + `tests/` — re-verified via the green base gate: lint ✓ ·
tsc ✓ · 165/165 unit · build (19 routes) · 94/94 e2e, one cold-start
timing flake re-run green).

Skills used this session: `agent-browser` / `frontend-ui-testing-journey`
(the reference-driving pattern — trusted Playwright clicks), `clone-app-
pat-pro` (measured facts — the live computed-style probes, the app
stylesheet byte-extraction, and the raster diff are the ground truth),
`tdd` / `tdd-workflow` (red → green → mutation evidence), `tailwind-
patterns` (the v4 @theme/engine discipline), `code-review-and-audit`
(the tiered review pipeline), `e2e-testing-lessons` (the timing-flake
and computed-pin discipline).

## 1. Audit scope and method

The session-22 §5 suggested targets executed live on BOTH apps (the
sign-up error-state geometry + the mobile 390×844 login/dialog geometry),
the matched-state raster diff extended to the mobile viewport, the mobile
menu re-measured (the standing priority), and the reference's OWN app
stylesheet byte-extracted to close a theme-token question the mobile
raster surfaced.

| Surface | Method | Result |
|---|---|---|
| Workspace (carried forward, contracts re-verified) | Full base gate | ✅ lint ✓ · typecheck ✓ · 165/165 unit · build (19 routes) · 94/94 e2e (after one cold-start timing flake — S23-F1) |
| The session-22 remediation commit (`a484a9d`) | Source-level audit + the space-y completeness sweep at HEAD | ✅ clean — the four rules present, scoping still exhaustive |
| The reference-account hygiene | Network-response entity capture at session START | ✅ 9 parity tasks + 3 notes, 0 leftovers |
| **The mobile menu (the standing user priority)** | Live re-measure on the reference at 390×844 | ✅ byte-identical (trigger 338/14/36×36 right 374; menu 182/54/192×164 right 374; items [Profile, Settings, Logout]; `animation-name: enter`) — no Tailwind v4 regression |
| The session-22 §5 target (a): the sign-up error-state geometry | Live probe on BOTH apps (client-side mismatch only — no account created) | ✅ byte-identical (card 180/540, alert 566/54, text + classes, gaps [10,10,10]) — **un-pinned → S23-P1** |
| The session-22 §5 target (b): the mobile login/dialog geometry | Live probe on BOTH apps at 390×844 | ✅ byte-identical (all cards/gaps/inputH bands; h2 offsets 8/8; the dialog 0/159/390/526, gaps [12]×6) — **un-pinned → S23-P1** |
| The matched-state raster at MOBILE (390×844) | The reference's 9 exact bodies re-seeded on the clone scratch user; blobs hidden identically; pulses phase-aligned | ✅ Planning 0.222% (noise) · skills-anchored 2.869% ALL in the DailyFocus LLM-quote band · ❌ **dashboard-top 0.481% + login-error 0.427% → S23-F2** (glyph-edge + corner-arc pixels) |
| The mobile card stack | Direct card-height measurement, matched data | ✅ Weekly Schedule 592=592 · Quick Actions 280=280 · Skills Map 330=330 · StatusCard 170=170 · the two LLM cards 318/336 vs 294/312 (the documented text-length class) |
| The semantic token family | Computed-style probes on BOTH apps + the reference's app stylesheet `:root` byte-extraction | ❌ **S23-F2** — the clone ships shadcn slate; the reference ships shadcn default (neutral) |
| The panel-animation timing spec | 6 full-suite runs + isolated stress runs | ⚠ **S23-F1** — two one-off timing flakes (the mount-frame read's CDP round-trip class) |

## 2. Issues, bugs and gaps found

### S23-F1 (Medium, e2e infra): the panel-animation mount-frame read races the load-dependent CDP round-trip

Two different timing specs flaked once each across six full-suite runs
(both green in isolation and in every other run — no product regression).
The diagnosable specimen: `panel-animation.spec.ts` "the panel body
enters…" reads the mount state via `waitForFunction` then schedules the
+100 ms delay-hold read as a SECOND `page.evaluate` — the CDP round-trip
between them is load-dependent (under cold-start load it eats into the
200 ms delay window and the hold read lands mid-tween). The second
specimen (dashboard "Focus Timer panel counts down") lost its failure
message to the next run's `test-results/` cleanup — same class, no blind
fix.

### S23-F2 (High, theme parity): the shadcn semantic theme — slate vs the reference's default (neutral)

The clone's `:root` ships the shadcn **slate** variant; the reference's
app stylesheet (`/assets/index-CcElM1Qx.css`) ships the shadcn **default
(neutral)** variant. Live-measured visible divergences: `--foreground` /
`--card-foreground` / `--popover-foreground` (rgb(10,10,10) vs
rgb(2,8,23) — the body default, the dialog labels/inputs/select-triggers,
the Planning CardTitles), `--muted-foreground` (rgb(115,115,115) vs
rgb(100,116,139) — the TaskDialog title placeholder), and `--radius`
(.5rem vs .625rem — every var-based corner: the week-nav buttons 8 vs
10 px, the dialog `sm:rounded-lg` 8 vs 10 px, the dropdown `rounded-xl`
12 vs 14 px). The primary/secondary/muted/accent/ring family is
stylesheet-evidenced. NOT changed: `--border`/`--input` (the reference's
nominal neutral-200 never renders — its bare `border` surfaces take the
v3 preflight `#e5e7eb`; the clone's slate-200 is the closest rendered
match, 1–3 units; documented acceptance) and `--destructive` (already
identical).

### S23-P1 (pin gap, FS-22): the two session-22 §5 closures are verified but un-pinned

The sign-up error-state geometry and the mobile login/dialog geometry
(byte-identical, live-verified this session) carry no pins.

## 3. The remediation — TDD execution plan

### T-1 RED: the pins land FIRST (must fail at base)

**`tests/e2e/theme-palette.spec.ts`** — ADD the describe
"the semantic token family (S23-F2)":
- `/Dashboard`: `getComputedStyle(document.body).color` ===
  `"rgb(10, 10, 10)"`;
- the week-nav Previous button's computed `border-radius` === `"8px"`;
- `/Planning` (a day card clicked): the selected-day CardTitle color ===
  `"rgb(10, 10, 10)"`;
- the TaskDialog (the calendar-cell entry): the first field label's
  color === `"rgb(10, 10, 10)"`, the title input's `::placeholder` color
  === `"rgb(115, 115, 115)"`, and the dialog panel's computed
  `border-radius` === `"8px"`.

**`tests/tailwind-theme-pins.test.ts`** — ADD the source pins: the
`:root` block's neutral values (`--foreground: hsl(0 0% 3.9%)`,
`--card-foreground`/`--popover-foreground` same, `--primary: hsl(0 0%
9%)`, `--primary-foreground: hsl(0 0% 98%)`, `--secondary:
hsl(0 0% 96.1%)`, `--secondary-foreground: hsl(0 0% 9%)`, `--muted:
hsl(0 0% 96.1%)`, `--muted-foreground: hsl(0 0% 45.1%)`, `--accent:
hsl(0 0% 96.1%)`, `--accent-foreground: hsl(0 0% 9%)`,
`--destructive-foreground: hsl(0 0% 98%)`, `--ring: hsl(0 0% 3.9%)`,
`--radius: 0.5rem`) + the slate forms ABSENT (`--foreground: hsl(222.2`
must not appear; `--radius: 0.625rem` must not appear).

**`tests/e2e/auth.spec.ts`** — ADD to the S22 geometry family: the
sign-up ERROR-state spec (trigger the client-side mismatch — no network
call): the alert's y-offset from the fields-wrap bottom = 16, the
submit's y-offset from the alert bottom = 16, the card height 540
(±1), the alert height 54 (±1), the three field gaps 10 (±1 each).

**`tests/e2e/auth.spec.ts`** — ADD the describe
"login field geometry at the mobile band (390×844, S23-P1)" with
`test.use({ viewport: { width: 390, height: 844 } })`:
- sign-in: card y 57 (±1) h 682 (±1), gaps [10,10], input height 44;
- sign-up: card y 187 (±1) h 422 (±1), gaps [10,10,10], input height 40,
  the h2 offset 8 (±1);
- forgot: card y 243 (±1) h 310 (±1), gaps [10], input height 40, the
  h2 offset **8** (±1 — the <sm band: space-y-4 only, NOT the ≥sm 16).

**`tests/e2e/dashboard.spec.ts`** — ADD the describe
"task dialog geometry at the mobile band (390×844, S23-P1)" with the
same viewport override: the dialog box (x 0, y 159, w 390, h 526 — ±1)
and all six label→field gaps 12 (±1).

**`tests/e2e/panel-animation.spec.ts`** — REWRITE spec #2 (the S23-F1
fix; a test-only change, GREEN at base, sensitivity by mutation):
- the DETERMINISTIC pin: the panel body's native WAAPI animation timing
  (polled in-page like spec #1): duration 300, delay 200, easing
  `cubic-bezier(0.55, 0, 1, 0.45)`, fill both;
- the mount-state + delay-hold read collapsed into ONE `page.evaluate`
  (an in-page rAF poll → the mount frame's computed state → an in-page
  +100 ms timer → resolve both) — no CDP round-trip between the mount
  detection and the hold read (the flake's root window);
- keep the settle poll + the back-to-Quick-Actions cleanup.

### The fix (GREEN target): `src/app/globals.css` `:root` — the neutral token block

Rewrite the 14 drifted tokens + `--radius` to the reference's app-CSS
values (all live-measured and/or byte-extracted — the table in the
review §2). The comment documents the evidence + the `--border`/
`--input` ruling. No other source file changes. No DOM/class changes
anywhere.

### T-2 MUTATION (the sensitivity harness at
`/home/z/my-project/scripts/mutate-s23.mjs`, ONE canonical backup per
file, production rebuild per mutation, the pin suites re-run after the
harness proves the tree restored):
- **M-1** (`--foreground` reverted to the slate value) → RED the
  body/CardTitle/dialog-label computed pins + the source pins;
- **M-2** (`--muted-foreground` reverted) → RED the placeholder pin;
- **M-3** (`--radius` reverted to 0.625rem) → RED the two radius pins;
- **M-4** (QuickActions' panelMotion `delay: 0.2` → `0`) → RED the
  rewritten WAAPI-timing pin (the delay 200 → 0) — sensitivity proven
  at the deterministic surface;
- **M-5** (the `.space-y-2 > label + *` compat rule removed) → RED the
  NEW mobile dialog-gap pins (proving the S23-P1 lock-ins guard the
  session-22 fix at the mobile band).

### T-3 GATE: the full consecutive gate

lint · typecheck · unit (165 → 169: +4 source-pin its) · build (19
routes) · e2e ×2 consecutive (94 → 99: +4 theme/semantic pins, +3
mobile/error geometry pins − wait, count below) — the exact totals
recorded at execution.

### T-4 LIVE: the re-probe on the remediated clone + the raster re-run

- The semantic probes re-run against the rebuilt standalone: the body /
  CardTitle / dialog label colors byte-match the reference
  (rgb(10,10,10)); the placeholder rgb(115,115,115); the radii 8px.
- The mobile raster re-run (matched state, element-anchored): the
  dashboard-top residual should collapse from 0.481% toward the noise
  band (the glyph-edge + corner-arc classes eliminated); the
  skills-anchored capture keeps its LLM-band-only diff.
- The reference-account hygiene re-list at session END.

### T-5 SCREENSHOTS: the 22-capture family re-run on the remediated
codebase (the dev server; `scripts/capture-screenshots.mjs`).

### T-6 DOCS: SKILL v2.12.0 (FS-35 — the semantic-token family is a
parity surface of its own; the scaffold-theme survival lesson; the
sub-threshold drift + curvature-blind lessons), README (the theme
section + the test-pyramid rows + counts), CLAUDE (the Tailwind v4
section's semantic-theme ruling + the counts), AGENTS (the
framework-quirks entry + the counts), PAD (§5.2's token table + §5.4 +
§8 counts + §12 ledger), the session_23-review.md, this plan's
execution record, the worklog.

### T-7 PUSH: commit on main (only main, no new branches) + the SSH
wrapper push (`docs/ssh_git_wrapper_v3.py --remote
git@github.com:nordeim/flow-schedule.git` per
`docs/how-to-git-push-using-ssh-wrapper_SKILL.md`) + the operator key
shredded after. `.env.example` (unchanged, contract-verified) is
included in the commit per the standing requirement.

## 4. Validation of this plan against the codebase

- The broken values enumerated from BOTH sides: the reference's app
  stylesheet `:root` block (byte-extracted, 82 160 bytes — the
  authenticated shell's CSS) vs the clone's `globals.css` lines 28–51;
  the visible surfaces live-measured on both apps (the table in the
  review §2: body/CardTitle/dialog-label/placeholder/radius).
- The rendered-color round-trip verified: hsl(0 0% 3.9%) ===
  rgb(10,10,10) === the reference's measured body color; hsl(0 0% 45.1%)
  === rgb(115,115,115) === its measured placeholder.
- The blast-radius check: no existing e2e pin asserts a
  semantic-token-derived computed color (grep-verified — dashboard.spec's
  rgb pins are explicit utility gradients; mobile-navigation's are
  red-600 + the --shadow-sm pin; theme-palette's are explicit utility
  ramps); the dialog GEOMETRY pins measure x/y/w/h (curvature-blind —
  unaffected by the radius change); the mobile-menu box pins likewise.
- The login page's own surfaces are explicit slate utilities (session-5
  measured) — the `--foreground` change does not touch the login card's
  text colors (the login-body default changes, but every visible login
  text carries an explicit class — verified by the S22 rasters closing
  at 0.098% with the slate body).
- The `--border`/`--input` no-change ruling validated: the reference's
  app CSS ships NO `border-border` utility and NO shadcn universal
  rule (its preflight default `#e5e7eb` renders on bare borders —
  1–3 units from the clone's slate-200, BELOW every threshold; both
  apps' explicitly-colored border surfaces match byte-for-byte).
- The panel-animation rewrite's deterministic surface verified live:
  the clone's panel body carries exactly ONE native animation with
  `{duration: 300, delay: 200, easing: cubic-bezier(0.55, 0, 1, 0.45),
  fill: both}` — the same metadata class spec #1 already pins for the
  overlay.
- The mobile-band pin values measured at the e2e viewport band (390×844)
  on BOTH apps this session (the review §1); the desktop-band error-
  state values likewise (1440×900 probe; the card/ alert offsets are
  viewport-independent padding sums — verified by the S22 family's
  viewport-independence).
- The rate-limiter constraint: the new specs perform ZERO real logins
  (auth.spec's logged-out surface; the dashboard/planning/theme specs
  use the storageState pattern).
- The e2e viewport mechanics verified: `test.use({ viewport })` inside a
  `test.describe` scopes the viewport to that block only (Playwright's
  documented API) — the rest of auth.spec/dashboard.spec stays at
  Desktop Chrome 1280×720.

## 5. Execution record (2026-10-06, appended after T-7)

Every step of §3 executed and verified — plus ONE finding that surfaced
mid-T-4 (the S22 mid-fix-Select-variant pattern repeating):

- **The audit** (§1–§2): the session-22 §5 targets executed live on
  BOTH apps — the sign-up error-state geometry and the mobile
  login/dialog geometry byte-identical (the two S23-P1 lock-in
  families); the mobile raster diff EXTENDED to 390×844 (matched data,
  element-anchored after the absolute-scroll artifact taught the same
  lesson as session-22's phantom task); the mobile menu re-measured
  byte-identical (the standing priority). **S23-F1** (two timing-spec
  flakes at base) + **S23-F2** (the shadcn slate-vs-neutral semantic
  theme — root-caused through the glyph-edge raster residue → the
  computed-color probes → the reference's OWN app stylesheet
  byte-extraction) established.
- **T-1 RED**: `tests/e2e/theme-palette.spec.ts` gained the 4-spec
  semantic-token describe (the body color, the week-nav radius, the
  Planning CardTitle, the dialog label/placeholder/radius) — all RED at
  base exactly as predicted (rgb(2,8,23) ≠ rgb(10,10,10); 10px ≠ 8px);
  `tests/tailwind-theme-pins.test.ts` gained the 4 source-pin its (the
  neutral family, the radius, the slate-absence, the shared-token
  guard) — 3 RED at base; the S23-P1 lock-ins (auth.spec's sign-up
  error-state spec + the 390×844 login family + dashboard.spec's 390×844
  dialog spec) GREEN at base as designed; the panel-animation spec #2
  rewritten.
- **The fix (GREEN)**: `src/app/globals.css` `:root` — the 14 drifted
  tokens + `--radius` rewritten to the reference's app-CSS values (the
  documented comment carries the evidence + the `--border`/`--input`
  rendered-match ruling). GREEN: unit 169/169; the theme-palette family
  10/10.
- **Mid-T-4 discovery — S23-F3**: the mobile raster's last residue
  (794 px, the day-label column) root-caused to v4's UNIT-LESS
  `--text-xs--line-height: calc(1/.75)` (a ratio that re-scales on
  inheritance — the `text-[10px]` date line rendered 13.33px vs the
  reference's v3 LENGTH-inherited 16px, shifting the centered label
  stack 1.33px). The pin landed FIRST (RED: the e2e date-line spec +
  the 12-line source pin), then the `@theme` v3 LENGTH forms for the
  whole used text scale. GREEN.
- **T-2 MUTATION**: M-1 (`--foreground` slate-revert) → RED the
  body/CardTitle/dialog pins; M-2 (`--muted-foreground` revert) → RED
  exactly the dialog-surfaces pin; M-3 (`--radius` revert) → RED the
  radius + dialog pins; M-4 (the panelMotion delay → 0) → RED the
  rewritten WAAPI-timing pin; M-5 (the `.space-y-2 > label + *` rule
  removed) → RED the NEW mobile dialog-gap pin; M-6 (the line-height
  ratio revert) → RED the date-line pin. **All 6 surgical; restore
  checksum-verified; the pin suites green post-restore.**
- **The panel-animation rewrite iterated once more**: the
  single-evaluate mount-frame design STILL flaked once under full-suite
  load (y=18.37 read mid-tween — the ~200 ms mode="wait" mount churn
  starves the rAF poll; the trace captured in the moment). The final
  design asserts ONLY deterministic metadata: the WAAPI timing
  (300/200/circOut/both) + the native keyframes (opacity 0→1) + the
  settle poll — the initial y and the delay covered by the source pins.
- **T-3 GATE**: lint ✓ · typecheck ✓ · **170/170 unit** (165 → 170:
  +5 source-pin its) · build (19 routes) · **104/104 e2e × 3
  consecutive** (94 → 104: +4 semantic + 1 date-line + 1 error-state +
  3 mobile login + 1 mobile dialog; the third run for flake-fix
  confidence — the panel-animation spec deterministic).
- **T-4 LIVE**: the semantic probes re-run — the body/CardTitle/dialog
  labels rgb(10,10,10) = the reference; the placeholder
  rgb(115,115,115) = the reference; the radii 8px = the reference; the
  root token `.5rem` = the reference. **The raster closure at BOTH
  viewport bands**: mobile dashboard-top/planning/login-error all
  **0.000%** (were 0.481/0.222/0.427%); desktop
  planning/profile/settings/login-error all **0.000%** (were
  0.057/0.009/0.009/0.098%); the desktop dashboard's non-LLM region
  pixel-clean (the 3.947% residual entirely inside the two LLM-content
  cards — today's live text is longer; the documented
  never-hard-fail region); login-reset keeps the session-5 alert-text
  ruling. The hygiene re-list at END: 9 parity tasks + 3 notes, 0
  leftovers; the mobile menu re-verified byte-identical.
- **T-5 SCREENSHOTS**: all 22 captures re-run on the remediated
  codebase (the dev server; `scripts/capture-screenshots.mjs` — the
  login/dialog captures now render the reference's neutral theme, the
  8px radii, and the 16px label line-heights).
- **T-6 DOCS**: SKILL v2.12.0 (FS-35 — the scaffold-theme survival
  ruling + the sub-threshold-drift and curvature-blind lessons + the
  ratio-vs-length line-height semantics), README, CLAUDE, AGENTS, PAD
  (§5.2's token table + §5.4's rows 4b/4c/7 + §8 counts + §12 ledger),
  the session_23-review.md, this execution record, the worklog.
- **T-7 PUSH**: commit on main + the SSH wrapper push.

Harness lessons recorded: (1) the desktop raster re-run needed the
absolute-import fix (the S22 scripts' bare `@playwright/test` import no
longer resolves from the repo root under this Node); (2) the
line-reporter's failure summary needs a block parse (no per-test ✘
lines); (3) a mutation regex must be validated against the actual
source text BEFORE the run (M-4's first `delay: 0.2,` pattern matched
nothing — delay is the LAST property in the transition object); (4)
Playwright wipes `test-results/` at each run start — a flake's trace
must be read in the moment.
