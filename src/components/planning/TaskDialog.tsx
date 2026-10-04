"use client";

// FlowSchedule — Add/Edit Task dialog (Planning page).
// Mirrors the reference's shadcn Dialog: sm:max-w-lg glassy panel with
// title/description, priority + category selects (native Radix), datetime
// start, 15-minute-step duration. Submit creates or updates via the store.

import * as React from "react";
import { format } from "date-fns";
import { Save, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, PRIORITIES, type Category, type Priority } from "@/lib/domain";
import { useFlowStore, type Task } from "@/store/useFlowStore";

export type TaskFormState = {
  title: string;
  description: string;
  priority: Priority;
  category: Category;
  start_time: string; // datetime-local value
  duration_minutes: string;
};

export function emptyTaskForm(): TaskFormState {
  return {
    title: "",
    description: "",
    priority: "medium",
    category: "work",
    start_time: "",
    duration_minutes: "",
  };
}

export function taskToForm(task: Task): TaskFormState {
  return {
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    category: task.category,
    start_time: task.start_time
      ? format(new Date(task.start_time), "yyyy-MM-dd'T'HH:mm")
      : "",
    duration_minutes: task.duration_minutes ? String(task.duration_minutes) : "",
  };
}

export function TaskDialog({
  open,
  onOpenChange,
  editing,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Task | null;
  initial: TaskFormState;
}) {
  // Radix mounts DialogContent's children ONLY while open, so the form
  // body below re-mounts per open-session and useState(initial) seeds the
  // fresh values — no reset-effect (react-hooks/set-state-in-effect
  // compliant) and no stale form state across opens.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {editing ? "Edit Task" : "Add New Task"}
          </DialogTitle>
        </DialogHeader>
        <TaskFormBody editing={editing} initial={initial} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function TaskFormBody({
  editing,
  initial,
  onOpenChange,
}: {
  editing: Task | null;
  initial: TaskFormState;
  onOpenChange: (open: boolean) => void;
}) {
  const [form, setForm] = React.useState<TaskFormState>(initial);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const createTask = useFlowStore((s) => s.createTask);
  const updateTask = useFlowStore((s) => s.updateTask);
  const deleteTask = useFlowStore((s) => s.deleteTask);

  const set = <K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const title = form.title.trim();
    if (!title) {
      setError("Task title is required.");
      return;
    }
    setBusy(true);
    setError(null);
    const startIso = form.start_time ? new Date(form.start_time).toISOString() : null;
    const duration = form.duration_minutes ? parseInt(form.duration_minutes, 10) : null;
    // Session 12 (W-3): the reference's dialog submits end_time
    // CLIENT-COMPUTED — its decompiled f function recomputes
    // end = start + duration*60000 on every start/duration change and the
    // save posts the full form state. Mirrored verbatim.
    const endIso =
      startIso && duration && !Number.isNaN(duration)
        ? new Date(new Date(startIso).getTime() + duration * 60_000).toISOString()
        : null;
    const payload = {
      title,
      // Session 12 (W-4): the reference submits the form value VERBATIM —
      // an empty description is "" on the wire (captured live), not null.
      description: form.description,
      priority: form.priority,
      category: form.category,
      start_time: startIso,
      end_time: endIso,
      duration_minutes: Number.isNaN(duration) ? null : duration,
    };
    try {
      if (editing) {
        await updateTask(editing.id, payload);
      } else {
        await createTask(payload);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the task.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editing || busy) return;
    // The reference's Xne delete guard (session 4, T-1): a native confirm
    // before the DELETE — dismiss aborts, accept deletes.
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteTask(editing.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the task.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Enter task title..."
              className="rounded-2xl border-slate-200"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Add details..."
              className="rounded-2xl border-slate-200 min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => set("priority", v as Priority)}
              >
                <SelectTrigger className="rounded-2xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set("category", v as Category)}
              >
                <SelectTrigger className="rounded-2xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
                className="rounded-2xl border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={15}
                step={15}
                value={form.duration_minutes}
                onChange={(e) => set("duration_minutes", e.target.value)}
                className="rounded-2xl border-slate-200"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {/* The reference's footer (decompiled Xne, session 6): the right
              group is `flex gap-3 ml-auto`; Delete is an icon+mr-2 outline
              button; the submit is a Save icon + "Create Task"/"Update Task"
              with NO text-white (the default variant's
              text-primary-foreground styles it). */}
          <div className="flex justify-between pt-4">
            {editing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void remove()}
                disabled={busy}
                className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-3 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-2xl border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {editing ? "Update Task" : "Create Task"}
              </Button>
            </div>
          </div>
    </form>
  );
}
