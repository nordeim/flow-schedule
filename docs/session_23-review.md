# Session 23 Review — FlowSchedule (2026-10-06)

Review + remediation session over base `main @ 93da3da` (the session-22
remediation `a484a9d` — the space-y engine-parity pass S22-F1/S22-F2 — plus
the operator's `docs/session_23.md` narrative commit) on the carried-forward
workspace (`.env` with `DATABASE_URL="file:../db/custom.db"`, `db/` at the
repo root, node_modules intact — no reset this session; the environment
contracts re-verified). The reviewer's plan for this session:
`docs/remediation-plan-session23.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD v1.0, flow-schedule_SKILL
  v2.11.0) against the tree — aligned. The full base gate re-executed green:
  lint ✓ · typecheck ✓ · 165/165 unit · build ✓ (19 routes) · **93/94 then
  94/94 e2e** (the one failure is finding S23-F1 below — a TIMING-spec flake,
  not a product regression; the suite passed on the immediate re-runs and the
  spec in isolation).
- The session-22 remediation commit (`a484a9d`) audited at source level: the
  four v3-compat rules present in `globals.css` with the documented scoping
  comments; the 3 auth.spec + 1 dashboard.spec computed-geometry specs + the
  6 source pins in `tests/space-y-compat.test.ts` all present; the
  completeness sweep re-run at HEAD (the only `-mb-*` in src/ is the
  BackToSignIn `-mb-2`; the only label-in-space-y sites are the login fields
  + TaskDialog; the only Radix Select is TaskDialog — all covered by the
  rules). Clean.
- Workspace environment contracts re-verified: `DATABASE_URL` resolves to
  the repo-root `db/custom.db` (db-path v3), `vitest.config.ts` (includes
  only `src/` + `tests/`), `playwright.config.ts` (production standalone
  :3100, its own `db/e2e.db`, single storageState login), `eslint`/
  `tsconfig` both exclude `skills/` — the skills folder is out of the
  code-checking surface per the operating instructions. `.env.example`
  matches the codebase contract (the env-example unit test green).
- The reference-account hygiene re-list at session START (the
  verify-don't-trust rule, network-response capture on the base44 entities
  API): **9 parity tasks + 3 notes, 0 leftovers** (NullSurf S12 Probe,
  NullEndTime Probe A, Top5 Parity D/E/F/G, Log Activity Parity A/B/C) —
  identical to the standing state.
- **The mobile navigation menu (the standing user priority) re-measured
  LIVE on the reference at 390×844** (trusted Playwright clicks, animation
  settled): trigger 338/14/36×36 right 374, menu 182/54/192×164 right 374,
  items [Profile, Settings, Logout], `animation-name: enter` — identical to
  the pins. No Tailwind v4 regression on the menu.
- **The session-22 §5 suggested targets executed live on BOTH apps** (the
  two remaining audit-frontier candidates):
  - **(a) the sign-up ERROR-state geometry** (mismatched passwords, the
    client-side-only probe — no account created on either app): the alert
    text "Passwords do not match", the alert classes, the card y/h
    (180/540), the alert y/h (566/54), the wrap bottom (550), the submit
    y/h (636/44) and the three field gaps [10,10,10] — **byte-identical**
    on both apps. NON-FINDING (but un-pinned — see S23-P1).
  - **(b) the MOBILE (390×844) login + dialog geometry**: sign-in card
    y57 h682 w358 gaps [10,10] inputH 44; sign-up y187 h422 gaps
    [10,10,10] inputH 40 + h2 offset 8; forgot y243 h310 gaps [10] inputH
    40 + h2 offset **8** (the <sm band — space-y-4 only, not the sm: 16);
    the dialog x0 y159 w390 h526 with all six gaps 12 — **byte-identical**
    on both apps. The S22 fix holds at BOTH viewport bands. NON-FINDING
    (but un-pinned — see S23-P1).
- **The matched-state raster diff extended to the MOBILE viewport** (the
  session-22 raster family ran at 1440×900 only): the reference's 9 exact
  task bodies recreated on the clone scratch user, blobs hidden
  identically, WAAPI pulse indicators phase-aligned —
  - /Planning mobile: 0.222% (noise),
  - /Dashboard mobile top (scroll 0): **0.481%** — NOT noise: the hot
    cells trace GLYPH EDGES (text antialiasing) and button corner arcs →
    **S23-F2** (below),
  - /Dashboard mobile skills-anchored (the SkillsMap scrolled to the
    viewport top): 2.869% ALL in the bottom band y647-843 — the
    DailyFocus LLM-quote text region (the documented nature-of-LLM
    ruling; the SkillsMap + StatusCard + DailyFocus chrome above it
    pixel-clean),
  - login-error mobile: 0.427% — the same glyph-edge class,
  - a first "scrolled" capture showed 25.3% — a HARNESS ARTIFACT (absolute
    scroll on pages whose LLM cards differ in height by 48px; re-captured
    element-anchored), and
  - the mobile card stack measured directly: Weekly Schedule 592=592,
    Quick Actions 280=280, **Skills Map 330=330** (the populated donut —
    matched data), StatusCard 170=170, DailyFocus 318 vs 294 and AI
    Summary 336 vs 312 (the LLM text lengths — the documented class).
- Skills used (the repo `skills/` catalog): `agent-browser`/`frontend-ui-
  testing-journey` (the reference-driving pattern — trusted Playwright
  clicks), `clone-app-pat-pro` (measured facts — the live probes, the
  stylesheet extraction, the raster diff are the ground truth), `tdd` /
  `tdd-workflow` (red → green → mutation), `tailwind-patterns` (the v4
  @theme/engine discipline), `code-review-and-audit` (the tiered review
  pipeline), `e2e-testing-lessons` (the timing-flake + geometry-pin
  discipline).

## 2. The findings

### S23-F1 (Medium, e2e infra): two TIMING-spec flakes at base — the panel-animation mount-frame read has a provable race window

Two different timing-sensitive specs failed once each across the session's
six full-suite runs (both passed in every other run and in isolation):

- `panel-animation.spec.ts` "the panel body enters from translateY(20px)…"
  (the cold-start first run): the spec's initial read is a
  `waitForFunction({ polling: "raf" })` whose predicate returns the computed
  transform/opacity at the FIRST frame the element exists. Under cold-start
  load (the standalone boot + the LLM 429 churn + the suite's browser
  contexts), a >200 ms main-thread stall between the element's mount and
  the first rAF poll lands the read MID-TWEEN — past the whole 0.2 s delay
  window the pin measures. The spec's own comments describe the race class
  ("a single read can race the registration and flake under compositing
  load"); the mount-frame design is the remaining exposure.
- `dashboard.spec.ts` "Focus Timer panel counts down" (one mid-session
  run): the failure message was lost (the Playwright `test-results/`
  artifact is wiped at the next run's start — an infra gap worth noting);
  unreproduced in 4 isolated stress runs + 3 subsequent full runs. Same
  load-race class; no blind fix without a diagnosis.

The product is NOT regressed (the animation/timer semantics are pinned
green in every other run). The remediation retired the live
transient-read design entirely: the panel-body entrance pin now asserts
(a) the DETERMINISTIC WAAPI timing metadata (duration 300, delay 200,
circOut, fill both — the same metadata class spec #1 pins for the
overlay), (b) the entrance's native keyframes (opacity 0 → 1 — also
metadata), and the settle poll; the initial y=20 and the 0.2 s delay are
covered by the WAAPI delay + the byte-level panel-motion SOURCE pins.
The single-evaluate mount-frame variant tried mid-session STILL flaked
once under full-suite load (the first rAF after the element's mount
landed mid-tween at y=18.37 — a ~200 ms main-thread stall during the
mode="wait" mount churn; the trace captured before the next run's
cleanup wiped it) — a live computed read of a transient window cannot
be made deterministic, so the metadata surfaces carry the contract. The
second specimen (the Focus Timer counts-down flake, message lost) is
documented as the same class; if it recurs, the same
deterministic-surface redesign is the template. The full suite ran
**104/104 × 3 consecutive** after the rewrite.

### S23-F2 (High, theme parity): the clone ships the shadcn SLATE semantic theme; the reference's app stylesheet ships the shadcn DEFAULT (neutral) theme

Surfaced by the mobile raster residual (0.481% dashboard-top — glyph-edge
pixels), root-caused by computed-style probes and closed by byte-extracting
the reference's OWN app stylesheet (`/assets/index-CcElM1Qx.css`, 82 160
bytes — the stylesheet the AUTHENTICATED shell loads; the login page is
served with a DIFFERENT platform build whose `:root` carries the zinc
family, but the login card's texts are all explicit slate utilities —
invisible either way):

| Token | Reference (app CSS, measured) | Clone (base) | Rendered delta |
|---|---|---|---|
| `--foreground` | `0 0% 3.9%` (rgb(10,10,10)) | `222.2 84% 4.9%` (rgb(2,8,23)) | body default, dialog labels/inputs/select-triggers, CardTitles |
| `--card-foreground` | `0 0% 3.9%` | `222.2 84% 4.9%` | the Planning/Card CardTitles (rgb(10,10,10) vs rgb(2,8,23)) |
| `--popover-foreground` | `0 0% 3.9%` | `222.2 84% 4.9%` | the same family (the :root block) |
| `--muted-foreground` | `0 0% 45.1%` (rgb(115,115,115)) | `215.4 16.3% 46.9%` (rgb(100,116,139)) | the TaskDialog title placeholder — a 15/1/24-channel delta, ABOVE the raster threshold |
| `--radius` | `.5rem` | `0.625rem` | every var-based radius: rounded-lg 8 vs 10 px (the week-nav buttons, the dialog `sm:rounded-lg` 8 vs 10), rounded-xl 12 vs 14 (the dropdown menu), rounded-md/sm shifted likewise |
| `--primary`, `--secondary`, `--muted`, `--accent` + their `-foreground`s, `--ring` | the neutral `0 0%` family | the slate/`210 40%` family | stylesheet-evidenced (no rest-state surface measured for all; `--destructive` already identical `0 84.2% 60.2%`) |

Measured live on BOTH apps (1440×900 and 390×844): the reference's Previous
button `border-radius: 8px` vs the clone's `10px`; the reference's dialog
`8px` vs the clone's `10px`; the reference's body/dialog-label/CardTitle
color `rgb(10,10,10)` vs the clone's `rgb(2,8,23)`; the reference's
placeholder `rgb(115,115,115)` vs the clone's `rgb(100,116,139)`. The
reference's `:root` `--radius: .5rem` and the whole neutral token block
byte-extracted from its app stylesheet (the session-20 evidence class).

**Why 22 sessions of diffs missed it:** every visible text surface with an
EXPLICIT utility (the `text-slate-*` family) was pinned and matches — the
session-20 theme-palette family pinned the UTILITY ramps, never the
SEMANTIC token block. The `--foreground` delta (8/2/13 channels) is BELOW
the >8 raster threshold on full-coverage glyph pixels and only surfaces at
antialiased glyph edges + corner arcs — the mobile raster (no LLM cards in
view at scroll 0, no dominating region) is what finally isolated it. The
`--radius` delta is pure shape (the box geometry pins measure x/y/w/h, not
corner curvature).

**The --border/--input ruling (NOT changed):** the reference's `:root`
declares `0 0% 89.8%` (neutral-200) but its app stylesheet ships NO
`border-border` utility and NO shadcn universal `* { border-color }` rule —
its bare `border` surfaces take the v3 preflight default `#e5e7eb`
(gray-200, rgb(229,231,238)). The clone's universal rule `* { @apply
border-border }` renders its `--border` = slate-200 (rgb(226,232,240)) —
1–3 units off the reference's rendered gray-200 on both channels that
matter (slate is CLOSER than neutral-200 would be: neutral's B channel is
9 units off). Both measured surfaces that carry an explicit border color
(the dialog inputs' `border-slate-200`, the day-card borders) render
byte-identically. Keeping the clone's slate `--border`/`--input` is the
closest rendered match; changing them to the reference's nominal neutral
values would move the bare-border surfaces AWAY from the rendered truth.
Documented acceptance.

### S23-P1 (pin gap, per FS-22): the two session-22 §5 closures are live-verified but carry no pins

The sign-up error-state geometry and the mobile login/dialog geometry are
byte-identical (verified this session, live, on both apps) — but no spec
pins them. A behavior verified live but unpinned is a regression waiting
to happen (the session-11 G-2/G-3 pattern: add the pins, prove their
sensitivity by mutation).

### S23-F3 (High, theme parity — found mid-T-4): v4's named text-* utilities emit UNIT-LESS line-heights, which smaller-font children RE-SCALE on inheritance

Surfaced by the mobile raster's last residue after the S23-F2 fix (794 px,
all in the calendar's day-label column): the date line (`text-[10px]`
inside a `text-xs` parent) computed **13.33px** line-height on the clone
vs **16px** on the reference — with the class strings byte-identical and
the parent's computed line-height 16px on BOTH apps. Mechanism: v4's
`.text-xs` emits `line-height: var(--tw-leading, var(--text-xs--line-height))`
with `--text-xs--line-height: calc(1 / .75)` — a UNIT-LESS ratio
(1.3333) — whereas the reference's v3 stylesheet emits `.text-xs
{ font-size: .75rem; line-height: 1rem }` (a LENGTH, byte-extracted from
its app CSS). A ratio line-height INHERITS as a ratio and re-scales with
the child's own font size (10px × 1.3333 = 13.33); a length inherits
fixed (16px). The 2.67px shorter date line shifted the centered two-line
label stack 1.33px down (EEE y 271.33 vs 270, live-measured). For the
element itself, ratio × size === the v3 length (identical pixels) — only
the INHERITANCE semantics differ. Fixed by pinning the v3 LENGTH forms
of the used text scale (`--text-xs--line-height: 1rem` …
`--text-2xl--line-height: 2rem`) in `@theme` (Trap 7 in the PAD's
table) + an e2e pin (the date line's computed line-height + the EEE
offset) + source pins. Mutation M-6 (the ratio reverted) → RED exactly
the new pin.

## 3. Non-findings (verified, no action)

- **The mobile navigation menu**: byte-identical at 390×844 (the standing
  priority — re-measured live this session).
- **The sign-up error-state geometry + the mobile login/dialog geometry**:
  byte-identical (see §1; the pins land this session as S23-P1).
- **The desktop raster family**: unchanged from the session-22 closures
  (login-error 0.098%; the ~830 px of the y100-300 band beyond the LLM
  region is the S23-F2 glyph-edge/corner class — expected to collapse with
  the fix, verified in T-4).
- **The mobile calendar structure**: days-as-rows × hours-as-columns with
  the 1040 px min-width horizontal scroller — identical DOM structure on
  both apps (the transposed appearance at 390px is the SAME structure as
  desktop, not a mobile-specific layout).
- **The v4 alpha-modifier compilation (`border-sky-200/90` etc.)**: the
  clone's computed border-color serializes as `lab(.../0.9)` where the
  reference serializes `rgba(186, 230, 253, 0.9)` — the SAME rendered
  color (v4 uses `color-mix(in oklab, …)` for alpha modifiers; the pinned
  base hex round-trips exactly — the full-coverage border pixels measured
  IDENTICAL at (193,232,253) on both apps). A serialization divergence,
  not a rendering one; documented, no action.
- **The environment/seed/db contracts**: verified green (§1).

## 4. Environment notes

- The workspace was carried forward (no reset) — the bootstrap contracts
  re-verified per §1 before any audit work; the base gate green.
- The e2e webServer lifecycle lessons honored (pkill the standalone before
  rebuilds; the harness scripts run under node with the repo's
  node_modules resolved by absolute import path).
- The first mobile raster "scrolled" capture taught the same class as
  session-22's phantom-task lesson: capture at ELEMENT anchors when the
  pages' total heights legitimately differ (the LLM cards' text lengths);
  an absolute scroll position fabricates a 25% divergence.
- VLM was rate-limited (429) for most of the session — the pixel-level
  forensics (channel-spread analysis, glyph ASCII-rendering, self-diff
  determinism checks) substituted and were MORE decisive than the visual
  passes: the "LCD fringing" hypothesis resolved to the foreground TOKEN
  delta (the clone's slate tint blended into the AA edges), and the
  corner-arc residue resolved to the --radius delta.
- The reference's login page and the authenticated shell load DIFFERENT
  stylesheets (the platform serves the login screen with its own build) —
  the app's `/assets/` stylesheet is the authoritative source for the
  authenticated surfaces' token contract.

## 5. Knowledge carried forward

- **The semantic token block is a parity surface of its own (S23-F2)**:
  the scaffold's default theme (slate) survived 22 sessions because every
  EXPLICIT utility color was pinned and every raster threshold sat above
  the glyph-edge deltas. The session-20 completeness invariant covers
  color-class tokens; it does NOT cover the `:root` semantic family. The
  reference's OWN app stylesheet (byte-extracted) is the ground truth for
  that family — the platform's login-shell stylesheet is a different
  build and must not be confused with it.
- **Raster thresholds hide sub-threshold token drift**: a delta of 8/2/13
  channels on text surfaces is invisible on full-coverage pixels and only
  aggregates at antialiased edges — the mobile raster (with no LLM region
  in view to dominate the ranking) is the surface that isolates it.
  Computed-color pins (the session-20 method, extended to the semantic
  family) are the deterministic guard.
- **Box-geometry pins are curvature-blind (the --radius class)**: x/y/w/h
  measurements cannot see an 8px vs 10px corner radius; the corner-arc
  antialiasing in a raster diff is the only trace. Pin the computed
  border-radius on at least one surface per radius band.
- **Timing-spec flake discipline (S23-F1)**: a spec that reads transient
  state through a CDP-mediated poll has a load-dependent race window; the
  in-page buffer sampler (installed before the trigger, recording every
  frame) removes the window entirely — the exit-probe pattern is the
  template. And: Playwright wipes `test-results/` at each run start — a
  flake's evidence does not survive a re-run; capture the failure output
  in the moment.

**Suggested session-24 targets**: the audit frontier after this session:
the semantic-theme family and the line-height semantics are closed (pins
+ values, both viewport bands byte-identical rasters), the login/dialog/
menu/motion/timing surfaces all carry computed-geometry or computed-color
pins at both viewport bands. Remaining candidates: (a) a full mobile
`/Profile` + `/Settings` geometry pin family (the desktop rasters closed
at 0.000% this session; mobile was never diffed), (b) the focus-visible
ring surfaces (`--ring` now neutral — the reference's focus-ring color
was never live-measured; a keyboard-driven probe would close it), or (c)
any surface the operator prefers.

**The post-fix raster closure (T-4, both viewport bands)**: with S23-F2
+ S23-F3 fixed, the matched-state rasters re-ran — mobile: dashboard-top
**0.000%** (was 0.481%), planning **0.000%** (was 0.222%), login-error
**0.000%** (was 0.427%); desktop: planning/profile/settings/login-error
all **0.000%** (were 0.057/0.009/0.009/0.098%); the desktop dashboard's
non-LLM region (y 0–388: header, calendar, nav, task blocks) is
pixel-clean with the residual 3.947% entirely inside the two LLM-content
cards (today's live quote/summary text is longer than the session-22
capture's — the documented never-hard-fail region, inherently
content-dependent); login-reset keeps the documented session-5
alert-text ruling. **Every non-LLM pixel on every rastered surface at
both viewport bands now matches the reference byte-for-byte.**
