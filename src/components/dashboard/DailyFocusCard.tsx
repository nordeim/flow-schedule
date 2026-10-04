"use client";

// FlowSchedule — Daily Focus card, rebuilt to the reference's decompiled
// `Y1e` (session 4, F-1..F-4):
//   - the deterministic fallback is the reference's j1 (Mark Twain) — the
//     session-0 Paul J. Meyer guess was wrong (visible on every SDK 429)
//   - quote/affirmation are VERTICAL blocks: icon (w-5 h-5 opacity-70
//     mb-1) above the text — quote p is text-lg italic with literal
//     double quotes, author p is text-sm opacity-80 text-right mt-1,
//     affirmation p is font-medium
//   - the affirmation icon is Target (the reference's rp), not CircleDot
//   - re-fetches when refreshTrigger changes (the reference re-runs
//     InvokeLLM on task mutations via X1e's counter)

import * as React from "react";
import { Lightbulb, Sun, Target } from "lucide-react";
import { DEFAULT_FOCUS, type DailyFocus } from "@/lib/ai-defaults";

export function DailyFocusCard({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
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
        // keep default (the reference's own catch: n(j1))
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  if (loading) {
    // Y1e's skeleton — same shape the clone had, minus the clone-only
    // min-h-[220px].
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 animate-pulse">
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
        <Lightbulb className="w-5 h-5 opacity-70 mb-1" />
        <p className="text-lg italic">&quot;{focus.quote}&quot;</p>
        <p className="text-sm opacity-80 text-right mt-1">- {focus.author}</p>
      </div>
      <div>
        <Target className="w-5 h-5 opacity-70 mb-1" />
        <p className="font-medium">{focus.affirmation}</p>
      </div>
    </div>
  );
}
