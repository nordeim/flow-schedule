// The response wire-format seam (session 8, G-4).
//
// The documented contract (AGENTS.md / PAD §4.1): the task/note JSON wire
// format is the reference app's snake_case entity shape —
// start_time/end_time/duration_minutes/created_at/updated_at — and the
// request side (POST/PATCH) already speaks it. The responses used to
// return raw Prisma objects (camelCase, plus the clone-internal isSample/
// userId, plus notes' tags as a JSON storage string). These serializers
// are the ONLY place a Prisma row crosses into an API response; the
// store's mapTask/mapNote consume their output directly.
//
// The reference's own entity shape (decompile-verified): Task fields
// start_time/end_time/duration_minutes (its TaskDialog state literally
// initializes {start_time:"", end_time:"", duration_minutes:60}); Note
// tags are an ARRAY (its notes UI maps them) and its list sorts by
// "-created_date". The wire ships created_at/updated_at — the repo's
// documented names.

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  category: string;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  durationMinutes: number | null;
  createdAt: Date;
  updatedAt: Date;
  // Prisma also carries isSample/userId — intentionally NOT on the wire.
};

type NoteRow = {
  id: string;
  title: string | null;
  content: string;
  tags: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WireTask = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  category: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export type WireNote = {
  id: string;
  title: string | null;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

export function serializeTask(task: TaskRow): WireTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    category: task.category,
    status: task.status,
    start_time: iso(task.startTime),
    end_time: iso(task.endTime),
    duration_minutes: task.durationMinutes,
    created_at: task.createdAt.toISOString(),
    updated_at: task.updatedAt.toISOString(),
  };
}

export function serializeNote(note: NoteRow): WireNote {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(note.tags);
    if (Array.isArray(parsed)) {
      tags = parsed.filter((t): t is string => typeof t === "string");
    }
  } catch {
    tags = [];
  }
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    tags,
    created_at: note.createdAt.toISOString(),
    updated_at: note.updatedAt.toISOString(),
  };
}
