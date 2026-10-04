import { describe, expect, it } from "vitest";

// Contract test for the reference's deterministic AI fallback content.
//
// The fallback text is user-visible on every SDK failure (429s fire the
// fallbacks by design — AGENTS.md "LLM never hard-fails"), so the exact
// strings are parity surfaces, decompiled from the reference bundle
// (`j1` for daily focus; fre's catch block for the summary fallback;
// fre's empty-day branch) and live-corroborated on the logged-in
// reference (session 4).
//
// The constants live in src/lib/ai-defaults.ts — a PURE module (no SDK
// import) so client components can consume the default without pulling
// z-ai-web-dev-sdk into the client bundle.

import {
  DEFAULT_FOCUS,
  EMPTY_DAY_SUMMARY,
  FALLBACK_SUMMARY,
} from "@/lib/ai-defaults";

describe("reference AI fallback content (ai-defaults)", () => {
  it("DEFAULT_FOCUS is the reference's j1 (Mark Twain set)", () => {
    expect(DEFAULT_FOCUS).toEqual({
      quote: "The secret of getting ahead is getting started.",
      author: "Mark Twain",
      affirmation: "I am focused, productive, and capable of achieving my goals today.",
    });
  });

  it("EMPTY_DAY_SUMMARY is the reference's empty-day branch", () => {
    expect(EMPTY_DAY_SUMMARY).toEqual({
      mood: "planning",
      focus_areas: ["Free day"],
      activities: ["Open schedule"],
      insights: "Perfect opportunity for planning or taking a break!",
    });
  });

  it("FALLBACK_SUMMARY is the reference's catch-block summary", () => {
    expect(FALLBACK_SUMMARY).toEqual({
      mood: "productive",
      focus_areas: ["Work tasks"],
      activities: ["Mixed activities"],
      insights: "Keep up the good work!",
    });
  });
});
