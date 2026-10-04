"use client";

// FlowSchedule — client data store (Zustand).
// Mirrors the reference's SPA data flow: components read tasks/notes/user
// from the store; the store fetches typed JSON from /api/* and unwraps the
// { ok, data } | { ok, error } envelope. Authenticated fetches only run
// when a session exists (same guard as the reference).

import { create } from "zustand";
import type { Category, Priority, TaskStatus } from "@/lib/domain";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  category: Category;
  status: TaskStatus;
  start_time: string | null; // ISO
  end_time: string | null; // ISO
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  title: string | null;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
};

type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !body || body.ok === false) {
    const message =
      body && body.ok === false ? body.error.message : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body.data;
}

type FlowState = {
  user: CurrentUser | null;
  tasks: Task[];
  notes: Note[];
  loadingTasks: boolean;
  tasksError: string | null;
  // Mirrors the reference dashboard's refresh counter (X1e): bumped by
  // createTask/updateTask/deleteTask so the AI sidebar cards re-run their
  // fetches on task mutations (the reference's onTaskUpdate/onTaskAdded
  // wiring). deliberately NOT bumped by completeTask — the reference's
  // Mark Complete (ure) re-fetches only itself.
  taskVersion: number;

  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  refreshNotes: () => Promise<void>;

  // Mark Complete (StatusCard, ure): PATCH status=completed + refresh,
  // WITHOUT bumping taskVersion.
  completeTask: (id: string) => Promise<void>;

  createTask: (input: {
    title: string;
    description?: string | null;
    priority?: Priority;
    category?: Category;
    status?: TaskStatus;
    start_time?: string | null;
    duration_minutes?: number | null;
  }) => Promise<Task>;
  updateTask: (
    id: string,
    input: Partial<{
      title: string;
      description: string | null;
      priority: Priority;
      category: Category;
      status: TaskStatus;
      start_time: string | null;
      duration_minutes: number | null;
    }>,
  ) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;

  createNote: (input: { title?: string | null; content: string; tags?: string[] }) => Promise<Note>;
  updateNote: (
    id: string,
    input: Partial<{ title: string | null; content: string; tags: string[] }>,
  ) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
};

// Server → client mappers (Prisma camelCase → reference-style snake_case).
type RawTask = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  category: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  createdAt: string;
  updatedAt: string;
};

function mapTask(t: RawTask): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority as Priority,
    category: t.category as Category,
    status: t.status as TaskStatus,
    start_time: t.startTime,
    end_time: t.endTime,
    duration_minutes: t.durationMinutes,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

type RawNote = {
  id: string;
  title: string | null;
  content: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
};

function mapNote(n: RawNote): Note {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(n.tags);
    if (Array.isArray(parsed)) tags = parsed.filter((t) => typeof t === "string");
  } catch {
    tags = [];
  }
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    tags,
    created_at: n.createdAt,
    updated_at: n.updatedAt,
  };
}

export const useFlowStore = create<FlowState>((set, get) => ({
  user: null,
  tasks: [],
  notes: [],
  // Starts TRUE: the tasks have never been fetched, so the dashboard
  // sidebar cards (StatusCard/SkillsMap skeletons) render their loading
  // state from the first paint — the reference's own behavior (its cards
  // fetch on mount). A first-paint "empty" flash before bootstrap's fetch
  // would diverge (session 4).
  loadingTasks: true,
  tasksError: null,
  taskVersion: 0,

  bootstrap: async () => {
    try {
      const data = await api<{ user: CurrentUser | null }>("/api/auth/me");
      set({ user: data.user });
    } catch {
      set({ user: null });
    }
    if (get().user) {
      void get().refreshTasks();
      void get().refreshNotes();
    } else {
      // No session → nothing will fetch; drop the initial loading flag so
      // the cards settle into their empty states instead of skeletoning
      // forever (the reference's failed fetch lands the same way).
      set({ loadingTasks: false });
    }
  },

  logout: async () => {
    try {
      await api("/api/logout", { method: "POST" });
    } catch {
      // cookie is cleared client-side below regardless
    }
    set({ user: null, tasks: [], notes: [] });
  },

  refreshTasks: async () => {
    if (!get().user) return;
    set({ loadingTasks: true, tasksError: null });
    try {
      const data = await api<{ tasks: RawTask[] }>("/api/tasks");
      set({ tasks: data.tasks.map(mapTask), loadingTasks: false });
    } catch (err) {
      set({
        loadingTasks: false,
        tasksError: err instanceof Error ? err.message : "Failed to load tasks",
      });
    }
  },

  refreshNotes: async () => {
    if (!get().user) return;
    try {
      const data = await api<{ notes: RawNote[] }>("/api/notes");
      set({ notes: data.notes.map(mapNote) });
    } catch {
      // notes failures leave the previous list; the brainstorm panel shows
      // its empty state
    }
  },

  createTask: async (input) => {
    const data = await api<{ task: RawTask }>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const task = mapTask(data.task);
    // PREPEND: the reference's dialog save refetches the task list
    // (createdAt desc — session 7, G-2), so the newly created task takes
    // the FIRST array position. Prepending the mapped response to the
    // already-createdAt-desc array yields the identical order without
    // the extra round-trip (ADR-003's single-fetcher design).
    set((s) => ({ tasks: [task, ...s.tasks], taskVersion: s.taskVersion + 1 }));
    return task;
  },

  updateTask: async (id, input) => {
    const data = await api<{ task: RawTask }>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    const task = mapTask(data.task);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? task : t)),
      taskVersion: s.taskVersion + 1,
    }));
    return task;
  },

  deleteTask: async (id) => {
    await api(`/api/tasks/${id}`, { method: "DELETE" });
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      taskVersion: s.taskVersion + 1,
    }));
  },

  completeTask: async (id) => {
    await api<{ task: RawTask }>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    });
    await get().refreshTasks();
  },

  createNote: async (input) => {
    const data = await api<{ note: RawNote }>("/api/notes", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const note = mapNote(data.note);
    set((s) => ({ notes: [note, ...s.notes] }));
    return note;
  },

  updateNote: async (id, input) => {
    const data = await api<{ note: RawNote }>(`/api/notes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    const note = mapNote(data.note);
    set((s) => ({ notes: s.notes.map((n) => (n.id === id ? note : n)) }));
    return note;
  },

  deleteNote: async (id) => {
    await api(`/api/notes/${id}`, { method: "DELETE" });
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
  },
}));
