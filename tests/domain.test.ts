import { describe, expect, it } from "vitest";
import {
  CALENDAR_HOURS,
  CALENDAR_LABEL_WIDTH,
  CALENDAR_SLOT_WIDTH,
  CATEGORY_BADGES,
  CATEGORY_GRADIENTS,
  CATEGORIES,
  PRIORITIES,
  PRIORITY_BADGES,
  QUICK_ACTIONS,
  SKILL_COLORS,
  SKILL_COLORS_LOOKUP,
  TASK_STATUSES,
  isCategory,
  isPriority,
  isTaskStatus,
  skillRowName,
  type Category,
} from "@/lib/domain";

// Domain constants — the contract the reference app's bundle pinned:
// 16 hour slots (7..22), 80px label column, 60px slot column, 4 priorities,
// 7 categories, 3 statuses, 4 quick actions.

describe("calendar geometry", () => {
  it("exposes 16 hour slots from 07:00 to 22:00", () => {
    expect(CALENDAR_HOURS).toHaveLength(16);
    expect(CALENDAR_HOURS[0]).toBe(7);
    expect(CALENDAR_HOURS[15]).toBe(22);
  });

  it("uses the reference's 80px label and 60px slot widths", () => {
    expect(CALENDAR_LABEL_WIDTH).toBe(80);
    expect(CALENDAR_SLOT_WIDTH).toBe(60);
  });

  it("slot width maps 1:1 to minutes-per-pixel", () => {
    // 60px per hour → 1px per minute — the task-block positioning math
    // (left = minutes since 07:00) depends on this identity.
    expect(CALENDAR_SLOT_WIDTH / 60).toBe(1);
  });
});

describe("enums", () => {
  it("priorities match the reference (low/medium/high/urgent)", () => {
    expect([...PRIORITIES]).toEqual(["low", "medium", "high", "urgent"]);
  });

  it("categories match the reference's seven values", () => {
    expect([...CATEGORIES]).toEqual([
      "work",
      "personal",
      "health",
      "learning",
      "creative",
      "social",
      "planning",
    ]);
  });

  it("task statuses match the reference (todo/in_progress/completed)", () => {
    expect([...TASK_STATUSES]).toEqual(["todo", "in_progress", "completed"]);
  });

  it("every category has a gradient and a badge", () => {
    for (const c of CATEGORIES) {
      expect(CATEGORY_GRADIENTS[c]).toMatch(/bg-gradient-to-r/);
      expect(CATEGORY_BADGES[c]).toMatch(/bg-\w+-100/);
    }
  });

  it("every priority has a badge", () => {
    for (const p of PRIORITIES) {
      expect(PRIORITY_BADGES[p]).toMatch(/text-\w+-600/);
    }
  });
});

describe("quick actions", () => {
  it("carries the reference's four actions with its exact gradients", () => {
    expect(QUICK_ACTIONS.map((a) => a.id)).toEqual([
      "addTask",
      "focusTimer",
      "logActivity",
      "brainstorm",
    ]);
    expect(QUICK_ACTIONS[0].gradient).toBe("linear-gradient(to right, #0ea5e9, #2563eb)");
    expect(QUICK_ACTIONS[1].gradient).toBe("linear-gradient(to right, #10b981, #14b8a6)");
    expect(QUICK_ACTIONS[2].gradient).toBe("linear-gradient(to right, #8b5cf6, #6366f1)");
    expect(QUICK_ACTIONS[3].gradient).toBe("linear-gradient(to right, #f59e0b, #f97316)");
  });

  it("each action names a tinted form surface", () => {
    for (const a of QUICK_ACTIONS) {
      expect(a.formColor).toMatch(/bg-\w+-50\/90/);
    }
  });
});

describe("skills map colors", () => {
  it("carries the reference's m0e hex map exactly", () => {
    // Decompiled from the reference bundle (m0e) + live-corroborated:
    // work #3B82F6, personal #10B981 (emerald — NOT green-500 #22c55e),
    // health #EF4444, learning #8B5CF6 (violet — NOT purple-500 #a855f7),
    // creative #EC4899, social #F59E0B (amber — NOT yellow-500 #eab308),
    // planning #6366F1.
    expect({ ...SKILL_COLORS }).toEqual({
      work: "#3B82F6",
      personal: "#10B981",
      health: "#EF4444",
      learning: "#8B5CF6",
      creative: "#EC4899",
      social: "#F59E0B",
      planning: "#6366F1",
    });
  });

  it("SKILL_COLORS_LOOKUP falls back to the reference's slate #64748B", () => {
    // The reference's g0e uses m0e[v] || "#64748B" for unknown categories
    // (NOT slate-400 #94a3b8).
    expect(SKILL_COLORS_LOOKUP("other" as Category)).toBe("#64748B");
    expect(SKILL_COLORS_LOOKUP("work")).toBe("#3B82F6");
  });

  it("skillRowName mirrors the reference's name transform", () => {
    // g0e: v.replace("_", " ").toUpperCase() — first underscore becomes a
    // space before the uppercase.
    expect(skillRowName("work")).toBe("WORK");
    expect(skillRowName("self_care" as Category)).toBe("SELF CARE");
  });
});

describe("guards", () => {
  it("isPriority accepts members and rejects anything else", () => {
    expect(isPriority("low")).toBe(true);
    expect(isPriority("PRIORITY")).toBe(false);
    expect(isPriority(null)).toBe(false);
    expect(isPriority(1)).toBe(false);
  });

  it("isCategory accepts members and rejects anything else", () => {
    expect(isCategory("work")).toBe(true);
    expect(isCategory("Work")).toBe(false);
    expect(isCategory("unknown")).toBe(false);
  });

  it("isTaskStatus accepts members and rejects anything else", () => {
    expect(isTaskStatus("todo")).toBe(true);
    expect(isTaskStatus("done")).toBe(false);
  });
});
