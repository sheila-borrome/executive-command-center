import { useEffect, useState, useCallback } from "react";
import { EntityTag } from "../components/EntityTag";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api";
import type { Task, Entity, TeamMember } from "../types";

const PRIORITY_ORDER: Task["priority"][] = ["critical", "high", "normal", "low"];
const STATUS_OPTIONS: Task["status"][] = ["not_started", "in_progress", "done", "cancelled"];

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quickTitle, setQuickTitle] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, eRes, tmRes] = await Promise.all([
        apiGet<{ tasks: Task[] }>("/tasks"),
        apiGet<{ entities: Entity[] }>("/entities"),
        apiGet<{ team_members: TeamMember[] }>("/team-members"),
      ]);
      setTasks(tRes.tasks);
      setEntities(eRes.entities);
      setTeam(tmRes.team_members);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = tasks.filter((t) => {
    if (filterEntity && t.entity_id !== filterEntity) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || saving) return;
    setSaving(true);
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
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleBulk = async (updates: Partial<Task>) => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      const res = await apiPatch<{ tasks: Task[] }>("/tasks/bulk", { ids: Array.from(selected), updates });
      setTasks((prev) => prev.map((t) => (selected.has(t.id) ? res.tasks.find((r) => r.id === t.id) ?? t : t)));
      setSelected(new Set());
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  };

  const detailTask = detailId ? tasks.find((t) => t.id === detailId) : null;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form onSubmit={handleQuickAdd} className="flex flex-1 min-w-[200px] gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Quick-add task…"
            className="flex-1 rounded-lg border border-gray-600 bg-surface-900 px-3 py-2 text-sm text-white placeholder-gray-500"
          />
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
            Add
          </button>
        </form>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="rounded border border-gray-600 bg-surface-900 px-2 py-1.5 text-sm text-white"
        >
          <option value="">All entities</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="rounded border border-gray-600 bg-surface-900 px-2 py-1.5 text-sm text-white"
        >
          <option value="">All priorities</option>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded border border-gray-600 bg-surface-900 px-2 py-1.5 text-sm text-white"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => handleBulk({ status: "done" })}
            className="rounded bg-green-600/20 px-3 py-1.5 text-sm text-green-400 border border-green-500/50"
          >
            Mark done
          </button>
          <button
            type="button"
            onClick={() => handleBulk({ priority: "high" })}
            className="rounded bg-amber-600/20 px-3 py-1.5 text-sm text-amber-400 border border-amber-500/50"
          >
            Set high priority
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="text-sm text-gray-400 hover:underline">
            Clear selection
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="flex gap-6">
          <ul className="flex-1 space-y-1">
            {filtered.map((t) => (
              <li
                key={t.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  detailId === t.id ? "border-blue-500 bg-blue-500/10" : "border-gray-700 bg-surface-900"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(t.id);
                    else next.delete(t.id);
                    setSelected(next);
                  }}
                  className="rounded"
                />
                <button type="button" onClick={() => setDetailId(detailId === t.id ? null : t.id)} className="min-w-0 flex-1 text-left">
                  <span className="font-medium text-white">{t.title}</span>
                  <span className="ml-2 text-xs text-gray-500">{t.priority}</span>
                  {t.entity && <EntityTag name={t.entity.name} slug={t.entity.slug} color={t.entity.color} />}
                  {t.due_date && <span className="ml-2 text-xs text-gray-500">{new Date(t.due_date).toLocaleDateString()}</span>}
                  {t.assignee && <span className="ml-2 text-xs text-gray-400">{(t.assignee as TeamMember).name}</span>}
                </button>
                <span className="text-xs text-gray-500">{t.status}</span>
                <button type="button" onClick={() => handleDelete(t.id)} className="text-red-400 hover:underline text-xs">
                  Delete
                </button>
              </li>
            ))}
          </ul>
          {detailTask && (
            <aside className="w-80 shrink-0 rounded-xl border border-gray-700 bg-surface-900 p-4">
              <h4 className="font-semibold text-white">{detailTask.title}</h4>
              {detailTask.description && <p className="mt-2 text-sm text-gray-400">{detailTask.description}</p>}
              <dl className="mt-3 space-y-1 text-sm">
                <div><dt className="text-gray-500">Status</dt><dd>{detailTask.status}</dd></div>
                <div><dt className="text-gray-500">Priority</dt><dd>{detailTask.priority}</dd></div>
                {detailTask.due_date && <div><dt className="text-gray-500">Due</dt><dd>{new Date(detailTask.due_date).toLocaleDateString()}</dd></div>}
                {detailTask.recurrence && <div><dt className="text-gray-500">Recurrence</dt><dd>{detailTask.recurrence}</dd></div>}
              </dl>
              <button type="button" onClick={() => setDetailId(null)} className="mt-4 text-sm text-gray-400 hover:underline">Close</button>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
