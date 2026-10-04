# Session 1 — Review & Remediation Record (2026-10-04)

> This file is THIS session's structured review record. The operator's
> `docs/session_1.md` (created directly on GitHub) is the original build
> session's narrative transcript — reviewed and validated as part of the
> work below; this record documents the review + remediation that
> followed it.

Operator prompt: `docs/prompt-to-review.md`. Base commit: `96d2dda`
("feat: build FlowSchedule clone").

## 1. What this session did

1. **Refreshed the workspace** — `git pull origin main` (fast-forward,
   2 files: `docs/prompt-to-review.md`, root `worklog.md`). Clean tree.
2. **Reviewed the four root docs** (`AGENTS.md`, `CLAUDE.md`, `README.md`,
   `Project_Architecture_Document.md`) and validated their claims against
   the codebase (env vars by grep, file paths by `find`, commands by
   running them). Also reviewed the operator's build narrative
   (`docs/session_1.md`, added to the remote mid-session) — every claim
   in it (build sequence, gate results, mobile-menu parity, push @
   96d2dda) checked out against the codebase and git history.
3. **Ran the full verification gate** at base: lint clean, typecheck
   clean, 36/36 unit, build green, 29/29 e2e.
4. **Re-measured the live reference app** (`flow-schedule-b9a0b2cb.base44.app`,
   logged in with the operator credentials via saved auth state):
   mobile menu **right 374, top 54, width 192**, trigger
   **right 374, bottom 50**, items `My Account` (label) +
   `Profile/Settings/Logout` — byte-identical to the clone's pinned
   geometry. **No reference drift; no UI changes warranted.**
5. **Wrote the remediation plan** (`docs/remediation-plan-session1.md`)
   and executed it with TDD. See §3.
6. **Re-captured all 9 dev-server screenshots** (`docs/screenshots/`).
7. **Distilled `flow-schedule_SKILL.md`** from the remediated codebase
   using `skills/distill-codebase-skill` + `skills/to-distill-project-into-skill`.
8. **Committed to `main` and pushed** via `docs/ssh_git_wrapper_v3.py`
   (rebasing over the operator's `session_1.md` commit).

## 2. Database status (the operator's DATABASE_URL requirement)

- `.env` ships `DATABASE_URL="file:../db/custom.db"` — the `db/` folder
  lives at the repo root (git-ignored), exactly as required.
- `src/lib/db-path.ts` anchors a RELATIVE `file:` URL against the repo
  that owns `prisma/schema.prisma`, so the Prisma CLI (`db:push`,
  `db:seed`), `next build`, and the running server all open the ONE file
  `<repo>/db/custom.db` regardless of process CWD. Pinned by
  `tests/db-path.test.ts` (15 tests).
- Verified end to end: `unset DATABASE_URL` (see the trap below) →
  `bun run db:push && bun run db:seed` → `db/custom.db` 40 KiB with the
  demo user, 9 tasks, 2 notes → dev server `/api/health` →
  `"database":"up"` → login works.

### Environment trap (hit this session, not a code bug)

A stale **exported** `DATABASE_URL=file:/home/z/my-project/db/custom.db`
(absolute, outside the repo) in the persistent shell outranked BOTH
`.env` files: the first `db:seed` of the session silently wrote to the
wrong file. `unset DATABASE_URL` (or point the parent `.env` at the repo
db) restores the documented behavior. `AGENTS.md` already warns that Bun
auto-loads parent `.env` files; the same applies to shell-exported vars —
they always win. Symptom to remember: `db:seed` says
"Sample tasks already present — skipped" while `<repo>/db/custom.db`
stays 0 bytes.

## 3. Remediation executed (TDD)

Plan: `docs/remediation-plan-session1.md` (with the execution record).
Summary of what changed:

| Change | Files |
|---|---|
| `.env.example` de-ORBITAL'd + honest `NEXT_PUBLIC_SITE_URL` wording, contract pinned by unit test | `.env.example`, `tests/env-example.test.ts` |
| Site metadata made real: `siteUrl()` helper + `metadataBase` + `/sitemap.xml` + `/robots.txt` (the docs previously claimed these; nothing read the var) | `src/lib/site.ts`, `src/app/layout.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `tests/site.test.ts` |
| `vitest.config.ts` header comment now names this repo's real seams | `vitest.config.ts` |
| e2e determinism: chip-interception fix (click day-card HEADER, never the center), hydration gate, spec-level API cleanup that converges the db back to the seed state, global-setup header documents why a file reset is FORBIDDEN | `tests/e2e/planning.spec.ts`, `tests/e2e/dashboard.spec.ts`, `tests/e2e/global-setup.ts` |

Unit tests: 36 → **44** (env-example contract ×4, site helper ×4).
e2e: **29/29 across three consecutive full runs**, and after every run
the e2e database holds exactly the 9 seed tasks (0 spec residue).

### The three hard-won e2e lessons (see the skill file for details)

1. **Day-card center clicks are unsafe** — task chips are
   `div[role=button]` with `stopPropagation` inside the card `button`;
   a center click can open the Edit dialog instead of selecting the day.
   Click the header block (`div.text-center`).
2. **Never delete the SQLite file in Playwright globalSetup** — the
   webServer boots BEFORE globalSetup; `rmSync` under the live server
   breaks every subsequent write with `SQLITE_READONLY_RECOVERY`
   ("attempt to write a readonly database"). Clean up in the specs
   (`page.request` shares the session cookie) instead.
3. **Cleanup must delete EVERY match** — a single
   `.find()`-then-delete leaves a stable residue of one row per crashed
   run; `filter()` + delete-all converges to zero.

## 4. Final state

- Gate: `bun run lint` ✓ · `bun run typecheck` ✓ · `bun run test` 44/44 ✓ ·
  `bun run build` ✓ (+ `/robots.txt`, `/sitemap.xml`) ·
  `bun run test:e2e` 29/29 ✓
- Reference parity re-verified (mobile menu geometry byte-identical).
- Fresh screenshots in `docs/screenshots/` (01-login → 09-mobile-planning).
- `flow-schedule_SKILL.md` distilled at the repo root.
- `skills/` folder excluded from code checking, testing and compilation.
- All commits on `main` (no new branches), pushed with
  `docs/ssh_git_wrapper_v3.py` per
  `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`.
