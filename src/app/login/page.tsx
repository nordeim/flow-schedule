"use client";

// /login — mirrors the reference's auth page: centered card, "Welcome to
// FlowSchedule" + subtitle, Continue with Google (parity button; no OAuth
// in a self-hosted clone → explanatory hint), email + password fields,
// Sign in, forgot-password + sign-up link. Sign-up toggles a register form
// (the reference delegates to the base44 platform; the self-hosted clone
// owns it at POST /api/auth/register).
//
// useSearchParams() requires a Suspense boundary for static prerendering —
// the page shell stays static, the card (which reads ?from_url=) is the
// suspended client island.

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-100 to-indigo-100" />
      }
    >
      <LoginCard />
    </React.Suspense>
  );
}

function LoginCard() {
  const router = useRouter();
  const params = useSearchParams();
  const fromUrl = params.get("from_url") ?? "/Dashboard";

  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  // Redirect target must stay in-app (open-redirect guard).
  const safeTarget = fromUrl.startsWith("/") && !fromUrl.startsWith("//") ? fromUrl : "/Dashboard";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const path = mode === "signin" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName: fullName || undefined }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok: true; data: unknown }
        | { ok: false; error: { message: string } }
        | null;
      if (!res.ok || !body || body.ok === false) {
        const message =
          body && body.ok === false ? body.error.message : "Sign-in failed. Try again.";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-600 rounded-2xl flex items-center justify-center shadow-md mb-4">
              <Activity className="w-8 h-8 text-sky-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 text-center">
              Welcome to FlowSchedule
            </h1>
            <p className="text-slate-500 text-sm mt-1 text-center">
              {mode === "signin" ? "Sign in to continue" : "Create your account"}
            </p>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-2xl border-slate-200 h-11"
              onClick={() =>
                setNotice(
                  "Google sign-in is not available in this self-hosted clone. Use email and password below.",
                )
              }
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {notice && (
              <p className="text-xs text-slate-500 text-center px-4" role="status">
                {notice}
              </p>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/95 px-2 text-slate-400">or</span>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="rounded-2xl h-11"
                    maxLength={100}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="rounded-2xl h-11 pl-10"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="rounded-2xl h-11 pl-10"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    minLength={8}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="w-full rounded-2xl h-11 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
              >
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
              </Button>
            </form>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-slate-500 hover:text-sky-600"
                onClick={() =>
                  setNotice("Password reset is handled by your workspace administrator.")
                }
              >
                Forgot password?
              </button>
              <button
                type="button"
                className="text-sky-600 hover:text-sky-700 font-medium"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                }}
              >
                {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          <Link href="/Dashboard" className="hover:text-slate-600">
            ← Back to FlowSchedule
          </Link>
        </p>
      </div>
    </div>
  );
}
