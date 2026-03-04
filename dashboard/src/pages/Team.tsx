import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "../lib/api";
import type { TeamMember, Task, Project } from "../types";

export function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "", notes: "" });

  const load = async () => {
    try {
      setLoading(true);
      const [mRes, tRes, pRes] = await Promise.all([
        apiGet<{ team_members: TeamMember[] }>("/team-members"),
        apiGet<{ tasks: Task[] }>("/tasks"),
        apiGet<{ projects: Project[] }>("/projects"),
      ]);
      setMembers(mRes.team_members);
      setTasks(tRes.tasks);
      setProjects(pRes.projects);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const tasksByAssignee = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const id = t.assignee_id || "unassigned";
    if (!acc[id]) acc[id] = [];
    acc[id].push(t);
    return acc;
  }, {});

  const projectsByOwner = projects.reduce<Record<string, Project[]>>((acc, p) => {
    const id = p.owner_id || "unassigned";
    if (!acc[id]) acc[id] = [];
    acc[id].push(p);
    return acc;
  }, {});

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await apiPost("/team-members", form);
      setForm({ name: "", email: "", role: "", notes: "" });
      setShowAdd(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const selected = selectedId ? members.find((m) => m.id === selectedId) : null;
  const selectedTasks = selected ? tasksByAssignee[selected.id] ?? [] : [];
  const selectedProjects = selected ? projectsByOwner[selected.id] ?? [] : [];
  const workload = selected ? selectedTasks.length + selectedProjects.length * 2 : 0;
  const workloadLabel = workload > 10 ? "High" : workload > 4 ? "Medium" : "Low";

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex justify-between">
        <h2 className="text-lg font-semibold text-white">Team & Delegation Hub</h2>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Add member
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-6 rounded-xl border border-gray-700 bg-surface-900 p-4">
          <h3 className="mb-3 text-sm font-medium text-white">New team member</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Name"
              className="rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white"
            />
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              type="email"
              className="rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white"
            />
            <input
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="Role"
              className="rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white"
            />
          </div>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes"
            className="mt-3 w-full rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white"
          />
          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">Save</button>
            <button type="button" onClick={() => setShowAdd(false)} className="rounded bg-surface-700 px-3 py-1.5 text-sm text-gray-300">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="flex gap-6">
          <ul className="w-64 shrink-0 space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`cursor-pointer rounded-lg border p-3 ${selectedId === m.id ? "border-blue-500 bg-blue-500/10" : "border-gray-700 bg-surface-900 hover:border-gray-600"}`}
              >
                <p className="font-medium text-white">{m.name}</p>
                {m.email && <p className="text-xs text-gray-500">{m.email}</p>}
                {m.role && <p className="text-xs text-gray-400">{m.role}</p>}
                <p className="mt-1 text-xs text-gray-500">
                  {(tasksByAssignee[m.id]?.length ?? 0)} tasks, {(projectsByOwner[m.id]?.length ?? 0)} projects
                </p>
              </li>
            ))}
          </ul>
          {selected && (
            <div className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-surface-900 p-4">
              <h3 className="text-lg font-semibold text-white">{selected.name}</h3>
              <p className="text-sm text-gray-500">Workload: {workloadLabel}</p>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400">Tasks</h4>
                <ul className="mt-1 space-y-1">
                  {selectedTasks.map((t) => (
                    <li key={t.id} className="text-sm text-white">{t.title}</li>
                  ))}
                  {selectedTasks.length === 0 && <li className="text-sm text-gray-500">No tasks</li>}
                </ul>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400">Projects</h4>
                <ul className="mt-1 space-y-1">
                  {selectedProjects.map((p) => (
                    <li key={p.id} className="text-sm text-white">{p.title}</li>
                  ))}
                  {selectedProjects.length === 0 && <li className="text-sm text-gray-500">No projects</li>}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
