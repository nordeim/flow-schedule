"use client";

// /Planning — the reference app's Weekly Planning page.
// Header row (title + Filter + Add Task), week card with 7 day columns
// (3 task chips + "+N more"), and two accordions for the selected day:
// task list + day statistics. Day cards select a day; the Add Task button
// and day-card clicks open the task dialog.

import * as React from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { Calendar, CheckCircle2, Filter, Plus, BarChart3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TaskDialog, emptyTaskForm, taskToForm } from "@/components/planning/TaskDialog";
import { CATEGORY_BADGES, PRIORITY_TEXT, SKILL_COLORS, type Category } from "@/lib/domain";
import { useFlowStore, type Task } from "@/store/useFlowStore";

export default function PlanningPage() {
  const tasks = useFlowStore((s) => s.tasks);
  const updateTask = useFlowStore((s) => s.updateTask);
  const [weekStart, setWeekStart] = React.useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedDay, setSelectedDay] = React.useState(() => new Date());
  const [filter, setFilter] = React.useState<"all" | "scheduled" | "unscheduled">("all");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [initialForm, setInitialForm] = React.useState(emptyTaskForm());

  const days = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const visibleTasks = React.useMemo(() => {
    switch (filter) {
      case "scheduled":
        return tasks.filter((t) => t.start_time);
      case "unscheduled":
        return tasks.filter((t) => !t.start_time);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const tasksForDay = React.useCallback(
    (day: Date) =>
      visibleTasks.filter((t) => t.start_time && isSameDay(new Date(t.start_time), day)),
    [visibleTasks],
  );

  const openCreate = () => {
    setEditingTask(null);
    setInitialForm(emptyTaskForm());
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setInitialForm(taskToForm(task));
    setDialogOpen(true);
  };

  const toggleComplete = async (task: Task) => {
    try {
      await updateTask(task.id, { status: task.status === "completed" ? "todo" : "completed" });
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const selectedDayTasks = tasksForDay(selectedDay);
  const selectedStats = React.useMemo(() => {
    const byCategory = new Map<Category, number>();
    let totalMinutes = 0;
    for (const t of selectedDayTasks) {
      const minutes = t.duration_minutes ?? 60;
      totalMinutes += minutes;
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + minutes);
    }
    const completed = selectedDayTasks.filter((t) => t.status === "completed").length;
    return { byCategory, totalMinutes, completed };
  }, [selectedDayTasks]);

  const unscheduled = visibleTasks.filter((t) => !t.start_time);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Weekly Planning</h1>
          <p className="text-slate-600">Organize and review your upcoming week</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() =>
              setFilter((f) =>
                f === "all" ? "scheduled" : f === "scheduled" ? "unscheduled" : "all",
              )
            }
            className="rounded-2xl border-slate-200"
          >
            <Filter className="w-4 h-4" /> Filter: {filter}
          </Button>
          <Button
            onClick={openCreate}
            className="rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
          >
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            Week of {format(weekStart, "MMM d, yyyy")}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              className="rounded-2xl border-slate-200"
            >
              ← Previous Week
            </Button>
            <Button
              variant="outline"
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              className="rounded-2xl border-slate-200"
            >
              Next Week →
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {days.map((day) => {
            const isToday = isSameDay(day, new Date());
            const dayTasks = tasksForDay(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left ${
                  isToday
                    ? "bg-sky-50 border-sky-200"
                    : "bg-white/50 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="text-center mb-3">
                  <div className="font-semibold text-slate-900">{format(day, "EEE")}</div>
                  <div className="text-2xl font-bold text-slate-700">{format(day, "d")}</div>
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(t);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          openEdit(t);
                        }
                      }}
                      className="text-xs p-2 rounded-xl bg-slate-100 truncate"
                    >
                      <div className="font-medium text-slate-700">{t.title}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${CATEGORY_BADGES[t.category as Category] ?? ""}`}
                        >
                          {t.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-slate-500 text-center py-1">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                  {dayTasks.length === 0 && (
                    <div className="text-xs text-slate-400 text-center py-2">No tasks</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Accordion
          type="single"
          collapsible
          defaultValue="tasks"
          className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-3xl"
        >
          <AccordionItem value="tasks" className="border-0">
            <AccordionTrigger className="flex items-center gap-2 px-6 py-4 hover:no-underline">
              <Calendar className="w-5 h-5 text-sky-500" />
              {format(selectedDay, "EEEE, MMM d, yyyy")}
            </AccordionTrigger>
            <AccordionContent className="px-6">
              <div className="space-y-3">
                {selectedDayTasks.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl bg-white/50 border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-slate-900">{t.title}</h4>
                      <div className={`text-sm font-medium ${PRIORITY_TEXT[t.priority]}`}>
                        {t.priority}
                      </div>
                    </div>
                    {t.description && (
                      <p className="text-sm text-slate-600 mb-2">{t.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge className={CATEGORY_BADGES[t.category as Category] ?? ""}>
                        {t.category}
                      </Badge>
                      {t.start_time && (
                        <span className="text-xs text-slate-500">
                          {format(new Date(t.start_time), "HH:mm")}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {t.duration_minutes ? `${t.duration_minutes}m` : ""}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void toggleComplete(t)}
                        className={`text-xs rounded-lg ${
                          t.status === "completed"
                            ? "text-green-600 hover:bg-green-50"
                            : "text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t.status === "completed" ? "Completed" : "Mark done"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(t)}
                        className="text-xs rounded-lg text-slate-500 hover:bg-slate-100"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
                {selectedDayTasks.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No tasks scheduled for this day</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="space-y-6">
          <Accordion
            type="single"
            collapsible
            defaultValue="stats"
            className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-3xl"
          >
            <AccordionItem value="stats" className="border-0">
              <AccordionTrigger className="flex items-center gap-2 px-6 py-4 hover:no-underline">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Day Statistics
              </AccordionTrigger>
              <AccordionContent className="px-6">
                <div className="space-y-4">
                  {selectedDayTasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Statistics for selected day</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/50 rounded-2xl border border-slate-200 text-center">
                          <div className="text-2xl font-bold text-slate-800">
                            {Math.round(selectedStats.totalMinutes / 6) / 10}h
                          </div>
                          <div className="text-xs text-slate-500">scheduled</div>
                        </div>
                        <div className="p-4 bg-white/50 rounded-2xl border border-slate-200 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {selectedStats.completed}
                          </div>
                          <div className="text-xs text-slate-500">completed</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[...selectedStats.byCategory.entries()].map(([cat, minutes]) => (
                          <div key={cat} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ background: SKILL_COLORS[cat] }}
                            />
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.round(
                                    (minutes / Math.max(selectedStats.totalMinutes, 1)) * 100,
                                  )}%`,
                                  background: SKILL_COLORS[cat],
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">
                              {cat} · {Math.round(minutes / 60 * 10) / 10}h
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion
            type="single"
            collapsible
            defaultValue="unscheduled"
            className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-3xl"
          >
            <AccordionItem value="unscheduled" className="border-0">
              <AccordionTrigger className="flex items-center gap-2 px-6 py-4 hover:no-underline">
                <Trash2 className="w-5 h-5 text-amber-500" />
                Unscheduled ({unscheduled.length})
              </AccordionTrigger>
              <AccordionContent className="px-6">
                <div className="space-y-3">
                  {unscheduled.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">
                      Nothing waiting to be scheduled.
                    </p>
                  ) : (
                    unscheduled.map((t) => (
                      <div
                        key={t.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openEdit(t)}
                        onKeyDown={(e) => e.key === "Enter" && openEdit(t)}
                        className="p-4 rounded-2xl bg-white/50 border border-slate-200 cursor-pointer hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-slate-900">{t.title}</h4>
                          <div className={`text-sm font-medium ${PRIORITY_TEXT[t.priority]}`}>
                            {t.priority}
                          </div>
                        </div>
                        <Badge className={CATEGORY_BADGES[t.category as Category] ?? ""}>
                          {t.category}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
