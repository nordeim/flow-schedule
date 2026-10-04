// FlowSchedule — z-ai-web-dev-sdk integration (server-side only).
//
// Mirrors the reference app's two InvokeLLM call sites:
//   1. Daily Focus — quote + author + affirmation (JSON schema)
//   2. AI Summary  — mood + focus_areas + activities + insights from the
//      day's task list
// Both fall back to deterministic defaults on any failure (the reference
// does the same: its catch blocks ship canned content) so the dashboard
// never hard-fails when the LLM is unavailable.

import ZAI from "z-ai-web-dev-sdk";
import type { Category, Priority } from "@/lib/domain";
import { format } from "date-fns";
import {
  DEFAULT_FOCUS,
  EMPTY_DAY_SUMMARY,
  FALLBACK_SUMMARY,
  type AiSummary,
  type DailyFocus,
} from "@/lib/ai-defaults";

// Re-export the shared types + fallback constants (single source of truth:
// src/lib/ai-defaults.ts — pure, client-safe) so server callers and the
// existing `@/lib/ai` type imports keep working.
export { DEFAULT_FOCUS, EMPTY_DAY_SUMMARY, FALLBACK_SUMMARY };
export type { AiSummary, DailyFocus } from "@/lib/ai-defaults";

function asStringArray(v: unknown, limit: number): string[] | null {
  if (!Array.isArray(v)) return null;
  const out = v
    .filter((x): x is string => typeof x === "string" && x.length > 0)
    .slice(0, limit);
  return out.length > 0 ? out : null;
}

export async function generateDailyFocus(): Promise<DailyFocus> {
  try {
    const zai = await ZAI.create();
    const res = await zai.chat.completions.create({
      messages: [
        {
          role: "user",
          content:
            "Generate a short inspirational quote for productivity, its author, and a positive affirmation for the day. Return as JSON.",
          // The reference passes response_json_schema; the SDK models this
          // via response_format, which the chat completions path accepts.
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });
    const raw = res.choices[0]?.message?.content ?? "";
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const quote = typeof parsed.quote === "string" ? parsed.quote : "";
    const author = typeof parsed.author === "string" ? parsed.author : "";
    const affirmation =
      typeof parsed.affirmation === "string" ? parsed.affirmation : "";
    if (quote && author && affirmation) {
      return { quote, author, affirmation };
    }
    return DEFAULT_FOCUS;
  } catch (err) {
    console.error(
      "[ai] daily focus generation failed, using default:",
      err instanceof Error ? err.message : err,
    );
    return DEFAULT_FOCUS;
  }
}

export async function generateAiSummary(
  day: Date,
  tasks: { title: string; category: Category; priority: Priority }[],
): Promise<AiSummary> {
  if (tasks.length === 0) return EMPTY_DAY_SUMMARY;
  const taskLines = tasks
    .map((t) => `- ${t.title} (${t.category}, ${t.priority} priority)`)
    .join("\n");
  const prompt = `
        Analyze this daily schedule briefly:

        Tasks for ${format(day, "MMMM d, yyyy")}:
        ${taskLines}

        Provide a concise analysis with:
        1. Overall mood/theme (1-2 words)
        2. Key focus areas (max 3 items)
        3. Activity types (max 3 items)
        4. Brief insight (max 2 sentences)
      `;
  try {
    const zai = await ZAI.create();
    const res = await zai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 500,
    });
    const raw = res.choices[0]?.message?.content ?? "";
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const mood = typeof parsed.mood === "string" ? parsed.mood : "";
    const focusAreas = asStringArray(parsed.focus_areas, 3);
    const activities = asStringArray(parsed.activities, 3);
    const insights = typeof parsed.insights === "string" ? parsed.insights : "";
    if (mood && focusAreas && activities && insights) {
      return { mood, focus_areas: focusAreas, activities, insights };
    }
    return FALLBACK_SUMMARY;
  } catch (err) {
    console.error(
      "[ai] summary generation failed, using fallback:",
      err instanceof Error ? err.message : err,
    );
    return FALLBACK_SUMMARY;
  }
}
