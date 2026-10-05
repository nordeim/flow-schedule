# Session 19 Review — FlowSchedule (2026-10-05)

Review + remediation session over base `main @ 9c1272b` (the session-18
remediation `0d39f09` — the Focus Timer timed-interaction family + the
terminal 00:00 display — plus the operator's docs/session_19.md narrative
commit) on a fresh `git clone` workspace (the review environment had been
reset again; `.env` recreated from `.env.example`, `db/` re-seeded via
`bun run db:push && bun run db:seed`, `bun install`). The reviewer's plan
for this session: `docs/remediation-plan-session19.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL
  v2.7.0) against the tree — aligned; the full gates re-executed green at
  base (lint ✓ · typecheck ✓ · 143/143 unit · build ✓ (19 routes) ·
  **81/81 e2e** in 2.8 m) on the freshly rebuilt workspace.
- The session-18 remediation commit (`0d39f09`) audited at source level:
  the FT-1 seam in `QuickActions.tsx` (the display is the `remaining`
  STATE, the toggle resets on both directions, the comment cites the
  measurement) — clean; the 5 focus-timer pins green inside the base run.
- **The session-18 §5 suggested target (a) executed: the framer-motion
  animation-timing pass — the Quick Actions panel entrance/exit family
  measured live on BOTH apps at rAF-frame precision** (an in-page rAF
  sampler reading the container/overlay/form-view/panel-body geometry,
  opacity, and transform matrices; the reference driven with the
  operator's account; the clone's dev server). Complemented by a
  full decompile of the reference's motion configs from its bundle
  (`index-BNgAatKl.js`) and a `getAnimations()` metadata probe on both
  apps.
- The mobile navigation menu (the standing user priority) re-measured
  LIVE on BOTH apps at 390×844 (trusted clicks, animation settled):
  trigger 338/14/36×36 right 374, menu 182/54/192×164 right 374, items
  [Profile, Settings, Logout], `animation-name: enter` — **byte-identical
  on both apps, identical to the e2e pins** (no drift, no Tailwind v4
  regression; the viewport-band + classless-body pins green inside the
  base run).
- The reference-account hygiene re-list at session START (the
  verify-don't-trust rule): **9 parity tasks + 3 notes, 0 leftovers**
  (the tasks from the captured login XHRs; the notes via a direct
  entity probe with the captured SDK auth).

## 2. The animation-timing findings

The pass examined every framer-motion surface on both apps — the Quick
Actions container morph, the expanding overlay, the form-view swap, the
panel-body entrance/exit, the buttons-view re-entrance, and the three
background blobs — at FOUR evidence levels:

**Level 1 — the config decompile (byte-exact).** The reference's
`G1e` (the Quick Actions card) and `W1e` (the Focus Timer panel) carry
EXACTLY the clone's source values: the container `layout` +
`{duration: .4, ease: "circOut"}` + `style: {background}`; the overlay
`initial/animate/exit` + `{duration: .35, ease: "circOut"}` with the
exit-internal `{duration: .3, ease: "circIn"}`; the form-view fade
`{duration: .3, delay: t?.15:0}`; the buttons-view fade with the
animate-internal `{delay: .2}` + component `{duration: .2}`; the four
panel bodies' `panelMotion` — `initial {opacity: 0, y: 20}`, `animate
{opacity: 1, y: 0}`, `exit {opacity: 0, y: -20}`, `transition
{duration: .3, ease: "circOut", delay: .2}`; the tiles' whileHover
scale 1.07 / whileTap .93; and the blobs' three configs (30/35/40 s
mirror loops, delays 0/5/10, easeInOut, identical keyframe arrays).
The clone is byte-identical at every seam.

**Level 2 — the runtime engine.** The reference's motion runtime is the
new WAAPI-hybrid `motion` engine (its vendor bundle carries
`supportedWaapiEasing` with `circOut: cubic-bezier(0.55, 0, 1, 0.45)`,
`circIn: cubic-bezier(0, 0.65, 0.55, 1)` — bezier approximations, NOT
the mathematical circular eases). The clone's `framer-motion@14.0.0`
carries the IDENTICAL easing table (`supportedWaapiEasing` +
`mapEasingToNativeEasing` + `supportsLinearEasing` markers in both) —
the same runtime family, so the per-value animation semantics
resolve identically.

**Level 3 — the measured timelines (rAF precision, both apps).** The
entrance: the overlay expands from the clicked tile's rect over 0.35 s
while its opacity crawls 0.6→1 on a slow ease-in curve (≈0.4 s — an
engine-level per-value resolution, identical on both apps); the
buttons-view fades out ~0.2 s; the form-view mounts after the exit
(mode="wait"), fades 0.3 s after a 0.15 delay; the panel body enters
at translateY(20px) and settles on 0.3 s circOut with a 0.2 delay —
its opacity LAGS the y-offset on both apps (the same engine quirk;
the y completes while the opacity is ≈0.5). The exit: the overlay
shrinks to the tile rect on 0.3 s circIn while its opacity falls on
an ease-out curve; the form-view's exit carries the LAST-RENDERED
0.15 delay (AnimatePresence exit semantics — the exit uses the
element's final-render transition, both apps); the panel body exits
y 0→-20 on 0.3 s circOut + 0.2 delay with the lagging opacity; the
buttons-view re-enters 0.3 s after a 0.2 delay. The container height
jumps INSTANTLY on both apps (the `layout` animation never visibly
runs on either — the height change is content-driven and lands in
one frame on both). **Every measured semantic matches.**

**Level 4 — the WAAPI animation metadata (deterministic).** The
overlay's entrance animation is a native WAAPI animation on BOTH apps
with byte-identical computed timing: `duration: 350, delay: 0, easing:
"cubic-bezier(0.55, 0, 1, 0.45)", iterations: 1, direction: "normal",
fill: "both"` — a jitter-free pin surface for the suite.

**One divergence — BL-1 (Medium): the second background blob renders
visible on the clone; INVISIBLE on the reference.** The reference's
blob layer (`A_e`) ships its second blob with `w-100 h-100` — classes
that DO NOT EXIST in its Tailwind v3-scale build (its 863 KB
stylesheet contains `.w-96{width:24rem}` but NO `.w-100` rule — v3's
scale stops at 96). The dead class leaves an absolutely-positioned,
content-less div at auto width → **0×0 → invisible** (the measured
reference rect is 0×0; the indigo/purple blob never renders). The
clone's `w-[400px] h-[400px]` renders a live 400 px drifting blob —
a visual the reference does not show. The icon_sm dead-variant ruling
(session 6, P-7) applies: the reference's dead class is mirrored by
its RENDERED effect, not by copying the class string (the clone's v4
engine would generate `w-100` as 400 px via the dynamic spacing scale
— copying the string would NOT mirror the rendering).

No other defects: the first/third blobs' classes resolve identically
(w-96/w-80, rules present in both stylesheets); the blobs' gradient
endpoints are the same colors with the same alphas (the clone's
oklab-vs-sRGB midtone serialization is the documented ADR-04
acceptance, previously ruled for the canvas and now confirmed on the
blob layer); the container-height difference measured during the pass
(clone 358 vs reference 280 idle) is DATA-DRIVEN — the row's default
stretch grows the QuickActions card to its taller SkillsMap sibling
(populated with today's seed tasks on the clone; the reference's
account has no tasks today → its SkillsMap renders the 280 px empty
state) — structurally identical, ruled styling-parity-by-data.

## 3. The pin gap

The animation-timing contract was verified live but UNPINNED — the
same class as session-17's VP-1 and session-18's FT-1: the existing
dashboard pins cover the settled states (gradient morph, heading
swap, panel content) but no spec pins the timing semantics (the 350 ms
circOut overlay expansion, the y-offset entrance with its 0.2 delay,
the exit's last-rendered 0.15 delay). A future edit to
`QuickActions.tsx`'s motion configs would pass every existing spec.
The remediation adds the pin family (e2e + source pins) plus the BL-1
blob fix — see `docs/remediation-plan-session19.md`.

## 4. Environment notes

- The workspace was RESET between sessions again — the documented
  bootstrap (`cp .env.example .env` · `bun install` · `db:push` ·
  `db:seed`) ran clean; the db-path v3 contract held (the repo's own
  `.env` authoritative; `DATABASE_URL="file:../db/custom.db"` resolves
  to `<repo>/db/custom.db`).
- The cold dev server's first-route compile can swallow a login probe
  (the session-18 lesson, re-met): wait for the email input to be
  VISIBLE, settle ~1.5 s for hydration, then fill — the login lands
  reliably. The dev-server spawn must still drain the pipes and kill
  the whole process group (`process.kill(-pid)` with `detached: true`).
- The reference's tile label is "Start Focus Timer" (the QUICK_ACTIONS
  array label) — the panel header renders the full label; icon-only
  buttons on the reference are located via `button:has(svg.lucide-*)`.
- `page.click` actionability adds ~50–250 ms before the handler fires;
  timing analyses anchor on the first observable frame, not the click
  call.
- The rAF sampler must stay lightweight (cached queries, no querySelectorAll
  scans per frame) — the first harness variant ran at 15–20 fps from
  per-frame h3 scans and missed the sub-100 ms curve detail; the
  optimized sampler hits the same rate from getComputedStyle recalc
  cost but captures the full curve shape.

## 5. Knowledge carried forward

- **The four evidence levels for motion parity**: config decompile
  (byte-exact source), runtime engine (the easing table + WAAPI
  markers), measured timelines (rAF sampling on both apps), and the
  WAAPI animation METADATA (`getAnimations()` → `effect.getComputedTiming()`
  — duration/delay/easing as deterministic data, jitter-free). The
  metadata level is the pin surface: it asserts the animation's
  declared timing without racing the curve.
- **The reference's motion engine is the WAAPI-hybrid `motion` runtime,
  and `framer-motion@14.0.0` is the same family** — identical
  `supportedWaapiEasing` tables (circOut IS
  `cubic-bezier(0.55, 0, 1, 0.45)` in both, not the mathematical
  circular ease). This closes the "which framer-motion version" question
  the way recharts 2.15 and lucide 0.475 were closed: the measured
  runtime is the pin.
- **AnimatePresence exit semantics carry the LAST-RENDERED
  transition** — the form-view's exit runs with `delay: 0.15` because
  the element's final render had `activeId` set; the `t?.15:0`
  ternary is dead code on the exit path. Both apps behave
  identically (measured) because both ship the same expression.
- **A dead class in the reference's v3 scale can be LIVE in the
  clone's v4 dynamic-spacing scale** (`w-100` → 400 px): mirroring a
  dead variant means mirroring the RENDERED effect (0×0), never
  copying the class string. The icon_sm ruling generalized to the
  blob layer (BL-1).
- **The blob/canvas gradient oklab-vs-sRGB midtone drift is the
  documented ADR-04 acceptance** — the endpoint colors and alphas are
  identical; only the interpolation serialization differs (rgba vs
  lab), ruled subtle-and-acceptable for background gradients (the
  Quick Action tiles keep the reference's inline-hex form).

**Suggested session-20 targets:** the audit frontier remains closed
on the entity wire, the layout bands, the Focus Timer's timed
interactions, and (after this session) the framer-motion animation
family. Remaining candidates: (a) the reference's SETTINGS/PROFILE
page deep-diff (static parity surfaces, never state-matched at
populated-data depth), (b) the AI-summary card's populated-state
diff (both LLMs rendered live side-by-side), or (c) any surface the
operator prefers.
