// POST /api/auth/register — email + password + name → account + session.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE,
  createSessionToken,
  hashPassword,
  initialFromEmail,
  sessionCookieOptions,
} from "@/lib/auth";
import { clientIp, fail, ok, rateLimit, readJson } from "@/lib/api";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`register:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: { code: "RATE_LIMITED", message: "Too many attempts. Try again shortly." } },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const body = await readJson(req);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const fullName =
    typeof body.fullName === "string" && body.fullName.trim().length > 0
      ? body.fullName.trim()
      : email.split("@")[0] ?? email;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("VALIDATION", "A valid email address is required.");
  }
  if (password.length < 8) {
    return fail("VALIDATION", "Password must be at least 8 characters.");
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return fail("CONFLICT", "An account with that email already exists.", 409);
  }

  const user = await db.user.create({
    data: {
      email,
      fullName: fullName || initialFromEmail(email),
      passwordHash: hashPassword(password),
    },
  });

  const res = ok({ id: user.id, email: user.email, fullName: user.fullName }, 201);
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions());
  return res;
}
