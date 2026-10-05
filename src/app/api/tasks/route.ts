// /api/tasks — GET (list) + POST (create).
// Task shapes mirror the reference entity (session 12 wire capture):
// title, description, priority, category, status, start_time,
// duration_minutes, end_time. Responses go through serializeTask (the
// snake_case wire seam; created_date/updated_date/is_sample/created_by).
// The reference's TaskDialog submits end_time client-computed (W-3) and
// description verbatim (W-4 — "" stays ""); both are accepted here.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail, okWire, okWireCreate, readJson, requireUser } from "@/lib/api";
import { isCategory, isPriority, isTaskStatus } from "@/lib/domain";
import { serializeTask, type WireAuthor } from "@/lib/serialize";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const author: WireAuthor = { id: auth.user.id, email: auth.user.email };
  const tasks = await db.task.findMany({
    where: { userId: auth.user.id },
    // The reference's default fn.Task.list() returns tasks createdAt DESC
    // (newest first — live-verified on the reference, session 7: creating
    // tasks in order Alpha→Beta→Gamma→Delta yields [Delta, Gamma, Beta,
    // Alpha]). Ordering IS parity: the Planning day-card chips (slice(0,3))
    // and the selected-day task list render the array AS RETURNED, so the
    // order decides which chips are visible behind "+N more".
    orderBy: { createdAt: "desc" },
  });
  return okWire({ tasks: tasks.map((t) => serializeTask(t, author)) });
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

  // W-4 (session 12): the reference's dialog submits the form value
  // VERBATIM — an empty description is "" (captured on the live wire), and
  // quick-added tasks leave the field absent → null. Stored as-is.
  const description =
    typeof body.description === "string" ? body.description : null;

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

  // W-3 (session 12): the reference's dialog submits end_time
  // client-computed (start + duration — its decompiled f function). A
  // caller-supplied end_time wins (validated). Session 16 (ET-1): the
  // reference's platform does NOT derive one server-side — a POST with
  // start_time + duration but NO end_time stores end_time:null (probed
  // live on its own API; the task is then EXCLUDED from Log Activity
  // by the H1e null guard, exactly like a quick-added task). The
  // clone's former start+duration fallback is removed to match; the
  // dialog still sends end_time on every save (e2e-pinned), so no app
  // flow changes.
  let endTime: Date | null = null;
  if (body.end_time !== undefined && body.end_time !== null && body.end_time !== "") {
    const parsed = new Date(String(body.end_time));
    if (Number.isNaN(parsed.getTime())) {
      return fail("VALIDATION", "end_time is not a valid date.");
    }
    endTime = parsed;
  }

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

  // The create-response wire (session 15, DW-1): the reference's POST
  // keeps the Z on its µs date tokens — okWireCreate's create mode.
  return okWireCreate(
    { task: serializeTask(task, { id: auth.user.id, email: auth.user.email }) },
  );
}
