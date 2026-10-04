# Session 11 Review — FlowSchedule (2026-10-05)

Review + remediation session over base `main @ a8e2987` (the session-10
remediation `49b1c94` plus the operator's docs/session_11.md prompt
commit) on a fresh `git clone` workspace (`.env` and `db/` re-created
from the documented setup; the ambient-polluted shell — a harness-exported
parent-workspace `DATABASE_URL` — exercised the db-path v3 protection on
a clean clone, and the repo's own DB was served). The reviewer's plan for
this session: `docs/remediation-plan-session11.md`.

## 1. What was reviewed

- The five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the full gates re-executed green at base
  (lint ✓ · typecheck ✓ · 88/88 unit · build ✓ (19 routes) · **66/66
  e2e** · smoke 30/30).
- The session-10 remediation commit (`49b1c94`) — every fix re-verified
  in code (`formatDistanceToNowStrict` import + call site; repo-wide
  `data-slot` search → 1 match = the badge comment only; the TaskDialog
  maxLength absence) and held by its 66 pins.
- **The audit targets were session 10's two closing suggestions** — the
  Brainstorm note-editing flow's deeper states and a cross-week Log
  Activity history diff (>5 items to pin the top-5 slice) — plus the
  standing per-session re-pins (mobile + desktop menus).

## 2. The findings: full parity everywhere probed — and three unpinned behaviors

1. **Log Activity top-5 slice (session 10's suggested surface):**
   7 qualifying items seeded on BOTH apps (4 new tasks created through
   the reference's own dialog — Top5 Parity D/E/F + a cross-week G at
   −12 d — on top of session 10's A/B/C; the same instants on the clone
   via its API). The panels render **identically**: exactly the newest
   5 by end_time desc (C "Completed in 2 days" · B "Ended 6 hours ago" ·
   D · E · F) with the 6th (4.5 d) and 7th (12 d, cross-week) CUT on
   both. The one wording difference observed ("24 hours ago" on the
   reference vs "1 day ago" on the clone, same end_time) resolved to an
   **observation-time artifact** (23h59m vs 24h6m distances — the strict
   formatter's hour/day boundary sits at exactly 24 h; re-derived both
   bands against the same instants before blaming either app).
   The H1e filter was re-decompiled from the live bundle:
   `d.status==="completed" || d.end_time && Wc(d.end_time) < l` — the
   **null guard matches the clone exactly** (quick-added title-only
   tasks carry no end_time and are excluded on both apps), and the
   reference also captures `now` once per mount (`const l = new Date`
   inside the mount effect = the clone's `useMemo(() => new Date(), [])`).
2. **Brainstorm deeper states (session 10's suggested surface):**
   empty → create → list (30-char + "…" truncation) → viewNote/edit →
   content edit → update → list, the empty-content save no-op, the
   delete confirm text (hooked `window.confirm`, cancel path), and the
   multi-note ordering — **every state diffs identical on both apps**
   (class trees, text, behavior). The clone's icon-button aria-labels
   remain the documented a11y floor.
3. **Standing pins:** the mobile menu (390×844: trigger 338/14/36×36
   right 374; menu 182/54/192×164 right 374; items [Profile, Settings,
   Logout]; `animation-name: enter`; navigation round-trip) and the
   desktop avatar menu (1440×900: trigger 1252/14/76×36; menu
   1136/54/192×164 right 1328) — **identical on both apps, no Tailwind
   v4 regression**. The sticky header's scroll-away behavior probed
   identical on both (parity, P-2).
4. **The gaps (this session's remediation): the three probed behaviors
   were UNPINNED** — the suite's Log Activity specs each seeded one
   task (a slice/sort regression would pass CI), and no spec exercised
   the empty-save no-op or a 2+-note list:
   - **G-1 (Medium):** the top-5 slice pinned with a SATURATED 7-item
     list — count exactly 5, end_time-desc DOM order, the 6th/7th
     absent from the panel (panel-scoped — they render as calendar
     blocks page-wide), the completed-future item's band-stable
     "Completed in 2 days". Mutation evidence: removing `.slice(0,5)`
     fails the spec.
   - **G-2 (Low):** the empty-save no-op pinned (assert from the LIST
     view — the create view unmounts the list, a wrong-test trap hit
     and fixed during the session).
   - **G-3 (Low):** the newest-first multi-note order pinned via DOM
     indices WITHIN the E2E title family (`.first()/.last()` collide
     with the seed's own notes — the second wrong-test trap).
   - Mutations B (client `content.trim()` guard deleted) and C (store
     prepend flipped) stayed GREEN — honest findings, not weak pins:
     the no-op is enforced server-side (`/api/notes` VALIDATION — the
     self-hosted write-validation class) and the rendered order is the
     save flow's `refreshNotes()` re-fetch (server-driven). The pins
     guard the BEHAVIOR surface — the parity contract — while
     documenting which seam actually enforces it.

## 3. Remediation (TDD: pin → mutation → green)

- **Pin phase:** the new G-1 spec + the extended Brainstorm spec passed
  on the correct build (after two wrong-test fixes — both documented
  above).
- **Mutation (RED) phase:** 3 deliberate regressions applied, rebuilt,
  and run: the slice removal FAILED the G-1 spec (the exact regression
  class session 10 worried about); the guard/prepend mutations stayed
  green with the enforcement-layer explanation above. Mutations
  reverted, source tree verified clean (`git status`: only the spec
  file + the new docs), rebuilt.
- **Gate after:** lint ✓ · typecheck ✓ · **88/88 unit** · build ✓ ·
  **67/67 e2e × 2 consecutive full runs** (66 → 67) · smoke **30/30**.
- Screenshots: all 20 captures re-run on the remediated codebase.

## 4. Environment notes

- The fresh-clone setup re-proved the session-9 F-1 acceptance in the
  polluted shell: the harness exports
  `DATABASE_URL=file:/home/z/my-project/db/custom.db` (resolves OUTSIDE
  the repo) — db-path v3 ignored it; `db:push`/`db:seed` and the dev
  server all targeted `<repo>/db/custom.db` (login + CRUD green,
  `database: "up"`).
- The reference's login session held; its account now carries the
  session-10 parity tasks plus the session-11 Top5 set and one
  quick-added probe task (reference data is disposable by convention).
- The z-ai SDK's summary endpoint 429'd during the e2e runs (the
  documented pattern — the deterministic fallback fired); the
  reference's Daily Focus rendered a live LLM quote during the live
  diff.

## 5. Knowledge carried forward

- **FS-22 (new): a behavior verified live but unpinned is a regression
  waiting to happen.** Member-level seeds never exercise
  list-capacity boundaries (slices, sorts, pagination, dedup). Pin the
  SATURATED state with panel-scoped negations; take MUTATION evidence
  for pins over correct behavior (break it, prove the spec fails,
  revert); expect some mutations to stay green when another layer
  enforces the behavior — and document which layer that is.
- **The 24 h band boundary (P-1):** a 23h59m-past end renders "24
  hours ago" and flips to "1 day ago" a minute later — both correct
  strict-formatter behavior; only the observation time moved.
  Relative-word pins must sit hours away from any unit boundary
  (generalizes FS-21's band-stable discriminator rule).
- **Two wrong-test traps worth naming:** (a) asserting a list's count
  from a view where the list is unmounted (0 by construction); (b)
  `.first()/.last()` on a list that carries seed residue — assert
  within the test's own title family via DOM indices.
- Test counts moved to **88 unit / 67 e2e / 30 smoke**; the SKILL doc
  moves to v2.0.0 (FS-22; the saturated-pin discipline; the
  enforcement-layer lesson).

- **Suggested session-12 targets:** the Quick Action Add Task panel's
  created-task landing (where the quick-added task with null end_time
  appears — the calendar does not render it; the Planning page's
  day-card chips do not either; the Dashboard's StatusCard ignores it —
  what DOES surface it on the reference? A first-time
  null-end_time-task surface diff), and the Notes API's tag-array
  round-trip against the reference's tag editor (if any surface
  exposes one).
