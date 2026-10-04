"use client";

// FlowSchedule — Skills Map card (recharts PieChart with a center total).
// Empty state mirrors the reference ("No activities today"). Chart state
// aggregates the selected day's scheduled tasks by category minutes.

import * as React from "react";
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Target } from "lucide-react";
import { SKILL_COLORS, type Category } from "@/lib/domain";
import type { Task } from "@/store/useFlowStore";
import { isSameDay } from "date-fns";

export function SkillsMap({ tasks, day }: { tasks: Task[]; day: Date }) {
  const [data, totalMinutes] = React.useMemo(() => {
    const dayTasks = tasks.filter(
      (t) => t.start_time && isSameDay(new Date(t.start_time), day),
    );
    const byCategory = new Map<Category, number>();
    let total = 0;
    for (const t of dayTasks) {
      const minutes = t.duration_minutes ?? 60;
      total += minutes;
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + minutes);
    }
    const rows = [...byCategory.entries()].map(([category, minutes]) => ({
      name: category,
      value: minutes,
      color: SKILL_COLORS[category] ?? "#94a3b8",
    }));
    return [rows, total] as const;
  }, [tasks, day]);

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
              <Tooltip
                formatter={(value, name) => [`${value}m`, String(name)]}
              />
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
                <span className="text-slate-600">{row.name}</span>
              </div>
              <span className="text-slate-500">
                {Math.round((row.value / totalMinutes) * 100)}% · {Math.round(row.value / 60 * 10) / 10}h
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
