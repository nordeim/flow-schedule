# Remediation Plan — Session 22 (2026-10-06)

Session-22 review of the FlowSchedule clone (base commit `3d0f43e` — the
session-21 remediation `fb1d29c` plus the operator's `docs/session_22.md`
narrative commit; a freshly cloned workspace re-bootstrapped and
re-verified per `docs/session_22-review.md` §4). The `skills/` folder is
excluded from code checking, testing and compilation per the operating
instructions (eslint ignores `skills`, tsconfig excludes `skills`,
vitest includes only `src/` + `tests/` — re-verified via the green base
gate: lint ✓ · tsc ✓ · 159/159 unit · build (19 routes) · 90/90 e2e).

Skills used this session: `agent-browser` (the reference-driving
pattern), `clone-app-pat-pro` (measured facts — the live geometry probes
on BOTH apps are the ground truth), `tdd` / `tdd-workflow` (red → green
→ mutation evidence), `tailwind-patterns` (the v4 engine discipline),
`code-review-and-audit` (the tiered review pipeline),
`e2e-testing-lessons` (geometry-pin discipline: assert computed layout,
not class strings).

## 1. Audit scope and method

The session-21 review §5 suggested the remaining raster-diff candidates
(the /Profile + /Settings close + the login populated states). This
session executed them at matched state, plus the standing disciplines.

| Surface | Method | Result |
|---|---|---|
| Workspace (fresh clone, bootstrapped) | Full base gate | ✅ lint ✓ · typecheck ✓ · 159/159 unit · build (19 routes) · 90/90 e2e (3.0 m) |
| The session-21 remediation commit (`fb1d29c`) | Source-level audit (Planning page + both spec families) | ✅ clean — mirrors `eSe` |
| The reference-account hygiene | Full entity dump at session START (tasks + notes, complete bodies) | ✅ 9 parity tasks + 3 notes, 0 leftovers |
| **The mobile menu (the standing user priority)** | Live re-measure on BOTH apps at 390×844 | ✅ byte-identical (trigger 338/14/36×36 right 374; menu 182/54/192×164 right 374; items [Profile, Settings, Logout]; `animation-name: enter`) — **no Tailwind v4 regression** |
| The matched-state raster diff (the §5 candidates) | The reference's 9 exact task bodies recreated on a scratch clone user; blobs hidden identically; pulses phase-aligned; 6 surfaces | ✅ Planning 0.057% (noise) · Profile 0.009% · Settings 0.009% · Dashboard 3.697% (all inside the LLM cards) · ❌ **login-error 2.948% + login-reset 3.539% → S22-F1/S22-F2** |
| The TaskDialog field geometry | Live probe on BOTH apps (calendar-cell entry) | ❌ **S22-F1** — the reference's 6 label→field gaps measure 12px; the clone's 4px |
| The login views' geometry | Live probe on BOTH apps (sign-in / sign-up / forgot, clean + error states) | ❌ **S22-F1 + S22-F2** — gaps 10px vs 4px; the h2 geometry 16/24px off on sign-up/forgot |
| The login alerts (error + reset) | DOM probe (text + classes) on BOTH apps | ✅ error byte-identical; reset = the documented session-5 alert-text ruling (Google-notice pattern) |

## 2. Issues, bugs and gaps found

TWO related visual defects, both Tailwind v4 space-y engine drift, both
live-measured on both apps. Zero functional defects. Zero functional
Tailwind regressions elsewhere (the mobile menu is byte-identical).

### S22-F1 (High): the inline-label space-y collapse — 12 label→field gaps

`<div class="space-y-1.5"><label/><div class="relative">input</div></div>`
(login × 6 fields) and `<div class="space-y-2"><label/><input|button/></div>`
(TaskDialog × 6 fields). The label renders `display: inline`; v4's
`:where(.space-y-N > :not(:last-child)) { margin-block-end }` lands the
margin on the label, where CSS ignores vertical margins on inline boxes
— the gap collapses to the line-box leading (4px). v3 put `margin-top`
on the FOLLOWING block sibling (effective). Measured: reference 10px
(login) / 12px (dialog) per field; clone 4px. Card heights 12/34/30px
short (login views); the dialog correspondingly shorter.

### S22-F2 (High): the BackToSignIn `-mb-2` specificity flip — 2 view headers

The reference's back-link (`… -mb-2`, session-5 measured) inside
`space-y-4` (sign-up) / `space-y-4 sm:space-y-6` (forgot). v3: the h2's
`margin-top` (16 / 24 at sm+) collapses with the button's `-mb-2` →
effective gap 8 / 16px. v4: the `:where()` zero-specificity margin
loses to the button's own `-mb-2` → the h2 gets no margin and sits 8px
ABOVE the button's bottom (16/24px higher than the reference).

### Root-cause class (both)

The engine, not the DOM: the clone's class strings are byte-identical
to the reference's captured DOM (verified). Tailwind v4 rewrote the
space-y selector semantics (margin side + `:where()` specificity +
`:not(:last-child)` targeting) — two failure modes: (a) the margin
lands on an inline box (ignored — S22-F1), (b) the margin lands where
a child's own negative utility overrides it (S22-F2). The documented
Trap 4 rule ("no space-y container with children that carry explicit
mt/mb utilities") covered (b)'s specificity half only.

## 3. The remediation — TDD execution plan

### The fix (GREEN target): v3-compat rules in `globals.css`

CSS-only, appended to the Trap 4 guardrail block — **the DOM stays
byte-identical** (class parity preserved; the repo's own precedent: the
preflight `cursor: pointer` restore, the `--shadow-sm` pin):

```css
/* Trap 4b (session 22, S22-F1): v4's space-y margin-block-end lands on
   the INLINE <label> (the classic shadcn field pattern), where CSS
   ignores vertical margins — the label→field gap collapses to the
   line-box leading. Restore v3's margin-top on the FOLLOWING sibling.
   Scoped: the only label-children space-y containers in the app are
   the login fields (space-y-1.5) and the TaskDialog fields (space-y-2). */
.space-y-1\.5 > label + * { margin-block-start: 0.375rem; }
.space-y-2 > label + * { margin-block-start: 0.5rem; }

/* Trap 4c (session 22, S22-F2): the back-link's own -mb-2 (the
   reference's class) beat v4's :where() margin; v3's margin-top on the
   FOLLOWING h2 margin-collapsed with it (16-8 / 24-8 = 8 / 16px
   effective). Restore the margin on the following sibling — normal-flow
   sibling collapsing reproduces the reference's arithmetic exactly. */
.space-y-4 > .-mb-2 + * { margin-block-start: 1rem; }
@media (min-width: 40rem) {
  .sm\:space-y-6 > .-mb-2 + * { margin-block-start: 1.5rem; }
}
```

Validation of the selectors against the codebase (the plan-vs-tree
check):
- `.space-y-1\.5 > label + *` — the only `space-y-1.5` containers with
  a `<label>` child are the login field pairs (6: sign-in ×2, sign-up
  ×3, forgot ×1; verified by grep — FieldLabel is used nowhere else);
  the other `space-y-1.5` containers (WeeklySchedule day rows,
  Planning chips) carry div children only.
- `.space-y-2 > label + *` — the only `space-y-2` containers with a
  `<label>` child are the TaskDialog field pairs (6); SkillsMap's
  legend, not-found, and the login headers use non-label children.
- `.-mb-2 + *` inside space-y — the BackToSignIn component is the only
  `-mb-2` usage in src/ (grep-verified); it renders first inside
  `space-y-4` (sign-up) and `space-y-4 sm:space-y-6` (forgot).
- Specificity: all four selectors are plain (≥ (0,1,1)) vs v4's
  `:where()` (0,0,0) — they win; no `!important` needed. The label's
  own v4 `margin-block-end` stays computed-but-ignored (inline) — no
  double-margin risk. The `sm:` media rule must follow the base rule in
  source order (equal specificity at ≥40rem, where both match the
  forgot view's container).
- The built CSS was inspected: v4 emits exactly
  `:where(.space-y-1\.5 > :not(:last-child))` etc. — the compat rules
  override the effective `margin-block-start: 0` they set on following
  siblings.

### T-1 RED: the pins land FIRST (must fail at base)

**`tests/e2e/auth.spec.ts`** — ADD **"login field geometry matches the
reference (S22-F1/S22-F2)"** (desktop viewport, logged-out surface —
auth.spec opts out of storageState):
- sign-in view: both label→input gaps = 10px (±1);
- sign-up view: all three gaps = 10px (±1); the h2 sits 8px (±1) below
  the back-link's bottom edge;
- forgot view: the gap = 10px (±1); the h2 sits 16px (±1) below the
  back-link's bottom (the ≥sm space-y-6 variant);
- measured via `getBoundingClientRect` on the label + its
  nextElementSibling (the computed-geometry contract, not class
  strings);
RED at base: gaps measure 4px (S21-F1) and the h2 offsets −8px (S22-F2).

**`tests/e2e/dashboard.spec.ts`** — ADD **"task dialog field geometry
matches the reference (S22-F1)"** (the calendar-cell entry path):
- open the dialog via the "Add task on … at 10:00" cell button;
- all six label→next-sibling gaps = 12px (±1);
RED at base: the gaps measure 4px.

**`tests/space-y-compat.test.ts`** (new unit file) — the SOURCE pin
(the ai-prompt/panel-motion pattern): reads `src/app/globals.css` and
asserts the four compat rules exist with the exact margin values
(0.375rem / 0.5rem / 1rem / 1.5rem + the 40rem media query). RED at
base: the rules don't exist yet.

### The fix (GREEN)

`src/app/globals.css` — append the four rules to the Trap 4 guardrail
block (the comment updates to document Trap 4b/4c). No other source
file changes. No DOM/class changes anywhere.

### T-2 MUTATION (the sensitivity evidence; harness outside the repo
at `/home/z/my-project/scripts/mutate-space-y-compat.mjs`, ONE canonical
backup per file, production rebuild per mutation, the pin suites re-run
after the harness proves the tree restored):
- **M-1** (the label rules removed) → RED the login + dialog gap pins
  (surgical — back to 4px);
- **M-2** (the `-mb-2` rules removed) → RED the sign-up/forgot h2 pins;
- **M-3** (the dialog rule's value changed 0.5rem → 0.375rem) → RED the
  dialog gap pin (12px → 10px);
- **M-4** (the sm: media value changed 1.5rem → 1rem) → RED the forgot
  h2 pin (16px → 8px at desktop).

### T-3 GATE: the full consecutive gate

lint · typecheck · unit (159 + the new source pin ≈ 165) · build (19
routes) · e2e ×2 consecutive (90 + 2 new specs = 92).

### T-4 LIVE: the re-probe on the remediated clone + the raster re-run

- The geometry probes re-run against the rebuilt standalone: the login
  gaps 10px (±0 measured), the dialog gaps 12px, the h2 offsets 8/16px
  — byte-matching the reference's captured numbers.
- The raster capture + diff re-run: login-error drops to noise; the
  other surfaces unchanged (Planning/Profile/Settings noise; Dashboard
  LLM-region only; login-reset keeps the documented alert-text
  divergence).
- The reference-account hygiene re-list at session END (the probes
  create no entities; the clone scratch user's tasks are wiped from
  `db/e2e.db` — converging cleanup).

### T-5 SCREENSHOTS: the 22-capture family re-run on the remediated
codebase (the dev server; `scripts/capture-screenshots.mjs`) — the
login captures (01/16/17/18/20) + the task-dialog capture (15) now
render the reference's field geometry; the whole family re-captured
fresh per the standing discipline.

### T-6 DOCS: SKILL v2.11.0 (FS-34 — the engine-parity ruling: class
parity ≠ geometry parity; the two new Trap 4 faces; the computed-
geometry pin method), README (the login feature row + the test-pyramid
rows + counts), CLAUDE (the Tailwind v4 section's trap list + the
counts), AGENTS (the framework-quirks entry + the counts), PAD (§5.4's
trap table rows 7/8 + the session-22 ledger rows + §8 counts), the
session_22-review.md, this plan's execution record, the worklog.

### T-7 PUSH: commit on main (only main, no new branches) + the SSH
wrapper push (`docs/ssh_git_wrapper_v3.py --remote
git@github.com:nordeim/flow-schedule.git` per
`docs/how-to-git-push-using-ssh-wrapper_SKILL.md`) + the operator key
shredded after. `.env.example` (unchanged, contract-verified) is
included in the commit per the standing requirement.

## 4. Validation of this plan against the codebase

- The broken patterns enumerated exhaustively: `rg "<Label|FieldLabel"
  src/` → login/page.tsx (FieldLabel, 6 field pairs) + TaskDialog.tsx
  (Label, 6 field pairs) — no other label usage in src/.
- The label's inline display verified on BOTH apps (computed styles:
  `display: inline`, `line-height: 20px` — the login FieldLabel and the
  ui/label classic form carry no display utility).
- The v4 rule verified in the built CSS:
  `:where(.space-y-1\.5>:not(:last-child))` sets `margin-block-start: 0`
  (reverse=0) and `margin-block-end: 0.375rem` — the compat rules'
  `margin-block-start` overrides the 0 at (0,1,2) > (0,0,0).
- The `-mb-2` selector verified: the built CSS escapes the class as
  `.-mb-2` (a valid CSS identifier — leading hyphen + letter).
- The reference's exact geometry captured this session (the tables in
  `docs/session_22-review.md` §2) — the pin values (10/12px gaps, 8/16px
  h2 offsets) come from the live reference measurements, not inference.
- The reference's view-header arithmetic verified: v3 margin-top
  (16/24) + the button's −mb-2 collapse (sum: 8/16) = the measured
  reference offsets — the compat rules reproduce it under v4 (same
  collapse semantics in normal flow; the containers are plain block
  divs, not flex).
- The blast-radius check: the compat selectors match ONLY the intended
  elements (grep-verified: no other `space-y-1.5`/`space-y-2` container
  has a label child; no other `-mb-2` exists in src/); the mobile-menu
  geometry spec (the Trap 4 guardrail pin) runs in the same e2e suite
  and must stay green.
- The rate-limiter constraint verified: the new specs perform ZERO
  real logins (auth.spec's logged-out surface; the dialog spec uses the
  storageState pattern).
- The raster harness's entity discipline fixed this session (the full
  body dump before the matched-state build — the session-22 review §4
  lesson).

## 5. Execution record (appended after T-7)

## 6. Execution record (2026-10-06, appended after T-7 prep)

Every step of §3 executed and verified:

- **The audit** (§1–§2): the session-21 §5 targets executed — the
  /Profile + /Settings raster close (0.009% both) and the login
  populated-state raster diff (error 2.948% / reset 3.539% — the reset
  delta is the documented session-5 alert-text ruling; the error delta
  was NOT the alert: text + classes byte-identical, DOM-probed). The
  mobile menu re-measured live on BOTH apps at 390×844: byte-identical
  (trigger 338/14/36×36 right 374; menu 182/54/192×164 right 374; items
  [Profile, Settings, Logout]; animation-name enter) — the standing
  user priority, NO Tailwind v4 regression. **S22-F1 + S22-F2 found**
  at the DOM-geometry level (live probes on both apps, all 12 field
  pairs + both view headers + the Select-pair inflation).
- **T-1 RED**: `tests/e2e/auth.spec.ts` gained the 3-spec login field
  geometry family; `tests/e2e/dashboard.spec.ts` gained the dialog
  field-geometry spec; `tests/space-y-compat.test.ts` (5 source pins —
  a 6th added with the Select-mb rule). All RED at base exactly as
  predicted (gaps 4 ≠ 10/12; the h2 offsets −8 ≠ 8/16; the rules
  absent).
- **The fix (GREEN)**: `src/app/globals.css` — the four v3-compat
  rules (the label pairs, the Select-mb zero, the back-link h2 margin
  + the sm: media variant). The DOM stayed byte-identical (the class
  strings untouched — the pinned-cursor/-shadow-sm precedent).
  GREEN: unit 165/165; the geometry families green.
- **T-2 MUTATION**: M-1 (the label rules removed) → RED all 4 geometry
  specs; M-2 (the -mb-2 rules removed) → RED exactly the sign-up +
  forgot specs (the h2 pins); M-3 (the dialog value 0.5rem → 0.375rem)
  → RED exactly the dialog spec; M-4 (the sm: media 1.5rem → 1rem) →
  RED exactly the forgot spec; **M-5** (the Select-mb rule removed —
  added when the live T-4 probe surfaced the residual 8px Select-field
  inflation) → RED the dialog-height pin. Restore checksum-verified;
  the pin suites green post-restore.
- **T-3 GATE**: the full consecutive gate — lint ✓ · typecheck ✓ ·
  **165/165 unit** (159 → 165: +6 source pins) · build (19 routes) ·
  **94/94 e2e × 2 consecutive** (3.1 m + 3.1 m; 90 → 94).
- **T-4 LIVE**: the geometry probes re-run against the rebuilt
  standalone — the login cards byte-match the reference (sign-in
  y77 h746 gaps [10,10]; sign-up y215 h470 gaps [10,10,10] + the h2
  offset 8; forgot y263 h374 gaps [10] + the h2 offset 16); the
  dialog internals byte-match (h 526 = 526, every element y/h
  identical). The raster re-run: **login-error 2.948% → 0.098%**
  (noise); the other surfaces unchanged (Planning 0.057%,
  Profile/Settings 0.009%, Dashboard 0.715% all inside the LLM
  cards, login-reset keeps the documented alert-text ruling). The
  reference-account hygiene re-list at END: 9 parity tasks (+3 notes
  from the START dump), 0 leftovers; the raster scratch user's tasks
  deleted from db/e2e.db.
- **T-5 SCREENSHOTS**: all 22 captures re-run on the remediated
  codebase (the dev server; `scripts/capture-screenshots.mjs`) — the
  login captures (01/16/17/18/20) + the task-dialog capture (15)
  now render the reference's field geometry.
- **T-6 DOCS**: SKILL v2.11.0 (FS-34 — the class-parity-is-not-
  geometry-parity ruling + the three v4 failure modes + the
  computed-geometry pin method; the §3 counts; the changelog),
  README (the test-pyramid rows + counts + the geometry pin family),
  CLAUDE (the Tailwind v4 section's field-geometry ruling + the
  counts), AGENTS (the framework-quirks entry + the §1 count + the
  session-22 reference), PAD (§5.4 rows 4b/4c + §8 counts + the five
  session-22 ledger rows), the session_22-review.md, this execution
  record, the worklog.
- **T-7 PUSH**: commit on main + the SSH wrapper push.

Harness lesson recorded (the review §4): the first raster run
INVENTED task bodies (the truncated capture gave "NullEndTime Probe
A" a phantom start_time, fabricating a SkillsMap/AI-summary
divergence) — matched-data discipline requires the FULL wire dump
before building the matched state. A second lesson: rebuilding
`.next/standalone` under a live server silently corrupts the reused
e2e webServer (the 25-failure run) — always `pkill` the standalone
before `bun run build` when the e2e suite may reuse :3100.

Reference-account state at session end: 9 parity tasks + 3 notes
(the hygiene re-list ran at session START and END; this session's
probes created no entities on the reference).
