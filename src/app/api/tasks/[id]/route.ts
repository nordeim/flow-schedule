// /api/tasks/[id] — PATCH (update, incl. status toggle) + DELETE.
import { fail, ok, readJson, requireUser } from "@/lib/api";
import { db } from "@/lib/db";
import { isCategory, isPriority, isTaskStatus } from "@/lib/domain";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;

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
  if ("description" in body) {
    data.description =
      typeof body.description === "string" && body.description.trim().length > 0
        ? body.description.trim()
        : null;
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

  const start = (data.startTime as Date | null | undefined) ?? existing.startTime;
  const duration =
    (data.durationMinutes as number | null | undefined) ?? existing.durationMinutes;
  if (recomputeEnd) {
    data.endTime = start && duration ? new Date(start.getTime() + duration * 60_000) : null;
  }

  const task = await db.task.update({ where: { id }, data });
  return ok({ task });
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
