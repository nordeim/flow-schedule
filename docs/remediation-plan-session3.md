# Remediation Plan — Session 3 (2026-10-04)

Session-3 review of the FlowSchedule clone (base commit `dac1fad`, the
session-2 Planning parity remediation) after `git pull` (fast-forward:
`docs/prompt-to-review-2.md` + `docs/session_3.md`). This plan records every
gap found by the audit, the remediation strategy, and the TDD execution order.
The `skills/` folder is excluded from code checking, testing and compilation
per the operating instructions.

Skills used this session: `agent-browser` (live reference re-measurement +
open-panel DOM corroboration), `code-review-checklist` (change-since-commit
review of `dac1fad`), `verification-and-review-protocol` (Iron Law: executed
evidence only), `tdd` (red → green), `nextjs16-tailwind4` (token-pin
discipline for the rewritten classes), `clone-app-pat-pro` (decompile-first
parity method).

## 1. Audit scope and method

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull origin main` (fast-forward: `docs/session_3.md` + prompt update) | ✅ clean tree, main @ dac1fad |
| Docs ↔ code alignment | Read `AGENTS.md`, `CLAUDE.md`, `README.md`, `Project_Architecture_Document.md`, `flow-schedule_SKILL.md`, `docs/session_2-review.md`, `docs/remediation-plan-session2.md`, `docs/session_3.md`, `worklog.md`; claims re-executed | ✅ aligned |
| Verification gate at base | `bun run lint` clean · `typecheck` clean · `test` 44/44 · `build` 19 routes · `test:e2e` 34/34 · smoke 25/25 | ✅ all green |
| Recent code changes (`dac1fad`) | Read every changed source file: `src/app/(app)/Planning/page.tsx` (245 lines), `tests/e2e/planning.spec.ts`, `tests/e2e/dashboard.spec.ts` | ✅ clean, well-pinned, comments cite bundle evidence |
| Database contract | `.env` = `DATABASE_URL="file:../db/custom.db"`; `db/` at repo root (custom.db + e2e.db); health probe `"database":"up"` | ✅ correct |
| Mobile navigation | e2e geometry spec green at base (374/54/192 pin); re-measured live after remediation (§5) | ✅ no regression |
| **Reference parity (Quick Actions OPEN-PANEL state)** | **Full decompile of the reference's Quick Actions components from its bundle** (`G1e` container + `z1e`/`W1e`/`H1e`/`K1e` panels, icon map `hF/NH/RH/LH/yH/mF/hE/zW`) + live DOM corroboration on BOTH apps (container classes, computed gradients, button classes, headings) | ⚠️ **9 gaps — Q-1…Q-7 + icon errors below** |
| Deferred work (PAD §11) | Reviewed `next.config.ts`, `src/lib/api.ts` against the deferred list | ⚠️ 2 items actionable — D-1/D-2 below |

## 2. Issues, bugs and gaps found

Session 2 verified the Quick Action **tiles** (gradients byte-identical) but
never the **open-panel state** — the same blind spot class as session 2's
Planning finding, one surface earlier: the open panels were built in session 0
from the live empty-state reference and inferred. The bundle decompile (this
session) plus live corroboration on the logged-in reference pins the actual
behavior. All root causes trace to "inferred, not decompiled" (FS-11).

| ID | Severity | Finding (reference = ground truth) | Fix strategy |
|----|----------|-----------------------------------|--------------|
| Q-1 | High | **Container morph**: the reference's whole card (`relative backdrop-blur-xl rounded-3xl p-4 shadow-xl border border-white/20 overflow-hidden min-h-[280px]`, motion `layout`, transition .4 circOut) swaps its background from `rgba(255,255,255,0.6)` to the action's gradient when a panel opens, with an AnimatePresence **expanding overlay** animating from the clicked tile's origin rect to the full card. Clone: static `bg-white/60 p-6` card + a separate gradient `PanelShell` div; no overlay; no `overflow-hidden`/`min-h` | Rewrite `QuickActions` container: motion.div + background state + expanding overlay; drop `PanelShell`'s gradient shell |
| Q-2 | High | **Header replacement**: the reference renders the "Quick Actions" h3 (`text-lg font-semibold text-slate-900 mb-3`) ONLY in the tiles view; opening a panel REPLACES it with the panel header (ghost icon back button + action icon + label). Clone keeps BOTH headings visible simultaneously | Move the h3 into the tiles view; single header row in panel view |
| Q-3 | Medium | **Tile geometry**: reference tiles `flex flex-col items-center justify-center h-24 rounded-2xl p-3 text-white shadow-lg`, grid `gap-3`, icon `w-5 h-5 mb-1.5`, label `text-[11px] font-medium text-center leading-tight`, framer `whileHover {scale:1.07, boxShadow:"0px 10px 20px rgba(0,0,0,0.15)"}` / `whileTap {scale:.93}`. Clone: `h-28 rounded-xl p-5 gap-3 shadow-md hover:shadow-lg`, `text-2xl` icon, `text-sm` label, CSS overlay div, grid `gap-4` | Re-class tiles to the reference geometry + motion hover/tap |
| Q-4 | Medium | **Add Task quick panel** (`z1e`): placeholder-only input (`rounded-lg border-slate-300 bg-white/70 placeholder:text-slate-500 text-slate-800`) — **no visible label**; buttons `size sm rounded-lg`; submit `bg-slate-700 hover:bg-slate-800 text-white` (NOT a blue gradient) + Save icon `w-4 h-4 mr-1.5` + " Add"; create posts `{title, category:"work", priority:"medium", status:"todo"}` (API defaults already match); no error UI, no required/maxLength; motion form (fade+y). Clone: visible label, `rounded-2xl` input, gradient submit, error state | Rebuild panel to `z1e` form; remove the label + error UI |
| Q-5 | Medium | **Focus Timer** (`W1e`): minutes input **hidden while running** and `disabled` when running; value empty-string when `minutes===0&&remaining===0`; onChange keeps raw parse (only "" sets 0); toggle icon is **Play when stopped / Pause when running** (the clone shows RotateCcw when running — wrong icon); `alert("Please set a valid duration.")` when starting at minutes≤0; `alert("Focus session complete!")` at 0; reset button is `size lg rounded-full w-20 h-20 border-slate-300 hover:bg-slate-200/50 text-slate-600` with RotateCcw `w-7 h-7` (clone: small green variant); Close Timer `ghost size sm rounded-lg … mt-2` (clone: `text-xs`, no `rounded-lg`/`mt-2`) | Rebuild to `W1e` logic + classes; add the two alerts; swap to Play/Pause |
| Q-6 | Medium | **Log Activity** (`H1e`): a READ-ONLY history — fetch on open, sort by end_time desc, filter `status==="completed" \|\| end_time < now`, `slice(0,5)`; items `p-2.5 bg-white/70 rounded-lg shadow-sm border border-slate-200/70` with title (`text-sm font-medium text-slate-800`) + meta line (`text-xs text-slate-500`) "Completed"/"Ended" + relative end_time (`formatDistanceToNow`, addSuffix; "N/A" if missing); loading "Loading history..."; close = "Close" (`rounded-lg`). Clone: 20 store-derived rows with category/priority chips and a clone-only **Done** action button, no loading state, no card wrapper | Rebuild to `H1e`: refresh-on-open + loading state, 5-item read-only list; remove the Done action |
| Q-7 | Medium | **Brainstorm** (`K1e`): three views (list / create / viewNote) with note **editing** (`Note.update` → "Update Note" button); list items `p-2.5 bg-white/70 rounded-lg shadow-sm border … flex justify-between items-center` with a **30-char truncated clickable preview** (`truncate cursor-pointer hover:underline`) and icon actions **Eye** (`w-7 h-7 rounded-md text-slate-500 hover:bg-slate-200/50`) + **Trash2** (`… text-red-500 hover:bg-red-100/50`); delete asks `window.confirm("Are you sure you want to delete this note?")`; textarea `rounded-lg border-slate-300 min-h-[120px] bg-white/80 text-slate-800`; "← Back to List" + Save/Update (green, `size sm rounded-lg`); footer `mt-3 pt-2 border-t border-slate-200/50` + "Close Notes"; loading "Loading notes...". Clone: two views, no editing, no confirm, full-content rows, text "Delete" button, `rounded-xl` cards, `rounded-2xl` textarea | Rebuild to `K1e` views + classes; wire `updateNote` (API + store already exist); add confirm + loading |
| D-1 | Low | **`next.config.ts` ships `typescript.ignoreBuildErrors: true`** (scaffold legacy; deferred in PAD §11). `bun run typecheck` is clean, so removing it is safe — but the PAD notes it is "untested in the standalone build pipeline" | Remove the flag; verify via full `build` + standalone e2e suite; pin with a unit contract test |
| D-2 | Low | **Rate-limiter bucket leak**: `buckets` Map in `src/lib/api.ts` never evicts expired entries — an attacker spraying from many IPs grows the map unboundedly (slow memory leak; every entry is ~40 bytes but the spray is free) | Opportunistic sweep: evict expired buckets when the map exceeds a small threshold (no timers, no behavior change for live keys); unit test with the existing fixed-window semantics |

Deliberately NOT changed (judgment calls, recorded for review):

- **aria-labels on icon-only buttons** ("Start timer"/"Pause timer"/"Reset
  timer", tile labels): the reference's icon buttons are unnamed in the a11y
  tree; the clone's labels are invisible, strictly better for a11y, and pin
  the e2e specs. Parity is the visible/functional contract, not the accessible
  tree (session-2 precedent: `<button>` day-cards kept over the reference's
  `<div onClick>`).
- **Data-source seam for panels**: the reference re-fetches (`Task.list`,
  `Note.list`) on each panel open; the clone reuses the store +
  `refreshTasks()`/`refreshNotes()` on open. Same visible behavior (loading
  state → fresh data), one fetch layer. The store stays the ONLY fetcher
  (AGENTS.md invariant).
- **`onTaskAdded` dashboard wiring**: the reference threads a refresh callback
  from the Dashboard through `G1e`; the clone refreshes inside the panel after
  create. Identical visible outcome.
- **Quick Action create defaults**: reference posts
  `{category:"work",priority:"medium",status:"todo"}` explicitly; the clone's
  API applies the same defaults — equivalent, no change.
- **Notes/tasks API sort orders**: `orderBy createdAt desc` (notes) already
  matches the reference's `-created_date`; Log Activity sorts client-side by
  `end_time desc` (the reference sorts server-side — same result list).
- **Mobile navigation, Dashboard calendar/gradient pins, Planning, Profile,
  Settings**: verified parity in sessions 0–2, all re-verified green at base —
  zero changes.

## 3. TDD execution order

Tests first (red), then the implementation (green), then the gate.

- **T-1 (red for Q-2/Q-1):** `tests/e2e/dashboard.spec.ts` — new spec
  "opening a quick action panel replaces the tiles view": click a tile → the
  "Quick Actions" h3 is hidden, the panel heading (e.g. "Log Activity") is
  visible, the container's computed backgroundImage becomes the action's
  gradient; back button → tiles return and the h3 reappears.
- **T-2 (red for Q-3):** extend "quick actions render the four tiles" —
  tile classes contain `h-24 rounded-2xl p-3`, grid `gap-3`, label
  `text-[11px]`, icon `w-5 h-5 mb-1.5` (asserted via `evaluate`).
- **T-3 (red for Q-4):** "Add New Task panel creates a task" — rework:
  `getByLabel("Task Title")` → `getByPlaceholder("Task Title...")`; assert NO
  label element; assert the Add button's class contains `bg-slate-700`; keep
  the API verification + converging cleanup.
- **T-4 (red for Q-5):** "Focus Timer panel counts down" — rework: after
  starting, the minutes input is HIDDEN; the running toggle shows the pause
  icon (assert via the svg class `lucide-pause`); reset button class contains
  `border-slate-300`; Close Timer visible.
- **T-5 (red for Q-6):** new spec "Log Activity shows the reference's
  read-only history": create a task via API, PATCH it to completed, open the
  panel → "Recently Completed / Past" h4, the item card with title +
  "Completed", NO "Done" button anywhere in the panel; close label "Close".
- **T-6 (red for Q-7):** new spec "Brainstorm panel supports create, edit,
  and confirm-delete": open → "My Notes" + New Note; create a note → truncated
  row (≤ 33 chars); click the row → textarea prefilled → edit → "Update Note"
  → updated row; Trash2 icon → `page.on("dialog")` accept → row removed.
- **T-7 (red for D-1):** new `tests/next-config.test.ts` — the exported
  config must NOT set `typescript.ignoreBuildErrors` (nor
  `eslint.ignoreDuringBuilds`).
- **T-8 (red for D-2):** new `tests/rate-limit.test.ts` — fixed-window
  semantics (10/min, 429 semantics via return value, window reset) + eviction:
  after inserting many expired buckets, the map size shrinks (exported
  `__bucketsForTest`).
- **Implementation (GREEN):** single-file rewrite of
  `src/components/dashboard/QuickActions.tsx` (container + 4 panels to the
  decompiled forms), `next.config.ts` flag removal, `src/lib/api.ts` sweep.
- **Gate re-run:** lint → typecheck → unit (44 + new) → build → e2e (34 +
  new) → smoke 25/25.
- **Live parity spot-check on BOTH apps** (agent-browser): tiles view + each
  open panel (classes, gradients, headings, list items); clone mobile-menu
  geometry re-pin (374/54/192).
- **Docs:** README (features row + screenshots), PAD (§ Quick Actions parity
  notes, §11 deferral resolution, §12 ledger), AGENTS.md (conventions:
  Quick Actions decompile notes), CLAUDE.md (testing table), 
  `flow-schedule_SKILL.md` (v1.2.0: FS-12 "empty-state inference is not
  parity" corollary; appendices), `docs/session_3-review.md`, worklog.
- **Screenshots:** re-capture dashboard + a new 11-quickaction-panel capture
  set (add-task/timer/log/brainstorm open states) at 1440×900.
- **Deliver:** single commit on `main`, pushed via `docs/ssh_git_wrapper_v3.py`
  per `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`. No new branches.

## 4. Non-goals (deliberately not changed)

- **Mobile navigation** — geometry pin green; zero header/menu changes.
- **Dashboard calendar / task blocks / SkillsMap / sidebar cards** — verified
  parity in sessions 0–2, all green at base.
- **Planning page** — decompiled parity landed in session 2; its 9 specs stay
  the pin.
- **The TaskDialog** (calendar/planning dialogs) — already bundle-verified
  ("Edit Task"/"Add New Task" `text-xl font-bold` heading).
- **Database/env contract** — correct and test-pinned.
- **`skills/` folder** — excluded from checking/testing/compilation.
- **Rate limiter architecture** — stays in-memory per-process (single-instance
  SQLite deployment assumption; a shared store is incoherent before a
  Postgres migration — recorded in PAD §11 with the reasoning). D-2 only adds
  eviction hygiene.

## 5. Execution record (filled during execution)

| Item | Outcome |
|---|---|
| T-1/T-2 specs (RED) | "opening a quick action panel replaces the tiles view" + tile-geometry extension written first; failed against the pre-fix build exactly as predicted (h3 never hidden; container backgroundImage `none`; tiles `h-28 rounded-xl p-5 gap-4`) |
| T-3 spec (RED) | "Add New Task panel creates a task" reworked to placeholder + `bg-slate-700` assertions; failed on the visible label + gradient submit |
| T-4 spec (RED) | "Focus Timer panel counts down" reworked (minutes hidden, `lucide-pause`, `border-slate-300` reset, `mt-2` close); failed on all four |
| T-5 spec (RED) | "Log Activity shows the reference's read-only history" (API-seeded completed task, read-only, "Close"); failed on the missing "Recently Completed / Past" heading + the clone-only Done buttons |
| T-6 spec (RED) | "Brainstorm panel supports create, edit, and confirm-delete"; failed on "Update Note" (no edit path) |
| T-7 (RED) | `tests/next-config.test.ts` — 1 failure (the flag existed); Next 16 has no `eslint` config key at all (type error → assertion dropped, documented) |
| T-8 (RED) | `tests/rate-limit.test.ts` — 4 failures (no `__bucketsForTest` seam, no eviction; plus a test-isolation fix — module state needed clearing in beforeEach, and a clock-regression guard was added to `shouldSweep` after fake-timer resets exposed the monotonic-time assumption) |
| Q-1…Q-7 implementation (GREEN) | Single-file rewrite of `src/components/dashboard/QuickActions.tsx` (container morph + AnimatePresence expanding overlay, header replacement, reference tile geometry, `z1e`/`W1e`/`H1e`/`K1e` panels; timer translated to derived-idle display to respect `react-hooks/set-state-in-effect`; alert-on-completion kept in the tick path) |
| D-1 implementation (GREEN) | `typescript.ignoreBuildErrors` removed from `next.config.ts`; **verified**: full `bun run build` green + the standalone e2e suite boots and passes without it |
| D-2 implementation (GREEN) | Throttled expired-bucket sweep in `rateLimit` (≤ 1 sweep/window, clock-regression safe, live keys untouched) + `__bucketsForTest` seam |
| Flakes fixed during GREEN | (1) Log Activity strict-mode violation — residue from crashed RED runs + calendar-block text matches → converging cleanup + `getByRole("paragraph")` scoping; (2) Brainstorm measured the FULL note text → **FS-13**: `getByText` matched the still-mounted textarea's default-value text node under suite load → role-scoped locators (which also make `toBeVisible` wait for the view switch) + semantic truncation assertions |
| Alert discovery | The reference's "Please set a valid duration." alert is UNREACHABLE dead code (the start control is `disabled` at minutes=0 — `disabled:minutes<=0&&!running` in W1e); the clone mirrors the pair; the spec pins the DISABLED state; the completion alert ("Focus session complete!") verified by a one-off Playwright run (2/2 passed, ~65s) |
| Gate | `bun run lint` clean · `typecheck` clean · `test` **53/53** · `build` green (19 routes, self-type-checked) · `test:e2e` **38/38 × 2 consecutive full runs** · smoke **25/25** |
| Live parity (both apps) | Container/tiles/panel classes and computed gradients measured byte-identical (container `p-4 … overflow-hidden min-h-[280px]` + gradient morph; tiles `h-24 rounded-2xl p-3 shadow-lg`, icon `w-5 h-5 mb-1.5`, label `text-[11px]`; Add `bg-slate-700 h-8 px-3 text-xs rounded-lg`; reset `border-slate-300 text-slate-600 w-20 h-20`; Close Timer `rounded-lg … mt-2`); minutes hidden while running + `lucide-pause` confirmed live; mobile-menu geometry re-pinned after the change (trigger 374/50, menu 374/54/192) |
| Screenshots | 13 captures in `docs/screenshots/` (01–10 re-captured + new 11-quickaction-addtask, 12-quickaction-logactivity, 13-quickaction-brainstorm) from the remediated dev server |
| Docs | README (features, counts, testing), PAD (§3 tree, §8 testing, §11 D-1/D-2 resolution + dead-code note, §12 ledger), AGENTS.md (commands, conventions, quirks, references), CLAUDE.md (counts, testing), `flow-schedule_SKILL.md` v1.2.0 (FS-12, FS-13, debugging row, appendices B/C), this plan, `docs/session_3-review.md`, worklog |
| Push | Single commit on `main` via `docs/ssh_git_wrapper_v3.py` (no new branches) |
