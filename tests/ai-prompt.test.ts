import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  DAILY_FOCUS_PROMPT,
  buildAiSummaryPrompt,
} from "@/lib/ai-prompt";
import type { Category, Priority } from "@/lib/domain";

// The AI prompt wire contract (session 13) — pinned BYTE-FOR-BYTE to the
// reference app's own CAPTURED InvokeLLM request bodies (XHR interception
// on the logged-in reference page; FS-23's discipline extended from the
// entity wire to the LLM wire). The reference's decompiled `fre`/`Y1e`
// builders corroborate the capture source-for-source.
//
// The whitespace IS the wire: the reference's template literals are
// indented inside their functions, so its "blank" lines carry 8 spaces,
// every task line carries the 8-space indent, consecutive tasks are
// separated by an 8-space line AND an empty line (the item template's
// trailing `\n        ` + the `\n` join), item 3 carries a trailing
// space, and the prompt ends with a 6-space line. The clone's builder
// must reproduce the captured bytes exactly — an LLM prompt is a
// documented parity surface (PAD §7, "verbatim").

const repo = path.resolve(import.meta.dirname, "..");

// The SDK mock (top level — vi.mock hoists): spies on
// zai.chat.completions.create so the WIRING tests can assert the exact
// prompt bytes that reach the provider.
const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("z-ai-web-dev-sdk", () => ({
  default: {
    create: async () => ({ chat: { completions: { create: mocks.create } } }),
  },
}));

const SP8 = "        "; // the reference's indented "blank" line
const lines = (...ls: string[]) => ls.join("\n");

const day = new Date(2026, 9, 4); // October 4, 2026 — the capture's day

const oneTask = [
  { title: "Log Activity Parity B", category: "work", priority: "medium" },
];

// Captured single-task prompt (reference InvokeLLM body, 2026-10-04).
const capturedOneTaskPrompt =
  "\n" +
  lines(
    "        Analyze this daily schedule briefly:",
    SP8,
    "        Tasks for October 4, 2026:",
    SP8,
    "        - Log Activity Parity B (work, medium priority)",
    SP8,
    SP8,
    "        Provide a concise analysis with:",
    "        1. Overall mood/theme (1-2 words)",
    "        2. Key focus areas (max 3 items)",
    "        3. Activity types (max 3 items) ",
    "        4. Brief insight (max 2 sentences)",
  ) +
  "\n      ";

// Captured two-task prompt (the API-created newest task listed FIRST —
// fn.Task.list()'s createdAt-desc default, L-5's ground truth).
const twoTasks = [
  { title: "LLMCap S13 Multi", category: "learning", priority: "medium" },
  { title: "Log Activity Parity B", category: "work", priority: "medium" },
];
const capturedTwoTaskPrompt =
  "\n" +
  lines(
    "        Analyze this daily schedule briefly:",
    SP8,
    "        Tasks for October 4, 2026:",
    SP8,
    "        - LLMCap S13 Multi (learning, medium priority)",
    SP8,
    "",
    "        - Log Activity Parity B (work, medium priority)",
    SP8,
    SP8,
    "        Provide a concise analysis with:",
    "        1. Overall mood/theme (1-2 words)",
    "        2. Key focus areas (max 3 items)",
    "        3. Activity types (max 3 items) ",
    "        4. Brief insight (max 2 sentences)",
  ) +
  "\n      ";

describe("the daily-focus prompt (Y1e parity)", () => {
  it("is the captured InvokeLLM prompt byte-for-byte", () => {
    expect(DAILY_FOCUS_PROMPT).toBe(
      "Generate a short inspirational quote for productivity, its author, and a positive affirmation for the day. Return as JSON.",
    );
  });
});

describe("the AI-summary prompt builder (fre parity)", () => {
  it("reproduces the captured single-task prompt byte-for-byte", () => {
    expect(buildAiSummaryPrompt(day, oneTask)).toBe(capturedOneTaskPrompt);
  });

  it("reproduces the captured two-task prompt byte-for-byte (join structure)", () => {
    expect(buildAiSummaryPrompt(day, twoTasks)).toBe(capturedTwoTaskPrompt);
  });

  it("renders the input array AS GIVEN (the route owns the order — createdAt desc)", () => {
    // Order preservation: the builder never re-sorts; the 2-task capture
    // proves the reference feeds it fn.Task.list()'s default (newest
    // first). If the builder sorted, this 3-task input would reorder.
    const three = [
      { title: "Newest", category: "work", priority: "low" },
      { title: "Middle", category: "health", priority: "high" },
      { title: "Oldest", category: "social", priority: "urgent" },
    ];
    const prompt = buildAiSummaryPrompt(day, three);
    expect(prompt.indexOf("- Newest")).toBeLessThan(prompt.indexOf("- Middle"));
    expect(prompt.indexOf("- Middle")).toBeLessThan(prompt.indexOf("- Oldest"));
  });
});

describe("the summary route feeds the builder fn.Task.list()'s order (L-5)", () => {
  it("queries tasks createdAt-desc (the captured order's source)", () => {
    // The prompt's task order is decided by the route's query — the
    // 2-task capture lists the newest-created task first, disproving the
    // clone's startTime-asc. Pinned at the source level (the
    // next-config / db-cli-scripts file-read precedent): the e2e suite
    // cannot intercept the server-side SDK call.
    const route = readFileSync(
      path.join(repo, "src", "app", "api", "ai", "summary", "route.ts"),
      "utf8",
    );
    expect(route).toContain('orderBy: { createdAt: "desc" }');
    expect(route).not.toContain('orderBy: { startTime: "asc" }');
  });
});

describe("generateAiSummary/generateDailyFocus send the captured prompts", () => {
  it("passes the byte-exact summary prompt as the user message", async () => {
    mocks.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              mood: "Focused",
              focus_areas: ["Work"],
              activities: ["Admin"],
              insights: "Good.",
            }),
          },
        },
      ],
    });
    const { generateAiSummary } = await import("@/lib/ai");
    // generateAiSummary's domain types (Category/Priority) — the captured
    // task set carries valid reference enum values.
    const wireTasks: { title: string; category: Category; priority: Priority }[] =
      twoTasks as { title: string; category: Category; priority: Priority }[];
    await generateAiSummary(day, wireTasks);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          expect.objectContaining({ role: "user", content: capturedTwoTaskPrompt }),
        ],
      }),
    );
  });

  it("passes the byte-exact daily-focus prompt as the user message", async () => {
    mocks.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              quote: "Q",
              author: "A",
              affirmation: "F",
            }),
          },
        },
      ],
    });
    const { generateDailyFocus } = await import("@/lib/ai");
    await generateDailyFocus();
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          expect.objectContaining({
            role: "user",
            content: "Generate a short inspirational quote for productivity, its author, and a positive affirmation for the day. Return as JSON.",
          }),
        ],
      }),
    );
  });
});
