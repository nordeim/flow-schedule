"use client";

// FlowSchedule — Status card, rebuilt to the reference's decompiled `ure`
// (session 4, S-1..S-4). Three states:
//   loading  → p-6 skeleton (shown while the store fetches tasks)
//   next     → the rich "Next Up" card: priority badge, title, optional
//              description, a Clock time row, a 75% progress bar + "Ready",
//              and a FUNCTIONAL Mark Complete button (PATCH → completed →
//              refresh; live-verified on the reference) plus a decorative
//              outline ArrowRight button (the reference wires no handler)
//   empty    → "All caught up!" (raw CircleCheck icon, no wrapper)
//
// Time formatter mirrors the reference EXACTLY — including its format-string
// bug: format(d, "MMM d at HH:mm") renders "Oct 6 AM1791284400 11:00"
// because date-fns reads `a` as AM/PM and `t` as the unix timestamp. Bug
// parity per the FS-12 corollary (the reference's live DOM shows the same
// string). The Today/Tomorrow branches are literal template strings (no
// bug): "Today at HH:mm" / "Tomorrow at HH:mm".

import * as React from "react";
import { ArrowRight, CircleCheck, Clock } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useFlowStore, type Task } from "@/store/useFlowStore";

// ure's priority badge map.
const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  low: "text-green-600 bg-green-100",
  medium: "text-yellow-600 bg-yellow-100",
  high: "text-orange-600 bg-orange-100",
  urgent: "text-red-600 bg-red-100",
};

function badgeClass(priority: string): string {
  return PRIORITY_BADGE_CLASSES[priority] ?? PRIORITY_BADGE_CLASSES.medium;
}

// ure's time formatter (the `at` format-string bug is mirrored — see above).
function formatWhen(value: string): string {
  const d = new Date(value);
  if (isToday(d)) return `Today at ${format(d, "HH:mm")}`;
  if (isTomorrow(d)) return `Tomorrow at ${format(d, "HH:mm")}`;
  return format(d, "MMM d at HH:mm");
}

export function StatusCard({ tasks }: { tasks: Task[] }) {
  const loadingTasks = useFlowStore((s) => s.loadingTasks);
  const completeTask = useFlowStore((s) => s.completeTask);

  const next = React.useMemo(() => {
    const now = new Date();
    return tasks
      .filter((t) => t.start_time && t.status !== "completed")
      .sort((a, b) => (a.start_time! > b.start_time! ? 1 : -1))
      .find((t) => new Date(t.start_time!) > now);
  }, [tasks]);

  const onComplete = React.useCallback(() => {
    if (next) void completeTask(next.id).catch(console.error);
  }, [completeTask, next]);

  if (loadingTasks) {
    // ure's loading skeleton — shown whenever its (re)fetch is in flight;
    // the store's loadingTasks covers mount + Mark Complete + refreshes.
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded-2xl w-1/3 mb-4" />
          <div className="h-4 bg-slate-200 rounded-2xl w-2/3 mb-2" />
          <div className="h-4 bg-slate-200 rounded-2xl w-1/2" />
        </div>
      </div>
    );
  }

  if (!next) {
    // ure's empty state — raw icon, no wrapper div.
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 text-center">
        <CircleCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up!</h3>
        <p className="text-slate-600">No upcoming tasks scheduled.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 relative overflow-hidden">
      <div className="bg-gradient-to-br from-sky-400/20 to-green-400/20 mx-64 my-4 px-16 absolute top-0 right-0 w-20 h-20 rounded-full transform translate-x-8 -translate-y-8" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Next Up</h3>
          <div className={`px-3 py-1 rounded-2xl text-xs font-medium ${badgeClass(next.priority)}`}>
            {next.priority}
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-xl font-bold text-slate-900 leading-tight">{next.title}</h4>
          {next.description && (
            <p className="text-slate-600 text-sm leading-relaxed">{next.description}</p>
          )}
          <div className="flex items-center gap-2 text-slate-500">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{formatWhen(next.start_time!)}</span>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full animate-pulse"
                style={{ width: "75%" }}
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">Ready</span>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onComplete}
            className="flex-1 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          >
            <CircleCheck className="w-4 h-4 mr-2" />
            Mark Complete
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border-slate-200 hover:bg-slate-50"
            aria-label="Next task details"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
