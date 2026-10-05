import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isSampleWeekStale, weekMonday } from "@/lib/sample-week";

// The sample-week re-anchoring contract (session 13, E-1).
//
// The seed anchors its 8 scheduled sample tasks to the CURRENT week at
// seed time (`at(dayOffset, …)` offsets from the week's Monday), and its
// idempotency guard (`existingSamples === 0`) means a db/e2e.db (or dev
// db/custom.db) seeded LAST week keeps its samples on the PREVIOUS week
// forever — while the calendar always renders the current week. After a
// Sunday→Monday rollover every seeded-task spec fails (reproduced live:
// 67/67 at 23:40 UTC Sunday, seeded-task failures 35 minutes later).
//
// The fix: the seed detects a stale sample week (the earliest scheduled
// sample's Monday ≠ the current Monday) and re-creates the samples on
// the current week — still idempotent within a week, and never touching
// the user's own (is_sample: false) rows.

const repo = path.resolve(import.meta.dirname, "..");

describe("weekMonday (the seed's own anchoring formula, extracted)", () => {
  it("returns the Monday of the given date's week (Sunday ends the week)", () => {
    // 2026-10-04 is a Sunday; its week's Monday is 2026-09-28.
    expect(weekMonday(new Date(2026, 9, 4)).getTime()).toBe(
      new Date(2026, 8, 28).getTime(),
    );
    // 2026-10-05 is a Monday — its own week.
    expect(weekMonday(new Date(2026, 9, 5)).getTime()).toBe(
      new Date(2026, 9, 5).getTime(),
    );
    // Mid-week: Wednesday 2026-10-07 → Monday 2026-10-05.
    expect(weekMonday(new Date(2026, 9, 7)).getTime()).toBe(
      new Date(2026, 9, 5).getTime(),
    );
  });
});

describe("isSampleWeekStale (the re-anchor decision)", () => {
  it("returns true when there is no scheduled sample (create path)", () => {
    expect(isSampleWeekStale(null, new Date(2026, 9, 5))).toBe(true);
  });

  it("returns false when the earliest sample sits on the current week", () => {
    const now = new Date(2026, 9, 7, 15, 0); // Wednesday
    const earliest = new Date(2026, 9, 5, 9, 30); // Monday same week
    expect(isSampleWeekStale(earliest, now)).toBe(false);
  });

  it("returns true when the earliest sample sits on a previous week", () => {
    const now = new Date(2026, 9, 5, 0, 15); // Monday 00:15 — the rollover
    const earliest = new Date(2026, 8, 28, 9, 30); // previous week's Monday
    expect(isSampleWeekStale(earliest, now)).toBe(true);
  });

  it("compares week identity, not timestamps (any in-week sample works)", () => {
    const now = new Date(2026, 9, 6, 12, 0);
    const lateWeekSample = new Date(2026, 9, 11, 21, 0); // Sunday evening
    expect(isSampleWeekStale(lateWeekSample, now)).toBe(false);
  });
});

describe("the seed re-anchors stale sample weeks (E-1 source contract)", () => {
  it("imports the staleness check and wipes only is_sample rows", () => {
    // The db-cli-scripts/next-config file-read precedent: the seed is a
    // script (no exported seams), so its contract is pinned at the source
    // level.
    const seed = readFileSync(path.join(repo, "prisma", "seed.ts"), "utf8");
    expect(seed).toContain("isSampleWeekStale");
    expect(seed).toMatch(/deleteMany\(\s*\{\s*where: \{ userId: user\.id, isSample: true \}/);
  });
});
