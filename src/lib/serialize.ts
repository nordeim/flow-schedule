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

// Session 14 (session-12 P-1 closed): the reference's Python backend
// serializes duration_minutes as a JSON FLOAT — the raw token on its
// captured entity wire reads "duration_minutes":60.0 (token-extracted
// from the reference's own Task list this session). JS
// JSON.stringify(60) emits 60; every parser reads both as 60, but the
// byte-level wire is a documented parity surface (FS-23/FS-24), so the
// task routes' response text float-formats the INTEGER duration
// tokens. Safety: escaped string content (a description quoting the
// token) serializes as \"duration_minutes\": — backslash-separated,
// which the property-token regex cannot match; null and
// already-fractional values pass through untouched (both probed on
// the reference's live wire).
export function floatFormatDurations(json: string): string {
  return json.replace(
    /("duration_minutes":)(-?\d+)([,}\]])/g,
    "$1$2.0$3",
  );
}

// Session 15 (DW-1): the reference's Python backend serializes its
// SERVER-GENERATED datetimes (created_date/updated_date) at microsecond
// precision, with a per-route Z asymmetry (all six surfaces probed live on
// the reference's own Task/Note traffic):
//   POST create responses:      "created_date":"2026-10-05T02:11:34.297127Z"
//   GET list / PUT-update:      "created_date":"2026-10-04T21:28:23.793000"
// JS toISOString() emits 3-digit ms + Z. The byte-form is a documented
// parity surface (FS-23/FS-24 — the duration-float ruling, session 14),
// so this text-level transform pads the ms token to 6 digits and —
// keyed by the RESPONSE mode — keeps the Z (create responses, shipped
// via okWireCreate) or strips it (read/update responses, okWire).
// The digits beyond ms are ".000" (the clone's clock and SQLite store
// milliseconds) — form parity, storage-precision residual, the same
// class as "duration_minutes":60.0.
// start_time/end_time (CLIENT-supplied dates: ms+Z on the reference too)
// are never touched — the regex keys on the property names, exactly like
// floatFormatDurations. Safety: escaped string content (a description
// quoting the token) serializes as \"created_date\":\" — the backslash
// before the closing quote breaks the property-token match, the same
// mechanism the duration transform relies on. Null values and
// already-6-digit forms fail the \.\d{3}Z pattern and pass through
// (idempotent by construction).
export function formatWireDates(
  json: string,
  mode: "read" | "create",
): string {
  return json.replace(
    /("(?:created_date|updated_date)"):"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3})Z"/g,
    (_match, prop: string, date: string) =>
      mode === "create" ? `${prop}:"${date}000Z"` : `${prop}:"${date}000"`,
  );
}

// Session 16 (KO-1 / FS-28): the KEY ORDER is part of the wire
// contract — the reference's platform emits the captured order on
// EVERY response surface (GET list + POST create + PUT update, Task
// AND Note — probed live on its own traffic; the REQUEST side — the
// dialog save — was probed byte-identical to the clone's TaskDialog
// payload). The literals below emit in the captured order:
//   Task: start_time, duration_minutes, end_time, description, title,
//         priority, category, status, id, created_date, updated_date,
//         created_by_id, created_by, is_sample
//   Note: title, content, tags, id, created_date, updated_date,
//         created_by_id, created_by, is_sample
// JSON.stringify preserves string-key insertion order; the okWire
// text transforms are order-agnostic substitutions. Consumers read
// by name (mapTask/mapNote) — the order is a byte-parity surface,
// not a behavioral one (tests/wire-order.test.ts pins it).
export function serializeTask(task: TaskRow, author: WireAuthor): WireTask {
  return {
    start_time: iso(task.startTime),
    duration_minutes: task.durationMinutes,
    end_time: iso(task.endTime),
    description: task.description,
    title: task.title,
    priority: task.priority,
    category: task.category,
    status: task.status,
    id: task.id,
    created_date: task.createdAt.toISOString(),
    updated_date: task.updatedAt.toISOString(),
    created_by_id: author.id,
    created_by: author.email,
    is_sample: task.isSample,
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
    title: note.title,
    content: note.content,
    tags,
    id: note.id,
    created_date: note.createdAt.toISOString(),
    updated_date: note.updatedAt.toISOString(),
    created_by_id: author.id,
    created_by: author.email,
    is_sample: note.isSample,
  };
}
