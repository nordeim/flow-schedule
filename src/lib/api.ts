// FlowSchedule — API route helpers: the { ok, data } | { ok, error } envelope
// (same contract as the ORBITAL/scandihaven ActionResult pattern) plus a
// tiny in-memory per-IP login rate limiter (429 + Retry-After).

import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { floatFormatDurations } from "@/lib/serialize";

export type ApiError = { ok: false; error: { code: string; message: string } };
export type ApiOk<T> = { ok: true; data: T };
export type ApiResult<T> = ApiOk<T> | ApiError;

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, { status });
}

// okWire (session 14): the envelope helper for responses that can
// carry a Task wire — same { ok, data } envelope as ok(), but the
// body is serialized as TEXT and passed through
// floatFormatDurations so the integer duration tokens read
// "duration_minutes":60.0, matching the reference's Python-backed
// entity wire byte for byte (session-12 P-1, closed this session).
// Consumers parse identically (JSON 60.0 === 60); only the raw
// response text differs. Used by GET/POST /api/tasks and PATCH
// /api/tasks/[id] — the only responses carrying serialized tasks.
export function okWire<T>(data: T, status = 200) {
  const json = floatFormatDurations(
    JSON.stringify({ ok: true, data } satisfies ApiOk<T>),
  );
  return new NextResponse(json, {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json<ApiError>(
    { ok: false, error: { code, message } },
    { status },
  );
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "local";
}

// ---- login/register rate limiting (fixed window, in-memory) --------------

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_HITS = 10;
// Throttled sweep: at most one full eviction pass per window. Without it the
// map leaks forever — expired buckets were never freed, so an attacker
// spraying logins from many distinct IPs grew the map unboundedly (the
// single-instance assumption caps live keys, not stale ones). A backward
// clock jump (NTP step, VM migration) also re-arms the sweep.
let lastSweep = 0;

function sweepExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
  lastSweep = now;
}

function shouldSweep(now: number): boolean {
  return now - lastSweep >= WINDOW_MS || now < lastSweep;
}

export function rateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (shouldSweep(now)) sweepExpired(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > MAX_HITS) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

// Test seam for the bucket map (tests/rate-limit.test.ts) — production code
// must never touch this.
export function __bucketsForTest(): Map<string, Bucket> {
  return buckets;
}

// ---- session guard for API routes -----------------------------------------

export async function requireUser(): Promise<
  { user: SessionUser } | { response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return { response: fail("UNAUTHORIZED", "You must be signed in.", 401) };
  }
  return { user };
}

// ---- body parsing ----------------------------------------------------------

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}
