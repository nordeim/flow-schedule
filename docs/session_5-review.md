# Session 5 Review — FlowSchedule (2026-10-04)

Review + remediation session over base `main @ 8ae844d` (the session-4
sidebar-card/layout-chrome remediation `47c171b` plus the operator's
session-log commits; `git pull` fast-forwarded `docs/session_5.md`). The
operator's narrative for the prior session lives in `docs/session_5.md`;
this file is the reviewer's record for the session that audited it. Plan:
`docs/remediation-plan-session5.md`.

## 1. What was reviewed

- All five root docs (AGENTS, CLAUDE, README, PAD, flow-schedule_SKILL)
  against the tree — aligned; the fast gates re-executed green at base
  (lint ✓ · typecheck ✓ · 59/59 unit).
- The session-4 remediation commit (`47c171b`) — verified by its own
  session; the diff spot-checked; all 15 of its screenshots still present.
- Environment contract re-verified: `.env` = `DATABASE_URL="file:../db/
  custom.db"`, `db/` at the repo root (custom.db + e2e.db), `.env.example`
  matches the codebase (unit-pinned), vitest + playwright configs in place.
- **Mobile navigation re-pinned live on BOTH apps** (390×844): the
  reference's trigger measures 374/50/36 and its menu 374/54/192 with
  [Profile, Settings, Logout]; the clone's trigger measures 374/50/36
  identically and its menu geometry is pinned by the e2e spec (51/51 ×2).
  **No Tailwind v4 regression on either app** — the pinned `--shadow-sm`,
  palette hexes, and the space-y discipline are all still load-bearing.
- **The audit target — the LOGIN page, the last surface never measured**
  (session_5.md's own forward pointer). The reference's `/login` is the
  base44 platform screen: every view state (sign-in, sign-up,
  forgot-password, reset-sent), the error and password-mismatch alerts,
  the unauthenticated guard redirects, the authenticated root route, and
  the 404 page were extracted from the LIVE reference DOM and corroborated
  interactively (sign-up round-trip to the OTP screen, Mark-Complete-style
  functional probes, Go-Home navigation).

## 2. The finding: 21 gaps on the logged-out surface

Sessions 0–4 had verified every AUTHENTICATED surface (dashboard,
planning, quick actions, sidebar cards, chrome, header/mobile menu) — the
same blind-spot chain as FS-11 → FS-12 → FS-14, one surface further: the
login page was a session-0 "reasonable auth card" that was never measured,
and the routing around it (guards, root, 404) was inherited from the
scaffold's conventions rather than the reference's behavior.

Highlights (the full table is in the remediation plan):

1. **The login card was a different DESIGN LANGUAGE**: the reference
   (base44 platform screen) is `rounded-2xl border-0 backdrop-blur-sm`
   with a slate top gradient bar, the real logo PNG in a ringed circle,
   `bg-slate-50/50 rounded-xl` inputs, and a solid **slate-900** submit;
   the clone shipped `rounded-3xl border-white/20 backdrop-blur-xl`, an
   Activity-icon logo box, transparent rounded-2xl inputs, and a
   sky-blue **gradient** submit. The page canvas was also wrong
   (`from-slate-50 to-slate-100`, not the app-canvas gradient).
2. **Sign-up and forgot-password are SEPARATE VIEWS in the reference** —
   the clone toggled fields inline. The reference's sign-up has
   Email/Password/Confirm (no Name field) with a "Back to sign in"
   affordance and a "Create account" submit; forgot-password has a full
   reset-request view plus a "Check your email" confirmation with a GREEN
   alert. All four view states are now mirrored and pinned.
3. **Error states are shadcn `[role=alert]` cards** — `bg-red-50/70
   border-red-200 rounded-xl` + `text-red-700` — and the login failure
   text is "Invalid email or password" with NO trailing period (the
   clone shipped a plain red `<p>` and a period).
4. **The (app) routes had NO auth guard** — the reference redirects
   unauthenticated `/Dashboard`, `/Planning`, `/` to `/login`; the clone
   rendered the full shell with empty data. Now: a server-side session
   guard in the `(app)` layout (`getSessionUser()` → `redirect`).
5. **The root route**: the reference renders the DASHBOARD at `/` when
   authenticated and lands there after login; the clone 307'd `/` →
   `/Dashboard`. Now: `(app)/page.tsx` serves the dashboard island at
   `/` (the old root redirect is gone; `/Dashboard` remains the header's
   link target).
6. **The 404 page was Next's default** — the reference ships a custom
   page (text-7xl slate-300 numeral, slate divider, "Page Not Found",
   the path echoed, a "Go Home" button → `/`). Now: `not-found.tsx`.

## 3. Remediation (TDD: red → green)

- **Red:** 12 new/reworked e2e specs (the login chrome, the four view
  states, the mismatch alert, the guards, the 404) — 12 failed against
  the pre-fix build exactly as predicted (2 pre-existing Google-notice
  and heading-level specs already passed).
- **Green:** `src/app/login/page.tsx` rewritten as a four-view state
  machine with the reference's exact chrome (logo `public/logo.png`
  fetched from the reference's own asset URL); `AuthAlert` component
  (red/green shadcn-style alerts); the API error message's period
  dropped; `(app)/layout.tsx` server-side session guard; the dashboard
  island extracted to `DashboardView` and served at BOTH `/` and
  `/Dashboard`; `src/app/page.tsx` (root redirect) removed;
  `src/app/not-found.tsx` added; the sitemap gains `/` as the primary
  entry; the smoke suite now checks authed page renders AND the unauth
  guard redirects (25 → 30 checks).
- **Flakes root-caused en route** (recorded in the plan): the Next.js
  route announcer carries `role="alert"` (scope with
  `:not(#__next-route-announcer__)`) and `getByLabel("Password")`
  substring-matches "Confirm Password" (`{ exact: true }`).
- **Gate after:** lint ✓ · typecheck ✓ · **59/59 unit** · build ✓
  (self-type-checked; the (app) pages are dynamic now — the guard reads
  cookies) · **51/51 e2e × 2 consecutive full runs** · smoke **30/30**.
- **Live parity re-verified on BOTH apps** (agent-browser): a JSON class
  diff of 13 key login elements is **byte-identical (13/13)** between
  the apps; the error alert, the sign-up/forgot/reset views, the guard
  redirects, the post-login `/` landing (pathname stays `/` on both),
  the 404 + Go Home navigation, and the mobile trigger (374/50/36 on
  both; the menu pinned 374/54/192 by the e2e) all verified.
- 20 screenshots in `docs/screenshots/` (01-login re-captured + new
  16-login-signup, 17-login-forgot, 18-login-reset-sent, 19-404,
  20-login-mobile; the rest re-captured or still current) — all
  state-gated via `scripts/capture-screenshots.mjs`.

## 4. Environment notes

- The reference's login is served by the base44 PLATFORM (Google GSI +
  Turnstile are configured in its frontend config); its OTP
  email-verification view after sign-up is platform mail infrastructure
  the self-hosted clone deliberately does not mirror (registration
  completes directly — the documented PAD §11 divergence, now
  live-measured and precisely described).
- The reference's logo asset is a JPEG-in-.png served from its Supabase
  bucket; the clone now ships the identical bytes as `public/logo.png`.
- The reference's `/logout` is a POST route (a GET visit does not clear
  its localStorage token — the session's early "logged-out" probes were
  actually still-authenticated until the tokens were explicitly cleared).
- The z-ai SDK again 429'd throughout (unchanged behavior — fallbacks
  fired by design).

## 5. Knowledge carried forward

- **FS-15 (new):** the logged-out surface is a parity surface too —
  parity sweeps must enumerate every route state an anonymous visitor
  can see (login views, guards, 404, root), not just the authenticated
  app. Four sessions of "the login card is fine" hid an entirely
  different design language.
- **Strict-mode collisions are everywhere Next adds invisible nodes**:
  the route announcer's `role="alert"` and label substring matching both
  produced two-element resolutions this session — scope locators
  deliberately (the FS-14 corollary, twice more).
- **Routing IS parity**: the landing URL after login, the guard
  redirects, and the 404 page are functional parity surfaces, measured
  like any geometry.
- Test counts moved to **59 unit / 51 e2e / 30 smoke**; every surface of
  the app — authenticated AND logged-out — is now decompile- or
  live-measure-pinned. Docs and the skill realigned (v1.4.0).
