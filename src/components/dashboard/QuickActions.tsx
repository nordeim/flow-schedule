"use client";

// FlowSchedule — Quick Actions card, decompiled from the reference bundle
// (session 3, G1e + panels z1e/W1e/H1e/K1e):
//   - the card container morphs: tiles view = translucent white
//     (rgba(255,255,255,0.6)), open panel = the action's gradient (motion
//     layout, transition .4 circOut) with an AnimatePresence expanding
//     overlay animating from the clicked tile's rect;
//   - the "Quick Actions" heading exists ONLY in the tiles view — opening a
//     panel replaces it with the panel header (ghost icon back button +
//     action icon + label);
//   - tiles: h-24 rounded-2xl p-3 shadow-lg, grid gap-3, icon w-5 h-5 mb-1.5,
//     label text-[11px], framer whileHover scale 1.07 / whileTap .93;
//   - Add Task (z1e): placeholder-only input (no label), slate-700 submit;
//   - Focus Timer (W1e): minutes input hidden while running, Play/Pause
//     toggle, "Focus session complete!" alert at 0;
//   - Log Activity (H1e): read-only top-5 completed/past history with
//     relative end times;
//   - Brainstorm (K1e): create/edit/confirm-delete notes with truncated
//     30-char previews.
// The gradient stops are inline-style sRGB hex values — the reference's own
// form, which also sidesteps Tailwind v4's in-oklab gradient interpolation
// drift (Trap 3 in the validation report).

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNowStrict } from "date-fns";
import {
  ArrowLeft,
  BookOpen,
  CirclePlus,
  Eye,
  Pause,
  Play,
  RotateCcw,
  Save,
  Timer,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QUICK_ACTIONS, type QuickActionId } from "@/lib/domain";
import { useFlowStore, type Note } from "@/store/useFlowStore";

// The reference's idle card background (z$ in its bundle).
const CARD_BG_IDLE = "rgba(255, 255, 255, 0.6)";

// The reference's panel entrance/exit (initial/animate/exit y-offsets,
// .3s circOut with a .2s delay).
const panelMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: "circOut" as const, delay: 0.2 },
};

type TileOrigin = { top: number; left: number; width: number; height: number };

type PanelProps = {
  onCancel: () => void;
  formColor: string;
};

function ActionIcon({ id, className }: { id: QuickActionId; className?: string }) {
  switch (id) {
    case "addTask":
      return <CirclePlus className={className} />;
    case "focusTimer":
      return <Timer className={className} />;
    case "logActivity":
      return <BookOpen className={className} />;
    case "brainstorm":
      return <Zap className={className} />;
  }
}

export function QuickActions() {
  const [activeId, setActiveId] = React.useState<QuickActionId | null>(null);
  const [activeGradient, setActiveGradient] = React.useState<string | null>(null);
  const [background, setBackground] = React.useState<string>(CARD_BG_IDLE);
  const [origin, setOrigin] = React.useState<TileOrigin | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Reference G1e: opening a tile records its rect (relative to the card),
  // flips the card background to the action's gradient, and swaps the view.
  const openPanel = (id: QuickActionId, e: React.MouseEvent<HTMLButtonElement>) => {
    const action = QUICK_ACTIONS.find((a) => a.id === id)!;
    const card = containerRef.current?.getBoundingClientRect();
    const tile = e.currentTarget.getBoundingClientRect();
    if (card) {
      setOrigin({
        top: tile.top - card.top,
        left: tile.left - card.left,
        width: tile.width,
        height: tile.height,
      });
    }
    setActiveGradient(action.gradient);
    setBackground(action.gradient);
    setActiveId(id);
  };

  const closePanel = () => {
    setActiveId(null);
    setBackground(CARD_BG_IDLE);
  };

  const active = activeId ? QUICK_ACTIONS.find((a) => a.id === activeId) ?? null : null;

  return (
    <motion.div
      ref={containerRef}
      layout
      className="relative backdrop-blur-xl rounded-3xl p-4 shadow-xl border border-white/20 overflow-hidden min-h-[280px]"
      style={{ background }}
      transition={{ duration: 0.4, ease: "circOut" as const }}
    >
      {/* Expanding overlay: grows from the clicked tile's rect to the full
          card while the gradient takes over (the reference's
          "expanding-overlay" AnimatePresence child). */}
      <AnimatePresence>
        {activeId && origin && activeGradient && (
          <motion.div
            key="expanding-overlay"
            className="absolute z-10 rounded-3xl"
            initial={{
              top: origin.top,
              left: origin.left,
              width: origin.width,
              height: origin.height,
              opacity: 0.6,
            }}
            animate={{ top: 0, left: 0, width: "100%", height: "100%", opacity: 1 }}
            exit={{
              top: origin.top,
              left: origin.left,
              width: origin.width,
              height: origin.height,
              opacity: 0,
              transition: { duration: 0.3, ease: "circIn" as const },
            }}
            transition={{ duration: 0.35, ease: "circOut" as const }}
            style={{ background: activeGradient }}
          />
        )}
      </AnimatePresence>
      <div className="relative z-20">
        <AnimatePresence mode="wait">
          {activeId && active ? (
            <motion.div
              key="form-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: activeId ? 0.15 : 0 }}
              className="relative"
            >
              <div className="flex items-center mb-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closePanel}
                  aria-label="Back to Quick Actions"
                  className="mr-2 rounded-full w-8 h-8 hover:bg-black/10 text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h3 className="text-lg font-semibold flex items-center text-white">
                  <ActionIcon id={activeId} className="w-5 h-5 mr-2" />
                  {active.label}
                </h3>
              </div>
              {activeId === "addTask" && (
                <AddTaskPanel onCancel={closePanel} formColor={active.formColor} />
              )}
              {activeId === "focusTimer" && (
                <FocusTimerPanel onCancel={closePanel} formColor={active.formColor} />
              )}
              {activeId === "logActivity" && (
                <LogActivityPanel onCancel={closePanel} formColor={active.formColor} />
              )}
              {activeId === "brainstorm" && (
                <BrainstormPanel onCancel={closePanel} formColor={active.formColor} />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="buttons-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.2 } }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action) => (
                  <motion.button
                    key={action.id}
                    onClick={(e) => openPanel(action.id, e)}
                    whileHover={{ scale: 1.07, boxShadow: "0px 10px 20px rgba(0,0,0,0.15)" }}
                    whileTap={{ scale: 0.93 }}
                    className="flex flex-col items-center justify-center h-24 rounded-2xl p-3 text-white shadow-lg"
                    style={{ background: action.gradient }}
                    aria-label={action.label}
                  >
                    <ActionIcon id={action.id} className="w-5 h-5 mb-1.5" />
                    <span className="text-[11px] font-medium text-center leading-tight">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ---- Add Task (reference z1e) ------------------------------------------------

function AddTaskPanel({ onCancel, formColor }: PanelProps) {
  const createTask = useFlowStore((s) => s.createTask);
  const refreshTasks = useFlowStore((s) => s.refreshTasks);
  const [title, setTitle] = React.useState("");

  // Reference z1e: submit posts the quick-add defaults explicitly, then the
  // panel closes (no error UI — failures log server-side/console).
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createTask({
        title: title.trim(),
        category: "work",
        priority: "medium",
        status: "todo",
      });
      await refreshTasks();
      onCancel();
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  return (
    <motion.form
      onSubmit={submit}
      className={`p-4 space-y-3 rounded-2xl ${formColor}`}
      {...panelMotion}
    >
      <Input
        placeholder="Task Title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-lg border-slate-300 bg-white/70 placeholder:text-slate-500 text-slate-800"
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="rounded-lg text-slate-600 hover:bg-slate-700/10"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="bg-slate-700 hover:bg-slate-800 text-white rounded-lg"
        >
          <Save className="w-4 h-4 mr-1.5" /> Add
        </Button>
      </div>
    </motion.form>
  );
}

// ---- Focus Timer (reference W1e) ---------------------------------------------

function FocusTimerPanel({ onCancel, formColor }: PanelProps) {
  const [minutes, setMinutes] = React.useState(25);
  const [remaining, setRemaining] = React.useState(25 * 60);
  const [running, setRunning] = React.useState(false);

  // Reference W1e semantics, translated without effect-body setState
  // (react-hooks/set-state-in-effect):
  //   - idle display = minutes*60 (derived); starting resets to full;
  //     pausing shows the full duration again (the reference's idle effect
  //     snaps remaining back to minutes*60);
  //   - running display = the countdown; reaching 0 stops + alerts.
  const display = running ? remaining : minutes * 60;

  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          window.alert("Focus session complete!");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const toggle = () => {
    if (!running && minutes <= 0) {
      window.alert("Please set a valid duration.");
      return;
    }
    if (!running) setRemaining(minutes * 60);
    setRunning(!running);
  };

  const reset = () => {
    setRunning(false);
    setRemaining(minutes * 60);
  };

  // Reference W1e: parseInt; only a positive integer changes the value and
  // only an emptied field sets 0.
  const onMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setMinutes(parsed);
      setRemaining(parsed * 60);
    } else if (e.target.value === "") {
      setMinutes(0);
      setRemaining(0);
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <motion.div className={`p-4 space-y-4 rounded-2xl text-center ${formColor}`} {...panelMotion}>
      <div className="text-5xl font-mono text-slate-700 tabular-nums">{fmt(display)}</div>
      {!running && (
        <div className="flex items-center justify-center gap-2">
          <Input
            type="number"
            value={minutes === 0 && remaining === 0 ? "" : minutes}
            onChange={onMinutesChange}
            placeholder="Minutes"
            aria-label="Timer minutes"
            className="w-24 text-center rounded-lg border-slate-300 bg-white/70"
            min={1}
            disabled={running}
          />
          <span className="text-slate-600">minutes</span>
        </div>
      )}
      <div className="flex justify-center gap-3">
        <Button
          onClick={toggle}
          size="lg"
          disabled={minutes <= 0 && !running}
          aria-label={running ? "Pause timer" : "Start timer"}
          className={`rounded-full w-20 h-20 ${
            running ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"
          } text-white`}
        >
          {running ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
        </Button>
        <Button
          onClick={reset}
          variant="outline"
          size="lg"
          aria-label="Reset timer"
          className="rounded-full w-20 h-20 border-slate-300 hover:bg-slate-200/50 text-slate-600"
        >
          <RotateCcw className="w-7 h-7" />
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="rounded-lg text-slate-600 hover:bg-slate-700/10 mt-2"
      >
        Close Timer
      </Button>
    </motion.div>
  );
}

// ---- Log Activity (reference H1e) --------------------------------------------

function LogActivityPanel({ onCancel, formColor }: PanelProps) {
  const tasks = useFlowStore((s) => s.tasks);
  const refreshTasks = useFlowStore((s) => s.refreshTasks);
  // Starts in the loading state — the store refresh IS the reference's
  // on-open fetch (the panel opens with "Loading history..." until it lands).
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void refreshTasks()
      .catch((err) => console.error("Error fetching past tasks:", err))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTasks]);

  // Reference H1e: end_time-descending, completed OR ended-in-the-past,
  // top 5 — a read-only history (no action buttons).
  const now = React.useMemo(() => new Date(), []);
  const history = React.useMemo(
    () =>
      tasks
        .filter((t) => t.status === "completed" || (t.end_time && new Date(t.end_time) < now))
        .sort((a, b) => (b.end_time ?? "").localeCompare(a.end_time ?? ""))
        .slice(0, 5),
    [tasks, now],
  );

  return (
    <motion.div
      className={`p-4 space-y-3 rounded-2xl ${formColor} max-h-80 overflow-y-auto custom-scrollbar`}
      {...panelMotion}
    >
      <h4 className="text-md font-medium text-slate-700 mb-2">Recently Completed / Past</h4>
      {!ready && <p className="text-slate-500 text-sm">Loading history...</p>}
      {ready && history.length === 0 && (
        <p className="text-slate-500 text-sm">No recent activity found.</p>
      )}
      {ready &&
        history.map((t) => (
          <div
            key={t.id}
            className="p-2.5 bg-white/70 rounded-lg shadow-sm border border-slate-200/70"
          >
            <p className="text-sm font-medium text-slate-800">{t.title}</p>
            <p className="text-xs text-slate-500">
              {t.status === "completed" ? "Completed" : "Ended"}{" "}
              {t.end_time ? formatDistanceToNowStrict(new Date(t.end_time), { addSuffix: true }) : "N/A"}
            </p>
          </div>
        ))}
      <div className="flex justify-end mt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="rounded-lg text-slate-600 hover:bg-slate-700/10"
        >
          Close
        </Button>
      </div>
    </motion.div>
  );
}

// ---- Brainstorm (reference K1e) ----------------------------------------------

function BrainstormPanel({ onCancel, formColor }: PanelProps) {
  const notes = useFlowStore((s) => s.notes);
  const refreshNotes = useFlowStore((s) => s.refreshNotes);
  const createNote = useFlowStore((s) => s.createNote);
  const updateNote = useFlowStore((s) => s.updateNote);
  const deleteNote = useFlowStore((s) => s.deleteNote);
  // Reference K1e views: "list" | "create" | "viewNote" (+ the note being
  // edited for viewNote).
  const [view, setView] = React.useState<"list" | "create" | "viewNote">("list");
  const [content, setContent] = React.useState("");
  const [editing, setEditing] = React.useState<Note | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void refreshNotes()
      .catch((err) => console.error("Error fetching notes:", err))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshNotes]);

  const openCreate = () => {
    setContent("");
    setEditing(null);
    setView("create");
  };

  const openNote = (n: Note) => {
    setEditing(n);
    setContent(n.content);
    setView("viewNote");
  };

  const save = async () => {
    if (!content.trim()) return;
    try {
      if (editing && editing.id) {
        await updateNote(editing.id, { content });
      } else {
        await createNote({ content });
      }
      await refreshNotes();
      setView("list");
    } catch (err) {
      console.error("Error saving note:", err);
    }
  };

  const remove = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteNote(id);
        await refreshNotes();
        if (editing && editing.id === id) setView("list");
      } catch (err) {
        console.error("Error deleting note:", err);
      }
    }
  };

  return (
    <motion.div
      className={`p-4 space-y-3 rounded-2xl ${formColor} max-h-80 overflow-y-auto custom-scrollbar`}
      {...panelMotion}
    >
      {view === "list" && (
        <>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-medium text-slate-700">My Notes</h4>
            <Button
              size="sm"
              onClick={openCreate}
              className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs"
            >
              <CirclePlus className="w-3.5 h-3.5 mr-1" /> New Note
            </Button>
          </div>
          {!ready && <p className="text-slate-500 text-sm">Loading notes...</p>}
          {ready && notes.length === 0 && (
            <p className="text-slate-500 text-sm">No notes yet. Create one!</p>
          )}
          {ready &&
            notes.map((n) => (
              <div
                key={n.id}
                className="p-2.5 bg-white/70 rounded-lg shadow-sm border border-slate-200/70 flex justify-between items-center"
              >
                <p
                  className="text-sm text-slate-800 truncate cursor-pointer hover:underline"
                  onClick={() => openNote(n)}
                >
                  {n.content.substring(0, 30)}
                  {n.content.length > 30 ? "..." : ""}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openNote(n)}
                    aria-label="View note"
                    className="w-7 h-7 rounded-md text-slate-500 hover:bg-slate-200/50"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void remove(n.id)}
                    aria-label="Delete note"
                    className="w-7 h-7 rounded-md text-red-500 hover:bg-red-100/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
        </>
      )}
      {(view === "create" || (view === "viewNote" && editing)) && (
        <>
          <Textarea
            placeholder="Your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="rounded-lg border-slate-300 min-h-[120px] bg-white/80 text-slate-800"
          />
          <div className="flex justify-between items-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("list")}
              className="rounded-lg text-slate-600 hover:bg-slate-700/10"
            >
              ← Back to List
            </Button>
            <Button
              size="sm"
              onClick={() => void save()}
              className="rounded-lg bg-green-500 hover:bg-green-600 text-white"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {editing ? "Update" : "Save"} Note
            </Button>
          </div>
        </>
      )}
      <div className="flex justify-end mt-3 pt-2 border-t border-slate-200/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="rounded-lg text-slate-600 hover:bg-slate-700/10"
        >
          Close Notes
        </Button>
      </div>
    </motion.div>
  );
}
