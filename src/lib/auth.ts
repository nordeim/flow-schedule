// FlowSchedule — cookie-session auth (scrypt + HMAC).
//
// Self-hosted replacement for the reference's base44 platform auth:
//   POST /api/auth/login    email + password → session cookie
//   POST /api/auth/register email + password → account + session
//   POST /api/logout        clears the session
//   GET  /api/auth/me       { user } | { user: null }
//
// Sessions are HMAC-signed tokens ("userId.expiry.hmac") stored in an
// HttpOnly cookie. No external auth dependency; the signing secret comes
// from AUTH_SECRET (falls back to a dev-only constant, matching the
// scaffold's .env.example contract).

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "fs_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length > 0) return secret;
  // Dev-only fallback — documented in .env.example; production must set
  // AUTH_SECRET (generate with `openssl rand -hex 32`).
  return "flow-schedule-dev-secret-do-not-use-in-production";
}

// ---- password hashing (scrypt) -------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// ---- session tokens (HMAC-signed) ----------------------------------------

function sign(payload: string): string {
  return createHmac("sha256", authSecret()).update(payload).digest("hex");
}

export function createSessionToken(userId: string): string {
  const expiry = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expiry}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiry, mac] = parts;
  const expected = sign(`${userId}.${expiry}`);
  if (mac.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  if (Number(expiry) < Date.now()) return null;
  return userId;
}

// ---- request-scoped helpers ----------------------------------------------

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = verifySessionToken(token);
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return { id: user.id, email: user.email, fullName: user.fullName };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export function initialFromEmail(email: string): string {
  const name = email.split("@")[0] ?? "U";
  return name.charAt(0).toUpperCase() || "U";
}
