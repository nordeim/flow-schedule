# Session 21 Review — FlowSchedule (2026-10-05)

Review + remediation session over base `main @ 9258cde` (the session-20
remediation `a19516a` — the Tailwind default-theme drift pass: F-1 font
stack / C-1 palette / PIN-1 completeness invariant — plus the operator's
`docs/session_21.md` narrative commit) on the carried-forward workspace
(`.env` intact with `DATABASE_URL="file:../db/custom.db"`, `db/` seeded at
the repo root, `node_modules` fresh, the vitest + playwright suites
configured). The reviewer's plan for this session:
`docs/remediation-plan-session21.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL
  v2.9.0) against the tree — aligned; the full gates re-executed green at
  base (lint ✓ · typecheck ✓ · 159/159 unit · build ✓ (19 routes) ·
  **89/89 e2e** in 2.9 m; the log's lone 429 is the documented LLM
  fallback path, not an incident).
- The session-20 remediation commit (`a19516a`) audited at source level:
  the `@theme inline` pins in `globals.css` (the `--font-sans`/
  `--font-mono` stacks + the 13 measured hexes, pink-700 `#be185d` with
  the nuance comment), `tests/e2e/theme-palette.spec.ts` (4 pins) +
  `tests/tailwind-theme-pins.test.ts` (6 source pins incl. the used ⊆
  pinned invariant) — all green inside the base run. Clean.
- The reference-account hygiene re-list at session START (the
  verify-don't-trust rule): **9 parity tasks + 3 notes, 0 leftovers**
  (identical to the standing state; the full entity bodies captured this
  time for the raster diff — see §1.4).
- **The session-20 §5 suggested target (b) executed: the Planning page's
  interactions at multi-week depth** — the week navigation probed LIVE on
  BOTH apps (trusted Playwright clicks) across the month boundary
  (current week Oct 5–11 → prev Sep 28–Oct 4 → prev Sep 21–27 → next Oct
  12–18 → back), capturing the week label, all 7 day cards (EEE/d text,
  chips, classes), and the selected-day section at a non-current week.
  Result: **byte-identical on both apps** — "Week of MMM d, yyyy" labels
  (`Week of Sep 28, 2026`), the month-boundary day cards ("Thu 1" —
  day-of-month only, no month marker), the selected-day title
  ("Monday, Sep 21, 2026"), the selected-day persistence across week
  navigation (no reset), and the completed-task chips rendering on the
  day cards (no status filter on either app's per-day filter).
  **But the probe surfaced S21-F1** — see §2.
- **The session-20 §5 suggested target (a) executed: the full-page raster
  diff at matched data state** — the reference account's EXACT 9 task
  entities (full field bodies: title/description/priority/category/
  status/start_time/duration_minutes/end_time) recreated on the clone's
  standalone (:3100, its own scratch user with the same email → the same
  header avatar initial), both apps captured at 1440×900 with the blob
  layer hidden identically on both (its parity is owned by the session-19
  motion pin family; the raster catch-all covers the CONTENT layer) and
  the WAAPI pulse indicators phase-aligned. Result:
  **/Planning: 0.057% of pixels differ (739 px at the >8 channel
  threshold), no hot grid cells — full content parity.**
  **/Dashboard: 0.737% differ, and every hot cell sits inside ONE card —
  the Daily Focus card** (its box x 1082 y 290 326×318 contains the whole
  hot region): the reference rendered a live InvokeLLM quote ("Amateurs
  sit and wait for inspiration…" — Stephen King) while the clone rendered
  the deterministic Mark Twain fallback (the z-ai 429 path — the
  documented never-hard-fail contract; the fallback set IS the
  reference's own). Everything else on the page — the calendar grid, task
  blocks, Quick Actions, StatusCard, AI Summary card (both apps rendered
  content with the identical class contract), SkillsMap, header — is
  pixel-identical. The raster catch-all found ZERO residual sub-visual
  divergence outside the documented nature-of-LLM region.
- The mobile navigation menu (the standing user priority) re-measured
  LIVE on BOTH apps at 390×844 (trusted clicks, animation settled):
  trigger 338/14/36×36 right 374, menu 182/54/192×164 right 374, items
  [Profile, Settings, Logout], `animation-name: enter` — **byte-identical
  on both apps, no Tailwind v4 regression** (the e2e mobile-navigation
  family also green in the base run).

## 2. The findings

### S21-F1 (High, functional): the clone's Planning "Add Task" button opens a create-task dialog — the reference's is a NO-OP

Three evidence levels, all captured this session:

1. **Decompile**: the reference's Planning component (`eSe` in its bundle)
   carries NO dialog state — its state is `[tasks, weekStart, selectedDay,
   loading]`, its effects are ONE mount-time `fn.Task.list()` fetch, and
   the header's Add Task button's props are
   `{className:"rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600"}`
   with children [Plus icon, "Add Task"] — **no onClick**. The reference's
   TaskDialog (`Xne({isOpen, onClose, selectedSlot, selectedTask,
   onSave})`) mounts in exactly ONE place: inside `lre` — the Dashboard
   calendar component (`S.jsx(Xne,{isOpen:o,…,onSave:P})`). The Planning
   page has no dialog in its tree at all.
2. **Live probe (trusted Playwright click on the logged-in reference)**:
   click "Add Task" → `[role="dialog"]` count 0, body children unchanged
   (1 → 1), no overlay added, no navigation. The button does NOTHING —
   the same evidence class as the reference's decorative Filter button.
3. **The clone's behavior (live, same probe)**: the click opens the full
   Radix TaskDialog ("Add New Task" form) and blocks the page until
   dismissed.

Root cause: the session-2 remediation plan asserted "**TaskDialog**: stays
— the reference opens it from the Add Task button and the Dashboard's
calendar cells/blocks" — an INFERENCE that was never live-verified (the
session-2 XHR/class-tree probes targeted the dialog itself, which the
Dashboard opens). The clone then shipped the Planning-page dialog mount +
the e2e pin "Add Task dialog creates a scheduled task"
(`tests/e2e/planning.spec.ts`), which has pinned the DIVERGENT behavior
since session 2. This is the repo's own FS-30/FS-31 lesson extended from
timed behavior to wired interactivity: **a decompile-level hypothesis
about a handler must be confirmed against the live click — and the bundle
IS the decompile here: no onClick means no handler.**

The fix mirrors the reference: remove the dialog mount, the `openCreate`
handler, and the button's `onClick` from the Planning page; the
TaskDialog stays where the reference mounts it (the Dashboard calendar —
`DashboardView.tsx`), reachable by calendar empty-cell and task-block
clicks. The dialog's request-contract pin (W-3/W-4: end_time
client-computed + description verbatim) MOVES to the Dashboard spec
(the reference's actual entry path) so the session-12 wire contract
coverage is preserved.

### Non-findings (verified, no action)

- **Multi-week navigation**: byte-identical on both apps (see §1) — the
  month boundary, the week label, the selected-day persistence, the
  completed-task chips. The session-20 §5 candidate (b) is CLOSED.
- **The raster diff (candidate (a))**: closed — zero residual sub-visual
  divergence outside the Daily Focus LLM region (matched-data, both apps,
  content layer).
- **The mobile menu**: byte-identical live on both apps — no Tailwind v4
  regression (the standing priority, re-verified every session).
- **The Planning per-day filter**: `isSameDay(new Date(start_time), day)`
  with the null-start guard — byte-identical to the reference's
  `zc(new Date(w.start_time), y)` with `w.start_time ?` guard.
- **The store-vs-mount-fetch seam**: the reference's Planning fetches
  tasks ONCE on mount (`useEffect(()=>{c()},[])`); the clone reads the
  Zustand store. The difference is invisible on this page (the reference
  has no mutation path while Planning is mounted — its own task items are
  display-only and its Add Task is the no-op above; the documented
  same-evidence-class ruling from the session-16 transport layer).

## 3. The pin gap

The Planning Add Task no-op has never been pinned — the existing pin
family asserted the OPPOSITE (the divergent dialog flow). The
remediation replaces the planning dialog spec with a no-op pin (no
dialog renders, no POST fires, the chips survive) and relocates the
dialog request-contract pin (W-3/W-4) to the dashboard spec at the
calendar-cell entry path, so both the no-op AND the dialog contract are
guarded going forward.

## 4. Environment notes

- The workspace survived this cycle (no reset) — the bootstrap chain was
  a no-op; `git pull` brought in `docs/session_21.md` only
  (`a19516a → 9258cde`).
- A stale dev server from the previous session's T-4 checks was still
  holding ~1 GB (killed before the probes; restarted for the screenshot
  pass).
- The reference's post-login URL is the root `/` — the probes wait for
  `/base44\.app\/?$/` (the documented `/dashboard|^\//` pattern in the
  older scripts matches nothing against a full URL string and silently
  falls through its `.catch`).
- The raster-diff harness: the blob layer is main-thread framer-motion
  (invisible to `getAnimations()`; `prefers-reduced-motion` does NOT
  freeze it on EITHER app — measured), so the content-layer capture hides
  the layer identically on both pages; the pulse indicators (WAAPI, 2 s)
  phase-align via a `currentTime % 2000 < 120` wait.

## 5. Knowledge carried forward

- **The bundle is the decompile — and a missing handler is a finding.**
  The reference's `eSe` button carries no `onClick` prop; the live click
  confirmed it. Session-2's "the reference opens it from the Add Task
  button" was an unverified inference that survived 19 sessions because
  the pin family pinned the clone's own divergent behavior. The
  FS-23 ruling, extended: when a contract is a HANDLER, the wire probe
  must be a trusted CLICK on the live reference, not an inference from
  the dialog's existence elsewhere.
- **A pin on divergent behavior is worse than no pin**: the "Add Task
  dialog creates a scheduled task" spec made the divergence
  regression-proof. When a live probe contradicts an old spec, the spec
  is the bug (the ET-1/FT-1 pattern — now applied to a handler).
- **Raster diffs need animation discipline**: main-thread framer loops
  (the blobs) can't be phase-aligned via WAAPI; hide the layer
  identically on both apps when its parity is separately pinned, and
  phase-align the WAAPI indicators via `currentTime % duration` windows.
- **Matched-data raster diffs are cheap and decisive**: 9 task bodies
  recreated on a scratch clone user + identical CSS injection → 0.057%
  Planning / 0.737% Dashboard (all inside the documented LLM region).
  The session-20 theme work (fonts + palette) is what made the remaining
  diff this small — the same raster harness at session-0 would have
  lit up everywhere.

**Suggested session-22 targets:** the audit frontier is closed on the
entity wire, the layout bands, the timed interactions, the motion
family, the theme values, the raster catch-all, and the Planning
handlers. Remaining candidates: (a) the /Profile + /Settings raster diff
at matched state (structure + glyph metrics already closed in session
20 — raster would be the belt-and-braces close), (b) the login-page
populated-state raster diff (error/success alert states at matched
credentials), or (c) any surface the operator prefers.
