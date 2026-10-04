"use client";

// FlowSchedule — AI Summary card, rebuilt to the reference's decompiled
// `fre` (session 4, A-1..A-6):
//   - header: Brain icon + a Sparkles LIVE INDICATOR (w-3 h-3
//     text-yellow-500 animate-pulse) after the heading
//   - Mood block: the purple→pink gradient card with a small TrendingUp
//     icon, text-xs font-medium purple-900 label, purple-800 body
//   - Focus Areas / Activities chips: bg-blue-100 / bg-green-100 rounded-lg
//   - Insights: max-h-20, font-medium h4, text-slate-700 body
//   - re-fetches when refreshTrigger changes (task mutations)

import * as React from "react";
import { Brain, Sparkles, TrendingUp } from "lucide-react";
import { EMPTY_DAY_SUMMARY, type AiSummary } from "@/lib/ai-defaults";

export function AISummaryCard({
  day,
  refreshTrigger = 0,
}: {
  day: Date;
  refreshTrigger?: number;
}) {
  // Derived loading (no effect-body setState): `result` holds the summary
  // keyed by its request day; when `dayKey` changes the stale result stops
  // matching and the skeleton renders until the fresh fetch lands.
  const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
    day.getDate(),
  ).padStart(2, "0")}`;
  const [result, setResult] = React.useState<{ day: string; summary: AiSummary } | null>(
    null,
  );
  const loading = !result || result.day !== dayKey;
  const summary = result?.summary ?? EMPTY_DAY_SUMMARY;

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: AiSummary;
      try {
        const res = await fetch(`/api/ai/summary?date=${dayKey}`);
        const body = (await res.json()) as
          | { ok: true; data: { summary: AiSummary } }
          | { ok: false };
        next = body.ok && body.data.summary ? body.data.summary : EMPTY_DAY_SUMMARY;
      } catch {
        next = EMPTY_DAY_SUMMARY;
      }
      if (!cancelled) setResult({ day: dayKey, summary: next });
    })();
    return () => {
      cancelled = true;
    };
  }, [dayKey, refreshTrigger]);

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-4 shadow-xl border border-white/20">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-purple-500 animate-pulse" />
          <h3 className="text-base font-semibold text-slate-900">AI Summary</h3>
        </div>
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-slate-200 rounded-xl w-3/4" />
          <div className="h-3 bg-slate-200 rounded-xl w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-4 shadow-xl border border-white/20 relative overflow-hidden">
      <div className="bg-gradient-to-br from-sky-400/20 to-green-400/20 mt-2 mr-64 mb-2 ml-64 pr-10 pl-10 absolute top-0 right-0 w-16 h-16 rounded-full transform translate-x-6 -translate-y-6" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-base font-semibold text-slate-900">AI Summary</h3>
          <Sparkles className="w-3 h-3 text-yellow-500 animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-purple-600" />
              <span className="text-xs font-medium text-purple-900">Mood</span>
            </div>
            <p className="text-purple-800 capitalize font-medium text-sm">{summary.mood}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-slate-900 mb-1.5">Focus Areas</h4>
            <div className="flex flex-wrap gap-1">
              {summary.focus_areas.slice(0, 3).map((area, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-slate-900 mb-1.5">Activities</h4>
            <div className="flex flex-wrap gap-1">
              {summary.activities.slice(0, 3).map((activity, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium"
                >
                  {activity}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 max-h-20 overflow-y-auto custom-scrollbar">
            <h4 className="text-xs font-medium text-slate-900 mb-1">Insights</h4>
            <p className="text-slate-700 text-xs leading-relaxed">{summary.insights}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
