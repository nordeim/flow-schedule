import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { serializeNote, serializeTask } from "@/lib/serialize";

// The entity wire KEY ORDER contract (session 16, KO-1 / FS-28) — pinned
// against the reference app's OWN entity traffic (full-body XHR capture +
// direct API probes with the captured auth, ALL SIX response surfaces:
// GET list + POST create + PUT update, Task AND Note — plus the dialog's
// save REQUEST and the Mark Complete REQUEST):
//
//   Task (every response surface, byte-captured):
//     start_time, duration_minutes, end_time, description, title,
//     priority, category, status, id, created_date, updated_date,
//     created_by_id, created_by, is_sample
//   Note (every response surface):
//     title, content, tags, id, created_date, updated_date,
//     created_by_id, created_by, is_sample
//
// The sessions-12 pins asserted the sorted KEY SET (the inference-era
// choice — the emission order was not yet captured); sessions 14/15
// established the RAW RESPONSE TEXT as the parity surface (the float +
// date token forms), and the key order is the last byte class on that
// surface. JSON key order is semantically null and every consumer reads
// by name (mapTask/mapNote, the e2e key pins) — so the existing pins
// stay green and THESE pins assert the exact captured ORDER.
//
// The REQUEST side (the dialog save) was probed byte-for-byte:
//   {title, description, priority, category, start_time, end_time,
//    duration_minutes} (integer duration) — the clone's TaskDialog
// already emits that exact order (verified: no pin needed, the
// planning W-3/W-4 interception spec covers the shape).

const repo = path.resolve(import.meta.dirname, "..");

// Prisma-shaped fixtures (what the routes receive from db.* calls).
const prismaTask = {
  id: "t1",
  title: "Team standup",
  description: null,
  priority: "medium",
  category: "work",
  status: "todo",
  startTime: new Date("2026-10-04T09:30:00.000Z"),
  endTime: new Date("2026-10-04T10:00:00.000Z"),
  durationMinutes: 30,
  isSample: false,
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-02T00:00:00.000Z"),
  userId: "u1",
};

const prismaNote = {
  id: "n1",
  title: "Idea",
  content: "Theme Fridays as deep-work days.",
  tags: '["work","focus"]',
  isSample: true,
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-02T00:00:00.000Z"),
  userId: "u1",
};

const author = { id: "u1", email: "demo@flowschedule.app" };

const CAPTURED_TASK_ORDER = [
  "start_time",
  "duration_minutes",
  "end_time",
  "description",
  "title",
  "priority",
  "category",
  "status",
  "id",
  "created_date",
  "updated_date",
  "created_by_id",
  "created_by",
  "is_sample",
];

const CAPTURED_NOTE_ORDER = [
  "title",
  "content",
  "tags",
  "id",
  "created_date",
  "updated_date",
  "created_by_id",
  "created_by",
  "is_sample",
];

describe("serializeTask — the captured emission order (KO-1)", () => {
  it("emits the keys in the reference's captured order (all six surfaces probed)", () => {
    const wire = serializeTask(prismaTask, author) as Record<string, unknown>;
    // EXACT order — no sort. The reference's platform emits this order
    // on GET, POST, and PUT alike (probed live, session 16).
    expect(Object.keys(wire)).toEqual(CAPTURED_TASK_ORDER);
  });

  it("emits the same order for null/unscheduled fields (the null form keeps its slot)", () => {
    const wire = serializeTask(
      { ...prismaTask, startTime: null, endTime: null, durationMinutes: null },
      author,
    ) as Record<string, unknown>;
    expect(Object.keys(wire)).toEqual(CAPTURED_TASK_ORDER);
  });
});

describe("serializeNote — the captured emission order (KO-1)", () => {
  it("emits the keys in the reference's captured order (all six surfaces probed)", () => {
    const wire = serializeNote(prismaNote, author) as Record<string, unknown>;
    expect(Object.keys(wire)).toEqual(CAPTURED_NOTE_ORDER);
  });

  it("keeps the order with a null title (the reference's notes ship title:null)", () => {
    const wire = serializeNote({ ...prismaNote, title: null }, author) as Record<
      string,
      unknown
    >;
    expect(Object.keys(wire)).toEqual(CAPTURED_NOTE_ORDER);
  });
});

describe("the text seam — JSON.stringify preserves the emission order", () => {
  it("the serialized Task JSON starts with the start_time token", () => {
    // JSON.stringify emits string keys in insertion order; the raw
    // response text (post okWire transforms — order-agnostic regex
    // substitutions) carries this order to the wire.
    const text = JSON.stringify(serializeTask(prismaTask, author));
    expect(text.startsWith('{"start_time":"2026-10-04T09:30:00.000Z"')).toBe(true);
    // …and the second token is the duration (the captured pair).
    expect(text).toMatch(/^\{"start_time":"[^"]+","duration_minutes":30,/);
  });

  it("the serialized Note JSON starts with the title token", () => {
    const text = JSON.stringify(serializeNote(prismaNote, author));
    expect(text.startsWith('{"title":"Idea","content":')).toBe(true);
  });

  it("the okWire transforms do not reorder the keys (disjoint token substitutions)", () => {
    // The float + date transforms are regex substitutions over the
    // serialized text — they cannot move tokens; this pins the
    // composition's order preservation at the unit seam (the e2e
    // pins the raw response text end-to-end).
    const wire = serializeTask(prismaTask, author);
    const text = JSON.stringify({ task: wire });
    expect(text).toMatch(/^\{"task":\{"start_time"/);
    expect(text.indexOf('"start_time"')).toBeLessThan(text.indexOf('"id"'));
    expect(text.indexOf('"id"')).toBeLessThan(text.indexOf('"created_date"'));
    expect(text.indexOf('"created_date"')).toBeLessThan(text.indexOf('"is_sample"'));
  });
});

describe("the end_time derivation removal (ET-1) — route source pins", () => {
  // The reference stores end_time AS SUBMITTED (probed live, session 16:
  // a POST with start_time + duration_minutes but no end_time stores
  // end_time:null — the task is EXCLUDED from Log Activity by the H1e
  // null guard; a PUT updates ONLY the provided fields — Mark Complete
  // probed: PUT {"status":"completed"}). The clone's server-side
  // derivation made direct-API-created tasks behave differently on the
  // two apps. These pins guard the ABSENCE of the derivation (the
  // file-read precedent from wire-dates; the e2e wire spec pins the
  // behavior end-to-end: end_time:null on a no-end_time POST).
  it("POST /api/tasks carries no start+duration end_time derivation", () => {
    const src = readFileSync(
      path.join(repo, "src", "app", "api", "tasks", "route.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/startTime\.getTime\(\)\s*\+\s*durationMinutes\s*\*\s*60_000/);
    expect(src).not.toMatch(/endTime\s*=\s*startTime\s*&&\s*durationMinutes/);
  });

  it("PATCH /api/tasks/[id] carries no recompute-on-start/duration-change block", () => {
    const src = readFileSync(
      path.join(repo, "src", "app", "api", "tasks", "[id]", "route.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/recomputeEnd/);
    expect(src).not.toMatch(/start\.getTime\(\)\s*\+\s*duration\s*\*\s*60_000/);
  });

  it("a SUPPLIED end_time still validates on both routes (the guard stays)", () => {
    // The validation of caller-supplied end_time is parity (the dialog
    // always sends it); only the silent fallback is removed.
    for (const rel of [
      path.join("src", "app", "api", "tasks", "route.ts"),
      path.join("src", "app", "api", "tasks", "[id]", "route.ts"),
    ]) {
      const src = readFileSync(path.join(repo, rel), "utf8");
      expect(src).toMatch(/end_time is not a valid date/);
    }
  });
});
