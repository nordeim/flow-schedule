// /api/tasks — GET (list) + POST (create).
// Task shapes mirror the reference entity: title, description, priority,
// category, status, start_time, duration_minutes, end_time.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail, ok, readJson, requireUser } from "@/lib/api";
import { isCategory, isPriority, isTaskStatus } from "@/lib/domain";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const tasks = await db.task.findMany({
    where: { userId: auth.user.id },
    orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
  });
  return ok({ tasks });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const body = await readJson(req);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return fail("VALIDATION", "Task title is required.");
  }
  if (title.length > 300) {
    return fail("VALIDATION", "Task title must be 300 characters or fewer.");
  }

  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : null;

  const priority = isPriority(body.priority) ? body.priority : "medium";
  const category = isCategory(body.category) ? body.category : "work";
  const status = isTaskStatus(body.status) ? body.status : "todo";

  let startTime: Date | null = null;
  if (typeof body.start_time === "string" && body.start_time.length > 0) {
    const parsed = new Date(body.start_time);
    if (Number.isNaN(parsed.getTime())) {
      return fail("VALIDATION", "start_time is not a valid date.");
    }
    startTime = parsed;
  }

  let durationMinutes: number | null = null;
  if (body.duration_minutes !== undefined && body.duration_minutes !== null) {
    const n = Number(body.duration_minutes);
    if (!Number.isInteger(n) || n < 1 || n > 24 * 60) {
      return fail("VALIDATION", "duration_minutes must be an integer between 1 and 1440.");
    }
    durationMinutes = n;
  }

  const endTime =
    startTime && durationMinutes
      ? new Date(startTime.getTime() + durationMinutes * 60_000)
      : null;

  const task = await db.task.create({
    data: {
      title,
      description,
      priority,
      category,
      status,
      startTime,
      durationMinutes,
      endTime,
      userId: auth.user.id,
    },
  });

  return ok({ task }, 201);
}
