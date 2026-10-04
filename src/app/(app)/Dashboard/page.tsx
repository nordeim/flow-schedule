"use client";

// /Dashboard — the reference app's main page.
// lg: 12-col grid — calendar (col-span-9) + sidebar stack (col-span-3);
// below lg the sidebar stacks under. Clicking a calendar hour cell opens
// the task dialog prefilled with that day/hour; clicking a task block
// opens it for editing.

import * as React from "react";
import { format, set } from "date-fns";
import { WeeklySchedule, useWeekStart } from "@/components/dashboard/WeeklySchedule";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SkillsMap } from "@/components/dashboard/SkillsMap";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { DailyFocusCard } from "@/components/dashboard/DailyFocusCard";
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import { TaskDialog, emptyTaskForm } from "@/components/planning/TaskDialog";
import { useFlowStore, type Task } from "@/store/useFlowStore";

export default function DashboardPage() {
  const tasks = useFlowStore((s) => s.tasks);
  const refreshTasks = useFlowStore((s) => s.refreshTasks);
  const { weekStart, prev, next } = useWeekStart();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [initialForm, setInitialForm] = React.useState(emptyTaskForm());

  const today = React.useMemo(() => new Date(), []);

  const openCreate = (day: Date, hour: number) => {
    const start = set(day, { hours: hour, minutes: 0, seconds: 0, milliseconds: 0 });
    setEditingTask(null);
    setInitialForm({
      ...emptyTaskForm(),
      start_time: format(start, "yyyy-MM-dd'T'HH:mm"),
      duration_minutes: "60",
    });
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setInitialForm({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      category: task.category,
      start_time: task.start_time ? format(new Date(task.start_time), "yyyy-MM-dd'T'HH:mm") : "",
      duration_minutes: task.duration_minutes ? String(task.duration_minutes) : "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 space-y-6">
          <WeeklySchedule
            tasks={tasks}
            weekStart={weekStart}
            onPrevWeek={prev}
            onNextWeek={next}
            onRefresh={() => void refreshTasks()}
            onCellClick={openCreate}
            onTaskClick={openEdit}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuickActions />
            <SkillsMap tasks={tasks} day={today} />
          </div>
        </div>
        <div className="lg:col-span-3 space-y-6">
          <StatusCard tasks={tasks} />
          <DailyFocusCard />
          <AISummaryCard day={today} />
        </div>
      </div>

      <TaskDialog
        key={editingTask?.id ?? "new-task"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingTask}
        initial={initialForm}
      />
    </div>
  );
}
