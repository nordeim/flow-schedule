// The wire-format contract (session 8 G-4, re-pinned session 12 W-1/W-2):
// the API responses speak the reference app's snake_case entity shape —
// now pinned to the CAPTURED live wire (XHR interception of the reference
// app's own base44 entity traffic, session 12), not decompile inference:
//   Task: start_time / end_time / duration_minutes / created_date /
//         updated_date / is_sample / created_by / created_by_id (+ the
//         6 shape-invariant fields) — 14 keys total
//   Note: title / content / tags (ARRAY) / created_date / updated_date /
//         is_sample / created_by / created_by_id (+ id) — 9 keys total
// serializeTask/serializeNote are the ONLY response seam; they take the
// acting user (author) because the reference's platform injects
// created_by (the author's email) and created_by_id server-side.
import { describe, expect, it } from "vitest";
import { serializeNote, serializeTask } from "@/lib/serialize";

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

// The acting user — the routes pass { id, email } from the session.
const author = { id: "u1", email: "demo@flowschedule.app" };

describe("serializeTask — the reference's captured snake_case entity shape", () => {
  it("maps Prisma camelCase to the reference's snake_case fields", () => {
    const wire = serializeTask(prismaTask, author);
    expect(wire.start_time).toBe("2026-10-04T09:30:00.000Z");
    expect(wire.end_time).toBe("2026-10-04T10:00:00.000Z");
    expect(wire.duration_minutes).toBe(30);
    expect(wire.created_date).toBe("2026-10-01T00:00:00.000Z");
    expect(wire.updated_date).toBe("2026-10-02T00:00:00.000Z");
  });

  it("keeps the shape-invariant fields as-is", () => {
    const wire = serializeTask(prismaTask, author);
    expect(wire.id).toBe("t1");
    expect(wire.title).toBe("Team standup");
    expect(wire.description).toBeNull();
    expect(wire.priority).toBe("medium");
    expect(wire.category).toBe("work");
    expect(wire.status).toBe("todo");
  });

  it("ships the reference's author + sample fields (session 12, W-2)", () => {
    const wire = serializeTask(prismaTask, author);
    expect(wire.is_sample).toBe(false);
    expect(wire.created_by).toBe("demo@flowschedule.app");
    expect(wire.created_by_id).toBe("u1");
    expect(serializeTask({ ...prismaTask, isSample: true }, author).is_sample).toBe(true);
  });

  it("emits EXACTLY the captured 14-key wire shape", () => {
    const wire = serializeTask(prismaTask, author) as Record<string, unknown>;
    expect(Object.keys(wire).sort()).toEqual(
      [
        "category",
        "created_by",
        "created_by_id",
        "created_date",
        "description",
        "duration_minutes",
        "end_time",
        "id",
        "is_sample",
        "priority",
        "start_time",
        "status",
        "title",
        "updated_date",
      ].sort(),
    );
    // The clone-internal camelCase fields never leak.
    expect(wire.isSample).toBeUndefined();
    expect(wire.userId).toBeUndefined();
    expect(wire.created_at).toBeUndefined();
    expect(wire.updated_at).toBeUndefined();
  });

  it("serializes null timestamps as null (unscheduled tasks)", () => {
    const wire = serializeTask(
      {
        ...prismaTask,
        startTime: null,
        endTime: null,
        durationMinutes: null,
      },
      author,
    );
    expect(wire.start_time).toBeNull();
    expect(wire.end_time).toBeNull();
    expect(wire.duration_minutes).toBeNull();
  });
});

describe("serializeNote — the reference's captured entity shape (tags as ARRAY)", () => {
  it("ships tags as a JSON array, not the storage string", () => {
    const wire = serializeNote(prismaNote, author);
    expect(wire.tags).toEqual(["work", "focus"]);
  });

  it("tolerates a malformed storage string (empty array)", () => {
    const wire = serializeNote({ ...prismaNote, tags: "not json" }, author);
    expect(wire.tags).toEqual([]);
  });

  it("maps the captured timestamp/author fields and the exact 9-key shape", () => {
    const wire = serializeNote(prismaNote, author) as Record<string, unknown>;
    expect(wire.created_date).toBe("2026-10-01T00:00:00.000Z");
    expect(wire.updated_date).toBe("2026-10-02T00:00:00.000Z");
    expect(wire.is_sample).toBe(true);
    expect(wire.created_by).toBe("demo@flowschedule.app");
    expect(wire.created_by_id).toBe("u1");
    expect(wire.title).toBe("Idea");
    expect(wire.content).toBe("Theme Fridays as deep-work days.");
    expect(Object.keys(wire).sort()).toEqual(
      [
        "content",
        "created_by",
        "created_by_id",
        "created_date",
        "id",
        "is_sample",
        "tags",
        "title",
        "updated_date",
      ].sort(),
    );
    // The clone-internal camelCase fields never leak.
    expect(wire.isSample).toBeUndefined();
    expect(wire.userId).toBeUndefined();
    expect(wire.created_at).toBeUndefined();
  });
});
