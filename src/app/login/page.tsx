"use client";

// /login — mirrors the reference's auth page (the base44 platform screen,
// live-measured session 5 — see docs/remediation-plan-session5.md): a
// centered rounded-2xl card with a slate top gradient bar, the REAL logo
// image in a ringed circle, "Continue with Google" (parity button; no OAuth
// in a self-hosted clone → explanatory hint), email + password fields with
// slate-50/50 backgrounds, a DARK slate-900 submit, and the reference's
// separate VIEW states — sign-up (with Confirm Password) and forgot-password
// (with the check-your-email confirmation) — plus the shadcn-style
// [role=alert] error/success cards.
//
// useSearchParams() requires a Suspense boundary for static prerendering —
// the page shell stays static, the card (which reads ?from_url=) is the
// suspended client island.

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, Mail } from "lucide-react";

// The reference's exact Google "G" mark (four paths, its own colors).
function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// The reference's shadcn-style alert card (red for errors, green for the
// reset confirmation). Exact classes from the live reference DOM.
function AuthAlert({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className={`relative w-full border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground text-foreground ${
        tone === "error"
          ? "bg-red-50/70 border-red-200"
          : "bg-green-50/70 border-green-200"
      } rounded-xl`}
    >
      <div
        className={`[&_p]:leading-relaxed text-sm ${
          tone === "error" ? "text-red-700" : "text-green-700"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// Field label — the reference's exact classes (text-slate-700).
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium text-slate-700"
    >
      {children}
    </label>
  );
}

// Input icon positioner (reference: absolute left-3, centered).
function InputIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{children}</span>
  );
}

type View = "signin" | "signup" | "forgot" | "reset-sent";

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100" />}
    >
      <LoginCard />
    </React.Suspense>
  );
}

function LoginCard() {
  const router = useRouter();
  const params = useSearchParams();
  const fromUrl = params.get("from_url") ?? "/";

  const [view, setView] = React.useState<View>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [resetEmail, setResetEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  // Redirect target must stay in-app (open-redirect guard). The reference
  // lands authenticated users at "/" (the dashboard root).
  const safeTarget = fromUrl.startsWith("/") && !fromUrl.startsWith("//") ? fromUrl : "/";

  const goTo = (next: View) => {
    setView(next);
    setError(null);
    setNotice(null);
  };

  const submitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok: true; data: unknown }
        | { ok: false; error: { message: string } }
        | null;
      if (!res.ok || !body || body.ok === false) {
        const message =
          body && body.ok === false ? body.error.message : "Invalid email or password";
        throw new Error(message);
      }
      router.push(safeTarget);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setBusy(false);
    }
  };

  const submitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok: true; data: unknown }
        | { ok: false; error: { message: string } }
        | null;
      if (!res.ok || !body || body.ok === false) {
        const message =
          body && body.ok === false ? body.error.message : "Could not create your account";
        throw new Error(message);
      }
      router.push(safeTarget);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    // Self-hosted: no mail transport exists, so no request is sent — the
    // reference's check-your-email view still renders (its chrome is the
    // parity surface; the message is honest, like the Google notice).
    setResetEmail(resetEmail);
    setView("reset-sent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-card-foreground relative overflow-hidden border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl">
          {/* The reference's slate top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
          <div className="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10">
            {view === "signin" && (
              <SignInView
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                busy={busy}
                error={error}
                notice={notice}
                setNotice={setNotice}
                onSubmit={submitSignIn}
                onSignUp={() => goTo("signup")}
                onForgot={() => goTo("forgot")}
              />
            )}
            {view === "signup" && (
              <SignUpView
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                busy={busy}
                error={error}
                onSubmit={submitSignUp}
                onBack={() => goTo("signin")}
              />
            )}
            {view === "forgot" && (
              <ForgotView
                email={resetEmail}
                setEmail={setResetEmail}
                onSubmit={submitForgot}
                onBack={() => goTo("signin")}
              />
            )}
            {view === "reset-sent" && <ResetSentView email={resetEmail} onBack={() => goTo("signin")} />}
          </div>
        </div>
        {/* The reference's empty mobile-only spacer under the card */}
        <div className="mt-8 text-center text-xs text-slate-400 sm:hidden">
          <p>&nbsp;</p>
        </div>
      </div>
    </div>
  );
}

// ---- Sign-in view (the reference's resting /login state) -----------------

function SignInView({
  email,
  setEmail,
  password,
  setPassword,
  busy,
  error,
  notice,
  setNotice,
  onSubmit,
  onSignUp,
  onForgot,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  busy: boolean;
  error: string | null;
  notice: string | null;
  setNotice: (v: string | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSignUp: () => void;
  onForgot: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
      {/* The reference's real logo in a ringed circle with a blur halo */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full blur-xl opacity-30 group-hover:opacity-40 transition-opacity duration-300" />
        <span className="flex shrink-0 overflow-hidden rounded-full relative h-20 w-20 sm:h-24 sm:w-24 shadow-lg ring-4 ring-white/50 group-hover:shadow-xl transition-all duration-300">
          <img
            className="aspect-square h-full w-full object-cover"
            alt="FlowSchedule logo"
            src="/logo.png"
          />
        </span>
      </div>
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Welcome to FlowSchedule
        </h1>
        <p className="text-slate-500 text-sm sm:text-base font-medium">Sign in to continue</p>
      </div>
      <div className="w-full">
        <div className="space-y-3">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 font-medium text-[16px] group"
            onClick={() =>
              setNotice(
                "Google sign-in is not available in this self-hosted clone. Use email and password below.",
              )
            }
          >
            <div className="transition-transform duration-200 -ml-4">
              <GoogleMark />
            </div>
            <span>Continue with Google</span>
          </button>
        </div>
        {notice && (
          <p className="text-xs text-slate-500 text-center px-4 pt-3" role="status">
            {notice}
          </p>
        )}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="shrink-0 h-[1px] w-full bg-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-500 font-medium tracking-wider">or</span>
          </div>
        </div>
        <form className="space-y-4 sm:space-y-5" onSubmit={onSubmit}>
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <div className="relative">
                <InputIcon>
                  <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
                </InputIcon>
                <input
                  type="email"
                  id="email"
                  className="flex w-full border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-600"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <InputIcon>
                  <Lock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                </InputIcon>
                <input
                  type="password"
                  id="password"
                  className="flex w-full border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 h-11 sm:h-12 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-600"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>
          {error && <AuthAlert tone="error">{error}</AuthAlert>}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-3 py-2 w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm rounded-xl transition-all duration-200"
            >
              {busy ? "Please wait…" : "Sign in"}
            </button>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                onClick={onForgot}
              >
                Forgot password?
              </button>
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                onClick={onSignUp}
              >
                Need an account? <span className="font-medium text-slate-700">Sign up</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Sign-up view (the reference's separate create-account screen) -------

function BackToSignIn({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors -mb-2"
      onClick={onBack}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to sign in
    </button>
  );
}

function SignUpView({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  busy,
  error,
  onSubmit,
  onBack,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  busy: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  // The reference's sign-up inputs are the SMALLER variant (h-10 sm:h-11,
  // slate-400 icons/placeholders, text-sm sm:text-base).
  const inputClass =
    "flex w-full border px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 h-10 sm:h-11 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400 text-sm sm:text-base";
  return (
    <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
      <div className="w-full">
        <div className="space-y-4">
          <BackToSignIn onBack={onBack} />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Create your account</h2>
          <form className="space-y-3 sm:space-y-4" onSubmit={onSubmit}>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <div className="relative">
                  <InputIcon>
                    <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </InputIcon>
                  <input
                    type="email"
                    id="email"
                    className={inputClass}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <InputIcon>
                    <Lock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </InputIcon>
                  <input
                    type="password"
                    id="password"
                    className={inputClass}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                <div className="relative">
                  <InputIcon>
                    <Lock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </InputIcon>
                  <input
                    type="password"
                    id="confirmPassword"
                    className={inputClass}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {error && <AuthAlert tone="error">{error}</AuthAlert>}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-3 py-2 w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm rounded-xl transition-all duration-200"
            >
              {busy ? "Please wait…" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---- Forgot-password view (the reference's reset-request screen) ---------

function ForgotView({
  email,
  setEmail,
  onSubmit,
  onBack,
}: {
  email: string;
  setEmail: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
      <div className="w-full">
        <div className="space-y-4 sm:space-y-6">
          <BackToSignIn onBack={onBack} />
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Reset your password</h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Enter your email and we&apos;ll send you a link to reset your password
            </p>
          </div>
          <form className="space-y-4 sm:space-y-5" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <div className="relative">
                <InputIcon>
                  <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </InputIcon>
                <input
                  type="email"
                  id="email"
                  className="flex w-full border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 h-10 sm:h-11 bg-slate-50/50 border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 px-3 py-2 w-full h-10 sm:h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm rounded-xl transition-all duration-200"
            >
              Send reset link
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---- Reset-sent view (the reference's check-your-email screen) -----------

function ResetSentView({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
      <div className="w-full">
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Mail className="h-7 w-7 sm:h-8 sm:w-8 text-slate-700" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Check your email</h2>
              <p className="text-slate-600 text-sm sm:text-base">
                We&apos;ve sent password reset instructions to
                <br />
                <span className="font-medium text-slate-900">{email}</span>
              </p>
            </div>
          </div>
          <AuthAlert tone="success">
            This self-hosted clone has no mail transport — password resets are handled by
            your workspace administrator.
          </AuthAlert>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
