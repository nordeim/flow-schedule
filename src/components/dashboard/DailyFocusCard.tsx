"use client";

// FlowSchedule — Daily Focus card: LLM-generated quote + affirmation with a
// deterministic fallback (never hard-fails). Sky→blue gradient card like the
// reference.

import * as React from "react";
import { Sun, Lightbulb, CircleDot } from "lucide-react";
import type { DailyFocus } from "@/lib/ai";

const DEFAULT_FOCUS: DailyFocus = {
  quote:
    "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.",
  author: "Paul J. Meyer",
  affirmation:
    "I am capable, focused, and empowered to accomplish everything I set my mind to today.",
};

export function DailyFocusCard() {
  const [focus, setFocus] = React.useState<DailyFocus>(DEFAULT_FOCUS);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/daily-focus");
        const body = (await res.json()) as
          | { ok: true; data: { focus: DailyFocus } }
          | { ok: false };
        if (!cancelled && body.ok && body.data.focus?.quote) {
          setFocus(body.data.focus);
        }
      } catch {
        // keep default
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 animate-pulse min-h-[220px]">
        <div className="h-6 bg-slate-200 rounded-2xl w-1/3 mb-4" />
        <div className="h-4 bg-slate-200 rounded-2xl w-full mb-2" />
        <div className="h-4 bg-slate-200 rounded-2xl w-2/3 mb-2" />
        <div className="h-4 bg-slate-200 rounded-2xl w-1/2 mt-4" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-sky-500/80 to-blue-600/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 text-white">
      <div className="flex items-center gap-3 mb-4">
        <Sun className="w-6 h-6 opacity-80" />
        <h3 className="text-lg font-semibold">Daily Focus</h3>
      </div>
      <div className="mb-6">
        <div className="flex gap-3">
          <Lightbulb className="w-5 h-5 mt-1 opacity-80" />
          <div>
            <p className="italic font-medium leading-relaxed opacity-95">
              &ldquo;{focus.quote}&rdquo;
            </p>
            <p className="text-right text-xs mt-1 opacity-75">- {focus.author}</p>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <CircleDot className="w-5 h-5 mt-1 opacity-80" />
          <p className="text-sm opacity-90 leading-relaxed">{focus.affirmation}</p>
        </div>
      </div>
    </div>
  );
}
