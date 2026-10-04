// /api/tasks/[id] — PATCH (update, incl. status toggle) + DELETE.
// Session 12 (W-3/W-4): a caller-supplied end_time wins over derivation;
// description is stored verbatim ("" stays "", null when absent).
import { fail, ok, readJson, requireUser } from "@/lib/api";
import { db } from "@/lib/db";
import { isCategory, isPriority, isTaskStatus } from "@/lib/domain";
import { serializeTask } from "@/lib/serialize";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const author = { id: auth.user.id, email: auth.user.email };

  const existing = await db.task.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!existing) {
    return fail("NOT_FOUND", "Task not found.", 404);
  }

  const body = await readJson(req);
  const data: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) return fail("VALIDATION", "Task title cannot be empty.");
    if (title.length > 300) return fail("VALIDATION", "Task title must be 300 characters or fewer.");
    data.title = title;
  }
  // W-4: verbatim — a string is stored as-is ("" stays ""); the field
  // must be explicitly null to clear it.
  if ("description" in body) {
    data.description = typeof body.description === "string" ? body.description : null;
  }
  if (isPriority(body.priority)) data.priority = body.priority;
  if (isCategory(body.category)) data.category = body.category;
  if (isTaskStatus(body.status)) data.status = body.status;

  let recomputeEnd = false;
  if (body.start_time !== undefined) {
    if (body.start_time === null || body.start_time === "") {
      data.startTime = null;
      data.endTime = null;
      data.durationMinutes = existing.durationMinutes; // keep duration
    } else {
      const parsed = new Date(String(body.start_time));
      if (Number.isNaN(parsed.getTime())) {
        return fail("VALIDATION", "start_time is not a valid date.");
      }
      data.startTime = parsed;
      recomputeEnd = true;
    }
  }
  if (body.duration_minutes !== undefined && body.duration_minutes !== null) {
    const n = Number(body.duration_minutes);
    if (!Number.isInteger(n) || n < 1 || n > 24 * 60) {
      return fail("VALIDATION", "duration_minutes must be an integer between 1 and 1440.");
    }
    data.durationMinutes = n;
    recomputeEnd = true;
  }

  // W-3: a caller-supplied end_time WINS (the reference's dialog always
  // sends it, client-computed); derivation from start+duration only
  // applies when the caller did not send one.
  const hasExplicitEnd = body.end_time !== undefined;
  if (hasExplicitEnd) {
    if (body.end_time === null || body.end_time === "") {
      data.endTime = null;
    } else {
      const parsed = new Date(String(body.end_time));
      if (Number.isNaN(parsed.getTime())) {
        return fail("VALIDATION", "end_time is not a valid date.");
      }
      data.endTime = parsed;
    }
  } else if (recomputeEnd) {
    const start = (data.startTime as Date | null | undefined) ?? existing.startTime;
    const duration =
      (data.durationMinutes as number | null | undefined) ?? existing.durationMinutes;
    data.endTime = start && duration ? new Date(start.getTime() + duration * 60_000) : null;
  }

  const task = await db.task.update({ where: { id }, data });
  return ok({ task: serializeTask(task, author) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;

  const existing = await db.task.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!existing) {
    return fail("NOT_FOUND", "Task not found.", 404);
  }
  await db.task.delete({ where: { id } });
  return ok({ deleted: id });
}
