// GET /api/ai/daily-focus — quote + author + affirmation for the Daily Focus
// card. LLM-backed with a deterministic default (never hard-fails).
import { generateDailyFocus } from "@/lib/ai";
import { ok, requireUser } from "@/lib/api";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const focus = await generateDailyFocus();
  return ok({ focus });
}
