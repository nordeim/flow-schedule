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
import {
  DAILY_FOCUS_PROMPT,
  buildAiSummaryPrompt,
} from "@/lib/ai-prompt";
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
          // The captured InvokeLLM prompt, byte-for-byte (session 13;
          // src/lib/ai-prompt.ts — unit-pinned against the capture).
          content: DAILY_FOCUS_PROMPT,
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
  // The captured InvokeLLM prompt, byte-for-byte (session 13, L-1..L-4:
  // the 8-space "blank" lines, the per-task template + join, the
  // trailing space on item 3 — src/lib/ai-prompt.ts, unit-pinned
  // against the capture). The task ORDER is this caller's contract:
  // /api/ai/summary feeds fn.Task.list()'s default (createdAt desc).
  const prompt = buildAiSummaryPrompt(day, tasks);
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
