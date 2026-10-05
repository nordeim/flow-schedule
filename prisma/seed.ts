// FlowSchedule — idempotent seed.
// Creates the demo user (demo@flowschedule.app / demo1234) plus a week of
// sample tasks and two starter notes. Re-running within the same week is
// a no-op: the user is upserted by unique email, and sample tasks/notes
// are guarded by is_sample = true. When the seeded sample week has gone
// STALE (the database was seeded last week — E-1, session 13), the
// is_sample task rows are deleted and re-created on the CURRENT week so
// the calendar (always the current week) keeps rendering them; the
// user's own rows are never touched.

import { PrismaClient } from "@prisma/client";
import { resolveProcessDatabaseUrl } from "../src/lib/db-path";
import { isSampleWeekStale } from "../src/lib/sample-week";

process.env.DATABASE_URL = resolveProcessDatabaseUrl();

const prisma = new PrismaClient();

function at(dayOffset: number, hour: number, minute = 0): Date {
  const d = new Date();
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  const target = new Date(monday);
  target.setDate(monday.getDate() + dayOffset);
  target.setHours(hour, minute, 0, 0);
  return target;
}

async function main() {
  const email = "demo@flowschedule.app";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      fullName: "Demo Scheduler",
      // hashPassword('demo1234') — scrypt: salt:hash
      passwordHash:
        "64b7abaf666055cb67b4910c5d527b30:7861384724c73d251705a15bc209b006be485865192790e40875be614414d77e94b62f4af5ee516d9dabf59247f7cfc3c4b7776805f40fa0a653b08eb07129b3",
    },
  });

  // E-1 (session 13): re-anchor the sample week when it has gone stale.
  // The seed anchors its scheduled samples to the week the database was
  // FIRST seeded; after a week rollover the calendar (always the current
  // week) renders none of them — reproduced live at the Sunday→Monday UTC
  // boundary (67/67 at 23:40, seeded-task spec failures 35 minutes
  // later). The staleness decision lives in src/lib/sample-week.ts
  // (unit-pinned); only is_sample rows are ever deleted.
  const sampleCount = await prisma.task.count({
    where: { userId: user.id, isSample: true },
  });
  const earliestSample =
    sampleCount > 0
      ? await prisma.task.findFirst({
          where: { userId: user.id, isSample: true, startTime: { not: null } },
          orderBy: { startTime: "asc" },
        })
      : null;
  const stale = isSampleWeekStale(earliestSample?.startTime ?? null, new Date());
  if (sampleCount > 0 && stale) {
    await prisma.task.deleteMany({ where: { userId: user.id, isSample: true } });
    console.log("Sample tasks re-anchored to the current week");
  }

  const existingSamples = stale ? 0 : sampleCount;
  if (existingSamples === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: "Team standup",
          description: "Daily sync with the product team",
          category: "work",
          priority: "medium",
          startTime: at(0, 9, 30),
          durationMinutes: 30,
          isSample: true,
          userId: user.id,
        },
        {
          title: "Deep work: roadmap draft",
          description: "Write the Q4 roadmap first draft",
          category: "work",
          priority: "high",
          startTime: at(0, 11),
          durationMinutes: 120,
          isSample: true,
          userId: user.id,
        },
        {
          title: "Lunch break",
          category: "personal",
          priority: "low",
          startTime: at(0, 13),
          durationMinutes: 60,
          isSample: true,
          userId: user.id,
        },
        {
          title: "Gym session",
          category: "health",
          priority: "medium",
          startTime: at(1, 18),
          durationMinutes: 90,
          isSample: true,
          userId: user.id,
        },
        {
          title: "Read 30 pages",
          description: "Currently: Deep Work",
          category: "learning",
          priority: "low",
          startTime: at(2, 20, 30),
          durationMinutes: 45,
          isSample: true,
          userId: user.id,
        },
        {
          title: "Sketch cover ideas",
          category: "creative",
          priority: "low",
          startTime: at(3, 16),
          durationMinutes: 60,
          isSample: true,
          userId: user.id,
        },
        {
          title: "Dinner with Alex",
          category: "social",
          priority: "medium",
          startTime: at(4, 19),
          durationMinutes: 120,
          isSample: true,
          userId: user.id,
        },
        {
          title: "Weekly review + next-week plan",
          category: "planning",
          priority: "high",
          startTime: at(6, 10),
          durationMinutes: 60,
          isSample: true,
          userId: user.id,
        },
        {
          title: "Book dentist appointment",
          category: "health",
          priority: "urgent",
          isSample: true,
          userId: user.id,
        },
      ],
    });
    console.log("Seeded 9 sample tasks");
  } else {
    console.log(`Sample tasks already present (${existingSamples}) — skipped`);
  }

  const existingNotes = await prisma.note.count({
    where: { userId: user.id, isSample: true },
  });
  if (existingNotes === 0) {
    await prisma.note.createMany({
      data: [
        {
          content:
            "Brainstorm: split the weekly review into 15 min inbox triage + 45 min planning blocks.",
          tags: JSON.stringify(["planning", "review"]),
          isSample: true,
          userId: user.id,
        },
        {
          content: "Idea — theme Fridays as deep-work days: no meetings before 14:00.",
          tags: JSON.stringify(["focus"]),
          isSample: true,
          userId: user.id,
        },
      ],
    });
    console.log("Seeded 2 sample notes");
  } else {
    console.log(`Sample notes already present (${existingNotes}) — skipped`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
