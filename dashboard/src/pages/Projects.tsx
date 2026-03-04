import { useEffect, useState } from "react";
import { EntityTag } from "../components/EntityTag";
import { apiGet, apiPost, apiPatch } from "../lib/api";
import type { Project, Entity, TeamMember } from "../types";

type ViewMode = "list" | "kanban";
const STATUSES: Project["status"][] = ["not_started", "in_progress", "done", "on_hold"];

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", description: "", entity_id: "", status: "not_started" as Project["status"], due_date: "" });

  const load = async () => {
    try {
      setLoading(true);
      const [pRes, eRes] = await Promise.all([
        apiGet<{ projects: Project[] }>("/projects"),
        apiGet<{ entities: Entity[] }>("/entities"),
      ]);
      setProjects(pRes.projects);
      setEntities(eRes.entities);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    apiGet<Project>(`/projects/${detailId}`).then(setDetail).catch(console.error);
  }, [detailId]);

  const filtered = projects.filter((p) => {
    if (filterEntity && p.entity_id !== filterEntity) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  const byStatus = STATUSES.reduce<Record<string, Project[]>>((acc, s) => {
    acc[s] = filtered.filter((p) => p.status === s);
    return acc;
  }, {});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;
    try {
      await apiPost("/projects", {
        title: createForm.title.trim(),
        description: createForm.description.trim() || null,
        entity_id: createForm.entity_id || null,
        status: createForm.status,
        due_date: createForm.due_date || null,
      });
      setCreateForm({ title: "", description: "", entity_id: "", status: "not_started", due_date: "" });
      setShowCreate(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          New project
        </button>
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="rounded border border-gray-600 bg-surface-900 px-2 py-1.5 text-sm text-white"
        >
          <option value="">All entities</option>
          {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded border border-gray-600 bg-surface-900 px-2 py-1.5 text-sm text-white"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        {showCreate && (
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-700 bg-surface-900 p-3">
            <input
              required
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Project title"
              className="rounded border border-gray-600 bg-surface-800 px-2 py-1.5 text-sm text-white"
            />
            <select
              value={createForm.entity_id}
              onChange={(e) => setCreateForm((f) => ({ ...f, entity_id: e.target.value }))}
              className="rounded border border-gray-600 bg-surface-800 px-2 py-1.5 text-sm text-white"
            >
              <option value="">Entity</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <button type="submit" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">Add</button>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded bg-surface-700 px-3 py-1.5 text-sm text-gray-300">Cancel</button>
          </form>
        )}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded px-3 py-1.5 text-sm ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-surface-700 text-gray-400"}`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`rounded px-3 py-1.5 text-sm ${viewMode === "kanban" ? "bg-blue-600 text-white" : "bg-surface-700 text-gray-400"}`}
          >
            Kanban
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : viewMode === "kanban" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATUSES.map((status) => (
            <div key={status} className="rounded-xl border border-gray-700 bg-surface-900 p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">{status.replace("_", " ")}</h3>
              <ul className="space-y-2">
                {byStatus[status]?.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => setDetailId(p.id)}
                    className="cursor-pointer rounded-lg border border-gray-600 bg-surface-800 p-2 hover:border-blue-500/50"
                  >
                    <p className="font-medium text-white">{p.title}</p>
                    {p.entity && <EntityTag name={p.entity.name} slug={p.entity.slug} color={p.entity.color} />}
                    <div className="mt-1 h-1.5 w-full rounded bg-surface-700">
                      <div className="h-full rounded bg-blue-500" style={{ width: `${p.percent_complete}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => (
            <li
              key={p.id}
              onClick={() => setDetailId(p.id)}
              className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-700 bg-surface-900 p-4 hover:border-gray-600"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{p.title}</p>
                {p.entity && <EntityTag name={p.entity.name} slug={p.entity.slug} color={p.entity.color} />}
              </div>
              <span className="text-sm text-gray-500">{p.status}</span>
              <span className="text-sm text-gray-500">{(p.owner as TeamMember)?.name ?? "—"}</span>
              {p.due_date && <span className="text-sm text-gray-500">{new Date(p.due_date).toLocaleDateString()}</span>}
              <div className="w-24">
                <div className="h-2 w-full rounded bg-surface-700">
                  <div className="h-full rounded bg-blue-500" style={{ width: `${p.percent_complete}%` }} />
                </div>
                <span className="text-xs text-gray-500">{p.percent_complete}%</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailId(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border border-gray-700 bg-surface-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-white">{detail.title}</h2>
            {detail.entity && <EntityTag name={detail.entity.name} slug={detail.entity.slug} color={detail.entity.color} />}
            {detail.description && <p className="mt-2 text-gray-400">{detail.description}</p>}
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-gray-500">Status</dt><dd>{detail.status}</dd></div>
              <div><dt className="text-gray-500">Progress</dt><dd>{detail.percent_complete}%</dd></div>
              {detail.due_date && <div><dt className="text-gray-500">Due</dt><dd>{new Date(detail.due_date).toLocaleDateString()}</dd></div>}
            </dl>
            {detail.checklist && detail.checklist.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400">Checklist</h4>
                <ul className="mt-1 space-y-1">
                  {detail.checklist.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={c.completed} readOnly className="rounded" />
                      <span className={c.completed ? "text-gray-500 line-through" : "text-white"}>{c.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detail.activity && detail.activity.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400">Activity</h4>
                <ul className="mt-1 space-y-1 text-xs text-gray-500">
                  {detail.activity.slice(0, 10).map((a) => (
                    <li key={a.id}>{a.action} — {new Date(a.created_at).toLocaleString()}</li>
                  ))}
                </ul>
              </div>
            )}
            <button type="button" onClick={() => setDetailId(null)} className="mt-4 rounded bg-surface-700 px-3 py-1.5 text-sm text-white hover:bg-surface-600">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
