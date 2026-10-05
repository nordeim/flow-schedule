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

  // fn.Task.list()'s default order = createdAt DESC (session 7, G-1) —
  // the reference's fre filters that list AS RETURNED (no re-sort), and
  // the session-13 two-task InvokeLLM capture confirms it: the
  // newest-created task is listed FIRST in the prompt despite a later
  // start_time (L-5 — the clone's old startTime-asc query produced a
  // different task order in the prompt). Pinned by
  // tests/ai-prompt.test.ts's route-contract source read.
  const tasks = await db.task.findMany({
    where: { userId: auth.user.id, startTime: { not: null } },
    orderBy: { createdAt: "desc" },
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
