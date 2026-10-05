// FlowSchedule — the AI prompt wire (session 13, L-1..L-5).
//
// A PURE module (the ai-defaults pattern): no SDK import, so the unit
// suite pins the prompt BYTES without any provider round-trip. The
// strings are parity surfaces, transcribed VERBATIM from the reference
// app's own CAPTURED InvokeLLM request bodies (XHR interception on the
// logged-in reference page) and corroborated by the decompiled `Y1e`
// (daily focus) and `fre` (AI summary) builders in its bundle.
//
// THE WHITESPACE IS THE WIRE: the reference's template literals are
// indented inside their functions, so its "blank" lines carry 8 spaces,
// every task line carries the 8-space indent, consecutive tasks are
// separated by an 8-space line AND an empty line (the item template's
// trailing newline+indent closed by the `\n` join), item 3 carries a
// trailing space, and the prompt ends with a 6-space line. Do not
// "clean up" any of it — tests/ai-prompt.test.ts pins the exact bytes
// against the captured wire (FS-23: a captured wire beats an inferred
// wire; FS-24: the prompt IS the wire).
//
// The task ORDER is the caller's contract: the reference feeds
// fn.Task.list()'s default order (createdAt desc — the 2-task capture
// lists the newest-created task first), and /api/ai/summary queries
// the same. The builder renders its input AS GIVEN.
import { format } from "date-fns";

// The reference's Y1e — its InvokeLLM call's prompt, byte-for-byte.
export const DAILY_FOCUS_PROMPT =
  "Generate a short inspirational quote for productivity, its author, and a positive affirmation for the day. Return as JSON.";

type SummaryTask = {
  title: string;
  category: string;
  priority: string;
};

// The reference's fre — its InvokeLLM call's prompt, byte-for-byte
// (the decompiled template, source-for-source).
export function buildAiSummaryPrompt(day: Date, tasks: readonly SummaryTask[]): string {
  const taskList = tasks
    .map(
      (t) => `
        - ${t.title} (${t.category}, ${t.priority} priority)
        `,
    )
    .join("\n");
  return `
        Analyze this daily schedule briefly:
        
        Tasks for ${format(day, "MMMM d, yyyy")}:
        ${taskList}
        
        Provide a concise analysis with:
        1. Overall mood/theme (1-2 words)
        2. Key focus areas (max 3 items)
        3. Activity types (max 3 items) 
        4. Brief insight (max 2 sentences)
      `;
}
