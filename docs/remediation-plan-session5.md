# Remediation Plan — Session 5 (2026-10-04)

Session-5 review of the FlowSchedule clone (base commit `8ae844d`, i.e. the
session-4 sidebar-card/layout-chrome remediation `47c171b` plus the operator's
session-log commits) after `git pull` (fast-forward: `docs/session_5.md`).
The `skills/` folder is excluded from code checking, testing and compilation
per the operating instructions.

Skills used this session: `agent-browser` (live reference measurement +
corroboration on both apps — every class string below was read off the LIVE
reference DOM at `https://flow-schedule-b9a0b2cb.base44.app/login`),
`tdd` (red → green), `verification-and-review-protocol` (executed evidence
only), `nextjs16-tailwind4` (token-pin discipline), `clone-app-pat-pro`
(decompile/live-measure-first parity method, adapted: the reference's
`/login` is the base44 PLATFORM screen, so the live DOM IS the bundle).

## 1. Audit scope and method

| Surface | Method | Result |
|---|---|---|
| Workspace refresh | `git pull origin main` (fast-forward: `docs/session_5.md`) | ✅ clean tree, main @ 8ae844d |
| Docs ↔ code alignment | Re-read AGENTS.md, CLAUDE.md, README.md, PAD, flow-schedule_SKILL.md, session_4-review.md, remediation-plan-session4.md, worklog.md, session_5.md; claims re-executed | ✅ aligned — lint ✓ · typecheck ✓ · 59/59 unit |
| Env contract | `.env` = `DATABASE_URL="file:../db/custom.db"`; `db/` at repo root (custom.db + e2e.db); `.env.example` matches the codebase; 15 screenshots in `docs/screenshots/`; vitest + playwright configs present | ✅ correct (sessions 1–4 deliverables intact) |
| Recent code changes (`47c171b`) | Session-4 verified by its own session; fast gates re-run green at base; diff spot-checked | ✅ clean |
| **Reference parity — the LOGIN page, the last surface never verified (session_5.md's forward pointer)** | Live DOM extraction on the reference at all FOUR view states (sign-in, sign-up, forgot-password, reset-sent) + the error/mismatch states + 390px classes + unauth/guard behavior + the 404 page + the root-route behavior | ⚠️ **21 gaps — L-1…L-21, N-1, G-1, R-1, E-1** |

The blind-spot class is FS-12/FS-14 one surface further: sessions 0–4
verified every AUTHENTICATED surface (dashboard, planning, quick actions,
sidebar cards, chrome, header/mobile menu) but the logged-out login page
was built in session 0 from the "reasonable auth card" pattern and never
re-measured. The reference's login is the base44 platform screen — its
design language (slate-900 solid submit, rounded-xl, bg-slate-50/50 inputs,
top gradient bar, real logo image, separate sign-up/forgot VIEWS, shadcn
Alert error cards) diverges from the clone's session-0 guess (sky-blue
gradient submit, rounded-2xl/3xl, transparent inputs, inline sign-up
toggle) on every measured axis.

## 2. Issues, bugs and gaps found

All classes below are the reference's literal values, read off the live
authenticated/anonymized reference DOM (1440×900 unless noted).

### The login page — sign-in view (`/login`)

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| L-1 | High | Page background: clone `bg-gradient-to-br from-slate-50 via-sky-100 to-indigo-100` (the APP canvas); reference `min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4` | Re-class (also the Suspense fallback) |
| L-2 | High | Card: clone `bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8`; reference `text-card-foreground relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl` + a top bar `absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200` | Re-class + add the bar |
| L-3 | Med | Padding: clone `p-8` flat; reference `p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10` | Re-class |
| L-4 | High | Logo: clone = Activity lucide icon in a `w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-600 rounded-2xl` box; reference = the real logo `<img>` (fetched to `public/logo.png`) inside `span.flex.shrink-0.overflow-hidden.rounded-full.relative.h-20 w-20 sm:h-24 sm:w-24.shadow-lg.ring-4.ring-white/50` + a blur halo `absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full blur-xl opacity-30` in a `relative group` wrapper | Replace with the reference's logo treatment |
| L-5 | Med | h1: clone `text-2xl font-bold text-slate-900 text-center`; reference `text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight` | Re-class |
| L-6 | Med | Subtitle: clone `text-slate-500 text-sm mt-1`; reference header block `space-y-2 sm:space-y-3` with p `text-slate-500 text-sm sm:text-base font-medium` | Re-class |
| L-7 | Med | Card content: clone `div.space-y-4` + header `flex flex-col items-center mb-8`; reference `flex flex-col items-center text-center space-y-6 sm:space-y-8` (logo/heading/form siblings) | Restructure |
| L-8 | High | Google button: clone = shadcn outline `rounded-2xl border-slate-200 h-11 px-4 py-2 text-sm` + svg `mr-2`; reference = custom `w-full flex items-center justify-center gap-3 bg-white text-slate-700 px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 font-medium text-[16px] group` + svg wrapper `transition-transform duration-200 -ml-4` | Re-class (keep the notice behavior — ADR-002) |
| L-9 | Med | Divider: clone `relative` + `span.w-full.border-t.border-slate-200` + `span.bg-white/95 px-2 text-slate-400`; reference `relative my-6` + `shrink-0 h-[1px] w-full bg-slate-200` + `span.bg-white px-3 text-slate-500 font-medium tracking-wider` | Re-class |
| L-10 | Med | Form spacing: clone `space-y-4` / rows `space-y-2`; reference `space-y-4 sm:space-y-5` / fields wrapper `space-y-3 sm:space-y-4` / rows `space-y-1.5` | Re-class |
| L-11 | High | Inputs: clone `rounded-2xl h-11 pl-10` (transparent bg, default border) + placeholders "Email"/"Password"; reference `pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-600` + placeholders `you@example.com` / `••••••••` | Re-class + placeholders |
| L-12 | Low | Input icons: clone `text-slate-400`; reference `text-slate-500` (sign-in) | Re-class |
| L-13 | High | Submit: clone `rounded-2xl h-11 bg-gradient-to-r from-sky-500 to-blue-600 …`; reference `w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm rounded-xl transition-all duration-200` — **the reference's submit is DARK SLATE, not the sky gradient** | Re-class |
| L-14 | Med | Footer: clone `flex items-center justify-between text-sm` (always row) + Forgot `text-slate-500 hover:text-sky-600` + signup `text-sky-600 font-medium`; reference `flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0` + Forgot `text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors` + signup `text-sm text-slate-500 hover:text-slate-700 transition-colors` with inner `span.font-medium.text-slate-700` | Re-class |
| L-15 | Low | Labels: clone default color; reference `text-sm font-medium text-slate-700` | Re-class |
| L-16 | High | Error state: clone inline `p.text-sm.text-red-600`; reference a shadcn-style Alert `div[role=alert].relative.w-full.border.p-4 … bg-red-50/70 border-red-200 rounded-xl` + inner `[&_p]:leading-relaxed text-red-700 text-sm` "Invalid email or password" — placed INSIDE the form, between the fields and the buttons | Build the Alert (shared with mismatch/reset states) |
| L-20 | Med | Below the card: clone a "← Back to FlowSchedule" link (clone-only); reference an EMPTY mobile-only spacer `div.mt-8.text-center.text-xs.text-slate-400.sm:hidden` with `&nbsp;` | Replace |
| L-22 | Low | Sign-in password input carries clone-only `minLength={8}` (browser validation UI the reference does not show); reference sign-in has no minlength | Drop (server still enforces) |

### The login page — sign-up view (separate VIEW, not an inline toggle)

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| L-16a | High | Clone toggles the SAME card inline (adds a "Name" field, swaps the submit label); the reference swaps to a SEPARATE view: "Back to sign in" button (`flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors -mb-2` + ArrowLeft `h-4 w-4`) + h2 `text-xl sm:text-2xl font-bold text-slate-900` "Create your account" + Email/Password/**Confirm Password** (NO Name field — the platform derives it) + submit "Create account" (`h-10 sm:h-11 bg-slate-900 … rounded-xl`) | Rebuild as view state |
| L-16b | High | Sign-up inputs are the SMALLER variant: `h-10 sm:h-11` (vs sign-in's h-11 sm:h-12), icons `text-slate-400` (vs sign-in's text-slate-500), `placeholder:text-slate-400 text-sm sm:text-base`, placeholders `you@example.com` / `Min. 8 characters` / `Re-enter password` | Mirror |
| L-17 | High | Confirm mismatch: reference alert "Passwords do not match" (same red Alert component, in-form) — live-verified | Mirror (client-side check) |
| — | Judgement | The reference then shows a "Verify your email" 6-digit OTP view (platform email capability). The self-hosted clone has no email infrastructure — registration completes directly into the session (documented PAD divergence, unchanged). | Accepted divergence |

### The login page — forgot-password view (separate VIEW, not a notice string)

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| L-18 | High | Clone shows a notice string ("handled by your administrator"); the reference swaps to a separate view: "Back to sign in" + h2 "Reset your password" (`text-xl sm:text-2xl font-bold`) + p "Enter your email and we'll send you a link to reset your password" (`text-slate-600 text-sm sm:text-base`) + email field (small variant, `h-10 sm:h-11`, icon `text-slate-400`) + submit "Send reset link" (`h-10 sm:h-11 bg-slate-900 …`) | Rebuild as view state |
| L-19 | Med | Reset-sent success view: Mail icon in `mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center` (icon `h-7 w-7 sm:h-8 sm:w-8 text-slate-700`) + h2 "Check your email" + p "We've sent password reset instructions to<br><span class="font-medium text-slate-900">email</span>" + GREEN alert `bg-green-50/70 border-green-200` / `text-green-700` + "Back to sign in" (full-width link-style). The clone cannot send mail — mirror the VIEW; the green alert's text states the self-hosted reality (the Google-button precedent: reference UI + honest content) | Mirror with adapted alert text |

### Routing / guards

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| G-1 | High | The clone renders the full (app) shell for UNAUTHENTICATED visits to `/Dashboard` / `/Planning` (empty data, no redirect); the reference redirects to `/login` (live-verified: `/Planning` and `/Dashboard` unauth → URL `/login`) | Server-side session guard in `src/app/(app)/layout.tsx` (cookie check via `verifySessionToken`) → `redirect("/login")` |
| R-1 | Med | Root: the clone 307s `/` → `/Dashboard` always; the reference renders the DASHBOARD at `/` when authed (URL stays `/` — live-verified) and redirects to `/login` when unauth. Post-login the reference lands at `/` (the clone pushes `/Dashboard`) | Move the dashboard island into `src/app/(app)/page.tsx` (URL `/` inside the app chrome), delete `src/app/page.tsx`; the login card's default target becomes `/` |
| E-1 | Low | Login failure message: clone "Invalid email or password." (trailing period); reference "Invalid email or password" | Drop the period (both the API string and the e2e pin) |

### The 404 page (never examined)

| ID | Severity | Finding | Fix |
|----|----------|---------|-----|
| N-1 | Med | The clone ships Next.js's default 404; the reference renders a custom page: `min-h-screen flex items-center justify-center p-6 bg-slate-50` + `max-w-md w-full` + `text-center space-y-6` + h1 `text-7xl font-light text-slate-300` "404" + divider `h-0.5 w-16 bg-slate-200 mx-auto` + h2 `text-2xl font-medium text-slate-800` "Page Not Found" + p `text-slate-600 leading-relaxed` "The page <span class="font-medium text-slate-700">"path"</span> could not be found in this application." + "Go Home" button (`px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 …` + home icon `w-4 h-4 mr-2`) → navigates to `/` (live-verified) | Add `src/app/not-found.tsx` |

### Mobile navigation (re-checked, no regression)

- The e2e geometry pin (374/54/192, `tests/e2e/mobile-navigation.spec.ts`)
  stays the authority; the full e2e gate re-runs it. No header changes are
  in this session's scope. No Tailwind v4 regression observed at base
  (fast gates green; token pins intact).

### Deliberately NOT changed (judgment calls, recorded for review)

- **Google button click behavior**: the reference initiates real Google
  OAuth (GSI); the clone shows the self-hosted notice — the documented
  ADR-002 divergence. The BUTTON'S CLASSES are being fixed to parity, the
  click behavior is not.
- **Registration without email verification**: the reference's OTP view is
  platform email infrastructure; the self-hosted clone registers directly
  (PAD §11 documents this). Sign-up view parity covers the form surface.
- **Forgot-password success alert text**: the reference's green alert says
  "Please check your email for the password reset link…"; the clone cannot
  send mail, so the alert carries the same chrome with an honest
  self-hosted message (the Google-notice pattern).
- **`autocomplete` attributes on inputs** (clone has them, reference
  doesn't): invisible a11y floor — session-2/3 precedent, kept.
- **`aria-label`s / role attrs on the login forms**: kept (invisible floor).
- **The reference's toaster (`[data-rht-toaster]`)**: empty at rest; no
  toast fired in any observed flow — not a visible surface, skipped.
- **Store seam**: the login page keeps its own `fetch` (it pre-dates the
  store contract for authenticated routes — the login card is
  unauthenticated; the store's `api()` helper requires no session for
  /api/auth/*). No change.

## 3. TDD execution order

**e2e (RED) → implementation (GREEN) → gate.**

- **E-A** rework `tests/e2e/auth.spec.ts`:
  - "renders the auth card" → pins the reference chrome: logo `<img>` with
    `alt="FlowSchedule logo"`, `rounded-2xl` card, top gradient bar, h1
    `tracking-tight`, placeholders `you@example.com` / `••••••••`, submit
    `bg-slate-900`, footer `flex-col sm:flex-row` classes, NO "Back to
    FlowSchedule" link.
  - "rejects wrong credentials with an inline error" → the red Alert
    (`[role=alert]` with `bg-red-50/70`), text "Invalid email or password"
    (no period).
  - "sign-up view matches the reference flow" → click "Need an account?
    Sign up" → h2 "Create your account" + "Back to sign in" button +
    Confirm Password field + "Create account" submit; mismatch →
    "Passwords do not match" alert; matching → account created → lands on
    `/` with the dashboard.
  - "forgot-password view matches the reference flow" → click "Forgot
    password?" → "Reset your password" + email + "Send reset link" →
    "Check your email" view with the green alert + Back.
  - "signs in with valid credentials" → lands on `/` (URL exactly `/`)
    with "Weekly Schedule" visible.
  - "unauthenticated /Dashboard redirects to /login" (new).
  - "unauthenticated / redirects to /login" (new).
- **E-B** new `tests/e2e/not-found.spec.ts`: unknown path → 404 heading +
  "Page Not Found" + the path echoed + "Go Home" → `/`.
- **GREEN (implementation)**:
  1. `public/logo.png` ← the reference's logo asset (downloaded).
  2. Rewrite `src/app/login/page.tsx`: view state machine
     (`signin | signup | forgot | reset-sent`), the shared `AuthAlert`
     component (red/green variants, reference classes), the reference's
     card chrome/logo/inputs/buttons/footer; error message period fix
     (`src/app/api/auth/login/route.ts`).
  3. `src/app/(app)/layout.tsx`: server-side session guard →
     `redirect("/login")` when the cookie is absent/invalid.
  4. Extract the dashboard island → both `src/app/(app)/page.tsx` (URL
     `/`) and `src/app/(app)/Dashboard/page.tsx` render it; delete
     `src/app/page.tsx`; login default target → `/`.
  5. `src/app/not-found.tsx` (the reference's 404 design; client component
     for the Go Home navigation).
- **Gate**: lint → typecheck → unit 59 → build → e2e ×2 → smoke 25/25.
- **Live parity spot-check on BOTH apps** (agent-browser): the four login
  views side-by-side, the 404 side-by-side, the guard behavior, the
  post-login `/` landing, the mobile-menu e2e re-pin.
- **Docs**: README (features: auth flows; testing counts), PAD (§ ledger,
  §3 tree + route table, §11), AGENTS.md (login conventions + quirks),
  CLAUDE.md (counts), flow-schedule_SKILL.md (v1.4.0: FS-15 — the
  logged-out surface is a parity surface too), this plan, session review,
  worklog.
- **Screenshots**: re-capture 01-login (new design) + new captures:
    signup view, forgot view, reset-sent view, 404 page.
- **Deliver**: single commit on `main`, pushed via `docs/ssh_git_wrapper_v3.py`
  per `docs/how-to-git-push-using-ssh-wrapper_SKILL.md`. No new branches.

## 4. Non-goals (deliberately not changed)

- **Mobile navigation / header** — pinned by the e2e spec; zero changes.
- **Dashboard / Planning / Quick Actions / sidebar cards / Profile /
  Settings** — sessions 0–4 decompile-pinned; zero changes.
- **API shapes/envelopes, auth crypto, rate limiter, DB contract** — the
  only API change is the login error message's trailing period.
- **The reference's OTP email-verification view** — platform capability,
  documented divergence.
- **`skills/` folder** — excluded from checking/testing/compilation.

## 5. Execution record

| Item | Outcome |
|---|---|
| E-A (RED) | 12 of the 14 new/reworked auth specs failed against the pre-fix build exactly as predicted (the two that passed: the Google-notice behavior and the resting heading checks — content that did not change); not-found.spec.ts failed on the missing 404 page |
| E-B (RED) | `not-found.spec.ts` failed: Next's default 404 (no "Page Not Found" heading, no Go Home) |
| L-1…L-15, L-20, L-22 (GREEN) | `src/app/login/page.tsx` rewritten as a four-view state machine: the reference's page canvas (`from-slate-50 to-slate-100`, also the Suspense fallback), the `rounded-2xl border-0 backdrop-blur-sm` card + slate top gradient bar, responsive padding `p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10`, the real logo PNG (`public/logo.png`, fetched from the reference's own asset URL) in the ringed circle + blur halo, `tracking-tight` h1, `font-medium` subtitle, the custom Google button (`gap-3 px-5 py-3.5 rounded-xl text-[16px]`, `-ml-4` icon wrapper — the notice behavior kept per ADR-002), the `my-6` divider (`h-[1px]` + `px-3 font-medium tracking-wider`), `text-slate-700` labels, `h-11 sm:h-12 bg-slate-50/50 rounded-xl` inputs with `you@example.com` / `••••••••` placeholders, `text-slate-500` icons, the solid **slate-900** submit, the `flex-col sm:flex-row` footer with slate links, the empty mobile-only spacer (the clone-only "← Back" link removed), and the sign-in password's clone-only `minLength` dropped |
| L-16/L-17 (GREEN) | Sign-up rebuilt as a SEPARATE VIEW: Back-to-sign-in (ArrowLeft, `-mb-2`), h2 "Create your account", Email/Password/Confirm Password (the smaller `h-10 sm:h-11` variant, `text-slate-400` icons, "Min. 8 characters" / "Re-enter password" placeholders), "Create account" submit; the client-side mismatch check renders the red AuthAlert "Passwords do not match" (live-verified text on the reference) |
| L-18/L-19 (GREEN) | Forgot-password rebuilt as a SEPARATE VIEW (h2 "Reset your password", the explanatory p, the small email field, "Send reset link") + the reset-sent view (Mail icon circle, h2 "Check your email", the email span, the GREEN AuthAlert with the honest self-hosted message, full-width Back) — the reference's chrome with adapted alert content (the Google-notice pattern, judgment call documented in §2) |
| L-16 alert (GREEN) | `AuthAlert` component — the reference's exact alert classes (red `bg-red-50/70 border-red-200` / green `bg-green-50/70 border-green-200`, `[&_p]:leading-relaxed text-red-700/green-700 text-sm`, the inert `[&>svg…]` variants included) |
| E-1 (GREEN) | `/api/auth/login` failure message → "Invalid email or password" (trailing period dropped; the e2e pins the no-period string) |
| G-1 (GREEN) | `(app)/layout.tsx` → an async server component: `getSessionUser()` (cookie + HMAC + user row) → `redirect("/login")` when absent; the (app) pages became dynamic (cookies are read) — build output verified |
| R-1 (GREEN) | The dashboard island extracted to `src/components/dashboard/DashboardView.tsx`; `src/app/(app)/page.tsx` renders it at `/` and `src/app/(app)/Dashboard/page.tsx` is a thin wrapper; `src/app/page.tsx` (the root redirect) DELETED; the login card's default target is now `/` (post-login landing matches the reference); the sitemap gains `/` as the primary entry |
| N-1 (GREEN) | `src/app/not-found.tsx` — the reference's 404 (text-7xl font-light slate-300 numeral, `h-0.5 w-16` divider, h2 "Page Not Found", the path echoed via `usePathname`, the "Go Home" button with the reference's home icon → `/`); hydration-safe (no set-state-in-effect) |
| Flakes fixed during GREEN | (1) Next's route announcer `#__next-route-announcer__` carries `role="alert"` → strict-mode two-element resolution → scoped with `:not(#__next-route-announcer__)`; (2) `getByLabel("Password")` substring-matched "Confirm Password" → `{ exact: true }` |
| Infra | `.gitignore` + eslint ignores gain `reference/` (the downloaded decompile-analysis bundle chunks — scratch, never committed); `scripts/smoke-test.sh` restructured: authed page renders (200 incl. `/`) checked BEFORE logout, unauth guard redirects (307 → /login) after (25 → 30 checks) |
| Gate | `bun run lint` clean · typecheck clean · `test` **59/59** · build green (self-type-checked; `/`, `(app)` routes dynamic, `/_not-found` static, `/login` static — 19 routes) · `test:e2e` **51/51 × 2 consecutive full runs** (was 43; +8 auth-view/guard specs + the not-found suite) · smoke **30/30** |
| Live parity (both apps) | JSON class diff of 13 key login elements (card, top bar, padding, content wrapper, h1, subtitle, Google button, divider span, label, email input, submit, footer, forgot link): **13/13 byte-identical**; the error alert + the sign-up/forgot/reset views verified live on both; unauth `/Dashboard` `/Planning` `/` → `/login` on both; post-login pathname stays `/` on both (Weekly Schedule visible); the 404 + Go Home → `/` verified; mobile trigger 374/50/36 on both, reference menu re-measured 374/54/192 (the clone pinned by the e2e spec) — **no Tailwind v4 regression** |
| Screenshots | 20 captures in `docs/screenshots/`: 01-login re-captured (new card design) + new 16-login-signup, 17-login-forgot, 18-login-reset-sent, 19-404, 20-login-mobile; 02–15 re-captured where the chrome changed or still current — all state-gated (heading waits) via `scripts/capture-screenshots.mjs` |
| Docs | README (guards/404 feature row, 51 e2e, screenshot list, tree), AGENTS.md (51 e2e, the root-route/guard invariant, the login convention, the two new quirks, session-5 references), CLAUDE.md (51 e2e, testing), PAD (§3 tree + Layer-0 guard, §8 counts + spec list, §11 OTP note, §12 five new ledger rows), flow-schedule_SKILL.md v1.4.0 (FS-15, 2 debugging rows, Appendix B/C), this plan, `docs/session_5-review.md`, worklog |
| Push | Single commit on `main` via `docs/ssh_git_wrapper_v3.py` (no new branches) |
