"use client";

// FlowSchedule — Skills Map card, rebuilt to the reference's decompiled
// `g0e` (session 4, K-1..K-5):
//   - loading skeleton (header + a pulsing w-48 h-48 circle) keyed to the
//     store's loadingTasks
//   - header carries the Award live indicator (w-4 h-4 text-yellow-500)
//   - custom Tooltip: glass card with name, "Xh Ym", "Z% of day"
//   - legend: capitalized slate-700 category names, percentage-ONLY right
//     column (no hours suffix)
//   - slice colors via SKILL_COLORS_LOOKUP (the reference's m0e + the
//     #64748B fallback), rows named by the reference's transform

import * as React from "react";
import { Cell, Pie, PieChart, Tooltip, ResponsiveContainer } from "recharts";
import { Target, Award } from "lucide-react";
import { SKILL_COLORS_LOOKUP, skillRowName } from "@/lib/domain";
import type { Task } from "@/store/useFlowStore";
import { isSameDay } from "date-fns";
import { useFlowStore } from "@/store/useFlowStore";

type Row = {
  name: string;
  value: number;
  percentage: number;
  color: string;
};

// g0e's tooltip content component (recharts 3 passes active/payload via
// props — typed loosely to match the runtime shape).
function SkillsTooltip(props: { active?: boolean; payload?: unknown[] }) {
  const { active, payload } = props;
  if (active && payload && payload.length) {
    const row = (payload[0] as { payload?: Row })?.payload;
    if (!row) return null;
    return (
      <div className="bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-lg border border-white/20">
        <p className="font-medium text-slate-900">{row.name}</p>
        <p className="text-sm text-slate-600">
          {Math.round(row.value / 60)}h {row.value % 60}m
        </p>
        <p className="text-sm text-slate-600">{row.percentage}% of day</p>
      </div>
    );
  }
  return null;
}

export function SkillsMap({ tasks, day }: { tasks: Task[]; day: Date }) {
  const loadingTasks = useFlowStore((s) => s.loadingTasks);

  const [data, totalMinutes] = React.useMemo(() => {
    const dayTasks = tasks.filter(
      (t) => t.start_time && isSameDay(new Date(t.start_time), day),
    );
    const byCategory = new Map<string, number>();
    let total = 0;
    for (const t of dayTasks) {
      const minutes = t.duration_minutes || 60;
      total += minutes;
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + minutes);
    }
    const rows: Row[] = [...byCategory.entries()].map(([category, minutes]) => ({
      name: skillRowName(category),
      value: minutes,
      percentage: total > 0 ? Math.round((minutes / total) * 100) : 0,
      color: SKILL_COLORS_LOOKUP(category),
    }));
    return [rows, total] as const;
  }, [tasks, day]);

  if (loadingTasks) {
    // g0e's loading skeleton.
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 min-h-[280px]">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-indigo-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-slate-900">Skills Map</h3>
        </div>
        <div className="w-48 h-48 bg-slate-200 rounded-full mx-auto animate-pulse" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 text-center min-h-[280px]">
        <Target className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Skills Map</h3>
        <p className="text-slate-600">No activities today</p>
        <p className="text-sm text-slate-500">
          Schedule some tasks to see your skills distribution
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 relative overflow-hidden min-h-[280px]">
      <div className="bg-gradient-to-br from-sky-400/20 to-green-400/20 mx-1 my-3 absolute top-0 left-0 w-20 h-20 rounded-full transform -translate-x-8 -translate-y-8" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-indigo-500" />
          <h3 className="text-lg font-semibold text-slate-900">Skills Map</h3>
          <Award className="w-4 h-4 text-yellow-500" />
        </div>
        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((row, i) => (
                  <Cell key={`cell-${i}`} fill={row.color} />
                ))}
              </Pie>
              <Tooltip content={<SkillsTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{Math.round(totalMinutes / 60)}h</div>
              <div className="text-xs text-slate-500">total</div>
            </div>
          </div>
        </div>
        <div className="space-y-2 mt-4">
          {data.map((row) => (
            <div key={row.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: row.color }} />
                <span className="text-slate-700 capitalize">{row.name.toLowerCase()}</span>
              </div>
              <span className="font-medium text-slate-600">{row.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
