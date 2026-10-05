// FlowSchedule — the seed's sample-week staleness seam (session 13, E-1).
//
// A PURE module (the db-path pattern: prisma/seed.ts imports it, the
// unit suite pins it). The seed anchors its 8 scheduled sample tasks to
// the CURRENT week (at(dayOffset, …) offsets from the week's Monday),
// so its rows are only visible on the calendar while that week IS the
// current week. This seam decides when a seeded database has crossed a
// week boundary and needs its samples re-anchored — the calendar
// always renders the current week (the reference's startOfWeek(now)),
// and an idempotency-guarded seed would otherwise leave last week's
// samples invisible forever.

// The Monday of the given date's week — the seed's own `at()` anchoring
// formula (Sunday belongs to the week that STARTED six days earlier).
export function weekMonday(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
}

// True when the sample rows need (re-)creation: no scheduled sample
// exists (fresh database — the original create path), or the earliest
// scheduled sample sits on a week that is not the current one (a seeded
// database that crossed a week boundary — the re-anchor path).
// Week IDENTITY is compared (both Mondays), so any in-week sample
// decides equally; the seed's rows all live inside one week.
export function isSampleWeekStale(
  earliestSampleStart: Date | null,
  now: Date,
): boolean {
  if (earliestSampleStart === null) return true;
  return weekMonday(earliestSampleStart).getTime() !== weekMonday(now).getTime();
}
