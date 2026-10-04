// FlowSchedule — domain constants.
// Values mirror the reference app's enums exactly (extracted from the
// reference bundle): 4 priorities, 7 categories, 3 statuses, 16 hour slots
// (07:00–22:00), 80px row-label column, 60px slot column.

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CATEGORIES = [
  "work",
  "personal",
  "health",
  "learning",
  "creative",
  "social",
  "planning",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const TASK_STATUSES = ["todo", "in_progress", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// Calendar geometry — identical to the reference:
//   const $k = Array.from({length: 16}, (_, t) => t + 7); // hours 7..22
//   const LABEL_W = 80, SLOT_W = 60;
export const CALENDAR_HOURS: readonly number[] = Array.from(
  { length: 16 },
  (_, i) => i + 7,
);
export const CALENDAR_LABEL_WIDTH = 80;
export const CALENDAR_SLOT_WIDTH = 60;

// Category → calendar task-block gradient (Tailwind v4 emits these classes
// statically so the compiler sees them).
export const CATEGORY_GRADIENTS: Record<Category, string> = {
  work: "bg-gradient-to-r from-blue-400 to-blue-500",
  personal: "bg-gradient-to-r from-green-400 to-green-500",
  health: "bg-gradient-to-r from-red-400 to-red-500",
  learning: "bg-gradient-to-r from-purple-400 to-purple-500",
  creative: "bg-gradient-to-r from-pink-400 to-pink-500",
  social: "bg-gradient-to-r from-yellow-400 to-yellow-500",
  planning: "bg-gradient-to-r from-indigo-400 to-indigo-500",
};

// Category → badge classes (Planning page day chips / detail rows).
export const CATEGORY_BADGES: Record<Category, string> = {
  work: "bg-blue-100 text-blue-700",
  personal: "bg-green-100 text-green-700",
  health: "bg-red-100 text-red-700",
  learning: "bg-purple-100 text-purple-700",
  creative: "bg-pink-100 text-pink-700",
  social: "bg-yellow-100 text-yellow-700",
  planning: "bg-indigo-100 text-indigo-700",
};

// Priority → badge classes (low/medium/high/urgent).
export const PRIORITY_BADGES: Record<Priority, string> = {
  low: "text-green-600 bg-green-100",
  medium: "text-yellow-600 bg-yellow-100",
  high: "text-orange-600 bg-orange-100",
  urgent: "text-red-600 bg-red-100",
};

// Priority → text color only (Planning page detail rows).
export const PRIORITY_TEXT: Record<Priority, string> = {
  low: "text-green-600",
  medium: "text-yellow-600",
  high: "text-orange-600",
  urgent: "text-red-600",
};

// Skills Map pie slice colors (recharts Cells), keyed by category — the
// reference's m0e map exactly (decompiled + live-corroborated, session 4):
// personal is EMERALD #10B981 (not green-500), learning is VIOLET #8B5CF6
// (not purple-500), social is AMBER #F59E0B (not yellow-500).
export const SKILL_COLORS: Record<Category, string> = {
  work: "#3B82F6",
  personal: "#10B981",
  health: "#EF4444",
  learning: "#8B5CF6",
  creative: "#EC4899",
  social: "#F59E0B",
  planning: "#6366F1",
};

// The reference's g0e lookup: m0e[v] || "#64748B" — the fallback is
// slate-500, NOT slate-400.
export function SKILL_COLORS_LOOKUP(category: string): string {
  return SKILL_COLORS[category as Category] ?? "#64748B";
}

// The reference's g0e row-name transform: v.replace("_", " ").toUpperCase()
// (first underscore only — mirrored exactly, including the toLowerCase the
// legend applies on render).
export function skillRowName(category: string): string {
  return category.replace("_", " ").toUpperCase();
}

export const QUICK_ACTIONS = [
  {
    id: "addTask",
    label: "Add New Task",
    gradient: "linear-gradient(to right, #0ea5e9, #2563eb)",
    formColor: "bg-sky-50/90",
  },
  {
    id: "focusTimer",
    label: "Start Focus Timer",
    gradient: "linear-gradient(to right, #10b981, #14b8a6)",
    formColor: "bg-green-50/90",
  },
  {
    id: "logActivity",
    label: "Log Activity",
    gradient: "linear-gradient(to right, #8b5cf6, #6366f1)",
    formColor: "bg-purple-50/90",
  },
  {
    id: "brainstorm",
    label: "Quick Brainstorm",
    gradient: "linear-gradient(to right, #f59e0b, #f97316)",
    formColor: "bg-yellow-50/90",
  },
] as const;
export type QuickActionId = (typeof QUICK_ACTIONS)[number]["id"];

export function isPriority(v: unknown): v is Priority {
  return typeof v === "string" && (PRIORITIES as readonly string[]).includes(v);
}
export function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}
export function isTaskStatus(v: unknown): v is TaskStatus {
  return (
    typeof v === "string" && (TASK_STATUSES as readonly string[]).includes(v)
  );
}
