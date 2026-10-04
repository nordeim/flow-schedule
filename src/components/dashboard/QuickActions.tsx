"use client";

// FlowSchedule — Quick Actions card.
// Mirrors the reference: a 2×2 grid of gradient tiles; clicking a tile
// swaps the WHOLE card body for an inline panel (gradient header row with
// back arrow + icon + title, then the form/list on a tinted surface).
// The gradients are inline-style linear-gradients with sRGB hex stops —
// the reference's own values (#0ea5e9→#2563eb, #10b981→#14b8a6,
// #8b5cf6→#6366f1, #f59e0b→#f97316) — which also sidesteps Tailwind v4's
// in-oklab gradient interpolation drift (Trap 3 in the validation report).

import * as React from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CirclePlus,
  Play,
  RotateCcw,
  Save,
  Timer,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QUICK_ACTIONS, PRIORITY_TEXT, type QuickActionId } from "@/lib/domain";
import { useFlowStore } from "@/store/useFlowStore";

type ActivePanel = QuickActionId | null;

export function QuickActions() {
  const [active, setActive] = React.useState<ActivePanel>(null);
  const createTask = useFlowStore((s) => s.createTask);
  const refreshTasks = useFlowStore((s) => s.refreshTasks);

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
      {active === null ? (
        <div className="grid grid-cols-2 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => setActive(action.id)}
              className="group relative overflow-hidden rounded-xl p-5 flex flex-col items-center justify-center gap-3 transition-all duration-200 shadow-md hover:shadow-lg h-28 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ background: action.gradient }}
              aria-label={action.label}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <ActionIcon id={action.id} />
              <span className="font-medium text-sm opacity-90">{action.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <QuickActionPanel
          id={active}
          onClose={() => setActive(null)}
          onCreateTask={async (title) => {
            await createTask({ title });
            await refreshTasks();
          }}
        />
      )}
    </div>
  );
}

function ActionIcon({ id }: { id: QuickActionId }) {
  const cls = "text-2xl opacity-90";
  switch (id) {
    case "addTask":
      return <CirclePlus className={cls} />;
    case "focusTimer":
      return <Timer className={cls} />;
    case "logActivity":
      return <BookOpen className={cls} />;
    case "brainstorm":
      return <Zap className={cls} />;
  }
}

function PanelShell({
  id,
  title,
  onClose,
  children,
}: {
  id: QuickActionId;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const action = QUICK_ACTIONS.find((a) => a.id === id)!;
  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-white/20 shadow-xl min-h-[280px]"
      style={{ background: action.gradient }}
    >
      <div className="relative z-20">
        <div className="flex items-center mb-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="mr-2 rounded-full w-8 h-8 hover:bg-black/10 text-white"
            aria-label="Back to Quick Actions"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-semibold flex items-center text-white">
            <ActionIcon id={id} />
            <span className="ml-2 inline-flex items-center">{title}</span>
          </h3>
        </div>
        {children}
      </div>
    </div>
  );
}

function QuickActionPanel({
  id,
  onClose,
  onCreateTask,
}: {
  id: QuickActionId;
  onClose: () => void;
  onCreateTask: (title: string) => Promise<void>;
}) {
  switch (id) {
    case "addTask":
      return <AddTaskPanel onClose={onClose} onCreateTask={onCreateTask} />;
    case "focusTimer":
      return <FocusTimerPanel onClose={onClose} />;
    case "logActivity":
      return <LogActivityPanel onClose={onClose} />;
    case "brainstorm":
      return <BrainstormPanel onClose={onClose} />;
  }
}

function AddTaskPanel({
  onClose,
  onCreateTask,
}: {
  onClose: () => void;
  onCreateTask: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onCreateTask(trimmed);
      setTitle("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the task.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelShell id="addTask" title="Add New Task" onClose={onClose}>
      <form
        onSubmit={submit}
        className="p-4 space-y-3 rounded-2xl bg-sky-50/90"
      >
        <div className="space-y-2">
          <label htmlFor="quick-task-title" className="text-sm font-medium text-slate-700">
            Task Title
          </label>
          <Input
            id="quick-task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task Title..."
            className="rounded-2xl"
            maxLength={300}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={busy || title.trim().length === 0}
            className="rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
          >
            <Save className="w-4 h-4" /> Add
          </Button>
        </div>
      </form>
    </PanelShell>
  );
}

function FocusTimerPanel({ onClose }: { onClose: () => void }) {
  const [minutes, setMinutes] = React.useState(25);
  const [remaining, setRemaining] = React.useState(25 * 60);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const setMinutesAndReset = (m: number) => {
    if (Number.isNaN(m) || m < 1) return;
    const clamped = Math.min(Math.floor(m), 600);
    setMinutes(clamped);
    setRemaining(clamped * 60);
    setRunning(false);
  };

  const reset = () => {
    setRemaining(minutes * 60);
    setRunning(false);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <PanelShell id="focusTimer" title="Start Focus Timer" onClose={onClose}>
      <div className="p-4 space-y-4 rounded-2xl text-center bg-green-50/90">
        <div className="text-5xl font-mono text-slate-700 tabular-nums">
          {mm}:{ss}
        </div>
        <div className="flex items-center justify-center gap-2">
          <Input
            type="number"
            min={1}
            value={minutes}
            onChange={(e) => setMinutesAndReset(Number(e.target.value))}
            placeholder="Minutes"
            aria-label="Timer minutes"
            className="w-24 text-center rounded-lg border-slate-300 bg-white/70"
          />
          <span className="text-slate-600">minutes</span>
        </div>
        <div className="flex justify-center gap-3">
          <Button
            onClick={() => setRunning((r) => !r)}
            disabled={remaining <= 0 && !running}
            className={`rounded-full w-20 h-20 shadow text-white ${
              running ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"
            }`}
            aria-label={running ? "Pause timer" : "Start timer"}
          >
            {running ? <RotateCcw className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </Button>
          <Button
            variant="outline"
            onClick={reset}
            className="rounded-full h-20 px-4 border-green-200 text-green-700 hover:bg-green-50"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose} className="text-slate-600 hover:bg-slate-700/10 text-xs">
            Close Timer
          </Button>
        </div>
      </div>
    </PanelShell>
  );
}

function LogActivityPanel({ onClose }: { onClose: () => void }) {
  const tasks = useFlowStore((s) => s.tasks);
  const updateTask = useFlowStore((s) => s.updateTask);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const now = new Date();
  const recent = tasks
    .filter((t) => t.start_time && new Date(t.start_time) <= now)
    .sort((a, b) => (a.start_time! < b.start_time! ? 1 : -1))
    .slice(0, 20);

  const complete = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await updateTask(id, { status: "completed" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the task.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PanelShell id="logActivity" title="Log Activity" onClose={onClose}>
      <div className="p-4 space-y-3 rounded-2xl bg-purple-50/90 max-h-80 overflow-y-auto custom-scrollbar">
        <h4 className="text-md font-medium text-slate-700 mb-2">Recently Completed / Past</h4>
        {recent.length === 0 && (
          <p className="text-slate-500 text-sm">No recent activity found.</p>
        )}
        {recent.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-slate-700 truncate">{t.title}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {t.category}
                </Badge>
                <span className={PRIORITY_TEXT[t.priority]}>{t.priority}</span>
                {t.status === "completed" && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> done
                  </span>
                )}
              </div>
            </div>
            {t.status !== "completed" && (
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === t.id}
                onClick={() => void complete(t.id)}
                className="rounded-lg border-green-200 text-green-700 hover:bg-green-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Done
              </Button>
            )}
          </div>
        ))}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose} className="text-slate-600 hover:bg-slate-700/10 text-xs">
            Close
          </Button>
        </div>
      </div>
    </PanelShell>
  );
}

function BrainstormPanel({ onClose }: { onClose: () => void }) {
  const notes = useFlowStore((s) => s.notes);
  const createNote = useFlowStore((s) => s.createNote);
  const deleteNote = useFlowStore((s) => s.deleteNote);
  const [editing, setEditing] = React.useState(false);
  const [content, setContent] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const save = async () => {
    const trimmed = content.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await createNote({ content: trimmed });
      setContent("");
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the note.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelShell id="brainstorm" title="Quick Brainstorm" onClose={onClose}>
      <div className="p-4 space-y-3 rounded-2xl bg-yellow-50/90 max-h-80 overflow-y-auto custom-scrollbar">
        {!editing ? (
          <>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-medium text-slate-700">My Notes</h4>
              <Button
                size="sm"
                onClick={() => setEditing(true)}
                className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs"
              >
                <CirclePlus className="w-3.5 h-3.5" /> New Note
              </Button>
            </div>
            {notes.length === 0 && (
              <p className="text-slate-500 text-sm">No notes yet. Create one!</p>
            )}
            {notes.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-white/70 border border-slate-200/60">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.content}</p>
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void deleteNote(n.id)}
                    className="text-red-500 hover:bg-red-50 text-xs"
                    aria-label={`Delete note ${n.id}`}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Your note..."
              className="w-full min-h-[120px] rounded-2xl border border-slate-300 bg-white/70 p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              maxLength={10000}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setEditing(false)}
                className="text-slate-600 hover:bg-slate-700/10"
              >
                ← Back to List
              </Button>
              <Button
                size="sm"
                onClick={() => void save()}
                disabled={busy || content.trim().length === 0}
                className="rounded-lg bg-green-500 hover:bg-green-600 text-white"
              >
                <Save className="w-4 h-4" /> Save Note
              </Button>
            </div>
          </div>
        )}
        <div className="flex justify-end pt-2 border-t border-slate-200/50">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-600 hover:bg-slate-700/10 text-xs"
          >
            Close Notes
          </Button>
        </div>
      </div>
    </PanelShell>
  );
}
