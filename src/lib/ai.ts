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

// The schema-shape checks (session 14, FS-26): the reference's contract
// is schema-INVALID → the catch/fallback, schema-VALID-but-empty →
// rendered VERBATIM (the platform's response_json_schema has no
// minLength/minItems — probed live on the reference's own cards with
// the XHR response-override harness). The clone's defensive parse is
// the self-hosted validation seam (ADR-005), so it checks SHAPE, not
// truthiness: empty strings, empty arrays and empty-string items are
// VALID and pass through; non-strings / non-arrays / missing fields
// are INVALID and fall to the deterministic fallbacks.
function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
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
    // RS-4 (session 14): the guard is quote ONLY — the reference's
    // decompiled `a && a.quote ? n(a) : n(j1)` renders empty author/
    // affirmation verbatim ("- " + ""). Non-string author/affirmation
    // coerce to "" (the platform schema would have rejected the
    // response server-side; the parse's coercion only affects the
    // render-equivalent "").
    const author = isString(parsed.author) ? parsed.author : "";
    const affirmation = isString(parsed.affirmation) ? parsed.affirmation : "";
    if (quote) {
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
    // RS-1/2/3 (session 14): the SHAPE check, not truthiness — empty
    // mood/insights, empty arrays and empty-string items are
    // schema-VALID and pass through VERBATIM (the reference renders
    // zero chips / empty <p>s for them; probed live). The arrays are
    // NOT sliced or filtered here — the card's render owns the 3-slice
    // (fre's decompile: .slice(0,3) at render, matching probe 2's
    // 5-item → 3-chip behavior).
    if (
      isString(parsed.mood) &&
      isStringArray(parsed.focus_areas) &&
      isStringArray(parsed.activities) &&
      isString(parsed.insights)
    ) {
      return {
        mood: parsed.mood,
        focus_areas: parsed.focus_areas,
        activities: parsed.activities,
        insights: parsed.insights,
      };
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
