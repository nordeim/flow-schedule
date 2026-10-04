import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit, __bucketsForTest } from "@/lib/api";

// Login/register rate limiting — the reference platform's per-IP fixed
// window, self-hosted (session-3 D-2 adds expired-bucket eviction).
//
// Semantics pinned by this suite:
//   - 10 hits per 60s window per key (11th blocked, retryAfter <= 60)
//   - the window resets fully after resetAt passes
//   - expired buckets are evicted by a throttled sweep (at most one sweep
//     per window) so the map cannot leak forever — an attacker spraying
//     from many distinct IPs used to grow the map unboundedly, and stale
//     entries lived forever. Live keys are never touched.

const KEY = "login:203.0.113.9";

describe("rateLimit fixed window", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-04T12:00:00Z"));
    // Module state persists across tests in a file — start each clean.
    __bucketsForTest().clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows 10 hits then blocks with a bounded retryAfter", () => {
    for (let i = 0; i < 10; i++) {
      expect(rateLimit(KEY)).toEqual({ allowed: true, retryAfter: 0 });
    }
    const blocked = rateLimit(KEY);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
    // Still blocked on subsequent hits within the same window.
    expect(rateLimit(KEY).allowed).toBe(false);
  });

  it("tracks keys independently", () => {
    for (let i = 0; i < 10; i++) rateLimit(KEY);
    expect(rateLimit(KEY).allowed).toBe(false);
    expect(rateLimit("login:198.51.100.7").allowed).toBe(true);
  });

  it("resets the window after 60s", () => {
    for (let i = 0; i < 10; i++) rateLimit(KEY);
    expect(rateLimit(KEY).allowed).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(rateLimit(KEY)).toEqual({ allowed: true, retryAfter: 0 });
    // Fresh window: the counter starts over — 9 more hits stay allowed…
    for (let i = 0; i < 9; i++) expect(rateLimit(KEY).allowed).toBe(true);
    // …and the fresh window's 11th call blocks again.
    expect(rateLimit(KEY).allowed).toBe(false);
  });
});

describe("rateLimit bucket eviction (D-2)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-04T12:00:00Z"));
    __bucketsForTest().clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stays bounded while spraying distinct keys (the leak fix)", () => {
    const start = Date.now();
    let maxSize = 0;
    for (let i = 0; i < 5_000; i++) {
      vi.setSystemTime(start + i * 1_000);
      rateLimit(`login:10.${Math.floor(i / 65536)}.${Math.floor(i / 256) % 256}.${i % 256}`);
      maxSize = Math.max(maxSize, __bucketsForTest().size);
    }
    // Without eviction the map holds 5_000 entries; the throttled sweep
    // keeps it near the live-window population (60s of distinct keys).
    expect(maxSize).toBeLessThan(1_000);
  });

  it("evicts all expired buckets on the next window", () => {
    const start = Date.now();
    for (let i = 0; i < 600; i++) {
      vi.setSystemTime(start + i * 1_000);
      rateLimit(`old:${i}`);
    }
    // Everything has long expired.
    vi.setSystemTime(start + 720_000);
    rateLimit("final");
    expect(__bucketsForTest().size).toBe(1); // only the final bucket
  });

  it("keeps live (unexpired) buckets through a sweep", () => {
    const t0 = Date.now();
    // 600 keys whose window expires at t0+60s …
    for (let i = 0; i < 600; i++) rateLimit(`old:${i}`);
    // … plus 50 keys whose window expires at t0+70s (still live at t0+65s).
    vi.setSystemTime(t0 + 10_000);
    for (let i = 0; i < 50; i++) rateLimit(`live:${i}`);
    // A sweep at t0+65s must evict only the expired `old:*` buckets.
    vi.setSystemTime(t0 + 65_000);
    rateLimit("trigger");
    const keys = [...__bucketsForTest().keys()];
    expect(keys.filter((k) => k.startsWith("live:")).length).toBe(50);
    expect(__bucketsForTest().size).toBe(51); // 50 live + the trigger bucket
  });
});
