// FlowSchedule — deterministic AI fallback content (shared constants).
//
// A PURE module: no SDK import, so client components (DailyFocusCard) can
// consume the default without pulling z-ai-web-dev-sdk into the client
// bundle (the SDK is server-side only — AGENTS.md invariant).
//
// The strings are parity surfaces, decompiled from the reference bundle
// (j1 for daily focus; fre's empty-day branch + catch block for the
// summary) and live-corroborated on the logged-in reference: they render
// verbatim on every SDK failure (the 429s fire the fallbacks by design).

export type DailyFocus = {
  quote: string;
  author: string;
  affirmation: string;
};

export type AiSummary = {
  mood: string;
  focus_areas: string[];
  activities: string[];
  insights: string;
};

// The reference's j1 — NOT Paul J. Meyer (the session-0 guess).
export const DEFAULT_FOCUS: DailyFocus = {
  quote: "The secret of getting ahead is getting started.",
  author: "Mark Twain",
  affirmation: "I am focused, productive, and capable of achieving my goals today.",
};

// fre's empty-day branch (no tasks today).
export const EMPTY_DAY_SUMMARY: AiSummary = {
  mood: "planning",
  focus_areas: ["Free day"],
  activities: ["Open schedule"],
  insights: "Perfect opportunity for planning or taking a break!",
};

// fre's catch-block fallback (SDK failure with tasks present).
export const FALLBACK_SUMMARY: AiSummary = {
  mood: "productive",
  focus_areas: ["Work tasks"],
  activities: ["Mixed activities"],
  insights: "Keep up the good work!",
};
