# Remediation Plan — Session 1 (2026-10-04)

Session-1 review of the FlowSchedule clone (base commit `96d2dda`, build
narrative in `docs/session_1.md`) after `git pull` (fast-forward:
`docs/prompt-to-review.md`, root `worklog.md`; the operator's
`session_1.md` narrative arrived on the remote mid-session and was
reviewed as part of §1).
This plan records every gap found by the audit, the remediation strategy,
and the TDD execution order. The `skills/` folder is excluded from code
checking, testing and compilation per the operating instructions.

## 1. Audit scope and method

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull origin main` (fast-forward, 2 new files) | ✅ clean tree |
| Docs ↔ code alignment | Read `AGENTS.md`, `CLAUDE.md`, `README.md`, `Project_Architecture_Document.md`; grep-verified every claim (env vars, file paths, test counts, commands) | ⚠️ 2 drift points (R-3, R-9) |
| Verification gate | `bun run lint` → clean · `bun run typecheck` → clean · `bun run test` → 36/36 · `bun run build` → green · `bun run test:e2e` → 29/29 | ✅ all green |
| Database contract | `.env` = `DATABASE_URL="file:../db/custom.db"`; `db/` at repo root; `src/lib/db-path.ts` anchors relative URLs to the schema-owning repo; `bun run db:push && bun run db:seed` → `db/custom.db` 40 KiB, 9 tasks + 2 notes seeded | ✅ correct (after clearing a stale shell env — see R-8) |
| Reference parity | agent-browser re-login (saved auth state) → live `flow-schedule-b9a0b2cb.base44.app` re-measured at 390×844: mobile menu **right 374, top 54, width 192**, trigger **right 374, bottom 50**; items `My Account` (label) + `Profile/Settings/Logout` — byte-identical to the clone's pinned geometry (`tests/e2e/mobile-navigation.spec.ts`) | ✅ no drift |
| Git hygiene | `git ls-files`: `.env` NOT tracked, no `*.db` tracked, `.env.example` tracked, no logs/test-results tracked | ✅ clean |

## 2. Issues, bugs and gaps found

| ID | Severity | Finding | Fix strategy |
|----|----------|---------|--------------|
| R-1 | Medium | `.env.example` header still says **“ORBITAL — environment configuration”** (the scaffold predecessor) and carries a stale `project_management` PostgreSQL example URL — does not match this codebase | Rewrite header/branding to FlowSchedule; keep the documented `DATABASE_URL="file:../db/custom.db"` contract; pinned by a new unit test (T-1) |
| R-2 | Low | `vitest.config.ts` header comment lists ORBITAL-era domain seams (“router, clarify questions, plan sanitizer, check-in mapping”) that do not exist in this repo | Rewrite comment to name the real seams: auth crypto, domain constants, db-path resolution, env-example contract |
| R-3 | Medium | **Docs/env drift:** `.env.example` + README document `NEXT_PUBLIC_SITE_URL` as “used for metadata, sitemap.xml, and robots.txt”, but `rg NEXT_PUBLIC_SITE_URL src/` finds **zero** readers and no `sitemap.ts`/`robots.ts` exist | Make the claim true: add `src/lib/site.ts` (pure URL helper, unit-tested), wire `metadataBase` in the root layout, add `src/app/sitemap.ts` + `src/app/robots.ts` |
| R-4 | Deliverable | `docs/session_1.md` does not exist (this session's review record) | Write it at session close |
| R-5 | Deliverable | No remediation plan under `docs/` | This document |
| R-6 | Deliverable | `flow-schedule_SKILL.md` missing — required output of `skills/distill-codebase-skill` + `skills/to-distill-project-into-skill` | Distill per the meta-skill's six-phase process (20 sections + appendices) |
| R-7 | Deliverable | Screenshots must be (re)captured from the dev server running the **remediated** codebase | Fresh captures to `docs/screenshots/` after the gate re-run |
| R-8 | Info (environment, not code) | Local workspace trap: a stale exported `DATABASE_URL=file:/home/z/my-project/db/custom.db` in the persistent shell (plus the parent workspace `.env`) outranked the repo `.env`, so the first `db:seed` wrote outside the repo. Repo code is correct — `db-path.ts` + the repo `.env` resolve `<repo>/db/custom.db` once the shell is clean (`unset DATABASE_URL`) | Document the trap in `docs/session_1.md` §Environment; AGENTS.md already warns about Bun parent-`.env` loading |
| R-9 | Low | README env table repeats the `NEXT_PUBLIC_SITE_URL` claim (covered by R-3) and the file-hierarchy section predates the new session docs | Update README (+ PAD/AGENTS/CLAUDE pointers) after remediation |

No functional regressions were found: the reference app re-measured identical
mobile-menu geometry, and the full gate (lint → typecheck → 36 unit → build →
29 e2e) is green at base commit `96d2dda`.

## 3. TDD execution order

Write tests first, watch them fail, then fix the code.

- **T-1 (red→green for R-1):** `tests/env-example.test.ts` — pins the
  `.env.example` contract: FlowSchedule header, exact
  `DATABASE_URL="file:../db/custom.db"` line, `AUTH_SECRET` + 
  `NEXT_PUBLIC_SITE_URL` documented, no `ORBITAL`/`project_management`
  leftovers. Fails against the current file.
- **T-2 (red→green for R-3):** `tests/site.test.ts` — pins `siteUrl()`:
  returns `NEXT_PUBLIC_SITE_URL` when set (trailing slash trimmed), falls
  back to `http://localhost:3000`; `absoluteUrl(path)` joins safely. Fails
  until `src/lib/site.ts` exists.
- **R-1 fix:** rewrite `.env.example` (FlowSchedule branding, honest
  comments, no stale examples).
- **R-2 fix:** rewrite the `vitest.config.ts` header comment.
- **R-3 fix:** add `src/lib/site.ts`; wire `metadataBase` in
  `src/app/layout.tsx`; add `src/app/sitemap.ts` (static app routes) and
  `src/app/robots.ts` (allow all, sitemap pointer).
- **Gate re-run:** `bun run lint && bun run typecheck && bun run test &&
  bun run build && bun run test:e2e` (unit count grows 36 → 38 files? —
  the two new test files are counted; final counts recorded in
  `docs/session_1.md`).
- **R-7:** fresh screenshots (desktop 1440×900 + mobile 390×844) from the
  remediated dev server.
- **R-4/R-6/R-9:** `docs/session_1.md`, `flow-schedule_SKILL.md`, doc
  alignment updates.
- **Deliver:** single `git commit` on `main` (no new branches), pushed via
  `docs/ssh_git_wrapper_v3.py` (runbook:
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`).

## 4. Non-goals (deliberately not changed)

- **UI/visual surface** — the reference re-measurement found zero drift;
  no component changes are warranted (any edit risks the pinned mobile-menu
  geometry specs).
- **Database location** — already correct (`db/` at repo root,
  `file:../db/custom.db`); `db-path.ts` resolution is pinned by
  `tests/db-path.test.ts`.
- **Test infra** — `vitest.config.ts` + `playwright.config.ts` already
  exist and are green; only the stale comment (R-2) changes.
- **`skills/` folder** — excluded from checking/testing/compilation.

## 5. Execution record (filled during execution)

All planned items executed; three additional findings surfaced while running
the e2e gate (the plan's "review and validate against the codebase" loop):

| Item | Outcome |
|---|---|
| T-1 `tests/env-example.test.ts` | Red as predicted (ORBITAL branding + stale example) → green after the `.env.example` rewrite (4 tests) |
| T-2 `tests/site.test.ts` | Red as predicted (module absent) → green after `src/lib/site.ts` (4 tests) |
| R-1 `.env.example` | Rewritten: FlowSchedule header, honest `NEXT_PUBLIC_SITE_URL` wording, no `project_management` leftovers |
| R-2 `vitest.config.ts` | Comment now names the real seams (auth crypto, domain constants, db-path, env-example contract, site helper) |
| R-3 site metadata | `src/lib/site.ts` + `metadataBase` in the root layout + `src/app/sitemap.ts` + `src/app/robots.ts`; build output now carries `/robots.txt` + `/sitemap.xml` |
| **F-1 (new) e2e flake — chip interception** | `planning.spec.ts` "day statistics" failed intermittently: a center click on a day card can land on a task chip (`div[role=button]` with `stopPropagation`) and open the Edit dialog instead of selecting the day. Fixed by clicking the day-card HEADER block (`div.text-center`) + a hydration gate (wait for a seeded chip before clicking). |
| **F-2 (new) e2e.db accumulation** | Data-creating specs left rows behind (task totals drift across runs). First attempted a global-setup file reset — WRONG: the Playwright webServer boots before globalSetup, and deleting the SQLite file under the live server broke every write with `SQLITE_READONLY_RECOVERY` ("attempt to write a readonly database"). Reverted; instead each creating spec now deletes what it created via the API (`page.request`, sharing the session cookie). Verified convergence: two consecutive full runs leave exactly the 9 seed tasks, 0 residue. |
| **F-3 (new) cleanup convergence** | Single `.find()`-then-delete left a stable residue of 1 task/spec (a crashed run's row was never fully reclaimed). Cleanup now deletes EVERY matching title — converges to 0. |
| Final gate | `bun run lint` clean · `bun run typecheck` clean · `bun run test` **44/44** (36 → 44: +4 env-example, +4 site) · `bun run build` green (+`/robots.txt`, `/sitemap.xml`) · `bun run test:e2e` **29/29** × 3 consecutive runs, db converged to seed state after each |

The three new findings (F-1…F-3) are exactly the class of knowledge the
session docs (`docs/session_1-review.md`) and the distilled skill
(`flow-schedule_SKILL.md`) must carry forward.
