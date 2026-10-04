"use client";

// /Planning — the reference app's Weekly Planning page, decompiled from the
// reference bundle (session 2, P-1…P-7):
//   - header row (title + DECORATIVE Filter button + Add Task);
//   - week card with 7 day columns — chips are display-only, a click
//     anywhere on a card (chips included) selects the day; the highlight
//     follows the selected day (there is no today-highlight);
//   - the selected-day section (task list accordion + Day Statistics
//     accordion) renders ONLY after a day card is clicked — selectedDay
//     starts null, exactly like the reference's useState(null);
//   - Day Statistics is the reference's static placeholder (no data
//     branch exists in the reference bundle);
//   - task items are display-only — task editing happens exclusively from
//     the Dashboard calendar task blocks.

import * as React from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { BarChart3, Calendar, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TaskDialog, emptyTaskForm } from "@/components/planning/TaskDialog";
import { CATEGORY_BADGES, PRIORITY_TEXT, type Category } from "@/lib/domain";
import { useFlowStore } from "@/store/useFlowStore";

export default function PlanningPage() {
  const tasks = useFlowStore((s) => s.tasks);
  const [weekStart, setWeekStart] = React.useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  // Reference: const [selectedDay, setSelectedDay] = useState(null) — the
  // selected-day section is guarded on this being non-null (P-1).
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [initialForm, setInitialForm] = React.useState(emptyTaskForm());

  const days = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const tasksForDay = React.useCallback(
    (day: Date) =>
      tasks.filter((t) => t.start_time && isSameDay(new Date(t.start_time), day)),
    [tasks],
  );

  const openCreate = () => {
    setInitialForm(emptyTaskForm());
    setDialogOpen(true);
  };

  const selectedDayTasks = selectedDay ? tasksForDay(selectedDay) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Weekly Planning</h1>
          <p className="text-slate-600">Organize and review your upcoming week</p>
        </div>
        <div className="flex gap-3">
          {/* Decorative, like the reference's Filter button (no handler). */}
          <Button variant="outline" className="rounded-2xl border-slate-200">
            <Filter className="w-4 h-4" /> Filter
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
            // Reference: the highlight follows the SELECTED day
            // (v = selectedDay && isSameDay(selectedDay, day)) — there is
            // no today highlight (P-2).
            const isSelected = selectedDay && isSameDay(selectedDay, day);
            const dayTasks = tasksForDay(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left ${
                  isSelected
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

      {/* Selected-day section — renders ONLY after a day card is clicked
          (reference: i && <div className="grid grid-cols-1 lg:grid-cols-2
          gap-6">…</div>, P-1). */}
      {selectedDay && (
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
                  {/* The reference's Day Statistics is a static placeholder —
                      its bundle has no data branch (P-7). */}
                  <div className="text-center py-8 text-slate-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Statistics for selected day</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      <TaskDialog
        key="new-task"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={null}
        initial={initialForm}
      />
    </div>
  );
}
