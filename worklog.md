# Worklog

---
Task ID: 17
Agent: main agent
Task: Session 3 — audit + Quick Actions parity remediation

Work Log:
- git pull (fast-forward: docs/prompt-to-review-2.md update + docs/session_3.md — the operator's
  narrative of the session-2 remediation that produced dac1fad)
- Reviewed AGENTS.md, CLAUDE.md, PAD (§11 deferred work, §12 ledger), session_2-review.md,
  remediation-plan-session2.md, worklog.md, session_3.md — all aligned with the tree
- Full gate at base dac1fad: lint clean · typecheck clean · 44/44 unit · build 19 routes ·
  34/34 e2e · smoke 25/25 — all green
- Env contract verified: .env DATABASE_URL="file:../db/custom.db", db/ at repo root
  (custom.db + e2e.db), dev server healthy
- Read skills/skills-catalog.md; selected skills: code-review-checklist,
  verification-and-review-protocol, tdd, nextjs16-tailwind4, agent-browser, clone-app-pat-pro
- Audit target = the session-2 change (dac1fad: Planning page + 2 spec files) — clean
- **FS-11 applied to the LAST unverified surface — Quick Actions OPEN-PANEL state** (only the
  tiles were verified in session 2). Decompiled G1e (container) + z1e (Add Task) + W1e (Focus
  Timer) + H1e (Log Activity) + K1e (Brainstorm) from the reference bundle:
  * Q-1 container: ref morphs whole-card background white/60→gradient (motion layout +
    AnimatePresence expanding-overlay from clicked tile origin), p-4, min-h-[280px],
    overflow-hidden; clone uses static white card + separate gradient PanelShell, p-6
  * Q-2 header: ref REPLACES "Quick Actions" h3 with the panel header (back arrow + action
    label); clone keeps BOTH visible
  * Q-3 tiles: ref h-24 rounded-2xl p-3 shadow-lg, icon w-5 h-5 mb-1.5, label text-[11px],
    grid gap-3, framer whileHover scale 1.07 / whileTap .93; clone h-28 rounded-xl p-5 gap-4,
    text-2xl icon, text-sm label, CSS hover overlay
  * Q-4 Add Task: ref = placeholder-only input (no label) rounded-lg, buttons size-sm
    rounded-lg, submit **bg-slate-700** (NOT blue gradient), explicit create defaults
    (category work / priority medium / status todo), no error UI; clone has label + rounded-2xl
    + blue-gradient submit + error UI
  * Q-5 Focus Timer: ref hides minutes input while running + disables it, empty-string value
    at 0/0, alert("Focus session complete!") at 0, alert("Please set a valid duration."),
    reset button = w-20 h-20 rounded-full border-slate-300 text-slate-600 (SAME size as
    toggle), Close Timer = rounded-lg mt-2 size-sm; clone shows input always, no alerts,
    small green reset button, close text-xs
  * Q-6 Log Activity: ref = fetch Task.list("-end_time") filter completed OR end_time<past
    slice(0,5), items p-2.5 bg-white/70 rounded-lg shadow-sm border + title + "Completed"/
    "Ended" + relative end_time (formatDistanceToNow), loading "Loading history...", close
    label "Close"; clone = store-derived slice(0,20) start_time<=now, flex rows with
    category/priority/clone-only "Done" action button
  * Q-7 Brainstorm: ref = 3 views (list/create/viewNote), note EDITING via Note.update
    (button label "Update"/"Save Note"), 30-char truncated clickable preview, edit+delete
    icon buttons (window.confirm on delete), loading "Loading notes...", items
    p-2.5 bg-white/70 rounded-lg shadow-sm border flex justify-between; clone = 2 views, no
    editing, no confirm, full content, different classes
  * Backend already supports everything needed (PATCH /api/notes/[id] + store.updateNote
    exist but unwired in the panel; task create defaults exist at the API)
- Deferred-work audit: D-1 ignoreBuildErrors removal (safe — typecheck clean; needs build
  pipeline verification), D-2 rate-limiter buckets Map never evicts expired entries
  (unbounded growth under distributed key spray — minor memory hygiene defect)

Stage Summary:
- Base dac1fad fully green; audit complete; headline finding = 7 Quick Actions panel gaps
  (Q-1…Q-7) + 2 deferred items (D-1 ignoreBuildErrors, D-2 bucket eviction)
- Next: write remediation-plan-session3.md, TDD execution, live parity re-verification

---
Task ID: 18
Agent: main agent
Task: Session 3 — TDD remediation execution, verification, screenshots, docs, push

Work Log:
- Wrote docs/remediation-plan-session3.md (9 findings: Q-1…Q-7 + D-1/D-2, TDD order,
  non-goals); validated against the codebase before executing
- RED: 2 new unit suites (tests/next-config.test.ts, tests/rate-limit.test.ts) + 6
  new/reworked e2e specs in dashboard.spec.ts — all failed exactly as predicted
  (7 unit failures incl. import-seam absence; 6 e2e failures incl. double-heading,
  bg-none container, label+gradient quick-add, visible minutes input, clone-only Done
  buttons, missing Update Note)
- GREEN: single-file rewrite of src/components/dashboard/QuickActions.tsx to the
  decompiled G1e/z1e/W1e/H1e/K1e behavior (container gradient morph + expanding
  overlay, header replacement, reference tile classes, placeholder-only quick-add
  with slate-700 submit, minutes-hidden timer with Play/Pause + completion alert,
  read-only top-5 history, Brainstorm 3-view create/edit/confirm-delete);
  react-hooks/set-state-in-effect respected via derived-idle timer display
- GREEN: next.config.ts typescript.ignoreBuildErrors REMOVED (build verified green
  + standalone e2e boots/passes without it — PAD §11 deferral resolved);
  rate-limiter throttled expired-bucket sweep (clock-regression safe) + test seam
- Flakes fixed: Log Activity strict-mode (residue + calendar text → converging
  cleanup + paragraph-role scoping); Brainstorm full-text measurement → FS-13
  (getByText matched the still-mounted textarea default-value text node under
  suite load → role-scoped locators + semantic truncation assertions)
- Alert discovery: reference's "Please set a valid duration." alert is unreachable
  dead code (start disabled at minutes=0) — mirrored faithfully, spec pins the
  disabled state; completion alert verified by a one-off Playwright run (passed)
- Full gate: lint clean · tsc clean · 53/53 unit · build green (self-type-checked)
  · 38/38 e2e × 2 consecutive full runs · smoke 25/25
- Live parity re-verified on BOTH apps (agent-browser): container/tiles/panel
  classes + computed gradients byte-identical; minutes hidden + lucide-pause while
  running; mobile-menu geometry re-pinned after the change (trigger 374/50, menu
  374/54/192)
- 13 screenshots in docs/screenshots/ (01–10 re-captured + 11/12/13 quickaction
  open panels) from the remediated dev server
- Docs realigned: README, PAD (§3/§8/§11/§12), AGENTS.md (commands, conventions,
  quirks, references), CLAUDE.md, flow-schedule_SKILL.md v1.2.0 (FS-12, FS-13,
  debugging row, appendices B/C), remediation-plan-session3.md execution record,
  docs/session_3-review.md, this worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 3 delivered: Quick Actions open-panel state now mirrors the decompiled
  reference exactly; e2e 34 → 38 specs; unit 44 → 53; the build type-checks itself;
  the rate-limiter can no longer leak
- Key new knowledge: FS-12 (parity = state machine, not screenshot — enumerate and
  pin every interactive state), FS-13 (textarea default-value text nodes match
  getByText — scope by role), dead-code mirroring (the unreachable alert is part of
  the contract)

---
Task ID: 19
Agent: main agent
Task: Session 4 — audit the never-decompiled sidebar cards + layout chrome

Work Log:
- git pull (fast-forward: docs/session_4.md — the operator's narrative of
  the session-3 remediation that produced c3a8ef8)
- Reviewed all five root docs + session_3-review.md, remediation-plan-
  session3.md, session_4.md, worklog — aligned with the tree; fast gates
  green at base (lint/typecheck/53 unit); env contract verified
  (DATABASE_URL file:../db/custom.db, db/ at root, .env.example matches)
- Mobile nav re-measured live on the reference at 390×844: trigger
  374/50/36, menu 374/54/192, items [Profile, Settings, Logout] —
  byte-identical to the clone's pin; NO Tailwind v4 regression on either app
- Audit target (per session-3 review's forward note): the dashboard sidebar
  cards + layout chrome that had never been decompile-verified. Decompiled
  ure (StatusCard), Y1e (DailyFocus), fre (AISummary), g0e (SkillsMap),
  X1e (Dashboard layout), are/rre (day rows/task blocks), Xne (TaskDialog)
  from the reference bundle; corroborated EVERYTHING live on the logged-in
  reference incl. a full Mark Complete round-trip (PATCH → completed → card
  advances) and the reference's own time-format bug
  ("Oct 6 AM1791284400 11:00" — date-fns `a`/`t` tokens in "MMM d at HH:mm")
- 26 gaps found across 8 surfaces: S-1..S-4 StatusCard (rich "Next Up" state
  machine: skeleton, priority badge, description, Clock row, 75% progress +
  "Ready", FUNCTIONAL Mark Complete, decorative ArrowRight; empty state
  p-6/raw-icon; loading skeleton), F-1..F-4 DailyFocus (WRONG fallback —
  Mark Twain, not Paul J. Meyer; vertical quote layout text-lg italic;
  Target affirmation icon; refreshTrigger re-fetch), A-1..A-6 AISummary
  (Brain icon + Sparkles live indicator; purple→pink Mood; blue/green
  chips; max-h-20; refreshTrigger), K-1..K-5 SkillsMap (loading skeleton;
  Award indicator; custom glass tooltip; capitalize legend percentage-only;
  m0e hexes #10B981/#8B5CF6/#F59E0B + #64748B fallback), W-1..W-4
  WeeklySchedule (space-y-1.5 day rows; minute-stacked zIndex;
  default-cursor cells; pre-07:00 spanning branch), D-1 Dashboard container
  (full-bleed p-4 md:p-6 lg:p-8, max-w-7xl removed), T-1 TaskDialog delete
  confirm, C-1 scrollbar cascade values, X-1 store taskVersion/completeTask
- Wrote docs/remediation-plan-session4.md; validated against the codebase
  (lucide exports, date-fns bug reproduction, recharts API, store seams)
  before executing

Stage Summary:
- 26 findings (S/F/A/K/W/D/T/C/X) + 2 judgment-call divergences documented;
  next: TDD remediation, gate, live parity, screenshots, docs, push

---
Task ID: 20
Agent: main agent
Task: Session 4 — TDD remediation execution, verification, screenshots, docs, push

Work Log:
- RED: tests/ai-defaults.test.ts (module absent) + domain.test.ts +3
  (skills hexes/lookup/name) + 6 new/reworked e2e specs — all failed as
  predicted (one test expectation corrected: "SELF CARE" not "SELF_CARE")
- GREEN: StatusCard/DailyFocusCard/AISummaryCard/SkillsMap rebuilt to the
  decompiled forms; WeeklySchedule chrome fixes (space-y-1.5 wrapper,
  zIndex 10+minutes, cursor removal, pre-07:00 branch); Dashboard container
  full-bleed; TaskDialog window.confirm; src/lib/ai-defaults.ts shared
  constants (client-safe); domain SKILL_COLORS/LOOKUP/skillRowName;
  globals.css scrollbar effective values; store taskVersion (bumped by
  create/update/delete, NOT completeTask) + completeTask + initial
  loadingTasks=true (first-paint skeletons; bootstrap drops when
  unauthenticated)
- Flakes fixed: "Skills Map" heading strict-mode substring collision →
  exact:true; skeleton-state evaluate race → waitForFunction on the
  loaded-state Award icon; legend span:last-child wrong match →
  :scope > span; chip filter regex → includes; e2e residue CASCADE
  (failed specs' tasks shifted planning top-3 chips + Next Up selection)
  → all E2E specs wipe the whole "E2E " family at start
- Gate: lint clean · tsc clean · 59/59 unit · build green (self-type-
  checked) · 43/43 e2e × 2 consecutive full runs · smoke 25/25
- Live parity re-verified on BOTH apps (agent-browser): page container
  1440=1440 full-bleed; Next Up card byte-identical + Mark Complete
  round-tripped on both; empty state identical; Mark Twain fallback +
  vertical DailyFocus identical; Brain+Sparkles/Award headers; space-y-1.5
  6px row gap; mobile trigger 374/50/36 (menu geometry pinned by the e2e
  spec — agent-browser cannot open Radix on the dev build, a tooling
  quirk documented in AGENTS.md)
- 15 screenshots in docs/screenshots/ (01–09 re-captured + 10–13 from
  session 3 still current + new 14-statuscard-nextup, 15-taskdialog via
  scripts/capture-screenshots.mjs — Playwright trusted clicks)
- Docs realigned: README (features/testing/tree/screenshots), PAD (§3 tree,
  §11 format-bug + store-seam notes, §12 ledger + 2 new parity rows),
  AGENTS.md (counts, sidebar-card + chrome conventions, 4 new quirks,
  references), CLAUDE.md (counts, testing), flow-schedule_SKILL.md v1.3.0
  (FS-14, 3 debugging rows, appendices B/C), remediation-plan-session4.md
  execution record, docs/session_4-review.md, this worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 4 delivered: the sidebar cards now mirror the decompiled
  reference exactly (state machines included); e2e 38 → 43 specs; unit
  53 → 59; the fallback content and layout chrome are pinned surfaces
- Key new knowledge: FS-14 (content-presence checks are not parity —
  fallbacks and chrome are surfaces), bug parity beyond dead code (the
  format-string bug), residue cascades are cross-spec (wipe the E2E
  family), agent-browser vs Radix on the dev build (the e2e spec is the
  pin)

---
Task ID: 21
Agent: main agent
Task: Session 5 — audit the login/routing surface (the last unexamined
surface per docs/session_5.md's forward pointer) + remediation

Work Log:
- git pull (fast-forward: docs/session_5.md — the operator's session-4
  narrative); base main @ 8ae844d; fast gates green at base
  (lint/tsc/59 unit); env/db/screenshots/.env.example verified intact
- Audit: live-measured the reference's base44 login screen in ALL FOUR
  view states (sign-in, sign-up, forgot-password, reset-sent) + the
  error/mismatch alert cards + the unauth guard redirects + the
  authenticated root route + the custom 404; found 21 gaps
  (L-1…L-22, N-1, G-1, R-1, E-1) — the login page was a session-0
  "reasonable design" never measured (FS-15 blind-spot class)
- Plan saved to docs/remediation-plan-session5.md; validated against
  the codebase (getSessionUser exists for the guard; URL assertions
  inventoried; sitemap has no test pin; smoke-test page-check flow)
- RED: reworked tests/e2e/auth.spec.ts (13 specs) + new
  tests/e2e/not-found.spec.ts — 12 failed as predicted against the
  pre-fix build
- GREEN: login/page.tsx rewritten as a four-view state machine with the
  reference's exact chrome (public/logo.png from the reference's own
  asset; rounded-2xl card + slate top bar; bg-slate-50/50 inputs;
  slate-900 solid submit; separate sign-up [Confirm Password, no Name]
  + forgot + reset-sent views; shadcn-style red/green [role=alert]
  cards; "Invalid email or password" — no period); (app)/layout.tsx
  server-side session guard (getSessionUser → redirect /login);
  DashboardView island served at BOTH "/" (new (app)/page.tsx) and
  "/Dashboard" (root redirect page deleted); not-found.tsx (the
  reference's 404); sitemap gains "/"; smoke restructured (30 checks);
  .gitignore/eslint ignores gain reference/ (scratch bundle chunks)
- Flakes fixed: Next route announcer role=alert strict-mode collision →
  :not(#__next-route-announcer__); getByLabel("Password") substring →
  exact: true
- Gate: lint clean · tsc clean · 59/59 unit · build green ((app) routes
  now dynamic — guard reads cookies; /_not-found static) · 51/51 e2e × 2
  consecutive full runs (43 → 51) · smoke 30/30
- Live parity re-verified on BOTH apps (agent-browser): 13/13 key login
  class strings byte-identical (JSON diff); error alert + views + guard
  redirects + post-login "/" landing identical; 404 + Go Home verified;
  mobile trigger 374/50/36 on both, reference menu re-measured
  374/54/192 — no Tailwind v4 regression
- 20 screenshots (01 re-captured + new 16-20) via the state-gated
  capture script
- Docs realigned: README, AGENTS.md (login convention + root/guard
  invariant + 2 quirks), CLAUDE.md, PAD (§3/§8/§11/§12),
  flow-schedule_SKILL.md v1.4.0 (FS-15), remediation-plan-session5.md
  execution record, docs/session_5-review.md, this worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 5 delivered: the logged-out surface (login views, guards,
  root route, 404) is now live-measure-pinned like every authenticated
  surface; e2e 43 → 51 specs; smoke 25 → 30 checks
- Key new knowledge: FS-15 (the logged-out surface is a parity surface
  too), routing IS parity (landing URL, guards, 404), Next's route
  announcer carries role=alert, the reference's login is the base44
  platform screen (design language: slate-900 submits, rounded-xl,
  bg-slate-50/50 inputs)

---
Task ID: 22
Agent: main agent
Task: Session 6 — audit the state-matched surfaces (full class-tree diff)
+ remediation of the small-gap family + the structural Planning finding

Work Log:
- git pull (fast-forward: docs/session_6.md — the operator's session-5
  narrative); base main @ d99d8ae; fast gates green at base
  (lint/tsc/59 unit); env/db/screenshots/.env.example verified intact
- Audit method upgrade: the reference account holds 0 tasks + 0 notes
  (verified via its entity API — the entity is "Note"), so an empty user
  was registered in the clone and the FULL <main> DOM class tree was
  dumped and element-wise diffed on both apps (dashboard 761 elements,
  Planning unselected 63, day-selected 98/106)
- 8 gaps found: P-1 the Planning selected-day sections were Radix
  Accordions (the reference ships always-visible Cards — CardTitle a
  div, no heading role, no collapse), P-2 dialog submit "Add Task"/
  "Save Changes" → reference "Create Task"/"Update Task" (a session-0
  inference that had crept into the e2e pin), P-3/P-4 dialog footer
  (Save icon mr-2, no text-white, Delete mr-2, flex gap-3 ml-auto),
  P-5 Planning header icons missing mr-2 (measured 89.1px vs 100.7px),
  P-6 Add Task button clone-only hover gradient + text-white, P-7 the
  Refresh Calendar button (invented icon_sm h-9 w-9 = 36px vs the
  reference's dead-variant content-size 30px), F-1 the status-card e2e
  spec's page-wide locators are TIME-OF-DAY dependent (strict-mode
  violation + impossible count(0) whenever now+5min is inside the
  07:00–22:00 grid; sessions 4/5 passed only pre-07:00 UTC; this
  session's 09:0x run exposed it — 50/51 at base)
- Profile/Settings suspected as the last unverified surface: full bundle
  decompile — already byte-identical (the session-4 claim holds)
- Plan saved to docs/remediation-plan-session6.md; validated against the
  codebase (Card imports, Save icon, cn/twMerge output, spec lines)
  before executing
- RED: 10 spec failures predicted and confirmed against the pre-fix
  build (8 planning + 2 dashboard)
- GREEN: Planning Accordions → Card/CardHeader/CardTitle/CardContent;
  TaskDialog footer rebuilt to the decompile; header icons mr-2;
  button.tsx icon_sm "" (dead-variant mirror); status-card spec
  re-scoped to the StatusCard via its Next Up heading (de-flaked);
  mid-GREEN fix: the chevron-count assertion scoped to main (the
  header avatar ships its own chevron)
- Gate: lint clean · tsc clean · 59/59 unit · build green (19 routes) ·
  54/54 e2e × 2 consecutive full runs (51 → 54; the de-flaked spec
  verified INSIDE the previously failing 09:0x UTC window) · smoke
  30/30
- Live parity re-verified on BOTH apps (agent-browser): Planning
  day-selected class tree 98/98 (was 98/106); dashboard 761/761 (only
  the 2 documented lucide polyline/path internals); dialog verified in
  both create ("Create Task" + Save icon) and edit ("Update Task",
  Delete mr-2) modes; Refresh button 30×30 on both; mobile menu
  re-pinned 374/54/192 after the changes — no Tailwind v4 regression
- Screenshots: 02-dashboard, 03-planning, 10-planning-selected,
  15-taskdialog re-captured (the changed surfaces) via the extended
  capture script (gained the desktop 02/03/10 captures)
- Docs realigned: README, AGENTS.md (card convention, TaskDialog footer
  + icon_sm dead-variant quirks, FS-16, session-6 references), CLAUDE.md,
  PAD (§8/§10.1/§12 ledger — 8 new session-6 rows),
  flow-schedule_SKILL.md v1.5.0 (FS-16, 4 debugging rows, session
  history), remediation-plan-session6.md execution record,
  docs/session_6-review.md, this worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 6 delivered: the exhaustive state-matched class-tree diff
  closed the small-gap family (icon margins, button sizes, class
  extras) that selected-element checks had skipped, plus one
  structural fix (Accordion → Card) and one de-flake (FS-16);
  e2e 51 → 54 specs; both apps now diff at 761/761 and 98/98 elements
- Key new knowledge: FS-16 (time-of-day locators — two green runs
  prove nothing about the other 22 hours), dead config is parity data
  (icon_sm), specs can inherit wrong inferences (the dialog label pin)

---
Task ID: 23
Agent: main agent
Task: Session 7 — audit the POPULATED-state surfaces (first matched-data
diff) + remediation of the ordering family, the recharts major, the Badge
form + the state-transition spec de-flake

Work Log:
- git pull (fast-forward: docs/session_7.md — the operator's session-6
  narrative); base main @ 58d471f; fast gates green at base
  (lint/tsc/59 unit); env/db/screenshots/.env.example verified intact
- Audit method upgrade: session 6 diffed EMPTY states; this session
  created 4 identical tasks through each app's own TaskDialog (Parity
  Alpha 10:00/work/high, Beta 12:00/personal/medium, Gamma 15:00/health/
  urgent, Delta 08:00/learning/low) and diffed the POPULATED state
- 4 gaps found: G-1 the tasks API ordered startTime asc vs the
  reference's default fn.Task.list() = createdAt DESC (live: creating
  A→B→C→D renders [D,C,B,A]) — the Planning chips (slice 0,3 + "+N
  more") and the selected-day list render the array AS RETURNED so the
  visible chips differed; G-2 the store's createTask APPENDED (the
  reference's save → refetch → newest-first); G-3 recharts 3.10.1 vs
  the reference's 2.x pie DOM (no zIndex layers, no shape wrappers,
  tooltip after svg); G-4 the Badge was the modern span form vs the
  reference's classic shadcn DIV (focus-ring + shadow/hover classes)
- Also live-verified clean: mobile menu geometry (re-pinned 374/54/192),
  the desktop dropdown open-state geometry (FIRST-TIME measured —
  1136/54/192×164 right-anchored, identical), header class-tree
  (byte-identical), week-init (Ka(new Date,{weekStartsOn:1}) both — an
  observed previous-week display was session-6 view state), StatusCard
  selection logic (decompile + live), Log Activity (end_time desc
  equivalent), notes ordering (matches "-created_date")
- Plan saved to docs/remediation-plan-session7.md; validated against
  the codebase (route line 14, store line 239, recharts 2.15.4
  React-19 peer range, badge usage sites, spec locator patterns)
- RED: 4 spec failures predicted and confirmed on the pre-fix build
- GREEN: tasks route orderBy createdAt desc; store createTask prepend;
  recharts ^2.15.4 + bun install; badge.tsx rebuilt to the classic
  div form; mid-GREEN F-2 — the status-card spec failed (57/58):
  a standalone debug boot + a one-off Playwright script proved the APP
  correct (PATCH landed, card re-rendered to "All caught up!" in 3s)
  and the SPEC's locator wrong (a "Next Up"-only heading filter zeroes
  out on the empty-state transition → "element(s) not found" on the
  negated assertion; sessions 4-6 passed only pre-10:00-UTC on
  Sundays); locator broadened to /^(Next Up|All caught up!)$/, verified
  green inside the previously failing window
- Gate: lint clean · tsc clean · 59/59 unit · build green (19 routes)
  · 58/58 e2e × 2 consecutive full runs (54 → 58) · smoke 30/30
- Live parity re-verified on BOTH apps (populated): Planning unselected
  74/74 and day-selected 132/132 (only the documented filter/funnel
  icon + day-card div/button diffs); dashboard 845/838 (the 7-element
  delta = 3 styled-jsx STYLE + 4 LLM-content chips — documented);
  G-2 live (new task first, no reload); mobile menu re-pinned after
  the changes — no Tailwind v4 regression
- Reference data cleaned up (4 Parity tasks deleted via its UI —
  account back to 0 tasks); clone debug tasks removed
- Screenshots: all 20 captures re-run via scripts/capture-screenshots.mjs
- Docs realigned: README (recharts 2.15.x, planning row, 58 e2e),
  AGENTS.md (ordering-is-parity section, recharts + Badge quirks, F-2
  rule, session-7 references), CLAUDE.md, PAD (§1.2/§5.3/§8/§10.1/§12
  — 8 new session-7 ledger rows), flow-schedule_SKILL.md v1.6.0 (FS-17
  + the state-transition corollary, 5 debugging rows, session history),
  remediation-plan-session7.md execution record,
  docs/session_7-review.md, this worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 7 delivered: the first POPULATED-state class-tree diff
  (matched data on both apps) closed the ordering family (chips/list
  order), the recharts major (2.x pinned, DOM byte-parity), and the
  Badge primitive form; e2e 54 → 58 specs; Planning now diffs at
  74/74 and 132/132, dashboard 845/838 (all documented divergences)
- Key new knowledge: FS-17 (array ordering is a parity surface —
  class-tree diffs are blind to text and DOM order; populated-state
  diffs need matched data), library versions are parity data, the
  state-transition locator corollary (accept BOTH headings), and
  prove-the-app-first before fixing a spec (the debug boot)

---
Task ID: 24
Agent: main agent
Task: Session 8 — audit the never-diffed surfaces (next-week view,
edit-mode dialog) + remediation of the dead animation CSS, the lucide
version, the classic primitive family, and the asymmetric wire contract

Work Log:
- git pull (fast-forward: docs/session_8.md — the operator's session-7
  narrative); base main @ 567a6a6; full gates green at base
  (lint/tsc/59 unit/build/58 e2e/30 smoke); session-7 fixes verified
  in code (orderBy, prepend, recharts 2.15.4, classic Badge)
- Audit method: the never-diffed surfaces. Found "Live verify
  scheduled" (completed, work, Tue Oct 6 11:00) on the reference's
  NEXT week — session 5's Mark Complete live-verification residue;
  sessions 6/7's "0 tasks" checks only looked at the current week.
  Reproduced it on the clone (calendar dialog + Mark Complete) for a
  state-matched diff of both new surfaces
- Audit A (next-week view, first-time diff): 0 diffs across the entire
  calendar + Quick Actions region (elements 0-653); the task block at
  the identical DOM index [227] with identical classes; the remaining
  diffs are the documented styled-jsx STYLE node + today-data sidebar
  states (the demo user's seed tasks vs the reference's 0-tasks-today)
- Audit B (edit-mode dialog, first populated diff): 8 raw diffs → 3
  real findings: DialogTitle missing tracking-tight, SelectTrigger
  missing ring-offset-background/data-[placeholder]:, and the lucide
  trash DUAL class. Followed the primitives to their sources: the
  reference's DialogContent is the classic form (left-[50%],
  translate-x-[-50%], 4 slide classes, sm:rounded-lg) — the clone
  shipped the modern form
- Audit of the open Select listbox: SelectContent missing the side
  slide-in-from-* classes. Audit of the open menu: order-only class
  diffs (same set, style-neutral — documented as P-2, not fixed).
  Log Activity populated panel: identical entries. Mobile menu
  re-pinned live on both apps (338/14/36 + 182/54/192×164)
- G-1 discovered: the built stylesheet contains ZERO animate-in/
  fade/zoom/slide rules — tw-animate-css was in devDependencies but
  never imported; every Radix animation in the clone was a dead string
  (the reference's CSS defines .animate-in {enter, 0.15s})
- G-2 discovered: the reference's bundle banner says lucide-react
  v0.475.0 and its factory emits ONE class per icon; the clone's
  0.525.0 emits two for renamed icons + different icon nodes (LogOut
  path+path vs polyline+line — the documented internals divergence is
  version-driven)
- G-4 discovered: the API wire was asymmetric — requests spoke the
  documented snake_case while responses returned raw camelCase Prisma
  objects (with isSample/userId; notes' tags as a JSON string); P-1:
  README still said Paul J. Meyer for the daily-focus fallback
- Plan saved to docs/remediation-plan-session8.md; validated against
  the codebase (route input parsing, store mappers, e2e reader usage,
  lucide 0.475 peer range)
- RED: 7 wire-format unit tests + 5 new e2e specs (animation-name,
  tracking-tight, ring classes, single lucide class, snake_case
  response) — all failing as predicted on the pre-fix build
- GREEN: @import "tw-animate-css" in globals.css (+ dead
  tailwindcss-animate removed); lucide-react pinned ^0.475.0; the
  classic DialogContent/DialogTitle/SelectTrigger/SelectContent forms;
  src/lib/serialize.ts (serializeTask/serializeNote) wired into all 4
  task/note routes + mapTask/mapNote reading the snake_case wire
- E-C: mobile-navigation.spec.ts waits for getAnimations() to finish
  before measuring (boundingBox includes transforms); the capture
  script settles animations before the menu/dialog shots
- Gate: lint clean · tsc clean · 66/66 unit (59→66) · build green ·
  63/63 e2e × 2 consecutive full runs (58→63) · smoke 30/30
- Live parity re-verified: the EDIT-MODE dialog 0/62 byte-identical
  (incl. container + values); the next-week populated calendar 0 diffs
  in the calendar region; animation-name "enter" on both apps; the
  mobile menu re-pinned (identical geometry, now animated); the wire
  verified live (snake_case + tags arrays + no internal fields)
- Reference cleanup: "Live verify scheduled" deleted via the
  reference's own dialog (confirm armed); the clone twin deleted via
  the API — the reference account is back to the TRUE 0-task baseline
- Screenshots: all 20 captures re-run (the script now settles
  animations and re-captures profile/settings/quickaction/mobile
  views so the lucide 0.475 icons render)
- Docs realigned: README (P-1 row, wire API rows, lucide row, counts),
  AGENTS.md (4 new quirks + the snake_case-wire rewrite + session-8
  references), CLAUDE.md (stack + serializer seams + counts), PAD
  (§1.2/§4.1/§5.3/§8/§10.1/§12 — 9 new ledger rows),
  flow-schedule_SKILL.md v1.7.0 (FS-18 + 6 debugging rows + session
  history + the recharts/ignoreBuildErrors stack-table corrections),
  remediation-plan-session8.md execution record,
  docs/session_8-review.md, this worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 8 delivered: the first next-week and edit-mode-dialog class
  tree diffs closed the animation gap (tw-animate-css import — the
  dialog/menu/select now animate like the reference's), the lucide
  version pin (0.475.0, the reference's measured version), the classic
  dialog/select primitive forms (the edit dialog now diffs 0/62), and
  the snake_case response wire (serializeTask/serializeNote); e2e
  58 → 63 specs, unit 59 → 66; the reference account restored to the
  true 0-task baseline
- Key new knowledge: FS-18 (class equality is not CSS existence —
  grep the BUILT stylesheet; importing a utility library is
  load-bearing; geometry specs must settle animations), the lucide
  corollary (version banners and icon factories are decompilable —
  the "not actionable" internals divergence was a version pin waiting
  to be measured), populated-only surfaces keep yielding (diff BOTH
  dialog modes), wire contracts must be symmetric, and cleanup claims
  must match their probe scope (enumerate the API, not just the
  current week)

---
Task ID: 25
Agent: main agent
Task: Session 9 — audit + environment-authority + day-card parity remediation

Work Log:
- Workspace reset — fresh `git clone` (main @ e4c66e8); bun install; .env +
  db/ recreated per the operator's instruction; db:push + db:seed
- Reviewed the five root docs + session_8-review.md +
  remediation-plan-session8.md + worklog.md + session_9.md — all aligned
  with the tree; full gates re-executed green at base (lint · tsc · 66/66
  unit · build 19 routes · 63/63 e2e · smoke 30/30)
- Session-8 remediation spot-checked in code: tw-animate-css import,
  lucide ^0.475.0, classic dialog/select primitives, serializeTask/
  serializeNote in all 4 task/note routes — all present, pins held
- skills/ exclusions verified: eslint ignores, tsconfig excludes, vitest
  includes only src/ + tests/
- Read skills/skills-catalog.md; used: agent-browser (live diffing on
  BOTH apps), clone-app-pat-pro (parity method), tdd/tdd-workflow (red →
  green), verification-and-review-protocol; reviewed the scandihaven
  repo's root docs for the tech-stack pattern family
- Logged into the reference (sepnetflix2023@outlook.com) via
  agent-browser trusted clicks; the account is at the TRUE 0-task
  baseline (session 8's cleanup held)
- **F-1 discovered**: the first db:push/db:seed created and seeded
  /home/z/my-project/db/custom.db (OUTSIDE the repo) — the workspace
  harness exports DATABASE_URL=file:/home/z/my-project/db/custom.db into
  every shell, and a parent .env (Bun auto-loads parent dirs) does the
  same; db-path v2.3's pass-through let it win; a dev server booted in
  that shell fails every query once the parent file is gone
- Audit (state-matched: an empty parity-empty@flowschedule.app user in
  the clone vs the reference's 0 tasks): dashboard 761/761 desktop AND
  mobile (only the 3 documented style nodes); Planning 63/63 + 98/98
  modulo the day-card div/button; Profile 26/26; Settings 39/39; the
  OPEN Select listbox item states byte-identical (session 8's
  suggestion, first-time diff); mobile menu re-pinned (338/14/36×36 +
  182/54/192×164, animation enter, navigation round-trip); desktop
  avatar menu re-pinned (1252/14/76×36 + 1136/54/192, right 1328); both
  LLMs observed LIVE (reference: Paul J. Meyer quote; clone: Walt
  Disney quote — P-1, the fallback claims remain about catch blocks)
- Wrote docs/remediation-plan-session9.md (F-1 db-path v3 + CLI wrapper,
  F-2 day-card div, F-3 docs narrative, P-1 observation); validated the
  plan against the code (locator sites, fixture structure, e2e env
  precedence) before execution
- TDD RED: 21 failing unit tests (chooseEnvSource/repoEnvDatabaseUrl
  absent; wrapper contract) + 1 failing e2e spec (day-card div pin)
- TDD GREEN: db-path v3 (chooseEnvSource + repoEnvDatabaseUrl +
  exported findSchemaRoot; 17 new unit tests); scripts/prisma-cli.ts +
  package.json db:push/db:migrate/db:reset rerouted (5 contract tests);
  Planning day-card button → the reference's plain div (no text-left);
  badge-spec locator retargeted to :not([class*=cursor-pointer]) (the
  tag-discriminator cascade — FS-19 locator corollary); 10 spec locator
  sites + the capture script updated
- Gate (in the POLLUTED shell — the point of F-1): lint clean · tsc
  clean · 88/88 unit (66 → 88) · build green · 64/64 e2e × 2 consecutive
  full runs (63 → 64) · smoke 30/30; the e2e isolation survived (the
  webServer's file:../db/e2e.db resolves INSIDE the repo → ambient wins)
- Live parity re-verified on BOTH apps: Planning unselected 63/63 and
  day-selected 98/98 IDENTICAL (the class trees are now 100% matched);
  dashboard 761/761 + 3 style nodes; mobile menu re-pinned; the F-1
  acceptance in the polluted shell (db:push/db:seed target <repo>/db/,
  dev server serves the seeded repo DB, login + health + CRUD green)
- Screenshots: all 20 captures re-run on the remediated codebase
- Docs realigned: README, AGENTS.md (the parent-.env quirk rewritten to
  the v3 authority), CLAUDE.md (new DB authority section), PAD (§4.3
  priority table + 10 ledger rows), flow-schedule_SKILL.md v1.8.0 (FS-19
  + env-trap rewrite + session-9 history), .env.example (v3 contract),
  DEPLOYMENT.md §4, remediation-plan-session9.md execution record,
  docs/session_9-review.md, this worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 9 delivered: db-path v3 — the repo's own .env is AUTHORITATIVE
  for DATABASE_URL (parent-workspace/harness hijack protection, the e2e
  isolation override preserved, the production provider override
  preserved; the CLI applies the same rule via scripts/prisma-cli.ts);
  the Planning day cards converted to the reference's plain clickable
  divs — Planning now diffs 100% IDENTICAL in both states; the open
  Select listbox states verified byte-identical for the first time; both
  LLMs observed live (P-1). Unit 66 → 88, e2e 63 → 64 (×2)
- Key new knowledge: FS-19 (a pass-through env seam is a policy vacuum —
  pin WHERE the value is consumed; one rule, two enforcement points;
  acceptance-test the environment itself), the locator corollary (tag
  discriminators silently retarget on tag conversions — discriminate on
  a class the reference's DOM guarantees), and LLM-content-vs-fallback
  evidence discipline (live output is not the fallback)

---
Task ID: 26
Agent: main agent
Task: Session 10 — Focus Timer running-state + populated Log Activity audit, attribute-inventory method, strict-formatter + data-slot remediation

Work Log:
- Workspace refreshed via git pull (main 7c26edd → be137a4, docs only);
  five root docs + session_9-review + remediation-plan-session9 +
  worklog + session_10 re-read and validated against the tree; full
  gates green at base (lint · tsc · 88/88 unit · build 19 routes ·
  64/64 e2e · smoke 30/30); dev server re-verified on the repo's own
  seeded db/custom.db (the session-9 F-1 acceptance)
- skills/ exclusions verified (eslint/tsconfig/vitest — unchanged);
  read skills/skills-catalog.md; used: agent-browser (live diffing on
  BOTH apps), clone-app-pat-pro (parity method), tdd/tdd-workflow,
  verification-and-review-protocol; scandihaven's vitest/playwright
  configs re-checked as the family pattern
- Logged into the reference (sepnetflix2023@outlook.com); the account
  still at the 0-task baseline; created 3 tasks through its own dialog
  (2 past-todo + 1 future completed via Mark Complete) and the same 3
  instants on the clone (parity-s10@flowschedule.app)
- Focus Timer (session 9's suggested surface): started the timer on
  BOTH apps — the running-state AND paused-state panel class trees are
  byte-identical; minutes input hidden while running on both; pause
  snaps the display back to 25:00 on both; W1e re-decompiled from the
  live bundle; the completion alert LIVE-verified on the reference
  (alert hooked, minutes=1: 01:00 → 00:00 → "Focus session complete!"
  → snap back) — previously only decompile + one-off evidence
- Log Activity (session 9's suggested surface): populated panel
  structure byte-identical (items, labels, order, top-5 slice) — but
  F-2: the relative-time WORDS diverged ("about 3 hours ago"/"in 1
  day" vs "3 hours ago"/"in 2 days"); bundle decompile identified the
  reference's GJ = formatDistanceToNowStrict (plain xHours/xDays +
  Math.round; both apps bundle the same enUS locale)
- NEW audit method — the attribute-inventory diff (all attribute NAMES
  on both DOMs): F-1 found (the clone's 24 data-slot sites across 9
  shadcn primitives vs the reference's zero in every state — invisible
  to class-tree diffs, which extract only class); F-3 found during
  F-1's verification (the title input's maxLength={300} the reference
  does not carry); the remaining extras confirmed as the documented
  a11y floor + dev-mode artifacts
- Wrote docs/remediation-plan-session10.md (F-1/F-2/F-3 + P-1); plan
  validated against the code (call sites, attribute sites, e2e
  insertion points, drift-stable discriminator) before execution
- TDD RED: 2 new e2e specs failed on the base build (the strict
  wording + the data-slot counts) + the maxlength pin RED-verified
  separately
- TDD GREEN: formatDistanceToNowStrict (one import + one call site in
  QuickActions.tsx); 24 data-slot deletions across the 9 primitives;
  the maxLength removal (server 300-char guard kept)
- Gate: lint clean · tsc clean · 88/88 unit · build green · 66/66 e2e
  × 2 consecutive full runs (64 → 66) · smoke 30/30
- Live parity re-verified on BOTH apps: the populated Log Activity
  panel diffs IDENTICAL post-fix; [data-slot] count 0 idle + dialog;
  mobile menu re-pinned POST-fix (338/14/36×36 + 182/54/192×164,
  right 374, enter, navigation round-trip); desktop avatar menu
  re-pinned POST-fix (1252/14/76×36 + 1136/54/192, right 1328)
- Screenshots: all 20 captures re-run; .env/.env.example contract
  unchanged (its test green); docs realigned: README, AGENTS.md,
  CLAUDE.md, PAD (§8 counts + §12 ledger + date),
  flow-schedule_SKILL.md v1.9.0 (FS-20 + FS-21 + conventions +
  history), remediation-plan-session10 execution record,
  docs/session_10-review.md, this worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 10 delivered: the Focus Timer verified at FULL parity in
  every state (incl. the live-verified completion alert); the
  populated Log Activity at full parity after F-2 (the strict
  formatter); the DOM attribute class cleaned after F-1 (zero
  data-slot) and F-3 (the uncapped title input) — with the new
  attribute-inventory audit method (FS-20) and the formatter-variant
  lesson (FS-21) recorded. Unit 88, e2e 64 → 66 (×2)
- Key new knowledge: FS-20 (a parity method built on ONE attribute has
  a blind spot — inventory-diff all attribute names periodically;
  generator conventions are not the reference's conventions), FS-21
  ("uses date-fns" is a family claim — pin the VARIANT; band-stable
  discriminators), and the populated-diff discipline (same data on
  both apps through their own UIs before blaming code)

---
Task ID: 27
Agent: main agent
Task: Session 11 — >5-item Log Activity top-5-slice + Brainstorm deeper-state audit, the three pin specs (G-1/G-2/G-3) with mutation evidence

Work Log:
- Workspace refreshed via fresh git clone (main a8e2987); .env re-created
  from .env.example (DATABASE_URL="file:../db/custom.db" + generated
  AUTH_SECRET); db/ at the repo root; db:push + db:seed; dev server
  verified healthy (database "up", login + CRUD green) in the
  ambient-polluted shell — the harness exports a parent-workspace
  DATABASE_URL resolving OUTSIDE the repo; db-path v3 ignored it and
  the repo's own DB was served (the session-9 F-1 acceptance re-proven
  on a clean clone)
- Five root docs + session_10-review + remediation-plan-session10 +
  worklog + session_11 re-read and validated against the tree; full
  gates green at base (lint · tsc · 88/88 unit · build 19 routes ·
  66/66 e2e · smoke 30/30); skills/ exclusions verified (eslint ·
  tsconfig · vitest include patterns)
- Read skills/skills-catalog.md; used: agent-browser (live diffing on
  BOTH apps), clone-app-pat-pro (parity method), tdd/tdd-workflow,
  verification-and-review-protocol
- Logged into the reference (sepnetflix2023@outlook.com; session held);
  the account carried session 10's 3 parity tasks
- Log Activity (session 10's suggested surface): created 4 more tasks
  on the reference through its own dialog (Top5 Parity D/E/F + a
  cross-week G at -12d) → 7 qualifying items on BOTH apps (the same
  instants seeded on the clone via its API, parity-s11@flowschedule.app);
  the panels render IDENTICALLY — exactly the newest 5 by end_time desc,
  the 6th (4.5d) and 7th (12d cross-week) CUT on both; the one wording
  difference ("24 hours ago" vs "1 day ago") resolved to an
  observation-time artifact (the strict formatter's hour/day boundary
  sits at exactly 24h — P-1); H1e re-decompiled from the live bundle:
  d.status==="completed" || d.end_time && Wc(d.end_time) < l — the NULL
  guard and the once-per-mount now-capture match the clone exactly
- Brainstorm (session 10's suggested surface): empty → create → list
  (30-char truncation) → viewNote/edit → update → empty-save no-op →
  confirm text (hooked window.confirm) → multi-note ordering — every
  state diffs IDENTICAL on both apps (class trees, text, behavior)
- Standing re-pins: mobile menu 390×844 (trigger 338/14/36×36 right
  374; menu 182/54/192×164 right 374; items [Profile, Settings,
  Logout]; animation enter; navigation round-trip) and desktop avatar
  menu 1440×900 (trigger 1252/14/76×36; menu 1136/54/192×164 right
  1328) — identical on both apps; the sticky-header scroll-away
  behavior probed identical on both (P-2) — no Tailwind v4 regression
- Wrote docs/remediation-plan-session11.md (G-1 top-5-slice pin, G-2
  empty-save no-op pin, G-3 multi-note order pin, P-1 band boundary,
  P-2 sticky header); plan validated against the code (insertion
  points, locator patterns, API contracts) before execution
- Pin phase: G-1 spec (7 seeds, count/order/cut/wordding) + the
  extended Brainstorm spec; two wrong-test traps hit and fixed during
  the RED runs (page-level count while the create view masks the list;
  .first()/.last() colliding with the seed's own notes — asserted
  within the E2E family via DOM indices)
- Mutation (RED evidence) phase: 3 deliberate regressions applied and
  rebuilt — the slice removal FAILED the G-1 spec (the exact regression
  class session 10 worried about); the client guard deletion and the
  store-prepend flip stayed GREEN with enforcement-layer findings (the
  no-op is server-validated in /api/notes; the rendered order is the
  refreshNotes() re-fetch — the pins guard the behavior surface);
  mutations reverted, tree verified clean, rebuilt
- Gate: lint clean · tsc clean · 88/88 unit · build green · 67/67 e2e
  × 2 consecutive full runs (66 → 67) · smoke 30/30
- Screenshots: all 20 captures re-run; .env/.env.example contract
  unchanged (its test green); docs realigned: README, AGENTS.md (4 new
  convention bullets + the Reference section), CLAUDE.md, PAD (§8
  counts + 6 ledger rows + date), flow-schedule_SKILL.md v2.0.0 (FS-22
  + debugging rows + session-11 history), remediation-plan-session11
  execution record, docs/session_11-review.md, this worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 11 delivered: the two suggested surfaces audited at FULL
  PARITY (the saturated top-5 slice live-diffed identical on both apps
  with the H1e null-guard decompile closing the one reachable edge;
  the Brainstorm deeper states identical in every probed state) — and
  the parity made DURABLE with three pin specs (the saturated slice
  with mutation evidence, the empty-save no-op, the newest-first
  order), the audit's real deliverable being the pin layer rather than
  code changes. Unit 88, e2e 66 → 67 (×2)
- Key new knowledge: FS-22 (live-verified ≠ pinned — member-level
  seeds never exercise list-capacity boundaries; pin the saturated
  state; take mutation evidence; document which layer enforces the
  behavior), the 24h band-boundary discriminator rule (generalizing
  FS-21), and the two wrong-test traps (assert from the view where the
  list is mounted; scope order assertions within the test's own title
  family)

---
Task ID: 28
Agent: session-12 remediation agent
Task: Session 12 — audit the two session-11 suggested surfaces (the
quick-added null-time task's surfacing; the Notes tags round-trip),
re-pin the mobile/desktop menus, and remediate whatever the audit
finds (TDD, docs, screenshots, push to main).

Work Log:
- git pull (main d29b480 → c414774, adds docs/session_12.md);
  re-read the five root docs + session_11-review +
  remediation-plan-session11 + worklog; full base gate re-executed:
  lint ✓ · tsc ✓ · 88/88 unit · build ✓ (19 routes) · 67/67 e2e in
  3.1 m — the codebase matched its documented state exactly
- Audit target 1 (quick-added task surfacing): quick-added
  "NullSurf S12 Probe" through the reference's own z1e panel, then
  enumerated EVERY surface on the reference — calendar (no block, no
  start_time), Planning day cards (no chip), StatusCard ("All caught
  up!" unchanged), Log Activity (H1e null guard), and the AI Summary
  prompt (read from the intercepted InvokeLLM request: only TODAY's
  tasks listed) — the task is INVISIBLE everywhere on BOTH apps; the
  intercepted entity GET confirms the quick-add defaults
  (work/medium/todo/null-times/null-description) match the clone
  byte-for-byte. Full parity, no action
- Audit target 2 (Notes tags): live-captured the reference's
  GET entities/Note?sort=-created_date response — tags:[] on every
  note (session 8's array inference confirmed first-hand); K1e
  create/update only ever sends {content} — parity
- METHOD UPGRADE — XHR interception on the logged-in reference page
  (patched XMLHttpRequest open/send): captured the live Task/Note
  entity JSON and the InvokeLLM request bodies. Found FOUR
  wire-contract divergences: W-1 the reference ships
  created_date/updated_date (the clone's created_at/updated_at was
  session 8's inferred name), W-2 the reference ships is_sample/
  created_by (author's email)/created_by_id (the clone stripped
  them), W-3 the reference's TaskDialog submits a client-computed
  end_time (its decompiled f function; the clone's dialog sent none),
  W-4 the reference's dialog submits description verbatim ("" stays
  ""; the clone coerced to null). Zero-consumer proof gathered first
  (bundle: created_at×0/is_sample×0/created_by×0; repo: no
  created_at consumer outside the store mapper/serializer)
- Wrote docs/remediation-plan-session12.md (W-1..W-4 + P-1 the
  30.0 float + P-2 the app-logs beacon, TDD steps, mutation plan);
  plan validated against the code (insertion points, locator
  patterns) before execution
- R-1 (W-1/W-2) RED-first: wire-format.test.ts re-pinned to the
  captured shapes (created_date/updated_date, is_sample, created_by/
  created_by_id, the exact 14-key Task / 9-key Note sets, the author
  argument) — 4 tests failed against the pre-change build; then
  serializeTask(task, author)/serializeNote(note, author) + the 6
  route call sites + the store types/mappers — wire-format 8/8
- R-2 (W-3/W-4) RED-first: the planning "Add Task dialog" spec
  gained a page.route POST-body interception pin (end_time =
  start + 45 min; description "" verbatim); TaskDialog now computes
  end_time client-side (the reference's f function, verbatim) and
  submits the description as-is; the API accepts an optional
  validated end_time (caller-supplied wins; start+duration
  derivation remains the fallback for quick-add/completeTask);
  the e2e G-4 spec re-pinned to the captured response shape
- MUTATION (RED) evidence: M-1+M-2 (serializer reverted to
  created_at, author/sample fields dropped) → 3 wire-format pins
  FAIL; M-3+M-4 (dialog drops end_time, description trim→null) →
  the interception spec FAILS. Mutations reverted, tree verified,
  rebuilt
- Gate: lint ✓ · tsc ✓ · 89/89 unit (88→89: the author/shape pins) ·
  build ✓ (19 routes) · 67/67 e2e — one Focus Timer countdown
  timing flake in run 1 (spec 129, W1e timer code untouched), then
  TWO consecutive full green runs; smoke via /api/health (the
  ambient-polluted shell held: the repo's own db/custom.db served)
- Live wire re-capture diff: the clone's /api/tasks returns the
  captured 14-key set, /api/notes the 9-key set — key-for-key
  IDENTICAL to the reference's wire (is_sample: true on seeded rows,
  created_by = the session user's email)
- Mobile + desktop menu pins green inside every full e2e run — no
  Tailwind v4 regression (the wire changes touch no CSS)
- All 20 screenshots re-captured; docs realigned: README, AGENTS.md
  (the session-12 conventions + Reference), CLAUDE.md, PAD (§4.1
  wire contract + §8 counts + 10 ledger rows), flow-schedule_SKILL.md
  v2.1.0 (FS-23 + session-12 history), remediation-plan-session12
  execution record, docs/session_12-review.md, this worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 12 delivered: both suggested surfaces audited at FULL
  PARITY (the quick-added task is invisible on both apps — the
  reference's own design; the tags array capture-confirmed) — and the
  audit's real finding, FOUR wire-contract divergences revealed by
  the session's live XHR interception of the reference's own base44
  traffic, all fixed pin-first with mutation evidence and closed out
  with a key-for-key live wire diff. Unit 88 → 89, e2e 67 (×2
  consecutive)
- Key new knowledge: FS-23 (a captured wire beats an inferred wire —
  decompile shows what the code SENDS, only the wire shows what the
  server RETURNS; prove zero consumers before renaming; pin exact
  key sets), and the zero-consumer rename discipline (the cheapest
  parity win there is)

---
Task ID: 29
Agent: session-13 remediation agent
Task: Session 13 — audit the session-12 suggested target (the two
InvokeLLM request bodies: the Daily Focus + AI Summary prompts and
their response_json_schema), re-pin the mobile/desktop menus, and
remediate whatever the audit finds (TDD, docs, screenshots, push to
main).

Work Log:
- git pull (main 0a7f7f6 → 9485de5, adds docs/session_13.md);
  re-read the five root docs + session_12-review +
  remediation-plan-session12 + worklog + session_13.md; full base
  gate re-executed: lint ✓ · tsc ✓ · 89/89 unit · build ✓ (19 routes)
  · 67/67 e2e in 3.2 m — the codebase matched its documented state
  exactly
- Audit target (the InvokeLLM bodies): XHR-patched the logged-in
  reference (session 12's method) UPGRADED with request-HEADER
  capture — the base44 SDK sends Authorization: Bearer … + X-App-Id
  + X-Origin-URL (plain fetch from the page CORS-fails without
  them), enabling direct entity round-trips (probe creation +
  cleanup). Triggered both LLM re-fetches with client-side quick-add
  mutations (direct API POSTs do NOT bump the reference's
  refreshTrigger); captured 4 InvokeLLM bodies (1-task + 2-task
  summary variants after an API-created second today-scheduled
  task); decompiled fre/Y1e from the live bundle
- FINDINGS: the Daily Focus prompt is byte-identical to the clone's
  (all three fallback constants also match); the AI Summary prompt
  has FOUR formatting divergences (L-1..L-4: the reference's 8-space
  "blank" lines, the blank line between date and first task, the
  per-task template + \n join with its blank-line pair between
  tasks, the trailing space on item 3) and ONE order divergence
  (L-5: fn.Task.list()'s createdAt-desc — the 2-task capture lists
  the newest-created task FIRST despite a later start_time,
  disproving the clone's startTime-asc query)
- Wrote docs/remediation-plan-session13.md (L-1..L-5 + P-3
  response_json_schema as platform validation + P-4 sampling params
  + P-5 the date param, TDD steps, mutation plan); plan validated
  against the code (insertion points, the file-read precedent)
  before execution
- R-1/R-2 RED-first: tests/ai-prompt.test.ts — the two captured
  prompts pinned BYTE-FOR-BYTE (whitespace-safe line-join
  construction), order preservation, the route-source contract
  (createdAt desc, the next-config/db-cli file-read precedent), and
  NEW evidence class: mocked-SDK wiring pins (vi.mock
  "z-ai-web-dev-sdk") asserting the exact prompt bytes reach
  chat.completions.create — the first unit-level evidence for a
  server-side call the e2e can never intercept. Granular RED:
  builder pins green after the module, the route pin + wiring pin
  RED against pre-change code
- R-1 GREEN: src/lib/ai-prompt.ts (pure, the ai-defaults pattern)
  — DAILY_FOCUS_PROMPT + buildAiSummaryPrompt (the decompiled fre
  template, source-for-source); ai.ts wired to both; R-2 GREEN:
  /api/ai/summary orderBy createdAt desc
- E-1 FOUND BY THE GATE: the post-change e2e failed 12 seeded-task
  specs at 00:15 UTC Monday after a 67/67 baseline at 23:40 UTC
  Sunday — the seed anchors its scheduled samples to the week the
  DB was FIRST seeded, the idempotency guard never re-anchors, and
  the calendar always renders the current week (the FS-16 family at
  WEEK granularity; pre-existing, not caused by the LLM changes)
- E-1 RED-first: tests/sample-week.test.ts (weekMonday identity,
  the staleness decision ×4, the seed source contract); GREEN:
  src/lib/sample-week.ts (pure) + the seed's re-anchor (stale →
  deleteMany is_sample rows → re-create on the current week; user
  rows never touched) — the dev seed re-anchored live ("Sample
  tasks re-anchored… Seeded 9 sample tasks"), within-week reruns
  stay no-ops ("already present (9) — skipped")
- MUTATION (RED) evidence: M-1 (builder reverted to the old format)
  → 3 pins FAIL; M-2 (route startTime flip) → the route pin FAILS;
  M-3 (item template loses its leading newline) → 3 pins FAIL; M-4
  (ai.ts inline prompt) → the wiring pin FAILS; M-5 (seed re-anchor
  removed) → the seed pin FAILS. All reverted, tree verified
- Gate: lint ✓ · tsc ✓ · 102/102 unit (89 → 96 ai-prompt → 102
  sample-week) · build ✓ (19 routes) · 67/67 e2e ×2 consecutive
  (3.3 m + 3.1 m, through live SDK 429s — the fallbacks by design)
  · the dev server's /api/ai/summary round-tripped live (the 429
  fallback class) in the ambient-polluted shell (the repo's own
  db/custom.db served)
- Mobile + desktop menu pins green inside every full e2e run — no
  Tailwind v4 regression (the prompt/seed changes touch no CSS)
- All 20 screenshots re-captured (the re-anchored seed week
  visible); reference-account hygiene: the 3 session-13 probe tasks
  deleted via the captured auth headers
- Docs realigned: README, AGENTS.md (FS-24 + E-1 conventions + the
  Reference section + counts), CLAUDE.md (the AI prompt wire
  section), PAD (§7 byte-pinned prompts + §8 counts + §12 ledger
  rows), flow-schedule_SKILL.md v2.2.0 (FS-24 + FS-25 + session-13
  history + counts), remediation-plan-session13 execution record,
  docs/session_13-review.md, this worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 13 delivered: the session-12 suggested target audited with
  the interception method extended to the LLM wire (header capture +
  decompile) — the Daily Focus route at FULL byte parity; the AI
  Summary route's prompt brought to BYTE parity (L-1..L-4) with its
  task order corrected to the captured createdAt-desc (L-5), all
  pinned with a new evidence class (the mocked-SDK wiring pin);
  PLUS the gate itself surfaced the week-rollover seed flake (E-1),
  fixed in the seed layer so the suite self-heals. Unit 89 → 102,
  e2e 67 (×2 consecutive)
- Key new knowledge: FS-24 (the prompt IS the wire — pin LLM request
  bodies byte-for-byte incl. source-indentation artifacts; the
  mocked-SDK spy is the seam evidence for server-side calls; the
  task ORDER is the caller's input contract), FS-25 ("today"-anchored
  seeds rot at week boundaries — re-anchor in the seed, not the
  specs), and the base44 SDK-auth unlock (Authorization Bearer +
  X-App-Id + X-Origin-URL for direct entity round-trips)

---
Task ID: 30
Agent: session-14 remediation agent
Task: Session 14 — audit the session-13 suggested target (the
InvokeLLM RESPONSE side: the parse/render contract for both cards'
success paths), re-pin the mobile/desktop menus, close session-12 P-1
(the duration_minutes float formatting), remediate TDD-first, re-align
docs, push to main.

Work Log:
- git pull (main 55904a1 → 5d1b32c, adds docs/session_14.md); base
  gate green (lint · tsc · 102/102 unit · build 19 routes · 67/67 e2e
  in 1.9 m) — the codebase matched its documented state exactly
- Built the XHR response-OVERRIDE harness (Object.defineProperty on
  the instance's responseText/response/status — the reference's own
  card components read the overridden values) and ran FIVE edge-case
  probes: empty arrays → ZERO chips (RS-1); ["", "real area"] → an
  empty chip + "real area" (RS-2); empty mood/insights → empty <p>s
  (RS-3); {quote, author:"", affirmation:""} → the quote + "- " +
  empty affirmation (RS-4 — the guard is a && a.quote ONLY, the Y1e
  decompile); 5-item arrays → 3 chips (the render owns the slice)
- Natural captures: 3 InvokeLLM round-trips (Walt Disney ×2, the
  "Focused" summary) — the normal path parses identically on both
  apps; the card DOM (probe-extracted) matches class-for-class
- Session-12 P-1 CONFIRMED via raw-text token extraction on the
  reference's entity wire: "duration_minutes":60.0 / 30.0 / null —
  the Python backend serializes floats; the clone's JS emitted 60
- Remediated (TDD): tests/ai-response.test.ts (11 pins, the
  mocked-SDK pattern) RED 7/11 → the schema-SHAPE parse in
  src/lib/ai.ts (isString/isStringArray; quote-only focus guard; no
  truthiness, no length filters, no parse-level slicing) GREEN;
  tests/wire-float.test.ts (8 pins) RED → okWire (api.ts) +
  floatFormatDurations (serialize.ts) + the 3 task-route call sites
  + the raw-text e2e assertion GREEN; the live dev-server wire now
  ships 30.0/120.0/60.0/90.0/45.0/null
- MUTATION (RED) evidence M-1..M-5 (the harness outside the repo):
  M-1 truthiness revert → 2 pins; M-2 three-field-guard revert → 2
  pins; M-3 okWire drops the float call → 1 pin (after the pin was
  STRENGTHENED to match the CALL, not the import — the first run
  survived on the import line alone; the pin-strength lesson); M-4
  slice/filter revert → 2 pins; M-5 route ok revert → 1 pin. All
  reverted, tree verified
- Gate: lint ✓ · tsc ✓ · 121/121 unit (102 → 121) · build ✓ ·
  67/67 e2e ×2 consecutive (2.0 m + 2.0 m) · the dev server's routes
  round-tripped live (the raw wire float-formatted; the AI routes on
  the documented 429 fallback class)
- Mobile + desktop menu pins green inside every full e2e run — no
  Tailwind v4 regression (the parse/wire changes touch no CSS)
- All 20 screenshots re-captured; reference-account hygiene: the 8
  S14 probe tasks deleted via the captured auth headers (verified 0
  leftovers; the 9 parity tasks untouched)
- Docs realigned: README (response-parse + float wire + counts),
  AGENTS.md (FS-26 + the float-wire + duration conventions + the
  Reference section), CLAUDE.md (the response-parse contract +
  okWire), PAD (§7 + §8 counts + §12 ledger rows),
  flow-schedule_SKILL.md v2.3.0 (FS-26 + the M-3 pin-strength
  lesson + session-14 history), remediation-plan-session14 execution
  record, docs/session_14-review.md, this worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 14 delivered: the InvokeLLM RESPONSE side brought to full
  parity — the four parse divergences (RS-1..RS-4) closed with the
  probed schema-shape contract (empty-but-valid renders verbatim;
  schema-invalid falls back), and session-12 P-1 closed with the
  float-formatted duration wire (okWire, byte-matching the
  reference's Python backend). Unit 102 → 121, e2e 67 (×2
  consecutive)
- Key new knowledge: FS-26 (the response is the wire too — the
  response-OVERRIDE harness probes the reference's own cards; shape
  checks, not truthiness), the M-3 pin-strength lesson (a source pin
  must match the CALL, not the import), and the raw-text token
  extraction as the byte-diff tool that closes P-class observations

---
Task ID: 31
Agent: main agent
Task: Session 15 — failure-path paired probe + the entity date-token
wire (DW-1) audit and remediation

Work Log:
- git pull (fast-forward: main 8378b85 → 89b9c7d, adds
  docs/session_15.md — the operator's narrative of the session-14
  remediation); reviewed session_14-review.md,
  remediation-plan-session14.md, worklog.md, session_15.md — aligned
- Full base gate: lint clean · typecheck clean · 121/121 unit ·
  build 19 routes · 67/67 e2e (2.0 m) — the codebase matched its
  documented state exactly; mobile + desktop menu pins green
  (no Tailwind v4 regression)
- Read skills/skills-catalog.md; used: agent-browser (reference login
  + XHR capture/probes), clone-app-pat-pro (measured facts), tdd +
  tdd-workflow (red → green → mutation), code-review-and-audit,
  testing-patterns, nextjs16-tailwind4 (trap re-check)
- AUDIT — the session-14 §5a suggested target, the failure-path
  paired probe: installed the response-override harness on the
  reference (status 429 + rate-limit body on the InvokeLLM XHR),
  triggered the daily-focus re-fetch via a quick-add mutation → the
  reference rendered the Mark Twain fallback
  ("The secret of getting ahead is getting started." / - Mark Twain /
  "I am focused, productive, and capable of achieving my goals
  today."); the clone's dev server hit the z-ai SDK's live 429 the
  same morning and rendered the byte-identical DEFAULT_FOCUS →
  PARITY CONFIRMED, the last unpinned AI surface closed (no action)
- AUDIT — DW-1 (the new find): the full-body XHR capture (with
  request-header capture: Bearer/X-App-Id) + direct API probes
  (POST/PUT via the captured auth) on all six Task/Note surfaces:
  the reference's Python backend ships server-generated
  created_date/updated_date at 6-digit µs — POST create responses
  WITH Z ("2026-10-05T02:11:34.297127Z"), GET list + PUT-update
  responses WITHOUT Z ("2026-10-04T21:28:23.793000"; the PUT's
  updated_date fresh µs, its created_date ms-truncated);
  start_time/end_time (client-supplied) are ms+Z — already matching
  the clone. Consumer safety verified (mapTask/mapNote opaque; zero
  parsers)
- AUDIT — the mobile menu re-measured LIVE on the reference at
  390x844 (Playwright trusted clicks; agent-browser has no Linux
  viewport control — the window-size arg is WM-clamped): trigger
  338/14/36x36 right 374, menu 182/54/192x164, items [Profile,
  Settings, Logout], animation-name enter — identical to the clone's
  e2e pins, no drift; a structural DOM diff of both live dashboards
  at 1440x900: match (only data-driven diffs)
- Remediated DW-1 pin-first: tests/wire-dates.test.ts (12 pins —
  the pure transform read/create modes, start_time/end_time
  untouched, escaped-content safety, idempotence, the float
  composition, the okWire/okWireCreate CALL-form seam pins, the
  route call sites) RED 11/12 → formatWireDates (src/lib/
  serialize.ts — property-keyed regex, ms padded to µs, route-keyed
  Z) + okWireCreate (api.ts, create mode, default 201) + the route
  switches (POST tasks/notes → okWireCreate; GET/PATCH notes →
  okWire, joining the task reads) GREEN; the raw-text date pins
  folded into the e2e G-4/W-1/W-2 wire spec (µs no-Z reads / µs+Z
  creates / ms+Z start_time)
- MUTATION (RED) evidence M-1..M-5 (the harness outside the repo):
  identity transform → 6 pins; float-only okWire → 7; read-mode
  create → 7; route revert → 8; notes ok revert → 9. THE HARNESS
  LESSON: the first run's per-mutation backup corrupted api.ts when
  M-3 re-backed-up the file M-2 had mutated — git diff --stat did
  not flag it, the unit source pins PASSED on the corrupted text,
  and only the e2e caught the compiled divergence (floats shipped,
  dates didn't). Fixed (canonical per-file backup + a mandatory
  post-run pin re-run), all mutations re-confirmed RED, tree
  verified restored (12/12 pins)
- Gate: lint clean · tsc clean · 133/133 unit (121 → 133: +12
  wire-dates) · build 19 routes · 67/67 e2e x2 consecutive
  (1.9 m + 1.9 m) · live dev-server wire verified: GET
  "2026-10-05T00:20:32.982000" (µs no Z) + 30.0/120.0/60.0/90.0
  floats; POST "…498000Z" (µs + Z) + 25.0; PATCH created .498000
  (ms-truncated) + updated .543000 (fresh); notes same — all six
  forms byte-matching the probes
- All 20 screenshots re-captured; reference-account hygiene: the 3
  S15 probe entities deleted via the captured auth headers (9 parity
  tasks + 3 notes remain, 0 leftovers)
- Docs realigned: README (the date-wire + counts), AGENTS.md (FS-27 +
  the harness lesson), CLAUDE.md (the date-wire contract), PAD
  (§4.1 wire table + §8 counts + 10 ledger rows),
  flow-schedule_SKILL.md v2.4.0 (FS-27 + the session-15 history),
  docs/session_15-review.md, this plan's execution record, this
  worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 15 delivered: the failure-path paired probe CLOSED with
  parity confirmed (both apps render the byte-identical Mark Twain
  fallback under the same 429 failure class — the last unpinned AI
  surface), and the entity DATE-token wire brought to byte parity
  (DW-1/FS-27: the reference's Python µs forms — no Z on reads, Z on
  creates — reproduced at the okWire seam via formatWireDates +
  okWireCreate, with the notes routes joining the wire seam).
  Unit 121 → 133, e2e 67 (x2 consecutive)
- Key new knowledge: FS-27 (the server-generated date wire is a
  Python artifact — three date serialization forms: client-supplied
  ms+Z, create µs+Z, read µs no-Z; reproduce the FORMS at the text
  seam, document the .000 storage-precision residual), and the
  mutation-harness backup lesson (one canonical per-file backup; a
  git diff --stat is NOT restore-verification — re-run the pins)

---
Task ID: 32
Agent: Z (session 16)
Task: Audit the session-15 remediation state, close the entity-wire key-order ruling (the session-15 §5a target), remove the end_time derivation divergence, re-verify the mobile menu + structural parity live, and deliver the session-16 remediation (review + plan + TDD fixes + docs + screenshots + push).

Work Log:
- git pull (main 74c8eb4 -> 2ea6c34, adds docs/session_16.md); .env
  re-verified (DATABASE_URL="file:../db/custom.db", db/ at the repo
  root, .env.example contract green); full base gate re-executed:
  lint clean, tsc clean, 133/133 unit, build 19 routes, 67/67 e2e
  (2.0 m) — the codebase matched its documented state exactly
- Audited the session-15 remediation commit (74c8eb4) at source level:
  formatWireDates, okWire/okWireCreate, the route switches, the 12
  pins — all clean; the wire forms re-verified live on the clone
- Live reference audit (agent-browser login + XHR/fetch capture with
  request-body + request-header capture): the entity KEY ORDER
  extracted from ALL SIX response surfaces (GET/POST/PUT x Task/Note)
  — a CONSISTENT captured order (Task start_time-first, Note
  title-first) vs the clone's id-first emission (KO-1); the dialog
  save REQUEST captured byte-identical to the clone's TaskDialog
  payload (order included); the Mark Complete REQUEST captured:
  PUT {"status":"completed"} — partial semantics
- Direct API probes with the captured auth (all probe entities
  deleted — account back to 9 parity tasks + 3 notes, 0 S16
  leftovers): the reference's POST with start_time + duration but NO
  end_time stores end_time:null (no server-side derivation) — the
  clone derived it (ET-1); the POST status is 200 vs the clone's 201
  (transport-layer, documented self-hosted design — no action)
- Mobile menu re-measured LIVE on the reference at 390x844 (Playwright
  trusted clicks, animation-settled): trigger 338/14/36x36 right 374,
  menu 182/54/192x164 right 374, items [Profile, Settings, Logout],
  animation enter — identical to the clone's e2e pins, no drift, no
  Tailwind v4 regression; structural DOM diffs of both live
  dashboards + planning pages: match (only data-driven diffs)
- Wrote docs/session_16-review.md + docs/remediation-plan-session16.md
  (validated against the codebase before execution — every seam,
  seed site, and pin location verified)
- RED: tests/wire-order.test.ts (10 pins — the exact captured
  emission orders, the null-form slots, the text-seam order
  preservation, the no-derivation route source pins) 9/10 failed
- GREEN: the serializer literal reorders (serializeTask/
  serializeNote — the captured orders, same key sets/values/types)
  + the derivation removals (POST: omitted end_time stays null;
  PATCH: the recompute block removed, partial semantics kept) + the
  e2e fixture updates (the strict-time + top-5 seeds send explicit
  end_time; the wire pin flipped to end_time:null) + the raw-text
  order pins folded into the existing wire spec (task/note orders on
  GET and POST)
- MUTATION (RED) evidence M-1..M-4 (the harness outside the repo,
  ONE canonical per-file backup): serializeTask revert -> 4 pins;
  serializeNote revert -> 3; POST derivation restored -> 1; PATCH
  recompute restored -> 1. Post-run pin re-run 10/10 green — tree
  verified restored
- Gate: lint clean, tsc clean, 143/143 unit (133 -> 143: +10
  wire-order), build 19 routes, 67/67 e2e x2 consecutive (3.1 m +
  3.1 m); live dev-server wire verified: GET starts
  {"tasks":[{"start_time":null, duration null, end_time null, ...
  (start_time-first + mu-s no-Z); POST without end_time ->
  end_time:null + 30.0 float + mu-s+Z create dates; PATCH full-form
  round-trips; PATCH without end_time leaves it unchanged; notes
  title-first on GET/POST
- All 20 screenshots re-captured (scripts/capture-screenshots.mjs,
  dev server, 1440x900 + 390x844); .env.example re-verified unchanged
- Docs realigned: README (the key-order + no-derivation notes +
  counts), AGENTS.md (FS-28 + the end_time ruling + the Reference
  section), CLAUDE.md (the wire contract), PAD (S4.1 wire + S8 counts
  + 8 ledger rows), flow-schedule_SKILL.md v2.5.0 (FS-28 + the
  session-16 history), docs/session_16-review.md, the plan's
  execution record, this worklog
- Commit on main + push via docs/ssh_git_wrapper_v3.py

Stage Summary:
- Session 16 delivered: the entity wire's last byte class closed —
  the KEY ORDER now matches the reference's captured emission order
  on every response surface (KO-1/FS-28), and the end_time
  server-side derivation removed (ET-1: the reference stores it as
  submitted; its partial-PUT semantics probed via Mark Complete).
  The mobile menu re-measured live again — identical, no Tailwind v4
  regression. Unit 133 -> 143, e2e 67 (x2 consecutive)
- Key new knowledge: FS-28 (the key order is part of the wire
  contract — pin it at the serializer literal + the raw-text e2e
  seam; JSON.stringify preserves string-key insertion order), and
  the ET-1 ruling principle (a self-hosted affordance is fine while
  invisible; when the same input produces different observable
  output than the reference, it is a parity defect)

---
Task ID: 33 (flow-schedule session 17)
Agent: Z (main)
Task: flow-schedule session-17 — execute the session-16 §5 suggested target (the multi-viewport diff pass), pin the unpinned tablet band, verify the mobile menu + structural parity live, remediate via TDD, docs + screenshots + push to main.

Work Log:
- git pull (8bd3a48 → c86d0e4, adds docs/session_17.md); base gate fully green (lint · tsc · 133→143/143 unit · build 19 routes · 67/67 e2e)
- The multi-viewport pass on BOTH apps live (390/768/1024/1440): classes/headings/overflow/breakpoint state + PNG pixel diffs (5.9–11.2, data-driven only); the mobile menu re-measured on the reference — identical to the pins (no drift, no Tailwind v4 regression); the reference-account hygiene re-list found + deleted the "S16 MarkComplete Probe" leftover (back to 9 parity tasks + 3 notes — the verify-don't-trust rule)
- VP-1 remediated TDD-style: tests/e2e/viewport-breakpoints.spec.ts (8 pins: the md edge 768×900 + 1024×900 band state via computed display; the no-horizontal-overflow invariant on documentElement at 390/768/1024/1440) — green first run; mutation harness: M-1 md:hidden→sm:hidden RED 4; M-2 REDESIGNED (the injection-into-DashboardView design SURVIVED — the AppShell root's overflow-hidden clips inner overflow; the honest mutation is w-[2000px] ON THE ROOT) → RED 4 surgical; restore verified green + git diff empty
- T-4's live field-diff surfaced BD-1: the clone's body shipped antialiased; the reference's body is CLASSLESS — pinned RED → layout.tsx body classless → GREEN → live-verified on both surfaces
- Gate after: 143/143 unit · 76/76 e2e ×2 consecutive (67 → 76); 22 screenshots (20 re-captured + 21-dashboard-768.png + 22-dashboard-1024.png, the capture script extended); docs realigned (SKILL v2.6.0 FS-29 + BD-1, README/AGENTS/CLAUDE/PAD + ledger rows, session_17-review, the plan's execution record, this worklog)
- Committed on main + pushed to git@github.com:nordeim/flow-schedule.git main via docs/ssh_git_wrapper_v3.py (dry-run → real push → remote ref verified == HEAD → operator key shredded)

Stage Summary:
- Session 17 delivered: the layout-band pin family (the tablet band + the overflow invariant at every band — the Tailwind v4 responsive-class regression guard) + the classless body (BD-1). Zero functional regressions; the audit frontier stays closed. Unit 143, e2e 67 → 76 (×2)
- Key new knowledge: FS-29 (pin the layout BANDS — the md edge via computed display, the overflow metric on documentElement; and the mutation-design lesson: an overflow mutation inside the clipping layer SURVIVES — mutate the ROOT's width) + the BD-1 ruling (diff the BODY class: a rendering-hint class is a parity defect, an aria-label the reference lacks is a sanctioned a11y affordance)

---
Task ID: 34 (flow-schedule session 18)
Agent: Z (main)
Task: flow-schedule session-18 — execute the session-17 §5 suggested target (a) (the timed-interaction pass: the Focus Timer countdown at sub-second precision on both apps), audit the session-17 remediation at the fresh workspace, remediate FT-1 via TDD, docs + screenshots + push to main.

Work Log:
- Workspace RESET between sessions — fresh `git clone` + the documented
  bootstrap: cp .env.example .env · bun install (one transient tarball
  retry) · db:push + db:generate + db:seed (9 tasks + 2 notes, the
  db-path v3 contract holding); base gate fully green: lint · tsc ·
  143/143 unit · build (19 routes) · 76/76 e2e (2.1 m)
- Session-17 remediation (024b59f) audited at source level (the 9-pin
  viewport family green in the base run; the classless body present);
  the two doc commits are docs-only
- The timed-interaction pass: the Focus Timer (W1e) measured live on
  BOTH apps across FIVE sequences at sub-second precision — an in-page
  MutationObserver + performance.now() display-flip timeline (harness
  outside the repo): (A) start → pause → resume → reset, (B) pause →
  edit minutes → resume, (C) close/reopen while running, (D) the real
  60-second completion path, (E) the parse edges. 13/14 semantics
  byte-identical; ONE divergence — FT-1: the completed display (the
  reference leaves 00:00 TERMINAL; the clone's derived
  running?remaining:minutes*60 display snapped to 01:00)
- Root cause: session-3's decompile misread the reference ("the idle
  effect snaps remaining back") — the measured truth: the display IS
  the remaining STATE, the snap-to-full lives in the TOGGLE (both
  directions) + the minutes-change handler; only the completion path
  leaves 00:00
- Reference hygiene re-list at session START (the verify-don't-trust
  rule): 9 parity tasks, 0 leftovers (the entity list captured from the
  live login traffic — base44.app/api/apps/.../entities/Task)
- T-1 RED: tests/e2e/focus-timer.spec.ts (5 pins — pause snap + resume
  restart, edit-while-paused, the completion terminal display via
  page.clock, close/reopen reset) — the completion pin failed exactly
  as predicted (Expected "00:00", Received "01:00"); tooling lesson:
  page.clock.runFor (NOT fastForward — fires each timer at most once
  + pauses the clock)
- T-2 MUTATION (harness outside the repo, ONE canonical backup,
  production rebuild per mutation): M-1 the derived-display revert →
  RED 1 (surgical — the completion pin); M-2 the pause-snap removal →
  RED 3; M-3 both toggle resets removed → RED 3; restore verified 6/6
  green + checksum-identical
- T-3 GREEN + GATE: the fix (display = remaining state; the toggle
  resets on BOTH directions; the comment cites the measurement) —
  lint · tsc · 143/143 unit · build (19 routes) · 81/81 e2e ×2
  consecutive (76 → 81)
- T-4 LIVE: the clone's completion path re-measured —
  displayAfterDismiss "00:00" (was 01:00), alert + controls
  byte-matching the reference; harness lessons: drain the spawn pipes
  (an unread stdout pipe blocks the dev server mid-compile), kill the
  whole process group (the next dev child survives a wrapper SIGKILL)
- T-5: all 22 screenshots re-captured; 06-focus-timer.png
  dimension-identical to HEAD (the fix touches no standing visual
  surface); VLM rate-limited ×2 (stopped per discipline)
- T-6 DOCS: SKILL v2.7.0 (FS-30 + the changelog + counts), README,
  CLAUDE, AGENTS, PAD (§8 + 6 ledger rows), session_18-review.md, the
  plan's execution record, this worklog
- T-7: commit on main + push via docs/ssh_git_wrapper_v3.py to
  git@github.com:nordeim/flow-schedule.git (dry-run → real push →
  remote ref verified == HEAD → operator key shredded)

Stage Summary:
- Session 18 delivered: the timed-interaction pass closed — the Focus
  Timer's W1e contract measured at sub-second precision on both apps
  (13/14 byte-identical), the ONE divergence fixed (FT-1: the 00:00
  terminal completion display — the display is the remaining STATE,
  the snap lives in the toggle), and the whole timed family pinned
  (5 e2e pins incl. the page.clock completion path — the ~65 s
  session-3 one-off is now a <2 s suite pin). Unit 143, e2e 76 → 81
  (×2 consecutive)
- Key new knowledge: FS-30 (the display-flip timeline is a parity
  surface — an in-page MutationObserver + performance.now() measures
  pause/resume/completion semantics the static diffs cannot see; the
  decompile is a hypothesis, the live measurement is the contract) +
  the page.clock ruling (install before goto; runFor not fastForward
  for interval-driven countdowns) + the spawn-pipe/process-group
  harness lessons

---

## Session 19 (2026-10-05)

**Task**: flow-schedule session-19 — refresh workspace, review docs, audit
the session-18 state, execute the framer-motion animation-timing pass
(the session-18 §5 target (a)), remediate via TDD, docs + screenshots +
commit + SSH push to main.

- Workspace reset again — fresh `git clone` + bootstrap (`.env` from
  `.env.example`, `bun install`, `db:push`/`db:seed`); base gate green:
  lint ✓ · tsc ✓ · 143/143 unit · build (19 routes) · 81/81 e2e (2.8 m)
- Audited session-18 commit `0d39f09` (the FT-1 seam: the remaining-state
  display, the two-direction toggle reset) — clean; the operator's
  9c1272b adds docs/session_19.md only
- Reference hygiene re-list at session START: 9 parity tasks + 3 notes
  (direct entity probe with the captured auth), 0 leftovers
- **The animation-timing pass at FOUR evidence levels on BOTH apps**:
  (1) the decompile — the reference's G1e/W1e/A_e motion configs
  byte-identical to the clone's source (panelMotion, the container
  layout morph, the overlay transitions, the form/buttons fades, the
  tiles' gestures, the three blob loops); (2) the engine — the
  reference's WAAPI-hybrid `motion` runtime carries the IDENTICAL
  supportedWaapiEasing table as framer-motion@14.0.0 (circOut =
  cubic-bezier(0.55, 0, 1, 0.45) in both); (3) the rAF timelines
  measured live on both apps — every semantic matches (the overlay's
  geometry/opacity split curves, the panel-body y-vs-opacity lag, the
  exit sequencing with the last-rendered 0.15 delay, the buttons-view
  re-entrance, the INSTANT container-height jump); (4) the WAAPI
  metadata — the overlay's native animation byte-identical
  (350/0/the circOut bezier/fill both)
- **BL-1 found & fixed (TDD)**: the reference's SECOND background blob
  renders 0×0 — its `w-100 h-100` is a DEAD class in the reference's
  v3-scale stylesheet (no .w-100 rule; .w-96 exists); the clone's
  `w-[400px]` rendered a live 400 px blob. Fixed by mirroring the
  RENDERED effect (no width/height utilities — the div collapses);
  the class string is NOT copied (v4's dynamic spacing would generate
  w-100 as 400 px). The icon_sm dead-variant ruling, generalized
- The mobile menu re-measured LIVE on BOTH apps at 390×844 (the
  standing priority): trigger 338/14/36×36 right 374, menu
  182/54/192×164 right 374, items [Profile, Settings, Logout],
  `animation-name: enter` — byte-identical, no Tailwind v4 regression
- Pins: `tests/e2e/panel-animation.spec.ts` (4 — the WAAPI metadata
  via getAnimations().getComputedTiming(), the translateY(20px)+
  opacity-0 entrance held through the 0.2 s delay read at the
  detection frame + at +100 ms, the form-view exit's last-rendered
  0.15 s delay measured as an in-page differential, the blob-layer
  contract) + `tests/panel-motion.test.ts` (10 source pins, the
  ai-prompt pattern)
- T-2 MUTATION: M-1..M-4 all RED surgical (each mutation fails
  exactly its own e2e pin + the unit pins); restore verified
  (checksums + rebuild + 10/10 + 5/5). Lesson: the mount-frame read
  is delay-INSENSITIVE (framer applies the initial transform
  synchronously) — the delay needs the +100 ms read
- T-3: 153/153 unit · 85/85 e2e ×2 consecutive (81 → 85). T-4: the
  blob layer re-verified live (the second blob at 0×0). T-5: all 22
  screenshots re-captured (the purple blob gone)
- T-6: SKILL v2.8.0 (FS-31 + the changelog + the §11 counts fixed),
  README, CLAUDE (the motion contract section), AGENTS, PAD (§4.2's
  stale end_time-derivation bullet fixed — DOC-1, a session-16
  realignment miss; the seed bullet's E-1 clause — DOC-2; §8 + 6
  ledger rows), the review + plan docs, this worklog
- T-7: commit on main + push via docs/ssh_git_wrapper_v3.py (dry-run →
  real push → remote ref verified == HEAD → operator key shredded)

**Stage Summary:**
- Session 19 delivered: the framer-motion animation family closed at
  four evidence levels (config/engine/timeline/metadata — FULL PARITY),
  the ONE rendered divergence fixed (BL-1: the second blob's 0×0
  mirror), and the motion contract pinned (4 e2e + 10 source pins;
  mutations M-1..M-4 surgical). The mobile menu re-verified
  byte-identical live. Unit 143 → 153, e2e 81 → 85 (×2 consecutive)
- Key new knowledge: FS-31 (the four-level motion-parity method; the
  WAAPI metadata is the deterministic pin surface; the dead-class-in-v4
  ruling) + the pin-engineering lessons (the rAF waitForFunction
  capture vs the ~0.5 s locator latency; the +100 ms delay read; the
  in-page differential for exit timing)

---
Task ID: S20 (flow-schedule session 20)
Agent: Z (main)
Task: flow-schedule session-20 — refresh workspace, review docs, audit the session-19 state, execute the default-theme drift pass (the session-19 §5 targets (a)+(b)), remediate via TDD, docs + screenshots + commit + SSH push to main.

Work Log:
- Workspace carried forward (no reset); git pull 30bb684 → ab8ddc8 (docs/session_20.md only); base gate green: lint ✓ · tsc ✓ · 153/153 unit · build (19 routes) · 85/85 e2e (2.9 m)
- Audited session-19 commit 30bb684 (the BL-1 seam + the pin families) — clean; reference hygiene re-list at START: 9 parity tasks + 3 notes, 0 leftovers
- The session-19 §5 targets executed: Settings/Profile deep-diff (structure byte-identical on both apps) + the AI Summary populated diff (class contract byte-identical; the LLM wording = the nature-of-LLM ruling)
- F-1 found via the content-sized h3 widths (~15% glyph drift): tailwindcss@4.3.3's default --font-sans is the v3-compat -apple-system list; the reference renders the v4.0-era ui-sans stack (its own stylesheet's preflight rule, byte-extracted + measured live). 19 sessions of block-geometry pins were font-metric-blind
- C-1 found by the completeness audit: 13 used-but-unpinned color tokens, 11 drifted (up to 34 G-units — red-700, purple-700/800/900, pink-700, indigo-700, yellow-700, gray-400/500, green-200, red-200); dev's oklch and prod's hex measured IDENTICAL computed colors
- TDD: T-1 RED (4 e2e theme-palette pins + 6 unit source pins incl. the used ⊆ pinned completeness invariant — all failed at base exactly as predicted); the fix (the --font-sans/--font-mono pins + the 13 color hexes in @theme inline); the live pin caught pink-700 = #be185d (the reference's OWN value, one B-unit off the v3 hex — the rendered-contract ruling)
- T-2 mutations M-1..M-4 all RED surgical (the font-pin drop, the purple-900 drop, the red-700 value regression, the gray-400 revert); restore checksum-verified
- T-3: 159/159 unit · 89/89 e2e ×2 consecutive; T-4 LIVE: the glyph-metric closure (h3 "Theme" 68.3 px = the reference 68.3; the paragraph 312.1 = 312.1; the mood colors byte-matching); the mobile menu re-measured live on BOTH apps (byte-identical — the standing priority); T-5: 22 screenshots re-captured; T-6: SKILL v2.9.0 (FS-32) + README/CLAUDE/AGENTS/PAD (Trap 6 + the ledger rows) + the validation report + review + plan docs
- T-7: committed + pushed via docs/ssh_git_wrapper_v3.py (remote verified == HEAD, operator key shredded)

Stage Summary:
- Session 20 delivered: the Tailwind default-theme drift closed (F-1 the font stack, C-1 the 13 palette tokens — the "Tailwind v4 bug" the operator flagged), the completeness invariant (PIN-1) making the pin set CLOSED, the Settings/Profile + AI-card surfaces verified at structure parity, the glyph-metric closure verified live. Unit 153 → 159, e2e 85 → 89 (×2). Pushed to main.
- Harness scripts persisted in /home/z/my-project/scripts/ (the pages probe, the font probe, the color-rule extractors, the injected-class probe, the live color diff, the AI-card + mobile-menu probe, the mutation harness, the capture script)

---
Task ID: S21 (flow-schedule session 21)
Agent: Z (main)
Task: flow-schedule session-21 — refresh workspace, review docs, audit the session-20 state, execute the Planning handler-parity pass + the matched-data raster diff (the session-20 §5 targets (a)+(b)), remediate S21-F1 via TDD, docs + screenshots + commit + SSH push to main.

Work Log:
- Workspace carried forward (no reset); git pull a19516a → 9258cde (docs/session_21.md only); base gate green: lint ✓ · tsc ✓ · 159/159 unit · build (19 routes) · 89/89 e2e (2.9 m); audited session-20 commit a19516a at source level (the @theme pins + both pin families) — clean
- Reference hygiene re-list at START: 9 parity tasks + 3 notes, 0 leftovers (full bodies captured this session for the raster diff)
- The multi-week Planning probe (target (b)) LIVE on BOTH apps across the Sep→Oct month boundary: week labels, day cards, chips, selected-day persistence — byte-identical. The Add Task click DIVERGED: the reference is a NO-OP, the clone opened the full TaskDialog
- S21-F1 established at three levels: the eSe decompile (no dialog state, no onClick; Xne mounts only inside lre — the Dashboard calendar), the live trusted click on the reference (no dialog, no DOM change, no navigation), the live trusted click on the clone (the full dialog). The session-2 "the reference opens it from the Add Task button" inference retired; the e2e spec had pinned the divergence since session 2
- The matched-data raster diff (target (a)): the reference's 9 task bodies recreated on a scratch clone user (same email → same avatar initial), blobs hidden identically (their parity is owned by the session-19 motion family — main-thread framer loops can't be phase-aligned; reduced-motion does NOT freeze them on either app, measured), pulse indicators phase-aligned via currentTime % 2000 windows: /Planning 0.057% (noise, no hot cells); /Dashboard 0.737% ALL inside the Daily Focus card (the reference's live InvokeLLM quote vs the clone's Mark Twain fallback after a 429 — the documented never-hard-fail contract). Zero residual sub-visual divergence
- The mobile menu re-measured live on BOTH apps at 390×844 (the standing priority): trigger 338/14/36×36 right 374, menu 182/54/192×164 right 374, items [Profile, Settings, Logout], animation-name enter — byte-identical, no Tailwind v4 regression
- TDD: T-1 RED (the planning no-op pin — dialog count 0 expected, 1 received; the W-3/W-4 request-contract pin RELOCATED to dashboard.spec's calendar-cell entry, green at base); the fix (Planning/page.tsx: the dialog mount + handler + state + imports removed — mirrors eSe); GREEN: planning 16/16, dashboard 31/31
- T-2 mutations M-1..M-3 all RED surgical (the fix revert, the end_time drop, the description-null swap); restore checksum-verified
- T-3: 159/159 unit (unchanged) · 90/90 e2e ×2 consecutive (89 → 90); T-4 LIVE: the clone's Add Task click now byte-matches the reference (dialogs [], no POST, no navigation); hygiene re-list at END: 9 tasks + 3 notes, 0 leftovers; the raster scratch user's tasks deleted from db/e2e.db
- T-5: 22 screenshots re-captured (the task-dialog capture now documents the calendar-cell entry); T-6: SKILL v2.10.0 (FS-33 + the changelog + the counts + the stale §3 table counts fixed) + README/CLAUDE/AGENTS/PAD + review + plan docs + this worklog
- T-7: commit on main + push via docs/ssh_git_wrapper_v3.py to git@github.com:nordeim/flow-schedule.git

Stage Summary:
- Session 21 delivered: the Planning handler parity closed (S21-F1 — the Add Task button is the reference's no-op; the divergent-behavior spec replaced by a no-op pin; the W-3/W-4 dialog contract pin relocated to the reference's true entry path), the matched-data raster diff closed at noise level (the catch-all — zero residual sub-visual divergence outside the documented LLM region), the multi-week navigation closed byte-identical, the mobile menu re-verified byte-identical live. Unit 159 (unchanged), e2e 89 → 90 (×2). Pushed to main.
- Key new knowledge: FS-33 (the bundle's MISSING handler is the contract — a decompile-level hypothesis about a handler must be confirmed by a trusted CLICK on the live reference; a pin on divergent behavior is worse than no pin) + the raster-diff harness lessons (hide the main-thread framer loops identically; phase-align WAAPI indicators via currentTime windows; matched-data raster diffs are cheap and decisive)
- Harness scripts persisted in /home/z/my-project/scripts/ (the planning multi-week probes ref+clone, the task dump, the raster capture + diff, the mobile-menu probes, the mutation harness)

---
Task ID: S22 (flow-schedule session 22)
Agent: Z (main)
Task: flow-schedule session-22 — refresh workspace (fresh clone after a reset), review docs, audit the session-21 state, execute the login/dialog space-y engine-parity pass (the session-21 §5 targets: the /Profile + /Settings + login-state raster diffs), remediate S22-F1/S22-F2 via TDD, docs + screenshots + commit + SSH push to main.

Work Log:
- Workspace RESET between sessions — fresh git clone at 3d0f43e + the bootstrap chain (.env from .env.example with DATABASE_URL="file:../db/custom.db" + a fresh AUTH_SECRET, db/ at the repo root, bun install, db:push, db:seed); base gate green: lint ✓ · tsc ✓ · 159/159 unit · build (19 routes) · 90/90 e2e (3.0 m)
- Audited session-21 commit fb1d29c at source level (the Planning eSe mirror + both pin families) — clean; reference hygiene re-list at START (full entity dump): 9 parity tasks + 3 notes, 0 leftovers
- The session-21 §5 targets executed at matched state (the reference's 9 exact bodies recreated on a scratch clone user; blobs hidden identically; pulses phase-aligned): /Profile 0.009% · /Settings 0.009% · /Planning 0.057% (noise) · /Dashboard 0.715% (all inside the LLM cards) · login-error 2.948% + login-reset 3.539% — the reset delta is the documented session-5 alert-text ruling; the error delta was NOT the alert (text + classes byte-identical, DOM-probed) — it was GEOMETRY
- The mobile menu re-measured LIVE on BOTH apps at 390×844 (the standing priority): trigger 338/14/36×36 right 374, menu 182/54/192×164 right 374, items [Profile, Settings, Logout], animation-name enter — byte-identical, NO Tailwind v4 regression (the operator's flagged concern, closed on the menu)
- S22-F1 established: v4's space-y rewrite (:where(.space-y-N > :not(:last-child)) { margin-block-end }) lands the inter-child margin on the INLINE <label> of the classic-shadcn field pattern — CSS IGNORES vertical margins on inline boxes, so every label→field gap collapsed to the line-box leading (login 10px→4px × 6 fields; TaskDialog 12px→4px × 6 — live-measured on both apps, class strings byte-identical)
- S22-F2 established: the reference's own BackToSignIn -mb-2 beat v4's :where() zero-specificity margin (v3's margin-top on the FOLLOWING h2 margin-collapsed with it → 8/16px effective; v4 renders −8 — the sign-up/forgot headings rose into the back-link's band). A third variant found mid-fix: Radix's hidden native <select> makes the SelectTrigger :not(:last-child) → v4's margin-block-end +8px per Select field
- TDD: T-1 RED (3 auth.spec login-geometry specs + 1 dashboard.spec dialog-geometry spec — gaps 4 ≠ 10/12, h2 offsets −8 ≠ 8/16; 5→6 source pins in tests/space-y-compat.test.ts); the fix (globals.css: four v3-compat rules — .space-y-1\.5 > label + *, .space-y-2 > label + * + its :not(:last-child) mb-zero, .space-y-4 > .-mb-2 + * + the sm:space-y-6 media variant; the DOM byte-identical); GREEN
- T-2 mutations M-1..M-5 all RED surgical (the label rules, the -mb-2 rules, the dialog value, the sm: media value, the Select-mb rule — each fails exactly its own pin family); restore checksum-verified
- T-3: 165/165 unit (159 → 165: +6 source pins) · 94/94 e2e ×2 consecutive (90 → 94) — after fixing a harness artifact (rebuilding .next/standalone under a live server silently corrupted the reused e2e webServer — 25 spurious failures; pkill before build)
- T-4 LIVE: the login cards byte-match the reference (sign-in y77 h746 gaps [10,10]; sign-up y215 h470 gaps [10,10,10] + h2 offset 8; forgot y263 h374 gaps [10] + h2 offset 16); the dialog internals byte-match (h 526 = 526, every element y/h); the raster re-run: login-error 2.948% → 0.098%; hygiene re-list at END: 9 tasks + 3 notes, 0 leftovers; the raster scratch user's tasks deleted from db/e2e.db
- T-5: 22 screenshots re-captured (the login + task-dialog captures now render the reference's field geometry); T-6: SKILL v2.11.0 (FS-34) + README/CLAUDE/AGENTS/PAD (§5.4 rows 4b/4c + 5 ledger rows) + review + plan docs + this worklog
- T-7: commit on main + push via docs/ssh_git_wrapper_v3.py to git@github.com:nordeim/flow-schedule.git

Stage Summary:
- Session 22 delivered: the space-y engine-parity pass closed (S22-F1/S22-F2 — the v3-compat rules restore v3's margin side for the inline-label field pattern, the -mb-2 back-link, and the Select trigger's hidden-native-select margin; the DOM byte-identical), the login + dialog geometry now byte-matches the live-measured reference (cards, gaps, h2 offsets, dialog internals), the login-state raster closed at noise (0.098%), the /Profile + /Settings surfaces closed at 0.009%, the mobile menu re-verified byte-identical live (the standing priority — no v4 regression). Unit 159 → 165, e2e 90 → 94 (×2). Pushed to main.
- Key new knowledge: FS-34 (class parity is not geometry parity — the engine is part of the contract; pin COMPUTED GEOMETRY, never class strings, when the reference and the clone run different utility-engine generations) + the three v4 space-y failure modes (the inline-label nullification, the negative-margin specificity flip, the hidden-sibling margin) + the harness lessons (the full-body wire dump before matched-state builds; pkill the standalone before rebuilding under a reusable webServer)
- Harness scripts persisted in /home/z/my-project/scripts/ (the ref probe, the entity dump, the raster capture + diff, the login/dialog geometry probes, the mutation harness) and research/session22-* in the repo's gitignored research/ folder

---
Task ID: S23 (flow-schedule session 23)
Agent: Z (main)
Task: flow-schedule session-23 — refresh workspace, review docs, audit the session-22 state, execute the semantic-theme pass (the session-22 §5 targets + the mobile raster + the S23-F2/F3 theme-family fixes), remediate S23-F1/F2/F3 via TDD, docs + screenshots + commit + SSH push to main.

Work Log:
- Workspace carried forward (contracts re-verified); git pull a484a9d → 93da3da (docs/session_23.md only); base gate green: lint ✓ · tsc ✓ · 165/165 unit · build (19 routes) · 94/94 e2e (one cold-start timing flake — S23-F1's first specimen — then green ×2)
- Audited session-22 commit a484a9d at source level (the four v3-compat rules + both pin families) — clean; the space-y completeness sweep re-run at HEAD; reference hygiene re-list at START: 9 parity tasks + 3 notes, 0 leftovers
- The session-22 §5 targets executed live on BOTH apps: the sign-up error-state geometry + the mobile 390×844 login/dialog geometry — BYTE-IDENTICAL (the two S23-P1 lock-in families, then pinned); the mobile menu re-measured byte-identical (the standing priority — no v4 regression)
- The matched-state raster extended to MOBILE (390×844, matched data, element-anchored after the absolute-scroll artifact): dashboard-top 0.481% (glyph-edge + corner-arc pixels) → root-caused through computed-style probes to S23-F2: the clone's :root shipped the shadcn SLATE variant; the reference's OWN app stylesheet (/assets/index-CcElM1Qx.css) ships the DEFAULT (neutral) variant — --foreground rgb(2,8,23) vs rgb(10,10,10) (body/dialog labels/CardTitles), --muted-foreground rgb(100,116,139) vs rgb(115,115,115) (the dialog placeholder), --radius 0.625rem vs .5rem (every var-based corner 2px). The --border/--input slate forms retained (the rendered-match ruling: the reference's nominal neutral-200 never renders — its bare borders take the v3 preflight #e5e7eb)
- Mid-T-4 discovery S23-F3: v4's named text-* utilities emit UNIT-LESS line-heights (--text-xs--line-height: calc(1/.75)) that RE-SCALE on inheritance — the day-label date line (text-[10px] in a text-xs parent) rendered 13.33px vs v3's LENGTH-inherited 16px, shifting the centered label stack 1.33px (the mobile raster's last residue, 794px)
- TDD: T-1 RED (the 4-spec semantic computed family + the 12-line source block + the S23-P1 lock-ins + the panel-animation rewrite); the fix (the neutral :root block + --radius 0.5rem + the v3 LENGTH line-heights in @theme — the DOM byte-identical); GREEN
- S23-F1 iterated: the single-evaluate mount-frame design STILL flaked once under full-suite load (y=18.37 mid-tween — the mode="wait" mount churn starves the rAF poll ~200ms; the trace captured before the next run's cleanup) — the final design pins ONLY deterministic metadata: the WAAPI timing (300/200/circOut/both) + the native keyframes (opacity 0→1) + the settle poll
- T-2 mutations M-1..M-6 all RED surgical (the foreground slate-revert, the muted-foreground revert, the radius revert, the panelMotion delay→0, the space-y dialog rule removal, the line-height ratio revert); restore checksum-verified; post-restore pins green
- T-3: 170/170 unit (165 → 170: +5 source pins) · 104/104 e2e ×3 consecutive (94 → 104: +4 semantic + 1 day-label + 1 error-state + 3 mobile login + 1 mobile dialog)
- T-4 LIVE: the semantic probes byte-match the reference (body/CardTitle/dialog labels rgb(10,10,10); the placeholder rgb(115,115,115); the radii 8px; --radius .5rem); THE RASTER CLOSURE AT BOTH VIEWPORT BANDS: mobile dashboard-top/planning/login-error 0.000% (was 0.481/0.222/0.427%), desktop planning/profile/settings/login-error 0.000% (was 0.057/0.009/0.009/0.098%) — every non-LLM pixel byte-identical; the desktop dashboard's 3.947% residual entirely inside the two LLM-content cards (today's live text is longer — the documented never-hard-fail region); hygiene at END: 9 tasks + 3 notes, 0 leftovers; the mobile menu re-verified byte-identical
- T-5: all 22 screenshots re-captured (the login/dialog captures render the reference's neutral theme, 8px radii, 16px label line-heights); T-6: SKILL v2.12.0 (FS-35) + README/CLAUDE/AGENTS/PAD (§5.2 + §5.4 rows 7/8 + §8 + the session-23 ledger) + review + plan docs + this worklog
- T-7: commit on main + push via docs/ssh_git_wrapper_v3.py to git@github.com:nordeim/flow-schedule.git

Stage Summary:
- Session 23 delivered: the semantic-theme pass closed (S23-F2 — the shadcn neutral :root family incl. --radius .5rem + the --border/--input rendered-match ruling; S23-F3 — the v3 LENGTH line-heights over v4's inheritance-rescaling ratios), the panel-animation entrance pin made deterministic (S23-F1 — metadata, never live transient reads), the two session-22 §5 closures pinned (S23-P1), and the matched-data rasters closed at BYTE-IDENTITY at both viewport bands (every non-LLM pixel on every rastered surface matches the reference). Unit 165 → 170, e2e 94 → 104 (×3). Pushed to main.
- Key new knowledge: FS-35 (a scaffold's semantic theme is an ENGINE artifact, not a reference fact — diff the reference's OWN app stylesheet :root block before trusting any semantic token; raster thresholds hide sub-threshold drift at glyph edges; box-geometry pins are curvature-blind) + the S23-F3 line-height semantics (ratio vs LENGTH inheritance) + the S23-F1 metadata-pin ruling (a live computed read of a transient window is unfixably racy — pin the WAAPI timing + keyframes instead)
- Harness scripts persisted in /home/z/my-project/scripts/ (the S23 ref probe, the geometry probes, the mobile raster capture + diff, the mutation harness incl. M-6)
