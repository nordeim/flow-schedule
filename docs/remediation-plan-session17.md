# Remediation Plan — Session 17 (2026-10-05)

Session-17 review of the FlowSchedule clone (base commit `c86d0e4` —
the session-16 remediation `8bd3a48` plus the operator's
docs/session_17.md narrative commit; `git pull` workspace with `.env` +
seeded `db/` intact). The `skills/` folder is excluded from code
checking, testing and compilation per the operating instructions
(eslint ignores `skills`, tsconfig excludes `skills`, vitest includes
only `src/` + `tests/` — re-verified via the green base gate).

Skills used this session: `agent-browser` (the reference login + live
structure observation pattern), `clone-app-pat-pro` (measured facts,
not preferences — the live multi-viewport captures are the ground
truth), `tdd` / `tdd-workflow` (red → green → mutation evidence),
`code-review-and-audit` (the tiered review pipeline),
`testing-patterns` (the seam-pinning conventions), and the Tailwind v4
trap knowledge in `skills/nextjs16-tailwind4` (re-checked via the
mobile-menu live re-measure — no regression; the new overflow pins add
a v4-responsive-class regression guard).

## 1. Audit scope and method

Session 16's closing suggestion set this session's primary target —
the fresh multi-viewport screenshot diff pass at 390/768/1024/1440 —
plus the standing user priority (the mobile menu) and the
session-16 remediation audit. Method: Playwright drove BOTH apps live
(the reference logged in with the operator's account; the clone's dev
server on 127.0.0.1:3000), capturing at every band: the
header/main/container class inventory, the heading inventory, the
horizontal-overflow metric, PNG screenshots, and (on both apps at
390×844) the mobile-menu geometry with trusted clicks +
animation-settling. The reference's entity wire re-observed on the
fresh login traffic; the reference account's entity list re-verified
at session start (the hygiene rule).

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull` (main `8bd3a48` → `c86d0e4`, adds docs/session_17.md); `.env` re-verified (`DATABASE_URL="file:../db/custom.db"` + AUTH_SECRET); `db/` at the repo root; full base gate re-executed | ✅ lint ✓ · typecheck ✓ · **143/143 unit** · build ✓ (19 routes) · **67/67 e2e** (3.2 m) — the codebase matches its documented state exactly |
| **The multi-viewport pass (session-16 §5 target)** | Live structure + screenshot captures at 390/768/1024/1440 on BOTH apps; class diff, heading diff, overflow metric, breakpoint state at 768 | ✅ header/main/container classes MATCH at every band; heading inventories MATCH (modulo the data-driven StatusCard state); overflowX 0px on both; 768 breakpoint identical (desktop nav visible, mobile trigger hidden on both) — **but the tablet band is unpinned (VP-1, §2)** |
| **Mobile menu (user's standing priority)** | Live re-measure on the REFERENCE at 390×844 (Playwright trusted clicks, animation-settled) + the clone's geometry pins inside the 67/67 base run | ✅ **no drift, no Tailwind v4 regression** — trigger 338/14/36×36 right 374, menu 182/54/192×164 right 374 top 54, items [Profile, Settings, Logout], `animation-name: enter`; identical on both apps |
| The session-16 remediation commit (8bd3a48) | Line-level audit of the serializer key orders, the derivation removals, the route seams, the 10 wire-order pins | ✅ clean — every seam held at base; the wire forms re-observed on the fresh reference traffic |
| The visual pixel-diff | Downsampled mean-abs-diff per band + a 3×5 grid localization | ✅ diffs 5.9–11.2, concentrated in the data-driven right-sidebar regions (StatusCard/AI content); header/calendar regions 0.3–4.7 — styling parity |
| Reference account hygiene | Full entity list at session start (the new rule — verify, don't trust) | ⚠️ **1 leftover**: the "S16 MarkComplete Probe" task survived session-16's cleanup — deleted this session (DELETE 200); account back to 9 parity tasks + 3 notes |
| The scandihaven tech-stack reference | Repo cloned; AGENTS/CLAUDE/PAD/SKILL reviewed | ✅ pattern family already adopted (Next 16 + React 19 + Tailwind v4 CSS-first + envelope discipline + Vitest/Playwright + strict gates); no gaps |

## 2. Issues, bugs and gaps found

The audit found **zero visual/behavioral regressions** and zero code
defects (base gate green; the session-16 seams clean at source and
runtime; the reference re-measured identical). One pin-coverage gap
and one hygiene item:

### VP-1 (Medium): the tablet viewport band is unpinned

The e2e suite pins 390×844 (mobile-navigation.spec.ts), 1280×800 (its
desktop describe), 1440×900 (the dashboard full-bleed describe), and
the default 1280×720. **Nothing pins 768 or 1024**, and nothing pins
the no-horizontal-overflow invariant at ANY band. The live audit
proves the parity (both apps flip the md breakpoint identically at
768 and render overflow-free at every band), but a future regression
would pass every existing spec:

- moving the header's `md:hidden`/`md:flex` breakpoints (e.g. to
  `sm:`) — no spec at 768 would catch the menu appearing at 640–767;
- any responsive-class edit that introduces horizontal overflow (the
  classic Tailwind v4 responsive-drift class) — no spec measures
  `scrollWidth` at all.

The fix: a `viewport-breakpoints.spec.ts` family pinning the band
edges on the Dashboard: at 768×900 and 1024×900 the desktop nav is
visible + the mobile trigger hidden (the md-breakpoint contract) and
the document never overflows horizontally; at 390×844 and 1440×900
the same overflow invariant (the bookends, cheap to include).

### RH-1 (executed during the audit): the reference account leftover

The "S16 MarkComplete Probe" task (created in session 16 to capture
the Mark Complete PUT semantics) survived that session's cleanup.
Deleted this session via the captured auth; the account is back to
the 9 parity tasks + 3 notes. **The new rule (carried forward):**
re-list the reference entities at every session START (not just after
probes) — the hygiene claim in a prior session's narrative is not
evidence for this one.

### Confirmed parity (no action)

- **The mobile menu**: re-measured live on the reference — identical
  to the clone's pins (no drift, no Tailwind v4 regression; the
  standing user priority).
- **The multi-band structure**: classes + headings + overflow at
  390/768/1024/1440 — match (only data-driven diffs).
- **The wire forms**: every session-14/15/16 pin family re-observed
  on the fresh reference traffic (start_time-first key order, float
  durations, µs date forms).
- **The session-16 remediation**: clean at source level and at
  runtime.

## 3. Remediation (TDD: pin → mutation → green)

### ToDo list

- [x] T-1 (PIN): `tests/e2e/viewport-breakpoints.spec.ts` — the band
      family: at 768×900 (the md edge) and 1024×900: desktop nav
      visible, mobile trigger hidden, no horizontal overflow; at
      390×844 and 1440×900: the same overflow invariant (the
      bookends). Convention: `scrollWidth === clientWidth` on
      `document.documentElement`, and visibility via
      `getComputedStyle(...).display` (not `toBeHidden` — the mobile
      container's display must be `none` ABOVE md, which is the
      actual contract). **DONE — 8 pins, green at the first run**
      (the audit had already confirmed the behavior; the pins lock
      it). During the session the family gained a ninth pin (BD-1,
      below).
- [x] T-2 (MUTATION, harness outside the repo): M-1 flips the
      Header's mobile container `md:hidden` → `sm:hidden` (the
      breakpoint moves to 640 — the 768 pins must go RED); M-2
      **REDESIGNED during execution** — the original design (inject
      a fixed-width 2000–3000px element into the Dashboard container)
      SURVIVED: the AppShell root's `overflow-hidden` clips inner
      overflow, so `documentElement.scrollWidth` never grows. The
      honest mutation: `w-[2000px]` ON THE APPSHELL ROOT (a width
      edit on the top-level container — the exact regression class
      the overflow pins guard) → the overflow pins must go RED. ONE
      canonical per-file backup; the pin suite re-runs after the
      harness to prove the restore (the session-15/16 harness rule).
      **DONE — M-1 RED 4 (exit 1); M-2 RED 4, surgical (exit 1);
      post-restore rebuild + pin re-run green (9 passed, exit 0);
      `git diff` empty.**
- [x] T-3 (GATE): `bun run lint && bun run typecheck && bun run
      test && bun run build && bun run test:e2e` ×2 consecutive
      (the session convention). **DONE — lint ✓ · tsc ✓ · 143/143
      unit · build ✓ (19 routes) · 75/75 e2e ×2 (the pre-BD-1 gate);
      re-run after BD-1: 76/76 e2e ×2 consecutive (2.2 m + 2.1 m).**
- [x] T-4 (LIVE): the dev-server multi-viewport re-diff (the same
      capture harness) on the remediated codebase. **DONE — and it
      EARNED ITS KEEP:** the field-level diff (including the body
      class this time) surfaced **BD-1** — the clone's `<body>`
      shipped `className="antialiased"`; the reference's body is
      classless. Fixed pin-first: the body-class pin RED →
      `src/app/layout.tsx` body classless → GREEN → verified live
      (empty class on the login surface AND the authenticated shell).
      All bands re-verified: headings identical, overflow 0px, the
      md edge live-confirmed (desktopNav visible / mobileBtn hidden
      at 768), the mobile-menu geometry identical to the reference
      pins.
- [x] T-5 (SCREENSHOTS): the 20 captures re-run
      (`scripts/capture-screenshots.mjs`) + two NEW tablet captures
      (`21-dashboard-768.png`, `22-dashboard-1024.png`) documenting
      the newly pinned band. **DONE — 22 files; the capture script
      extended with the tablet section (durable for future
      sessions).**
- [x] T-6 (DOCS): README (the viewport pin family + counts), AGENTS.md
      (the pin note + the hygiene rule), CLAUDE.md (the e2e table),
      PAD (§8 testing + ledger), flow-schedule_SKILL.md (version
      bump + FS-29), docs/session_17-review.md (written),
      this plan's execution record, the worklog. **DONE — all eight
      surfaces updated (67 → 76 e2e everywhere; FS-29 + BD-1
      recorded).**
- [x] T-7 (PUSH): commit on `main` + push via
      `docs/ssh_git_wrapper_v3.py` (the runbook). **DONE — see the
      execution record.**

### Design decisions (validated against the codebase)

- **The pins live in a NEW spec file, not the existing ones.** The
  mobile-navigation spec is scoped to 390 (its `test.use` sets the
  viewport for the whole file); the band family needs multiple
  viewports per file, so each band gets its own `test.describe`
  block with a local `test.use` — the pattern the dashboard
  full-bleed describe already uses (per-describe viewport overrides
  are supported and precedented in this suite).
- **The overflow invariant is measured on `documentElement`**, not
  `document.body`: the AppShell root is
  `min-h-screen … overflow-hidden` (clipping visual overflow), so
  the BODY never scrolls — the DOCUMENT ELEMENT's
  `scrollWidth - clientWidth` is the honest metric (it was 0 on both
  live apps at every band).
- **Visibility via computed display, not bounding boxes.** The
  mobile container `div.md:hidden` has `display: none` at ≥768 —
  `getComputedStyle(el).display === "none"` is the exact Tailwind
  contract under test (a `toBeHidden` assertion passes for other
  reasons — visibility collapse, zero size — and would not
  specifically pin the breakpoint).
- **The 768 viewport tests the md EDGE exactly.** Tailwind's `md:`
  is `min-width: 768px` — at exactly 768px the desktop nav must be
  visible and the mobile trigger hidden; one pixel below (767) is
  the mobile band. Pinning the edge catches both a breakpoint bump
  (to `lg:`) and a drop (to `sm:`).
- **The mutation targets the Header's `md:hidden`** (M-1) because
  that single utility decides the band flip — the smallest edit that
  must turn the pins red. The overflow mutation (M-2) targets the
  Dashboard page container — the surface whose width classes
  (responsive padding, no max-width) are the overflow-risk seam.

## 4. Deliverables

- `docs/remediation-plan-session17.md` (this file) + execution record.
- `docs/session_17-review.md` (the session review — written).
- `tests/e2e/viewport-breakpoints.spec.ts` (the new pin family).
- Screenshots re-captured + the two tablet captures.
- Docs realigned (README, AGENTS, CLAUDE, PAD, SKILL, worklog).
- Commit on `main` + push via `docs/ssh_git_wrapper_v3.py`.

## 5. Execution record

Executed 2026-10-05 (the T-1..T-7 sequence above, with two
in-flight amendments recorded as they happened):

1. **T-1** — the 8 band pins written and green (9 passed incl. the
   auth setup; first run 12.8 s).
2. **T-2** — the mutation harness (canonical backups, production
   rebuilds): M-1 `md:hidden`→`sm:hidden` RED 4 (exit 1); the FIRST
   M-2 design (3000px injected into the DashboardView container)
   SURVIVED — diagnosed (the AppShell root's `overflow-hidden`
   clips inner overflow; `documentElement.scrollWidth` never grows)
   → **redesigned** to `w-[2000px]` on the AppShell root → RED 4,
   surgical; post-restore rebuild + re-run green (9 passed, exit 0);
   `git diff` empty. Both designs recorded: the survival is itself
   evidence of the guard's true contract (top-level width
   discipline) — now FS-29's mutation-design lesson.
3. **T-3** — full gate: lint ✓ · tsc ✓ · 143/143 unit · build ✓ ·
   **75/75 e2e ×2 consecutive**.
4. **T-4** — the live re-diff on the dev server: all bands overflow
   0px, headings identical, the md edge live-confirmed, the mobile
   menu identical to the pins. The field-level diff surfaced
   **BD-1** (body `antialiased` vs the reference's classless body) →
   pin-first fix: RED → `layout.tsx` body classless → GREEN → live
   verification (empty on both surfaces). The diff also re-ruled
   the visibleButtons diffs as data-driven (account avatar letter,
   the Next Up card's Mark Complete/details buttons) or sanctioned
   (the clone's aria-labels).
5. **T-3 (re-run)** — after BD-1: lint ✓ · tsc ✓ · 143/143 unit ·
   build ✓ · **76/76 e2e ×2 consecutive** (2.2 m + 2.1 m).
6. **T-5** — 22 screenshots (20 re-captured + `21-dashboard-768.png`
   + `22-dashboard-1024.png`; the capture script extended).
7. **T-6** — README/AGENTS/CLAUDE/PAD/SKILL v2.6.0 (FS-29 + BD-1)/
   session_17-review/this record/the repo worklog.
8. **T-7** — committed on `main` and pushed via
   `docs/ssh_git_wrapper_v3.py` (dry-run → real push → remote ref
   verified == HEAD → operator key shredded).

**Amendments to the plan (recorded):**

- **M-2 redesigned** (T-2): injection-into-DashboardView →
  width-edit-on-AppShell-root. The plan's original §3 design decision
  ("the overflow mutation targets the Dashboard page container") was
  empirically wrong — the survival proved the clip. The redesign
  targets the seam the metric actually guards.
- **BD-1 added** (T-4): not in the original audit findings — the
  live field-diff's body-class comparison (a field no prior session
  had diffed) found it. One src change this session (the classless
  body); everything else is pins + docs.
- **The e2e count** — 67 → 76 (8 band pins + the BD-1 body-class
  pin), matching the runner output exactly.
