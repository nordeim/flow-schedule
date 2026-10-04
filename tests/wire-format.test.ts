// The wire-format contract (session 8, G-4): the API responses speak the
// reference app's snake_case entity shape, matching the documented
// contract in AGENTS.md / PAD §4.1 and the request side (which already
// accepts start_time / duration_minutes). Prisma objects are camelCase
// with clone-internal fields (isSample, userId) and a JSON-string tags
// column — serializeTask/serializeNote are the ONLY response seam.
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

describe("serializeTask — the reference's snake_case entity shape", () => {
  it("maps Prisma camelCase to the reference's snake_case fields", () => {
    const wire = serializeTask(prismaTask);
    expect(wire.start_time).toBe("2026-10-04T09:30:00.000Z");
    expect(wire.end_time).toBe("2026-10-04T10:00:00.000Z");
    expect(wire.duration_minutes).toBe(30);
    expect(wire.created_at).toBe("2026-10-01T00:00:00.000Z");
    expect(wire.updated_at).toBe("2026-10-02T00:00:00.000Z");
  });

  it("keeps the shape-invariant fields as-is", () => {
    const wire = serializeTask(prismaTask);
    expect(wire.id).toBe("t1");
    expect(wire.title).toBe("Team standup");
    expect(wire.description).toBeNull();
    expect(wire.priority).toBe("medium");
    expect(wire.category).toBe("work");
    expect(wire.status).toBe("todo");
  });

  it("drops the clone-internal fields (isSample/userId) from the wire", () => {
    const wire = serializeTask(prismaTask) as Record<string, unknown>;
    expect(wire.isSample).toBeUndefined();
    expect(wire.userId).toBeUndefined();
    expect(Object.keys(wire).sort()).toEqual(
      [
        "category",
        "created_at",
        "description",
        "duration_minutes",
        "end_time",
        "id",
        "priority",
        "start_time",
        "status",
        "title",
        "updated_at",
      ].sort(),
    );
  });

  it("serializes null timestamps as null (unscheduled tasks)", () => {
    const wire = serializeTask({
      ...prismaTask,
      startTime: null,
      endTime: null,
      durationMinutes: null,
    });
    expect(wire.start_time).toBeNull();
    expect(wire.end_time).toBeNull();
    expect(wire.duration_minutes).toBeNull();
  });
});

describe("serializeNote — the reference's entity shape (tags as ARRAY)", () => {
  it("ships tags as a JSON array, not the storage string", () => {
    const wire = serializeNote(prismaNote);
    expect(wire.tags).toEqual(["work", "focus"]);
  });

  it("tolerates a malformed storage string (empty array)", () => {
    const wire = serializeNote({ ...prismaNote, tags: "not json" });
    expect(wire.tags).toEqual([]);
  });

  it("maps created/updated to snake_case and drops internal fields", () => {
    const wire = serializeNote(prismaNote) as Record<string, unknown>;
    expect(wire.created_at).toBe("2026-10-01T00:00:00.000Z");
    expect(wire.updated_at).toBe("2026-10-02T00:00:00.000Z");
    expect(wire.isSample).toBeUndefined();
    expect(wire.userId).toBeUndefined();
    expect(wire.title).toBe("Idea");
    expect(wire.content).toBe("Theme Fridays as deep-work days.");
    expect(Object.keys(wire).sort()).toEqual(
      ["content", "created_at", "id", "tags", "title", "updated_at"].sort(),
    );
  });
});
