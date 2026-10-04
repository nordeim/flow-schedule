// The response wire-format seam (session 8, G-4; re-pinned session 12,
// W-1/W-2 against the CAPTURED live reference wire).
//
// The documented contract (AGENTS.md / PAD §4.1): the task/note JSON wire
// format is the reference app's snake_case entity shape. Session 12
// intercepted the reference app's own base44 entity traffic (logged-in
// XHR capture) and pinned the exact shape:
//   Task: start_time/end_time/duration_minutes/created_date/updated_date
//         /is_sample/created_by/created_by_id + the 6 shape-invariants
//   Note: title/content/tags (ARRAY)/created_date/updated_date/is_sample
//         /created_by/created_by_id + id
// The reference's platform injects created_by (the author's EMAIL) and
// created_by_id server-side; the self-hosted equivalent is the acting
// session user, so the serializers take an `author` argument. The
// clone-internal camelCase fields (isSample/userId) never cross the wire.
// The store's mapTask/mapNote consume this output directly — they remain
// the only wire→client conversion seam.
//
// Request side (session 12, W-3/W-4): the reference's TaskDialog submits
// {title, description, priority, category, start_time, end_time,
// duration_minutes} — end_time is CLIENT-computed (start + duration) and
// description is verbatim ("" stays ""); the clone's dialog + API now
// match (see TaskDialog.tsx and the /api/tasks routes).

export type WireAuthor = {
  id: string;
  email: string;
};

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
  isSample: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Prisma also carries userId — intentionally NOT on the wire.
};

type NoteRow = {
  id: string;
  title: string | null;
  content: string;
  tags: string;
  isSample: boolean;
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
  created_date: string;
  updated_date: string;
  is_sample: boolean;
  created_by: string;
  created_by_id: string;
};

export type WireNote = {
  id: string;
  title: string | null;
  content: string;
  tags: string[];
  created_date: string;
  updated_date: string;
  is_sample: boolean;
  created_by: string;
  created_by_id: string;
};

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

export function serializeTask(task: TaskRow, author: WireAuthor): WireTask {
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
    created_date: task.createdAt.toISOString(),
    updated_date: task.updatedAt.toISOString(),
    is_sample: task.isSample,
    created_by: author.email,
    created_by_id: author.id,
  };
}

export function serializeNote(note: NoteRow, author: WireAuthor): WireNote {
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
    created_date: note.createdAt.toISOString(),
    updated_date: note.updatedAt.toISOString(),
    is_sample: note.isSample,
    created_by: author.email,
    created_by_id: author.id,
  };
}
