"use client";

// FlowSchedule — Status card: "All caught up!" when nothing is upcoming,
// otherwise the next scheduled task with a countdown-ish subtitle.

import { CheckCircle2, Clock } from "lucide-react";
import { format, isAfter } from "date-fns";
import type { Task } from "@/store/useFlowStore";

export function StatusCard({ tasks }: { tasks: Task[] }) {
  const now = new Date();
  const upcoming = tasks
    .filter((t) => t.start_time && isAfter(new Date(t.start_time), now) && t.status !== "completed")
    .sort((a, b) => (a.start_time! > b.start_time! ? 1 : -1));
  const next = upcoming[0];

  if (!next) {
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 text-center min-h-[180px] flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4 text-green-500">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">All caught up!</h3>
        <p className="text-slate-500 text-sm">No upcoming tasks scheduled.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 text-center min-h-[180px] flex flex-col items-center justify-center">
      <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center mb-4 text-sky-500">
        <Clock className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">Up Next</h3>
      <p className="font-medium text-slate-800">{next.title}</p>
      <p className="text-slate-500 text-sm mt-1">
        {format(new Date(next.start_time!), "EEE, MMM d · HH:mm")}
      </p>
    </div>
  );
}
