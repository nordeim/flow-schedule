import { describe, expect, it, vi } from "vitest";
import type { Category, Priority } from "@/lib/domain";

// The AI RESPONSE-parse contract (session 14) — pinned against the
// reference app's own PROBED render behavior (the XHR response-override
// harness on the logged-in reference page: Object.defineProperty on the
// XHR instance feeds the reference's own card components arbitrary
// post-validation JSON, probe by probe).
//
// FS-26 (the response is the wire too): the reference's contract is
//   schema-INVALID  → the catch/fallback (the platform's
//                     response_json_schema validation fails server-side)
//   schema-VALID-but-empty → rendered VERBATIM (empty chips, empty <p>s)
// The platform's schema has NO minLength / NO minItems — so empty
// strings, empty arrays and empty-string items are VALID responses the
// reference renders as-is. The clone's defensive parse (the self-hosted
// validation seam, ADR-005) must therefore check SHAPE, not truthiness.
//
// Probed ground truth (each pin cites its probe):
//   RS-1 {"mood":"calm","focus_areas":[],"activities":[],…} → 0 chips
//   RS-2 {"focus_areas":["", "real area"]} → an empty chip + "real area"
//   RS-3 {"mood":"",…"insights":""} → empty <p> elements, no fallback
//   RS-4 {"quote":"A real quote","author":"","affirmation":""} → the
//        quote renders + "- " + an empty affirmation <p> (the guard is
//        `a && a.quote` — quote ONLY, per the Y1e decompile)

// The SDK mock (top level — vi.mock hoists), the ai-prompt.test.ts
// pattern: generateAiSummary/generateDailyFocus call
// zai.chat.completions.create; the mocked create returns the probe's
// response content.
const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("z-ai-web-dev-sdk", () => ({
  default: {
    create: async () => ({ chat: { completions: { create: mocks.create } } }),
  },
}));

const day = new Date(2026, 9, 5); // October 5, 2026 — this session's capture day

const oneTask: { title: string; category: Category; priority: Priority }[] = [
  { title: "S14 Paired Probe A", category: "work", priority: "medium" },
];

function sdkReturns(content: string) {
  mocks.create.mockResolvedValue({
    choices: [{ message: { content } }],
  });
}

describe("generateAiSummary: the schema-shape parse (RS-1/2/3)", () => {
  it("RS-1: empty arrays render verbatim (zero chips), NOT the fallback", async () => {
    // Probe 1 (2026-10-05): the reference rendered mood "calm", ZERO
    // focus/activities chips and the verbatim insight for this exact
    // response. The clone's asStringArray returned null for [] → the
    // whole summary fell to FALLBACK_SUMMARY — the divergence this pin
    // closes.
    sdkReturns(
      JSON.stringify({
        mood: "calm",
        focus_areas: [],
        activities: [],
        insights: "Empty arrays probe",
      }),
    );
    const { generateAiSummary } = await import("@/lib/ai");
    const out = await generateAiSummary(day, oneTask);
    expect(out).toEqual({
      mood: "calm",
      focus_areas: [],
      activities: [],
      insights: "Empty arrays probe",
    });
  });

  it("RS-2: empty-string items pass through verbatim (no filtering)", async () => {
    // Probe 3: the reference rendered an EMPTY chip + "real area" for
    // ["", "real area"] — no length filtering client-side.
    sdkReturns(
      JSON.stringify({
        mood: "mixed",
        focus_areas: ["", "real area"],
        activities: ["act"],
        insights: "Empty string probe",
      }),
    );
    const { generateAiSummary } = await import("@/lib/ai");
    const out = await generateAiSummary(day, oneTask);
    expect(out).toEqual({
      mood: "mixed",
      focus_areas: ["", "real area"],
      activities: ["act"],
      insights: "Empty string probe",
    });
  });

  it("RS-3: empty mood/insights render verbatim (empty <p>s), NOT the fallback", async () => {
    // Probe 4: the reference rendered an empty
    // <p class="text-purple-800 capitalize…"> and an empty insight <p>
    // for {"mood":"","insights":""} — the truthiness guard was the
    // clone-only divergence.
    sdkReturns(
      JSON.stringify({
        mood: "",
        focus_areas: ["fa"],
        activities: ["ac"],
        insights: "",
      }),
    );
    const { generateAiSummary } = await import("@/lib/ai");
    const out = await generateAiSummary(day, oneTask);
    expect(out).toEqual({
      mood: "",
      focus_areas: ["fa"],
      activities: ["ac"],
      insights: "",
    });
  });

  it("the parse does NOT slice arrays (the render owns the 3-slice — fre's decompile)", async () => {
    // Probe 2: 5 focus_areas + 4 activities → the reference rendered 3
    // chips each — the slice lives in the RENDER (fre's .slice(0,3)),
    // so the parse passes the full arrays through verbatim and the
    // card's existing slice(0,3) does the trimming.
    sdkReturns(
      JSON.stringify({
        mood: "busy",
        focus_areas: ["fa1", "fa2", "fa3", "fa4", "fa5"],
        activities: ["ac1", "ac2", "ac3", "ac4"],
        insights: "Four items probe",
      }),
    );
    const { generateAiSummary } = await import("@/lib/ai");
    const out = await generateAiSummary(day, oneTask);
    expect(out.focus_areas).toEqual(["fa1", "fa2", "fa3", "fa4", "fa5"]);
    expect(out.activities).toEqual(["ac1", "ac2", "ac3", "ac4"]);
  });

  it("the natural captured response still parses (the session-14 live capture)", async () => {
    // The real InvokeLLM round-trip captured this session (CAP#2): the
    // platform returned schema-validated JSON — the normal path's
    // regression pin.
    sdkReturns(
      JSON.stringify({
        mood: "Focused",
        focus_areas: ["Professional Research"],
        activities: ["Project Probe"],
        insights:
          "The schedule is highly streamlined, allowing for deep concentration on a single high-priority task. This approach minimizes cognitive load and promotes efficient progress.",
      }),
    );
    const { generateAiSummary } = await import("@/lib/ai");
    const out = await generateAiSummary(day, oneTask);
    expect(out.mood).toBe("Focused");
    expect(out.focus_areas).toEqual(["Professional Research"]);
    expect(out.activities).toEqual(["Project Probe"]);
  });

  it("schema-INVALID shapes still fall back (the platform-validation equivalent)", async () => {
    // The platform's response_json_schema rejects these server-side;
    // the SDK call errors → the reference's catch → fallback. The
    // clone's defensive parse is the self-hosted equivalent seam.
    const { FALLBACK_SUMMARY } = await import("@/lib/ai-defaults");
    const { generateAiSummary } = await import("@/lib/ai");
    for (const bad of [
      JSON.stringify({ mood: 42, focus_areas: ["a"], activities: ["b"], insights: "x" }),
      JSON.stringify({ focus_areas: ["a"], activities: ["b"], insights: "x" }),
      JSON.stringify({ mood: "m", focus_areas: "not-array", activities: ["b"], insights: "x" }),
      JSON.stringify({ mood: "m", focus_areas: ["a", 7], activities: ["b"], insights: "x" }),
      "not json at all",
    ]) {
      sdkReturns(bad);
      const out = await generateAiSummary(day, oneTask);
      expect(out).toEqual(FALLBACK_SUMMARY);
    }
  });
});

describe("generateDailyFocus: the quote-only guard (RS-4)", () => {
  it("RS-4: quote non-empty + empty author/affirmation → verbatim (NOT the default)", async () => {
    // Probe 5: the reference rendered "A real quote" + "- " + an empty
    // affirmation <p> — the decompiled guard is `a && a.quote ? n(a) :
    // n(j1)` (quote ONLY). The clone required all three truthy →
    // DEFAULT_FOCUS — the divergence this pin closes.
    sdkReturns(
      JSON.stringify({
        quote: "A real quote",
        author: "",
        affirmation: "",
      }),
    );
    const { generateDailyFocus } = await import("@/lib/ai");
    const out = await generateDailyFocus();
    expect(out).toEqual({
      quote: "A real quote",
      author: "",
      affirmation: "",
    });
  });

  it("empty quote → the default (the a && a.quote decompile)", async () => {
    // quote falsy → j1 (DEFAULT_FOCUS) — the reference's own guard.
    sdkReturns(
      JSON.stringify({
        quote: "",
        author: "Someone",
        affirmation: "Something",
      }),
    );
    const { generateDailyFocus } = await import("@/lib/ai");
    const { DEFAULT_FOCUS } = await import("@/lib/ai-defaults");
    const out = await generateDailyFocus();
    expect(out).toEqual(DEFAULT_FOCUS);
  });

  it("missing author/affirmation keys render as empty strings (the '- ' render)", async () => {
    // The platform schema has no required-array; a missing key renders
    // as "- " + undefined → the parse's string-coercion seam maps it
    // to "" (React renders both identically).
    sdkReturns(JSON.stringify({ quote: "Q" }));
    const { generateDailyFocus } = await import("@/lib/ai");
    const out = await generateDailyFocus();
    expect(out).toEqual({ quote: "Q", author: "", affirmation: "" });
  });

  it("the natural captured response still parses (Walt Disney, session 12/14)", async () => {
    sdkReturns(
      JSON.stringify({
        quote: "The way to get started is to quit talking and begin doing.",
        author: "Walt Disney",
        affirmation:
          "I am focused, capable, and productive throughout my day.",
      }),
    );
    const { generateDailyFocus } = await import("@/lib/ai");
    const out = await generateDailyFocus();
    expect(out.author).toBe("Walt Disney");
    expect(out.quote).toContain("quit talking");
  });

  it("schema-INVALID shapes still fall back (quote non-string)", async () => {
    const { DEFAULT_FOCUS } = await import("@/lib/ai-defaults");
    const { generateDailyFocus } = await import("@/lib/ai");
    for (const bad of [
      JSON.stringify({ quote: 42, author: "A", affirmation: "F" }),
      JSON.stringify({ author: "A", affirmation: "F" }),
      "{{broken",
    ]) {
      sdkReturns(bad);
      const out = await generateDailyFocus();
      expect(out).toEqual(DEFAULT_FOCUS);
    }
  });
});
