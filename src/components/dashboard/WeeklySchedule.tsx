"use client";

// FlowSchedule — Weekly Schedule calendar (the dashboard's main card).
// Mirrors the reference's grid exactly:
//   - header row: 80px label column + 16 × 60px hour columns (07:00–22:00),
//     sticky, bg-white/80 backdrop-blur-md
//   - day rows: 80px label (EEE + MMM d) + relative hour-cell grid with
//     1px right borders and hover plus affordances
//   - task blocks: absolutely positioned rounded gradient bars
//     (left = minutes since 07:00 × 1px/min, width = duration × 1px/min
//     with a 10px minimum, min 15-minute step in the form)
// Clicking a cell opens the task dialog pre-filled with that day+hour.

import * as React from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  CALENDAR_HOURS,
  CALENDAR_LABEL_WIDTH,
  CALENDAR_SLOT_WIDTH,
  CATEGORY_GRADIENTS,
  type Category,
} from "@/lib/domain";
import type { Task } from "@/store/useFlowStore";

const PX_PER_MINUTE = CALENDAR_SLOT_WIDTH / 60; // 60px per hour → 1px/min

export function WeeklySchedule({
  tasks,
  weekStart,
  onPrevWeek,
  onNextWeek,
  onRefresh,
  onCellClick,
  onTaskClick,
}: {
  tasks: Task[];
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onRefresh: () => void;
  onCellClick: (day: Date, hour: number) => void;
  onTaskClick: (task: Task) => void;
}) {
  const days = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const tasksByDay = React.useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const day of days) {
      map.set(
        day.toISOString(),
        tasks.filter((t) => t.start_time && isSameDay(new Date(t.start_time), day)),
      );
    }
    return map;
  }, [tasks, days]);

  const gridTemplate = `${CALENDAR_LABEL_WIDTH}px repeat(${CALENDAR_HOURS.length}, ${CALENDAR_SLOT_WIDTH}px)`;

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-4 md:p-5 shadow-xl border border-white/20">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-semibold text-slate-800">Weekly Schedule</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevWeek}
            className="rounded-lg border-slate-200/90 hover:bg-slate-50/90 px-3 py-1.5 text-xs"
          >
            {" "}
            ← Previous{" "}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextWeek}
            className="rounded-lg border-slate-200/90 hover:bg-slate-50/90 px-3 py-1.5 text-xs"
          >
            {" "}
            Next →{" "}
          </Button>
          <Button
            variant="outline"
            size="icon_sm"
            onClick={onRefresh}
            className="rounded-lg border-slate-200/90 hover:bg-slate-50/90 p-1.5"
            title="Refresh Calendar"
            aria-label="Refresh Calendar"
          >
            {" "}
            <RefreshCw className="w-3.5 h-3.5" />{" "}
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-lg border-sky-200/90 hover:bg-sky-50/90 text-sky-700 px-3 py-1.5 text-xs"
          >
            <Link href="/Planning">
              {" "}
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Full Planning{" "}
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-auto pb-2 custom-scrollbar">
        <div style={{ minWidth: `${CALENDAR_LABEL_WIDTH + CALENDAR_HOURS.length * CALENDAR_SLOT_WIDTH}px` }}>
          {/* Hour header row */}
          <div
            className="grid sticky top-0 bg-white/80 backdrop-blur-md z-20 py-2"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className="p-1"></div>
            {CALENDAR_HOURS.map((hour) => (
              <div key={hour} className="text-center p-1">
                <div className="font-semibold text-slate-700 text-xs">
                  {format(new Date(2000, 0, 1, hour), "HH:mm")}
                </div>
              </div>
            ))}
          </div>

          {/* Day rows — the reference wraps all seven in space-y-1.5
              (measured 6px inter-row gap, session 4, W-1). */}
          <div className="space-y-1.5">
            {days.map((day) => {
              const dayTasks = tasksByDay.get(day.toISOString()) ?? [];
              return (
                <div
                  key={day.toISOString()}
                  className="grid items-center"
                  style={{ gridTemplateColumns: `${CALENDAR_LABEL_WIDTH}px 1fr`, minHeight: "50px" }}
                >
                  <div className="p-1.5 text-left text-xs text-slate-600 font-medium flex flex-col justify-center items-start bg-slate-50/60 rounded-lg h-full">
                    <div className="font-bold text-slate-800">{format(day, "EEE")}</div>
                    <div className="text-slate-500 text-[10px]">{format(day, "MMM d")}</div>
                  </div>
                  <div
                    className="relative h-full grid border-l border-slate-200/70"
                    style={{ gridTemplateColumns: `repeat(${CALENDAR_HOURS.length}, ${CALENDAR_SLOT_WIDTH}px)` }}
                  >
                    {CALENDAR_HOURS.map((hour, i) => (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        role="button"
                        tabIndex={0}
                        aria-label={`Add task on ${format(day, "EEE MMM d")} at ${format(
                          new Date(2000, 0, 1, hour),
                          "HH:mm",
                        )}`}
                        className={`h-full ${i < CALENDAR_HOURS.length - 1 ? "border-r" : ""} border-slate-200/50 group hover:bg-sky-50/30 transition-colors duration-150`}
                        onClick={() => onCellClick(day, hour)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onCellClick(day, hour);
                          }
                        }}
                      >
                        <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <Plus className="w-3 h-3 text-sky-500" />
                        </div>
                      </div>
                    ))}
                    {dayTasks.map((task) => (
                      <TaskBlock key={task.id} task={task} onClick={onTaskClick} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskBlock({
  task,
  onClick,
}: {
  task: Task;
  onClick: (task: Task) => void;
}) {
  if (!task.start_time) return null;
  const start = new Date(task.start_time);
  const startHour = start.getHours() + start.getMinutes() / 60;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const duration = task.duration_minutes ?? 60;
  const minutesFromGridStart = (startHour - CALENDAR_HOURS[0]) * 60;
  // The reference's rre (session 4, W-4): a task entirely before the
  // 07:00 grid start is HIDDEN; one that spans 07:00 clips to the left
  // edge (left = 0).
  if (startHour < CALENDAR_HOURS[0]) {
    if (startMinutes + duration <= CALENDAR_HOURS[0] * 60) return null;
  }
  const left = Math.max(0, minutesFromGridStart * PX_PER_MINUTE);
  const width = Math.max(duration * PX_PER_MINUTE, 10);
  const gradient =
    CATEGORY_GRADIENTS[task.category as Category] ??
    "bg-gradient-to-r from-gray-400 to-gray-500";

  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        height: "calc(100% - 6px)",
        top: "3px",
        position: "absolute",
        // The reference stacks by the task's start MINUTE (rre: 10 + i),
        // not its list index (session 4, W-2).
        zIndex: 10 + start.getMinutes(),
      }}
      className={`rounded-lg px-2 py-0.5 text-white text-[10px] font-medium shadow-md cursor-pointer hover:opacity-80 transition-opacity duration-200 flex items-center justify-center ${gradient} overflow-hidden`}
      onClick={(e) => {
        e.stopPropagation();
        onClick(task);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onClick(task);
        }
      }}
      title={`${task.title} - ${format(start, "HH:mm")} (${task.duration_minutes ?? duration}m)`}
    >
      <span className="truncate block leading-tight">{task.title}</span>
    </div>
  );
}

export function useWeekStart(initial?: Date) {
  const [weekStart, setWeekStart] = React.useState(
    () => initial ?? startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const prev = React.useCallback(() => setWeekStart((w) => addDays(w, -7)), []);
  const next = React.useCallback(() => setWeekStart((w) => addDays(w, 7)), []);
  return { weekStart, setWeekStart, prev, next };
}
