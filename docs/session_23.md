I'll start by internalizing the task and setting up a structured plan. This is a complex multi-phase code audit and remediation task on the flow-schedule repo. Let me begin.
I've internalized the operating instructions (production-grade code audit discipline, evidence-based verification, TDD, root-cause fixes). Now let me set up the workspace.
Repo cloned, on `main` branch. Now let me review the project documentation.
Now let me read the core documentation files.
AGENTS.md fully read. Now let me check the sizes of the remaining docs and read them.
Now the Project Architecture Document (980 lines).
Now let me read the session-21 review and remediation plan docs.
Now let me check the worklog's recent entries (append-only, so the most recent are at the bottom).
I now have deep context on the project. Let me update my todos and validate understanding against the codebase — starting with key config files and the workspace bootstrap state.
Fresh clone confirmed — needs bootstrap. Let me check the test configs and key source files first.
All configs verified — skills/ excluded from tsconfig, eslint, vitest. Now let me bootstrap the workspace.
Unit tests green (159/159). Now the production build.
Build green (19 routes). Now the e2e suite (this takes ~3 minutes).
Base gate fully green: lint ✓ · tsc ✓ · 159/159 unit · build ✓ (19 routes) · 90/90 e2e. Now let me review the skills catalog and audit the recent changes.
Now let me audit the recent session-21 remediation commit (fb1d29c).
S21-F1 fix verified in source. Now let me check the reference app — first looking for surviving harness scripts from prior sessions.
Let me check the mobile navigation e2e spec (the pin for the highest-regression-risk surface).
Now let me create the reference-app probe script — login, hygiene re-list, and mobile menu measurement.
Login worked but the fetch-patch didn't capture traffic. Let me improve the probe with network response listeners and debugging.
The reference's mobile trigger has no aria-label (geometry was measured via DOM queries in prior sessions). Let me refine the probe.
**Reference mobile menu re-measured: byte-identical to the pins** (trigger 338/14/36×36, menu 182/54/192×164, items [Profile, Settings, Logout], `animation-name: enter`) — no Tailwind v4 regression. Reference hygiene: 9 parity tasks confirmed. Let me view the captured dashboard.
I'll use the raster-diff approach (session-21's method) for visual parity. Let me set up the matched-state capture harness.
Bun + Playwright request-context incompatibility. Let me run with Node instead.
Node works. Let me fix the capture script and run it with Node.
All 12 matched-state captures done. Now the pixel diff.
Profile/Settings are essentially identical (0.009%). But login-error (2.9%) and login-reset (3.5%) show real diffs, and dashboard is higher than session-21's baseline. Let me investigate with DOM-level probes first.
**Finding S22-F1: the reset-sent alert text diverges** — the reference says "Please check your email for the password reset link. It may take a few minutes to arrive." while the clone ships a self-hosted note. Let me check whether this is a documented divergence and analyze the raster diffs visually.
The reset-text divergence is a documented session-5 ruling (Google-notice pattern). Now let me inspect the login-error raster diff — text/classes are identical, so the pixels must differ elsewhere. Let me crop and compare visually.
The dashboard diff concentrates in the bottom half (rows 580-880). Let me visually inspect the crops using the VLM skill.
**Major clue**: the reference's SkillsMap shows "No activities today" while the clone renders a donut — with matched data. Also the AI Summary differs (Free day vs Work tasks). Let me examine the clone's SkillsMap filter logic.
The clone's SkillsMap includes completed tasks (no status filter). Let me check the e2e pins and the AI summary route to understand the day filter.
**Critical harness bug found (my own)**: I invented a start_time for "NullEndTime Probe A" — the reference's is actually `null`. The clone's donut came from that phantom task. Let me re-fetch the exact full task bodies from the reference.
Now I have exact bodies. Let me fix the capture script with the true values and re-run.
Planning now at noise level (0.057%). Dashboard still 3.7%. Let me visually inspect what still differs.
Let me inspect the login-error crops and extract the LLM-card DOM text on both apps for a precise comparison.
VLM suggests spacing/logo differences. Let me measure precisely at the DOM level.
The measurements mix pre/post-error states. Let me write a cleaner single-pass post-error measurement.
**Found a real geometric divergence**: the clone's label→input gap is 4px vs the reference's 10px (both email and password pairs), making the clone's card 12px shorter. Let me inspect the login page source and both apps' label/input classes.
Let me extract the exact DOM structure of a field pair on both apps.
The margin DOM shows both apps apply 6px (v3: wrapper margin-top; v4: label margin-bottom) — but measured gaps differ (10 vs 4). Let me measure the exact boxes in one clean pass.
**ROOT CAUSE FOUND — this is the Tailwind v4 bug**: Tailwind v4's `space-y-*` selector rewrite emits `margin-block-end` on the `:not(:last-child)` child. When that child is the **inline** shadcn `<label>` (classic form, no `block` class), the vertical margin is **ignored entirely** (CSS: vertical margins don't apply to inline boxes). The reference (v3) put margin-TOP on the following block wrapper — effective. Result: the clone's label→input gaps collapsed from 10px to 4px.

Let me audit all `space-y` containers in the source for this inline-child trap.
Let me check the QuickActions panels and AISummaryCard children — looking for inline first-children in space-y containers.
The Label is a raw inline `<label>` — only the 6 login field pairs match this pattern. Let me verify the sign-up and forgot views' geometry on both apps to confirm the full blast radius.
Extra drift beyond the label gaps in sign-up (-34) and forgot (-30). Let me measure those views' internals.
Two stacked v4 traps found on the login page. Let me check whether the TaskDialog has the same label+space-y pattern.
TaskDialog has the same pattern (space-y-2 + inline Label). Let me measure the dialog geometry on both apps.
The reference's calendar cells aren't buttons (handler on the parent grid). Let me click by position on the reference.
**The TaskDialog has the same trap**: reference label→input gap 12px, clone 4px (dialog 24px shorter). Let me enumerate all label-in-space-y patterns across the source.
Let me measure the Select (Priority/Category) pairs' gaps too.
All 6 dialog pairs collapsed (12px → 4px). Complete picture: **two live v4 traps**. Let me verify the reset-sent view geometry too, then check for any other margin-carrying children in space-y containers.
Reset view is clean (only the documented alert-text divergence). Let me check how Tailwind escapes these class names in its built CSS.
The fix approach is confirmed. Let me read globals.css to see where to add the compat rules.
The audit is complete. Now let me write the session-22 review and comprehensive remediation plan documents.
Now the remediation plan with the detailed ToDo list:
Plan saved and validated against the codebase. Now T-1 RED — the pins first. Let me check the auth spec structure.
Now let me add the T-1 RED pin to auth.spec.ts:
Now the dashboard dialog geometry pin. Let me find the right insertion point.
Now the unit source pin:
Unit pin RED confirmed (5/5 failing). Now verify the e2e RED against the base build.
4 specs RED at base. Let me verify the failure reasons are exactly the geometry (not locator issues).
The helpers need `page` passed in. Let me fix.
The e2e measures gap 6 (not 4). Let me debug the discrepancy — likely the label rect height.
The RED is correct — "Received: 6" is `Math.abs(4 - 10)`; the gap measures exactly 4px as predicted. T-1 RED verified for all pins. Now the fix (GREEN) — the v3-compat rules in globals.css:
164/164 unit green. Now rebuild and verify the e2e GREEN.
All GREEN. Now T-2 MUTATION — the sensitivity harness.
All mutations RED ✓ (restore verified, post-restore GREEN ✓). The "surgical" detection failed only due to output-format parsing. Let me verify surgical-ness manually for M-1 and M-2:
M-1 surgical ✓ (exactly the 4 geometry specs). Now M-2:
M-2 surgical ✓ (exactly sign-up + forgot h2 pins). Now M-3 and M-4:
All 4 mutations surgical ✓, tree restored (checksums match). Now T-3 GATE — rebuild and run the full consecutive gate ×2.
Gate run 1: lint ✓ · tsc ✓ · 164/164 unit · **94/94 e2e**. Run 2 (consecutive):
T-3 GATE GREEN ×2 (94/94 e2e). Now T-4 LIVE — re-probe the remediated clone.
**Byte-match achieved** — cards y/h and gaps identical on all 3 views. Now the dialog + h2 offsets:
h2 offsets and dialog gaps byte-match. The height difference is create-vs-edit mode. Let me confirm with an empty-cell (create mode) on the reference:
An 8px residual height difference in create mode. Let me compare the internal geometry side by side.
The field gaps match (12px) but the Priority/Category grid container is 8px taller on the clone. Let me find where the extra height lives.
The hidden native `<select>` (last child) makes the trigger a `:not(:last-child)` — v4 gives it margin-block-end 8px, inflating the container. Let me check the reference's computed structure.
**Residual root cause found**: v4 also gives the SelectTrigger `margin-block-end: 8px` (it's `:not(:last-child)` — the hidden native `<select>` follows it), inflating each Select field by 8px. The reference (v3) gives the trigger only margin-top. Let me extend the compat rule.
Now update the unit source pin to cover the new rule and add the dialog-height assertion to the e2e pin:
Dialog height now 526 = 526. Let me confirm all internal elements byte-match:
**Byte-identical dialog internals** — every element y/h matches. Let me run the new mutation M-5 (Select mb rule) and then the full gate.
M-5 surgical ✓. Now the final full T-3 gate (×2 consecutive) with the complete fix:
25 e2e failures — something broke. Let me investigate immediately.
The 25 failures are an artifact — I rebuilt while the old M-5 server was still running on :3100, and the e2e reused the half-swapped server. Let me kill everything, rebuild cleanly, and re-run.
The e2e measures 542 vs my probe's 526 — likely a viewport difference (e2e runs 1280×720). Let me verify:
The dialog measures 526 at both viewports when settled. The e2e spec measures mid-animation. Let me replicate the exact timing:
The e2e catches the dialog mid-zoom-animation (scale <1 → 510, |510−526|=16). My spec lacks the animation-settle wait (the session-8 E-C discipline). Let me fix the pin:
Now the full consecutive gate ×2 with the final code:
**T-3 GATE GREEN ×2: 165/165 unit · 94/94 e2e both runs.** Now T-4 LIVE — the raster re-run and hygiene re-list.
**Raster closure: login-error 2.948% → 0.098% (noise)**; Dashboard back to the LLM-region-only 0.715%. Now the END hygiene re-list and scratch cleanup.
T-4 complete (reference at standing state, scratch cleaned). Now T-5 SCREENSHOTS — start the dev server and run the capture family.
All 22 captures fresh. Now T-6 DOCS. Let me check the SKILL.md structure for the FS-34 addition.
Now let me apply the SKILL.md updates (FS-34, version, counts, changelog):
Now add FS-34 after FS-33 and the changelog entry:
SKILL.md done. Now CLAUDE.md:
Now add the framework-quirks entry to AGENTS.md (after the space-y Trap 4 bullet):
Now the PAD updates — §5.4 trap table + §8 counts + §12 ledger:
Now append the session-22 ledger rows to §12:
Now the worklog entry:
All docs updated. Now the final pre-commit verification and the SSH push setup. Let me review the wrapper runbook.
No ssh binary or paramiko. Let me install paramiko and set up the shim.
paramiko works on `/usr/bin/python3`. Let me deploy the ssh shim (Appendix A) outside the repo.
Shim ready. Now the final pre-commit verification and commit. First, check the changeset:
All green. Now the commit:
Now T-7 PUSH — write the operator key to a 0600 temp file outside the repo, then the wrapper dry-run:
Dry-run ✓ (auth verified, fast-forward 3d0f43e → a484a9d). Now the real push:
The worklog claims the harness scripts persist — let me restore them to /home/z/my-project/scripts/ (I cleaned research/ which was gitignored):
All harness scripts persisted. Let me finalize the shared worklog at the workspace level:
Session 22 is complete. Here's the summary:

## Session Complete — `main @ a484a9d` pushed to `nordeim/flow-schedule`

**What I found (the Tailwind v4 bug you flagged):** The mobile menu is byte-identical on both apps (no regression there) — but the login/dialog field geometry had drifted: v4's `space-y` rewrite lands its margin on the **inline `<label>`**, where CSS silently ignores vertical margins — every label→field gap collapsed (10px→4px login, 12px→4px dialog, 12 fields), plus the `-mb-2` back-link specificity flip raised the sign-up/forgot headings into the link's band (S22-F1/S22-F2).

**What I did:** TDD remediation — 4 computed-geometry e2e specs + 6 source pins (RED at base) → four surgical v3-compat rules in `globals.css` (DOM untouched, class parity preserved) → 5 mutations all surgically caught → gate ×2 green (**165/165 unit · 94/94 e2e**) → live re-probe shows login cards and dialog internals now **byte-match** the reference; login-error raster dropped 2.95%→0.098%.

**Suggested next steps:** (a) run `bun run dev` and visually confirm the login field spacing, (b) review `docs/session_22-review.md` + FS-34 in the SKILL, or (c) point me at the next session's audit surface (sign-up error-state geometry and mobile-view geometry pins are the open candidates).
