I'm continuing the flow-schedule multi-session audit workflow. Let me set up my TODO list and start the session-20 cycle.
工作区已刷新 — `ab8ddc8` 新增了 `docs/session_20.md`（新的周期文档）。让我阅读所有关键文档。
`session_20.md` is the session-19 execution narrative. Now let me read the session-19 review and remediation plan to understand the current state and suggested session-20 targets.
Session-19 state understood. Let me check the repo worklog, `.env` contract, skills catalog, and core docs status in parallel.
The workspace survived (node_modules + db + .env intact). Now let me verify the test configs and doc alignment, then start the base gate.
Docs and configs are aligned with the documented state (SKILL v2.8.0, 153/85 counts, db-path v3 contract). Now let me run the standing base gate — lint, typecheck, unit first.
Lint ✓ · typecheck ✓ · 153/153 unit. Now the production build, then e2e.
**Base gate fully green**: lint ✓ · typecheck ✓ · 153/153 unit · build ✓ (19 routes) · **85/85 e2e** (2.9m) — the codebase matches its documented state exactly. Now let me audit the session-19 remediation commit at source level.
BL-1 fix verified in source — the session-19 commit is clean. Now let me survey the remaining unverified parity surfaces (the session-20 candidates: Settings/Profile deep-diff, AI-summary populated-state) and check existing spec coverage.
Now let me check the relevant skills for this session's audit (agent-browser, clone-app-pat-pro, tdd, and the Tailwind v4 skill).
The audit approach is set. Let me check the surviving harness scripts from previous sessions (reference login pattern), then run the reference-account hygiene re-list at session START.
Let me run the reference-account hygiene re-list at session START (verify-don't-trust) and start the clone dev server in parallel.
**Hygiene verified**: 9 parity tasks + 3 notes, 0 leftovers — the standing state. Now let me build the Settings/Profile deep-diff probe (the session-20 target (a)). First, verify the dev server is up.
The reference redirects to `/` after login (not `/dashboard`). Let me fix the wait pattern.
Reference Settings/Profile captured — static surfaces, byte-identical classes to the clone's source. Now the clone side for the diff.
The clone login failed on the cold dev-server (the known session-18 lesson). The server is warm now — retry.
Login still failing. Let me check the dev log and what credentials the clone expects (the demo user, not the reference account).
The clone uses its own demo user. Let me get the demo credentials and fix the probe script.
Structural parity is byte-identical on both pages — but I notice a **text-width divergence on the h3 headings** (ref "Theme" 68px vs clone 58px; "Performance" 130 vs 110 — ~15% wider). That smells like a **font-family rendering difference**. Let me probe the computed fonts on both apps.
**MAJOR FINDING — the font stacks diverge**:
- **Reference** (measured): `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", ...` — **Tailwind v4's default `--font-sans`**
- **Clone** (measured): `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, ...` — **Tailwind v3's default stack**

And the rendered text widths differ live (ref "Theme" 68.3px vs clone 58px at 18px/600). Let me find where the clone sets its font stack.
The clone's globals.css does NOT define `--font-sans` — so where does the v3-style stack come from? Let me inspect the actually-served CSS.
The clone's CSS emits `font-family: var(--default-font-family, -apple-system, BlinkMacSystemFont, ...)`. Let me find which package emits this.
**Found the smoking gun** — the built `@layer theme` defines `--font-sans: -apple-system, BlinkMacSystemFont, ...` (the v3-style stack). Let me check whether Tailwind v4.3.3's own default emits this.
**ROOT CAUSE FOUND — a genuine Tailwind v4 drift bug**: Tailwind v4.3.3's `theme.css` default changed `--font-sans` from v4.0's `ui-sans-serif, system-ui, ...` to the v3-style `-apple-system, BlinkMacSystemFont, ...` list. The reference (v4.0-era build) renders the OLD default; the clone (v4.3.3 via the floating `^4` semver) renders the NEW one. Let me check the lockfile history and the v4 skills guidance.
The lockfile has always carried 4.3.3 — so the clone's default `--font-sans` (v3-compat stack) has NEVER matched the reference's measured stack (the v4.0-era `ui-sans-serif, system-ui, ...`). Previous sessions' geometry pins never caught it because block widths don't depend on glyph metrics — the Settings/Profile flex-item h3s are the first content-sized surfaces. Let me check the repo's Tailwind v4 skill guidance and validation report.
The skill and validation report confirm the `@theme` pin pattern. Let me now dump the reference's exact font-related CSS rules from its stylesheet for the byte-exact contract.
**The full picture is now clear.** The reference's stylesheet carries base44 design-system fonts (`Wix Madefor Text/Display` — scoped to `[data-ds=base44]` elements, never loaded for this app), while the app content renders the **v4.0-era preflight stack**: `ui-sans-serif, system-ui, sans-serif, ...`. The clone (Tailwind v4.3.3) ships the v3-compat stack instead. Let me verify the mono/serif defaults didn't also drift, and check where the app uses them.
`--font-serif`/`--font-mono` defaults match v4.0 — but the reference carries a base44 `--font-mono: "Azeret Mono"` token, and the clone's Focus Timer display uses `font-mono`. Let me measure the reference's live timer-display font resolution.
Font stack divergence fully established — and the mono/serif stacks match (ref's `--font-mono` is undefined at root → falls back to the same `ui-monospace` stack the clone resolves). Now let me check the rest of globals.css for unpinned color scales (the v4.3.3 palette also drifted — `red-200:#ffcaca` in the built CSS), and survey which color classes the app actually uses.
The used-color list was truncated. Let me get the complete list and check which used tokens are NOT pinned in globals.css.
The pinned-list grep regex failed. Let me redo the diff correctly.
13 used tokens fall back to v4.3.3's drifted palette. Let me extract the reference's actual values for those tokens from its stylesheet, and find where the clone uses them.
No hits — the reference is JIT-generated and may not use CSS vars. Let me search its raw CSS text directly for these class fragments.
The reference uses **v3 palette values** for these tokens (gray-400 `#9ca3af`, gray-500 `#6b7280`). Let me get the remaining tokens and diff them against the clone's built v4.3.3 values.
Now the decisive diff. Let me read Tailwind v4.3.3's own `theme.css` default values for these tokens.
The v4.3.3 defaults are oklch. Let me extract the exact hex the clone's BUILD actually emits for the 13 tokens and diff against the reference's v3 hexes.
`red-700: #bf000f` looks anomalous vs v3's `#b91c1c`. Let me check the exact rule context in the built CSS and convert the oklch reference value.
Let me verify the red-700 rule in full context — `#bf000f` vs the reference's `#b91c1c` would be a big visible drift.
The clone's build converts v4's oklch red-700 to `#bf000f` (gamut-clipped), while the reference ships v3's `#b91c1c`. Let me confirm where these 13 tokens are actually used in the clone's UI, then measure the live rendered colors on both apps.
The full usage map is clear — 11 of 13 tokens drift, hitting the AI Summary card, WeeklySchedule gradient, SkillsMap legend (domain.ts), login alerts, and TaskDialog. Let me now verify the drift LIVE (computed colors on both apps) — including the AI summary card (the session-20 candidate (b)) and the mobile menu (standing priority).
**Live divergence confirmed**: the clone's AI mood text renders `lab(24.94, 45.27, -51.27)` (≈rgb(89,22,139)) vs the reference's `rgb(88,28,135)` — and the dev server emits oklch directly while the production build carries pre-converted hex. Let me check whether the dev (oklch→browser) and production (hex) renderings agree — i.e. whether the build-time conversion itself is the bug.
Wait — injected classes only resolve if they were generated. Let me restrict to classes that actually exist in the CSS (used by source files).
Dev and prod render **identically** on the clone — so the divergence is consistent across both modes. Now the reference side of the same injected probe for the complete diff table.
Now let me convert the clone's lab values to sRGB for the definitive diff table.
My lab converter is buggy — but I already have the direct measurements (built-CSS hex vs reference rgb). One more thing the injected probe revealed: the **default unclassed border color** differs (clone `#e2e8f0` slate-200 vs reference `#e5e7eb` gray-200). Let me check if that's an already-ruled surface.
The unclassed border never renders visibly (all bordered surfaces carry explicit classes — pinned green). Now let me complete the audit with the AI-summary card geometry diff (candidate (b)) and the mobile menu re-measure (the standing priority).
That captured the Daily Focus card. The mobile menu trigger wasn't found with my selector — the session-19 mobile-menu script survives; let me use it.
**Mobile menu: byte-identical (MATCH on both geometry and items)** — no Tailwind v4 regression. Now let me target the actual AI Summary card. Let me check its heading structure first.
**The AI Summary card: full structural parity** (every class byte-identical) — with the C-1 color drift live on the mood text (`lab(...)` vs the reference's `rgb(88,28,135)`/`rgb(107,33,168)`), and the F-1 font drift visible on the h3 width (109 vs 93). Content differences (mood "planning" vs "productive") are LLM-driven — the documented nature-of-LLM ruling.

The audit is complete. Let me now check the existing spec patterns and the seed data to design the remediation pins.
The seed covers all skill categories (work/personal/health/learning/creative/social/planning). Let me check the WeeklySchedule bar map and SkillsMap legend DOM for deterministic pin surfaces.
The plan is taking shape. `CATEGORY_BADGES` (text-purple-700 etc.) renders on the **Planning page day chips** — deterministic seeded surfaces. Let me check the AI-card wait pattern and the planning badge DOM for the pin design.
I have the complete audit picture. Let me now write the session-20 review and remediation plan documents.
Plan saved. Now **T-1 RED** — the pins land first. Let me check the spec conventions.
Now let me check the Planning day-chip markup to target the badges precisely.
Now writing the e2e theme-palette spec (T-1 RED, part 1).
Now the unit source pins (T-1 RED, part 2).
Now let me verify the unit pins are RED at base (the pins don't exist in globals.css yet):
All 6 unit pins RED at base — and the completeness invariant found exactly the 13 missing tokens. Now the e2e RED check against the production build:
**T-1 RED fully established** — all 6 unit + 4 e2e pins fail at base exactly as predicted. Now the fix: the theme pins in globals.css.
Now the 13 color pins — appended to the existing color pin block (after cyan-400):
Now the unit GREEN check (the source pins should pass immediately), then rebuild for the e2e GREEN:
Built CSS carries the pins. Let me kill the stale standalone and run the e2e GREEN check:
The build is new (font + chips pass). Let me debug the mood test's element resolution:
It passes alone — the full-run failure is order interference. Let me check the error context from the failed run:
Let me probe what actually matches `[class*=from-purple]` on the dashboard in document order:
**Found it**: the FIRST `div[class*=from-purple]` in document order is the WeeklySchedule learning-task tooltip (`from-purple-400` — `hasP: false`), not the mood box (`from-purple-50`). The selector needs the `-50` discriminator. Let me fix both the locator and the evaluate:
Now let me re-run the full spec and inspect the planning-badges failure detail:
**A subtle real finding**: the reference's pink-700 measures `rgb(190, 24, 93)` = **`#be185d`** — 1 B-unit off the v3 hex `#be185c` I pinned. The reference's palette is NOT byte-v3 for this token; the rendered contract wins. Let me fix the pin:
Also update the review/plan docs' pink-700 rows to the measured value, then rebuild and re-run:
The edit accidentally dropped the indigo-700 row. Let me restore it and add the pink-700 nuance:
The indigo-700 row is missing. Let me re-add it:
Now update the plan doc's pink-700 value too, then rebuild and re-run the full spec:
Now rebuild and run the full spec family:
**GREEN established** — 4/4 theme-palette pins pass. Now the full unit suite + lint + typecheck:
**159/159 unit** (153→159). Now **T-2 MUTATION** — let me check the session-19 mutation harness pattern first:
**T-2 MUTATION perfect — all four caught surgically** (M-1: font pin; M-2: mood ramp + invariant; M-3/M-4: unit value pins), restore checksum-verified, all green. Now **T-3 — the full consecutive gate** (run 1):
89/89 (run 1). Now the consecutive run 2:
**T-3 GATE GREEN ×2**: lint ✓ · tsc ✓ · 159/159 unit · build (19 routes) · **89/89 e2e ×2** (85→89). Now **T-4 LIVE** — re-verify against the reference on the live dev server:
**T-4 LIVE GREEN — full glyph-metric closure**: font stack byte-matches, h3 "Theme" 68.3px (ref: 68.3), p 312.1px (ref: 312.1), mood colors byte-match. Now **T-5 SCREENSHOTS** — the 22-capture family:
The script errored partway — some captures are stale. Let me see the error:
The quickaction loop times out (panel-close ambiguity). Let me make each panel a fresh navigation:
The tile is labeled **"Add New Task"**. Let me get all four labels and fix the script:
**All 22 captures fresh.** Now **T-6 DOCS** — starting with the SKILL.md v2.9.0 update:
Now add FS-32 after FS-31 and the session-20 changelog entry:
Now the session-20 changelog entry in Appendix C:
SKILL.md done. Now the README updates:
README done. Now CLAUDE.md and AGENTS.md:
Now the PAD — the theme-drift ruling, §8 counts, and the session-20 ledger rows:
Now add the Trap 6 discovery to the Tailwind-V4-Validation-Report:
Now the execution record in the remediation plan:
Now the final pre-commit verification — the session-end hygiene re-list and the change set:
The change set is complete. Now **T-7 — commit + SSH push**. Let me review the SSH wrapper runbook:
The shim and paramiko are ready. Let me commit, then stage the key and push:
**Push verified** — remote `main @ a19516a == local HEAD`, key shredded. Final cleanup check:
The wrapper shredded its temp copy; let me also shred my staged key file per the operator contract:
**Session 20 complete — pushed to `main @ a19516a`** (remote verified, key shredded, tree clean, reference account at its 9-task + 3-note standing state).

**What was delivered:**
- **The session-19 suggested targets executed**: Settings/Profile deep-diff and the AI Summary populated-state diff — structure byte-identical on both surfaces
- **F-1 (the "Tailwind v4 bug" you flagged) found & fixed**: v4.3.3's default font stack (v3-compat) vs the reference's v4.0-era `ui-sans` stack — ~15% glyph-width drift invisible to 19 sessions of block-geometry pins. Pinned, with the glyph-metric closure verified live (h3 "Theme" now 68.3px = the reference exactly)
- **C-1**: 11 of 13 unpinned palette tokens were up to 34 color units off — all pinned to the reference's *measured* hexes (including pink-700's 1-unit nuance)
- **PIN-1**: a `used ⊆ pinned` completeness invariant so the pin set can never silently regress
- **Mobile menu**: re-measured byte-identical live — no Tailwind v4 regression
- Gate: **159/159 unit · 89/89 e2e ×2**, mutations M-1–M-4 all surgically caught

**Suggested next steps**: session-21 candidates from the review — (a) a full-page raster pixel-diff as the catch-all, (b) multi-week planning navigation, or (c) any surface you'd like prioritized in the next prompt.
