# Session 20 Review — FlowSchedule (2026-10-05)

Review + remediation session over base `main @ ab8ddc8` (the session-19
remediation `30bb684` — the framer-motion animation-timing family + the
invisible second blob — plus the operator's docs/session_20.md narrative
commit) on the carried-forward workspace (the review environment survived
this cycle; `.env` intact, `db/` seeded, `node_modules` fresh). The
reviewer's plan for this session: `docs/remediation-plan-session20.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL
  v2.8.0) against the tree — aligned; the full gates re-executed green at
  base (lint ✓ · typecheck ✓ · 153/153 unit · build ✓ (19 routes) ·
  **85/85 e2e** in 2.9 m).
- The session-19 remediation commit (`30bb684`) audited at source level:
  the BL-1 seam in `BackgroundBlobs.tsx` (the second blob carries NO
  width/height utilities — the 0×0 dead-`w-100` mirror, the comment citing
  the measurement) + the 4 e2e pins + 10 source pins green inside the base
  run — clean.
- The reference-account hygiene re-list at session START (the
  verify-don't-trust rule): **9 parity tasks + 3 notes, 0 leftovers**
  (identical to the standing state).
- **The session-19 §5 suggested target (a) executed: the SETTINGS/PROFILE
  deep-diff at populated-data depth** — the full DOM walk (tag, class,
  text, geometry) on BOTH apps at 1440×900, logged in with real accounts.
  Result: the structure is **byte-identical** (same container chain
  `p-6 max-w-4xl mx-auto` → `bg-white/60 backdrop-blur-xl rounded-3xl p-8
  shadow-xl border border-white/20`; same 4 Settings cards at identical
  geometry [329,177,782,194]/[329,395,782,114]/[329,533,782,114]/
  [329,671,782,114]; same Profile card with the User glyph at [688,121] and
  the 3 preference cards at [329,297]/[728,297]/[329,459]; identical
  lucide icon sets, texts, and classes). **But the CONTENT-SIZED text
  widths diverge ~15%** — the first surfaces in the app whose geometry
  directly depends on glyph metrics (flex-item h3s: "Theme" 68.3 px
  reference vs 58 px clone; "Performance" 130 vs 110; the AI Summary h3
  109 vs 93). Root cause below — **F-1**.
- The session-19 §5 suggested target (b): the AI-summary card's
  populated-state side-by-side — structure byte-identical (every class
  string matches, the gradient blob, the Brain/Sparkles header, the mood
  gradient box, the chips, the max-h-20 custom-scrollbar insights box);
  the color divergence **C-1** live on its mood text. The LLM-wording
  differences (mood "planning" vs "productive", insight length) are the
  documented nature-of-LLM ruling — the class contract is the pin.
- The mobile navigation menu (the standing user priority) re-measured LIVE
  on BOTH apps at 390×844 (trusted clicks, animation settled): trigger
  338/14/36×36 right 374, menu 182/54/192×164 right 374, items [Profile,
  Settings, Logout], `animation-name: enter` — **byte-identical on both
  apps, no Tailwind v4 regression**.
- A Tailwind-v4 **default-theme drift audit** prompted by the F-1
  discovery: the locked `tailwindcss@4.3.3` (bun.lock has carried it since
  the session-0 build) vs the reference's build, across every theme
  namespace the app uses — spacing ✓, text sizes/line-heights ✓,
  breakpoints ✓, tracking ✓, radius ✓, shadows ✓ (shadow-sm pinned),
  blur ✓, easing/animate ✓, font-serif ✓, font-mono ✓ — **two namespaces
  drift: `--font-sans` (F-1) and the per-step color values for the
  used-but-UNPINNED palette tokens (C-1)**.

## 2. The findings

### F-1 (High): the app's default font stack is Tailwind v4.3.3's v3-compat list — the reference renders the v4.0-era `ui-sans-serif` stack

Measured live on both apps (`getComputedStyle(documentElement).fontFamily`):

- **Reference** (from its own stylesheet's preflight rule, byte-exact):
  `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI
  Emoji", "Segoe UI Symbol", "Noto Color Emoji"` — the **Tailwind
  v4.0-era default `--font-sans`** (the reference's base44 build is a
  v4.0-era pipeline).
- **Clone**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji",
  ...` — **v4.3.3's own default** (verified in
  `node_modules/tailwindcss/theme.css`: v4.3.3 replaced the v4.0 default
  with the v3-compat stack; the bun.lock has pinned 4.3.3 since session 0,
  so the clone's stack NEVER matched the reference's).

The rendered effect: on macOS/Windows both stacks resolve the same system
font (SF Pro / Segoe UI), but on Linux/fontconfig (this box included —
the e2e + screenshots environment) they resolve **different physical
fonts** (DejaVu-class vs Liberation-class metrics), producing the measured
~15% glyph-width drift on every content-sized text surface. The base
stack also feeds `--default-font-family`, so the preflight html rule and
every font-inheriting element render it. The clone never caught it
because all previous geometry pins measured block-level boxes whose
widths are padding/container-driven — the Settings/Profile flex-item h3s
(content-sized) were the first surfaces to expose it.

The mono/serif namespaces are NOT drifted: v4.3.3's `--font-mono`
(`ui-monospace, SFMono-Regular, ...`) is byte-identical to v4.0's AND to
the reference's own `.font-mono` fallback resolution (the reference's
base44 `--font-mono: "Azeret Mono", ...` token is `[data-ds=base44]`-
scoped and undefined at the app root — measured: the app-level `.font-mono`
resolves the same `ui-monospace` stack on both apps).

### C-1 (Medium): 11 of 13 used-but-unpinned palette tokens render v4.3.3's oklch conversions — the reference renders the v3 hexes

The session-0 trap-2 response pinned 58 color tokens (the v3 hexes) for
every scale the app uses — but 13 used tokens were missed. The audit
diffed each one against the reference's own stylesheet values (the
reference emits the v3 hex per utility, e.g. `.text-red-700 { color:
rgb(185 28 28) }`):

| Token | Reference (measured) | Clone (v4.3.3) | Δ max/channel | Renders on |
|---|---|---|---|---|
| red-700 | `rgb(185,28,28)` | `rgb(191,0,15)` | **28 G** | login error alert text |
| purple-700 | `rgb(126,34,206)` | `rgb(130,0,218)` | **34 G** | Planning learning badge |
| pink-700 | `rgb(190,24,93)` = `#be185d` | `rgb(196,0,92)` | **23 G** | Planning creative badge |
| indigo-700 | `rgb(67,56,202)` | `rgb(67,45,215)` | **13 B** | Planning planning badge |
| purple-800 | `rgb(107,33,168)` | `rgb(110,17,176)` | 16 G | AI Summary mood body |
| purple-900 | `rgb(88,28,135)` | `rgb(89,22,139)` | 6 G | AI Summary mood label |
| yellow-700 | `rgb(161,98,7)` | `rgb(163,97,0)` | 7 B | Planning social badge |
| gray-400 | `rgb(156,163,175)` | `rgb(153,161,175)` | 3 R | WeeklySchedule "other" bar |
| gray-500 | `rgb(107,114,128)` | `rgb(106,114,130)` | 2 B | (same gradient stop) |
| green-200 | `rgb(187,247,208)` | `rgb(185,248,207)` | 2 R | login success alert border |
| red-200 | `rgb(254,202,202)` | `rgb(255,202,202)` | 1 R | login error alert border, TaskDialog delete border |
| blue-100 | `rgb(219,234,254)` | `rgb(219,234,254)` | 0 ✓ | AI Summary focus chip |
| pink-50 | `rgb(253,242,248)` | `rgb(253,242,248)` | 0 ✓ | AI Summary mood gradient stop |

The two 0-drift tokens are included for completeness (they match TODAY —
but the pin is a lock against the NEXT minor bump). One nuance the live
pin caught: the reference's pink-700 is `#be185d` — ONE B-unit off the
v3 hex `#be185c` (measured live AND in its stylesheet's own
`.text-pink-700` rule) — the reference's palette is not byte-v3
everywhere, so every pin is the REFERENCE's measured value, not an
assumed v3 lookup. The drift mechanism: v4.3.3 declares the palette in
oklch; the build (and the browser's own oklch rendering — dev and
production measured IDENTICAL computed lab values) gamut-clips to sRGB
differently than v3's authored hexes, most visibly crushing the green
channel out of the saturated purples/reds/pinks. The G-channel deltas
of 16–34 on the mood text, the login alert, and the planning badges
are visible in side-by-side comparison.

### PIN-1 (the guard gap): the "every used token is pinned" invariant was never enforced

The session-0 pinning philosophy ("pin the v3-era token values that v4
would otherwise drift from") covered the scales it enumerated, but no test
asserts **used ⊆ pinned** — the 13-token gap accumulated silently across
19 sessions of new components. The remediation adds the completeness
invariant as a unit pin (scan the source for color-class tokens, assert
each has a `@theme` pin).

### Non-findings (verified, no action)

- The unclassed default border color differs (clone `#e2e8f0` slate-200
  via the shadcn `--border` token vs the reference's v3-preflight
  `#e5e7eb` gray-200) — but every visible bordered surface in the app
  carries an explicit border class (all pinned green across the 85 e2e);
  the default never renders.
- The reference's `[data-ds=base44]` design-system fonts (Wix Madefor
  Text/Display, Dazzed, Azeret Mono) are scoped to base44-internal
  elements and never load for the app's DOM (measured: `document.fonts`
  empty, the app content inherits the preflight stack).
- The AI Summary card's content differences (mood/insights wording,
  insight height 39 vs 20 px) are LLM-driven — the structure and class
  contract are byte-identical; the documented nature-of-LLM ruling.
- The reference's AI-card inner `<style>` block (custom-scrollbar
  styled-jsx) is already mirrored by the globals.css `custom-scrollbar`
  rules (session 4, C-1).

## 3. The pin gap

The font stack and the drifting palette values are unpinned — a future
Tailwind bump (or a `bun.lock` regeneration) would silently re-drift them,
and the existing 85 e2e / 153 unit tests would stay green (the class
strings don't change; only the rendered values do). The computed-value
surfaces (`getComputedStyle` fontFamily/color) have never been pinned
anywhere in the suite. The remediation adds the theme-palette pin family
(e2e computed-value pins + the source pins + the completeness invariant) —
see `docs/remediation-plan-session20.md`.

## 4. Environment notes

- The workspace survived this cycle (no reset) — the bootstrap chain was
  a no-op; the dev server cold-start still requires the email-input
  visible + ~1.5 s settle before filling (the session-18/19 lesson,
  re-met once).
- The reference's post-login URL is the root `/` (not `/dashboard`) —
  probes must `waitForURL(/dashboard|^\//)`.
- The clone's dev server emits oklch() directly (the browser converts at
  render time) while the production standalone carries the
  Lightning-converted hex — **measured identical computed colors on both
  servers** (lab(40.4273 67.2623 53.7441) for red-700 on each), so the
  drift is mode-independent and the production build is the valid pin
  surface.
- The z-ai LLM can 429 mid-session (seen in the e2e webserver logs) — the
  AI cards' fallback content renders the same class contract, so
  computed-color pins are content-independent.
- `bun.lock` has pinned `tailwindcss@4.3.3` since the session-0 commit —
  the drift is a *default-theme* divergence, not a lockfile regression;
  downgrading Tailwind is NOT the fix (the repo's established pattern is
  to pin the reference's measured values in `@theme`).

## 5. Knowledge carried forward

- **Tailwind v4 minor versions drift the DEFAULT theme — pin every token
  the app uses, not just the ones that drifted at session 0.** v4.3.3's
  default `--font-sans` is the v3-compat `-apple-system` list; the
  v4.0-era default (the reference's rendered stack) is the
  `ui-sans-serif, system-ui` list. The oklch palette's build-time
  gamut-clipping also re-derives per-step hexes that differ from the v3
  authored values by up to 34 channels. The complete guard: a unit
  invariant asserting used-color-tokens ⊆ pinned-tokens.
- **The measured font stack IS a parity surface** — computed
  `font-family` strings assert deterministically (no timing, no raster);
  the glyph-metric consequences (content-sized widths) follow from the
  stack and need no separate pin.
- **Block-geometry pins are font-metric-blind** — 19 sessions of
  byte-identical geometry pins never noticed a 15% glyph-width drift
  because the measured boxes were container/padding-sized. Content-sized
  flex items (the Settings h3s) were the exposing surface.
- **Dev's oklch and prod's hex render identically** (both go through the
  browser's sRGB conversion) — the production standalone remains the
  e2e pin surface for color parity, and dev-server probes are valid
  evidence too.
- The reference's base44 design-system fonts are `[data-ds=base44]`-
  scoped and never render for the app DOM — the preflight stack is the
  app's real font contract (mirrors the session-19 finding that the
  reference's motion engine is the app-level runtime, not the platform
  extras).

**Suggested session-21 targets:** the audit frontier is now closed on
the entity wire, the layout bands, the timed interactions, the motion
family, and the theme values. Remaining candidates: (a) a full-page
raster diff (screenshot pixel-compare at matched data state) as a
catch-all for any residual sub-visual divergence, (b) the Planning page's
interactions at multi-week depth (the week navigation across month
boundaries), or (c) any surface the operator prefers.
