// GET /api/ai/summary — AI Summary card payload for a given day
// (?date=yyyy-MM-dd, default today). Analyzes the day's scheduled tasks.
import { NextResponse } from "next/server";
import { generateAiSummary } from "@/lib/ai";
import { ok, requireUser } from "@/lib/api";
import { db } from "@/lib/db";
import { isCategory, isPriority, type Category, type Priority } from "@/lib/domain";
import { isSameDay, parseISO } from "date-fns";

export async function GET(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  let day = new Date();
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    const parsed = parseISO(dateParam);
    if (!Number.isNaN(parsed.getTime())) day = parsed;
  }

  const tasks = await db.task.findMany({
    where: { userId: auth.user.id, startTime: { not: null } },
    orderBy: { startTime: "asc" },
  });
  const dayTasks = tasks
    .filter((t) => t.startTime && isSameDay(t.startTime, day))
    .map((t) => ({
      title: t.title,
      category: (isCategory(t.category) ? t.category : "work") as Category,
      priority: (isPriority(t.priority) ? t.priority : "medium") as Priority,
    }));

  const summary = await generateAiSummary(day, dayTasks);
  return NextResponse.json({ ok: true, data: { summary } });
}
