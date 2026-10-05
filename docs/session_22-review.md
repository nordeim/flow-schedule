# Session 22 Review — FlowSchedule (2026-10-06)

Review + remediation session over base `main @ 3d0f43e` (the session-21
remediation `fb1d29c` — the Planning handler-parity pass S21-F1 + the
matched-data raster diff closure — plus the operator's `docs/session_22.md`
narrative commit) on a FRESHLY CLONED workspace (the prior environment was
reset; the bootstrap chain re-ran: `.env` from `.env.example` with
`DATABASE_URL="file:../db/custom.db"` and a fresh `AUTH_SECRET`, `db/`
created at the repo root, `bun install`, `db:push`, `db:seed`). The
reviewer's plan for this session: `docs/remediation-plan-session22.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD v1.0, flow-schedule_SKILL
  v2.10.0) against the tree — aligned; the full gates re-executed green at
  base on the fresh workspace: lint ✓ · typecheck ✓ · 159/159 unit ·
  build ✓ (19 routes) · **90/90 e2e** (3.0 m; the log's 429s are the
  documented LLM fallback path, not an incident).
- The session-21 remediation commit (`fb1d29c`) audited at source level:
  the Planning page mirrors `eSe` (no dialog state, no handler — verified
  in `src/app/(app)/Planning/page.tsx`), the no-op pin + the relocated
  W-3/W-4 dashboard pin present in the spec files. Clean.
- Workspace environment contracts re-verified: `DATABASE_URL` resolves to
  the repo-root `db/custom.db` (the db-path v3 authority rule —
  `tests/db-path.test.ts` green), `vitest.config.ts` (includes only
  `src/` + `tests/`), `playwright.config.ts` (production standalone :3100,
  its own `db/e2e.db`, single storageState login), `eslint`/`tsconfig`
  both exclude `skills/` — the skills folder is out of the code-checking
  surface per the operating instructions.
- The reference-account hygiene re-list at session START (the
  verify-don't-trust rule, full bodies captured via the entity dump):
  **9 parity tasks + 3 notes, 0 leftovers** (NullSurf S12 Probe,
  NullEndTime Probe A — both unscheduled; Top5 Parity D/E/F/G;
  Log Activity Parity A/B/C). Identical to the standing state.
- **The mobile navigation menu (the standing user priority) re-measured
  LIVE on BOTH apps at 390×844** (trusted Playwright clicks, animation
  settled): trigger 338/14/36×36 right 374, menu 182/54/192×164 right
  374, items [Profile, Settings, Logout], `animation-name: enter` —
  **byte-identical, no Tailwind v4 regression** (the e2e
  mobile-navigation family also green in the base run).
- **The matched-state raster diff extended to the surfaces the session-21
  review suggested** — the reference's 9 exact task bodies recreated on
  a clone scratch user (same email → same avatar initial), blobs hidden
  identically, WAAPI pulse indicators phase-aligned:
  - **/Planning: 0.057%** (noise, no hot cells — matches session-21's
    number),
  - **/Profile: 0.009% · /Settings: 0.009%** (essentially identical —
    the session-22 (a) candidate closed),
  - **/Dashboard: 3.697%** — every hot cell inside the two LLM-content
    cards (the reference's live InvokeLLM quote/summary wording vs the
    clone's deterministic fallbacks — the documented never-hard-fail
    contract; both cards' class structures byte-identical),
  - **/login error state: 2.948%** — NOT the alert (text + classes
    byte-identical, DOM-probed) — the card GEOMETRY (see S22-F1/F2),
  - **/login reset-sent state: 3.539%** — the documented session-5
    alert-text divergence (the Google-notice pattern: honest self-hosted
    content) plus the same geometry drift.
- The TaskDialog field geometry probed LIVE on BOTH apps (the
  calendar-cell entry — the reference's one true dialog path): the
  reference's label→input gaps measure **12px on all six field pairs**;
  the clone's measure **4px** (see S22-F1).
- Skills used (the repo `skills/` catalog): `agent-browser` (the
  reference-driving pattern), `clone-app-pat-pro` (measured facts — the
  live probes and raster diff are the ground truth), `tdd` /
  `tdd-workflow` (red → green → mutation), `tailwind-patterns` (the v4
  @theme/engine discipline), `code-review-and-audit` (the tiered review
  pipeline), `e2e-testing-lessons` (the geometry-pin discipline).

## 2. The findings

### S22-F1 (High, visual): v4's space-y margin lands on the INLINE label — vertical margins on inline boxes are IGNORED, so every label→field gap collapsed

The classic-shadcn field pattern is
`<div class="space-y-1.5"><label …/><div class="relative">input…</div></div>`
(login, session-5 measured) and
`<div class="space-y-2"><label …/><input/button…/></div>` (TaskDialog).
The `<label>` renders **display: inline** (both the login's FieldLabel
and the ui/label classic form carry no display utility — verified on both
apps' computed styles).

- **v3 (the reference)**: `.space-y-N > :not([hidden]) ~ :not([hidden])`
  puts `margin-top` on the FOLLOWING sibling (the input wrapper — a
  block): the gap = line-box leading + 6px (login) / 8px (dialog).
- **v4 (the clone)**: `:where(.space-y-N > :not(:last-child))` puts
  `margin-block-end` on the PRECEDING child — **the label**. Vertical
  margins on non-replaced inline boxes are IGNORED per CSS — the margin
  is computed (6px, visible in getComputedStyle) but produces NO layout
  effect. The gap collapses to the line-box leading alone.

Live-measured on BOTH apps (1440×900, same browser):

| Surface | Reference gap | Clone gap | Loss |
|---|---|---|---|
| login sign-in (Email, Password) | 10px × 2 | 4px × 2 | 6px/field |
| login sign-up (Email, Password, Confirm) | 10px × 3 | 4px × 3 | 6px/field |
| login forgot (Email) | 10px × 1 | 4px × 1 | 6px/field |
| TaskDialog (Title, Description, Priority, Category, Start, Duration) | 12px × 6 | 4px × 6 | 8px/field |

Card geometry: the sign-in card is 12px shorter than the reference's
(746 → 734 at the clean state), the sign-up 34px shorter (combined with
S22-F2), the forgot 30px shorter (combined with S22-F2). The reference's
label DOM (classes, inline display, line-height 20px) is byte-identical
on the clone — the divergence is purely the ENGINE's margin-side rewrite
landing on an inline box. This is a NEW class of the documented Trap 4
(the repo rule covered the specificity flip, not the inline-box
nullification).

### S22-F2 (High, visual): the BackToSignIn `-mb-2` beats v4's zero-specificity space-y margin — the view headings rise into the back-link's band (the documented Trap 4, live on two views)

The sign-up and forgot views open with the reference's back-link
(`flex items-center gap-2 text-sm … -mb-2` — the session-5 measured
classes) inside `space-y-4` (sign-up) / `space-y-4 sm:space-y-6`
(forgot).

- **v3 (the reference)**: the FOLLOWING h2 carries `margin-top: 16px`
  (24px at sm+ for the forgot view); normal-flow sibling margin
  COLLAPSING with the button's own `-mb-2` (−8) sums to an effective
  8px (sign-up) / 16px (forgot, ≥sm) gap — the reference's measured
  geometry: h2 at button-bottom +8 / +16.
- **v4 (the clone)**: the space-y margin lands as `margin-block-end` on
  the BUTTON at `:where()` ZERO specificity — the button's own `-mb-2`
  (0,1,0) WINS, the h2 gets no margin, and the heading sits 8px ABOVE
  the button's bottom edge (overlapping its vertical band): 16px/24px
  higher than the reference.

This is precisely the documented Trap 4 pattern ("a child's own mt/mb
WINS where v3 overrode it") — the repo rule claims "no space-y container
carries children with explicit mt/mb utilities", but the session-5
login build shipped the reference's own `-mb-2` inside space-y-4
undetected: the class-tree diffs matched (the classes ARE the
reference's), and no geometry pin existed for these views. The
clone's own copy of the reference's classes is faithful — the engine
renders them differently.

### Non-findings (verified, no action)

- **The mobile navigation menu**: byte-identical on both apps at
  390×844 (all five measurements + the animation name) — the standing
  user priority, re-verified. No Tailwind v4 regression.
- **The reset-sent alert text divergence**: documented session-5
  ruling (the Google-notice pattern — the clone cannot send mail, so
  the alert carries honest self-hosted content in the reference's
  chrome). The view's other geometry (h2/p positions, alert position)
  is byte-identical; the card-height delta (+20px) is exactly the
  alert's extra text line.
- **The login error alert**: text + classes byte-identical on both
  apps ("Invalid email or password", the bg-red-50/70 rounded-xl
  chrome).
- **The Dashboard raster diff (3.697%)**: entirely inside the
  DailyFocus + AISummary cards — the nature-of-LLM region (the
  reference's live InvokeLLM content vs the clone's deterministic
  fallbacks, the documented never-hard-fail contract). Zero residual
  divergence in the calendar grid, task blocks, Quick Actions,
  StatusCard, SkillsMap (both "No activities today" at the matched
  empty day), or the header.
- **Profile/Settings/Planning rasters**: 0.009% / 0.009% / 0.057% —
  noise-level, full content parity.
- **The seed/db/workspace contracts**: `db/custom.db` at the repo root,
  `.env` authoritative, `.env.example` matching the codebase contract
  (the env-example unit test is green), vitest + playwright configs
  verified.

## 3. The pin gap

No geometry pin exists for the login views or the dialog fields — the
session-5 login work pinned classes/text (the class-tree diff), and the
dialog pins covered form behavior, not field spacing. The raster diff
(the session-21 catch-all, extended this session to the login states)
is what surfaced the drift: class parity does NOT imply geometry parity
when the utility engine's selector semantics differ between v3 and v4.
The remediation adds computed-geometry pins for both surfaces (the
label→field gaps on all four login views + the dialog's six pairs) and
a source pin for the compat rules themselves.

## 4. Environment notes

- The workspace was RESET between sessions — the bootstrap chain ran
  fresh (clone → .env → install → db:push → db:seed) and the full base
  gate re-verified green before any audit work.
- Bun cannot drive Playwright's request API context in this environment
  (a `Serialized error` interop failure — reproduced twice); the probe
  harness scripts run under `node` (the repo's `node_modules` resolve
  them). The e2e suite itself runs under `bun run test:e2e` unchanged.
- The first raster-capture run INVENTED task bodies (the probe output
  had truncated the entity list — "NullEndTime Probe A" got a phantom
  `start_time`), producing a phantom SkillsMap/AI-summary divergence.
  The harness was fixed to dump the FULL captured bodies first
  (`research/session22-entity-dump.mjs`) and re-run — the phantom
  disappeared. Matched-data discipline: the bodies must come from the
  wire dump verbatim, never from recall.
- The reference's Planning day cards show only "Log Activity Parity C"
  this week — correct (the other 8 parity tasks live on prior weeks;
  the calendar renders the current week).

## 5. Knowledge carried forward

- **Trap 4 has a second face (S22-F1)**: v4's space-y margin-block-end
  is IGNORED on inline children (labels). The documented rule ("no
  child mt/mb utilities") covered the specificity flip; the inline-box
  nullification is the same rule's other failure mode. Class-tree
  parity cannot catch it — only computed geometry can.
- **The reference's own negative margins are engine-sensitive
  (S22-F2)**: `-mb-2` inside space-y-4 was designed for v3's
  margin-top-on-following-sibling + margin collapsing. Copying the
  class byte-for-byte under v4 inverts the arithmetic. Faithful classes
  ≠ faithful rendering — the engine is part of the contract.
- **Raster diffs on the login states are cheap and decisive** — 22
  sessions of dashboard/planning rasters never covered the auth views;
  the operator's "look out for TailwindCSS v4 related bug" flag was
  answered on a surface nobody had pixel-diffed.
- **Matched-data raster discipline (the harness lesson)**: dump the
  full entity bodies from the wire BEFORE building the clone's matched
  state; a truncated capture is worse than no capture (it fabricates
  divergences).

**Suggested session-23 targets**: the audit frontier is now closed on
the login/dialog geometry in addition to everything session-21 closed.
Remaining candidates: (a) the sign-up ERROR-state geometry (the
mismatch alert inside the sign-up form at matched state), (b) the
mobile login/dialog geometry pins at 390px (the current pins run at
the desktop viewport), or (c) any surface the operator prefers.
