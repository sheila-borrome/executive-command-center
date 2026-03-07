import { useEffect, useState, useCallback } from "react";
import { EntityTag } from "../components/EntityTag";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api";
import type { Task, Entity, TeamMember } from "../types";

const PRIORITY_ORDER: Task["priority"][] = ["critical", "high", "normal", "low"];
const STATUS_OPTIONS: Task["status"][] = ["not_started", "in_progress", "done", "cancelled"];

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  critical: "text-red-400 border-red-500/50 bg-red-500/10",
  high: "text-orange-400 border-orange-500/50 bg-orange-500/10",
  normal: "text-gray-400 border-gray-500/50 bg-gray-500/10",
  low: "text-gray-500 border-gray-600/50 bg-gray-600/10",
};

type AppTab = "active" | "completed";

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appTab, setAppTab] = useState<AppTab>("active");
  const [filterEntity, setFilterEntity] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [quickTitle, setQuickTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<Task["status"]>("not_started");
  const [editPriority, setEditPriority] = useState<Task["priority"]>("normal");
  const [editDueDate, setEditDueDate] = useState("");
  const [editEntityId, setEditEntityId] = useState<string>("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tRes, eRes] = await Promise.all([
        apiGet<{ tasks: Task[] }>("/tasks"),
        apiGet<{ entities: Entity[] }>("/entities"),
      ]);
      setTasks(tRes.tasks);
      setEntities(eRes.entities);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const detailTask = detailId ? tasks.find((t) => t.id === detailId) : null;
  useEffect(() => {
    if (detailTask) {
      setEditTitle(detailTask.title);
      setEditDescription(detailTask.description ?? "");
      setEditStatus(detailTask.status);
      setEditPriority(detailTask.priority);
      setEditDueDate(detailTask.due_date ? detailTask.due_date.slice(0, 10) : "");
      setEditEntityId(detailTask.entity_id ?? "");
    }
  }, [detailTask?.id]);

  const activeTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const completedTasks = tasks.filter((t) => t.status === "done");

  const filtered = activeTasks.filter((t) => {
    if (filterEntity && t.entity_id !== filterEntity) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  // Group completed tasks by day (most recent first)
  const completedByDay = completedTasks.reduce<Record<string, Task[]>>((acc, t) => {
    const day = (t.updated_at ?? t.created_at).slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(t);
    return acc;
  }, {});
  const completedDays = Object.keys(completedByDay).sort((a, b) => b.localeCompare(a));

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const created = await apiPost<Task>("/tasks", {
        title,
        status: "not_started",
        priority: "normal",
        entity_id: filterEntity || null,
      });
      setTasks((prev) => [created, ...prev]);
      setQuickTitle("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to add task");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDone = async (task: Task) => {
    const newStatus = task.status === "done" ? "not_started" : "done";
    setSaving(true);
    try {
      const updated = await apiPatch<Task>(`/tasks/${task.id}`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      if (newStatus === "done" && appTab === "active") {
        // briefly show it moving away
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (detailId === id) setDetailId(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await apiPatch<Task>(`/tasks/${id}`, updates);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDetail = () => {
    if (!detailTask || saving) return;
    handleUpdateTask(detailTask.id, {
      title: editTitle.trim() || detailTask.title,
      description: editDescription.trim() || null,
      status: editStatus,
      priority: editPriority,
      due_date: editDueDate || null,
      entity_id: editEntityId || null,
    });
  };

  return (
    <div className="p-4 md:p-6">
      {/* Tab switcher */}
      <div className="mb-4 flex items-center gap-2 border-b border-gray-700 pb-3">
        <button
          type="button"
          onClick={() => setAppTab("active")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${appTab === "active" ? "bg-orange-500/15 text-orange-400 border border-orange-500/50" : "text-gray-400 hover:text-orange-300"}`}
        >
          Active
          <span className="ml-2 rounded-full bg-surface-700 px-1.5 py-0.5 text-xs text-gray-400">{activeTasks.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setAppTab("completed")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${appTab === "completed" ? "bg-green-500/15 text-green-400 border border-green-500/50" : "text-gray-400 hover:text-green-300"}`}
        >
          Completed
          <span className="ml-2 rounded-full bg-surface-700 px-1.5 py-0.5 text-xs text-gray-400">{completedTasks.length}</span>
        </button>
      </div>

      {appTab === "active" && (
        <>
          {/* Quick-add */}
          <form onSubmit={handleQuickAdd} className="mb-4 flex gap-2">
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Quick-add task…"
              className="flex-1 rounded-lg border border-gray-600 bg-surface-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, #f97316, #ec4899)" }}
            >
              Add
            </button>
          </form>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="rounded border border-gray-600 bg-surface-900 px-2 py-1.5 text-sm text-white">
              <option value="">All entities</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="rounded border border-gray-600 bg-surface-900 px-2 py-1.5 text-sm text-white">
              <option value="">All priorities</option>
              {PRIORITY_ORDER.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {saveError && <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{saveError}</div>}

          {loading ? (
            <p className="text-gray-400">Loading…</p>
          ) : error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>
          ) : (
            <div className="flex gap-6">
              <ul className="flex-1 space-y-1.5">
                {filtered.length === 0 && <li className="py-8 text-center text-gray-500">No active tasks. Add one above.</li>}
                {filtered.map((t) => (
                  <li
                    key={t.id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                      detailId === t.id ? "border-orange-500/60 bg-orange-500/8" : "border-gray-700 bg-surface-900 hover:border-gray-600"
                    }`}
                  >
                    {/* Complete checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleDone(t)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-gray-500 hover:border-green-400 transition-colors"
                      title="Mark complete"
                    />
                    <button
                      type="button"
                      onClick={() => setDetailId(detailId === t.id ? null : t.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="font-medium text-white">{t.title}</span>
                      <span className={`ml-2 rounded border px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[t.priority] ?? "text-gray-400"}`}>{t.priority}</span>
                      {t.entity && <EntityTag name={t.entity.name} slug={t.entity.slug} color={t.entity.color} />}
                      {t.due_date && <span className="ml-2 text-xs text-gray-500">{new Date(t.due_date).toLocaleDateString()}</span>}
                      {t.assignee && <span className="ml-2 text-xs text-gray-400">{(t.assignee as TeamMember).name}</span>}
                    </button>
                    <span className="text-xs text-gray-600">{t.status.replace("_", " ")}</span>
                    <button type="button" onClick={() => handleDelete(t.id)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">✕</button>
                  </li>
                ))}
              </ul>

              {/* Detail panel */}
              {detailTask && (
                <aside className="w-96 shrink-0 rounded-xl border border-gray-700 bg-surface-900 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-orange-400">Edit Task</h3>
                    <button type="button" onClick={() => setDetailId(null)} className="text-gray-500 hover:text-gray-300">✕</button>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Title</label>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-lg border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description</label>
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} placeholder="Notes…" className="w-full rounded-lg border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Status</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as Task["status"])} className="w-full rounded border border-gray-600 bg-surface-800 px-2 py-1.5 text-sm text-white">
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Priority</label>
                      <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as Task["priority"])} className="w-full rounded border border-gray-600 bg-surface-800 px-2 py-1.5 text-sm text-white">
                        {PRIORITY_ORDER.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Due date</label>
                    <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="w-full rounded border border-gray-600 bg-surface-800 px-2 py-1.5 text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Entity</label>
                    <select value={editEntityId} onChange={(e) => setEditEntityId(e.target.value)} className="w-full rounded border border-gray-600 bg-surface-800 px-2 py-1.5 text-sm text-white">
                      <option value="">None</option>
                      {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  {saveError && <p className="text-xs text-red-400">{saveError}</p>}
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={handleSaveDetail} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50" style={{ background: "linear-gradient(90deg,#f97316,#ec4899)" }}>
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button type="button" onClick={() => setDetailId(null)} className="text-sm text-gray-400 hover:underline">Close</button>
                  </div>
                </aside>
              )}
            </div>
          )}
        </>
      )}

      {appTab === "completed" && (
        <div>
          <p className="mb-4 text-sm text-gray-500">Tasks you've completed, grouped by day. Click the checkmark to move a task back to Active.</p>
          {completedDays.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-gray-400">No completed tasks yet.</p>
              <p className="text-sm text-gray-600">Check off tasks in the Active tab to see them here.</p>
            </div>
          )}
          <div className="space-y-6">
            {completedDays.map((day) => (
              <div key={day}>
                <div className="mb-2 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-700" />
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "linear-gradient(90deg,#f97316,#ec4899)", color: "white" }}>
                    {new Date(day + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <div className="h-px flex-1 bg-gray-700" />
                </div>
                <ul className="space-y-1.5">
                  {completedByDay[day].map((t) => (
                    <li key={t.id} className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2.5">
                      {/* Uncheck = move back to active */}
                      <button
                        type="button"
                        onClick={() => handleToggleDone(t)}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:border-red-400 hover:text-red-400 transition-colors text-[10px]"
                        title="Move back to active"
                      >
                        ✓
                      </button>
                      <span className="flex-1 text-sm text-gray-500 line-through">{t.title}</span>
                      {t.entity && <EntityTag name={t.entity.name} slug={t.entity.slug} color={t.entity.color} />}
                      <button type="button" onClick={() => handleDelete(t.id)} className="text-xs text-red-400/40 hover:text-red-400 transition-colors">✕</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
