import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { EntityTag } from "../components/EntityTag";
import { apiGet, apiPut, apiPatch } from "../lib/api";
import type { Task, DailyTop3, Entity, TeamMember } from "../types";

interface Briefing {
  tasks_today: Task[];
  meetings_today: { id: string; title: string; scheduled_at: string; entity_id: string }[];
  urgent: Task[];
  top3: string[];
}

export function CommandCenter() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [top3, setTop3] = useState<DailyTop3 | null>(null);
  const [brainDump, setBrainDump] = useState("");
  const [brainDumpSaving, setBrainDumpSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [b, tList, top3Res] = await Promise.all([
        apiGet<Briefing>("/briefing"),
        apiGet<{ tasks: Task[] }>("/tasks"),
        apiGet<DailyTop3 & { task_1?: Task; task_2?: Task; task_3?: Task }>("/daily-top-3"),
      ]);
      setBriefing(b);
      setTasks(tList.tasks);
      setTop3(top3Res);
      const bd = await apiGet<{ content: string }>("/brain-dump");
      setBrainDump(bd.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveTop3 = async (taskId1: string | null, taskId2: string | null, taskId3: string | null) => {
    try {
      await apiPut("/daily-top-3", { task_id_1: taskId1, task_id_2: taskId2, task_id_3: taskId3 });
      setTop3((prev) => (prev ? { ...prev, task_id_1: taskId1, task_id_2: taskId2, task_id_3: taskId3 } : null));
    } catch (e) {
      console.error(e);
    }
  };

  const saveBrainDump = async () => {
    setBrainDumpSaving(true);
    try {
      await apiPut("/brain-dump", { content: brainDump });
    } catch (e) {
      console.error(e);
    } finally {
      setBrainDumpSaving(false);
    }
  };

  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const thisWeekTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return d >= new Date() && d <= endOfWeek;
  });
  const byEntity = thisWeekTasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = t.entity_id || "none";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const delegated = tasks.filter((t) => t.assignee_id && t.status !== "done");
  const delegationByStatus = {
    not_started: delegated.filter((t) => t.status === "not_started"),
    in_progress: delegated.filter((t) => t.status === "in_progress"),
    done: delegated.filter((t) => t.status === "done"),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-400">Loading command center…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>
      </div>
    );
  }

  const top3Ids = top3 ? [top3.task_id_1, top3.task_id_2, top3.task_id_3] : [null, null, null];
  const top3Tasks = top3Ids.map((id) => (id ? tasks.find((t) => t.id === id) : null)).filter(Boolean) as Task[];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Daily Briefing */}
      {briefing && (
        <section className="rounded-xl border border-gray-700 bg-surface-900 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Daily Briefing</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Today&apos;s tasks</p>
              <p className="text-lg font-medium text-white">{briefing.tasks_today.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Meetings today</p>
              <p className="text-lg font-medium text-white">{briefing.meetings_today.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Urgent items</p>
              <p className="text-lg font-medium text-white">{briefing.urgent.length}</p>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Top 3 Must Move Today */}
          <section className="rounded-xl border border-gray-700 bg-surface-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Top 3 Must Move Today</h3>
            <Top3Picker
              current={top3Tasks}
              allTasks={tasks.filter((t) => t.status !== "done" && t.status !== "cancelled")}
              onSave={saveTop3}
              top3Ids={top3Ids}
            />
          </section>

          {/* Urgent / Time Sensitive */}
          <section className="rounded-xl border border-gray-700 bg-surface-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Urgent / Time Sensitive</h3>
            {briefing?.urgent?.length ? (
              <ul className="space-y-2">
                {briefing.urgent.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-800 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <Link to={`/tasks?highlight=${t.id}`} className="truncate font-medium text-white hover:underline">
                        {t.title}
                      </Link>
                      {t.entity && <EntityTag name={t.entity.name} slug={t.entity.slug} color={t.entity.color} />}
                    </div>
                    <span className="text-xs text-gray-500">{t.due_date ? new Date(t.due_date).toLocaleDateString() : ""}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nothing on fire. Good job.</p>
            )}
          </section>

          {/* This Week Snapshot */}
          <section className="rounded-xl border border-gray-700 bg-surface-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">This Week Snapshot</h3>
            {Object.keys(byEntity).length ? (
              <div className="space-y-3">
                {Object.entries(byEntity).map(([eid, list]) => {
                  const entity = list[0]?.entity as Entity | undefined;
                  return (
                    <div key={eid}>
                      {entity && <EntityTag name={entity.name} slug={entity.slug} color={entity.color} />}
                      <ul className="mt-1 space-y-1">
                        {list.map((t) => (
                          <li key={t.id} className="flex justify-between text-sm">
                            <Link to={`/tasks?highlight=${t.id}`} className="text-gray-300 hover:text-white">
                              {t.title}
                            </Link>
                            <span className="text-gray-500">{t.due_date ? new Date(t.due_date).toLocaleDateString() : ""}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No deadlines this week yet.</p>
            )}
          </section>

          {/* Delegation Overview */}
          <section className="rounded-xl border border-gray-700 bg-surface-900 p-4">
            <h3 className="mb-3 text-sm font-semibold text-white">Delegation Overview</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["not_started", "in_progress", "done"] as const).map((status) => (
                <div key={status} className="rounded-lg bg-surface-800 p-2">
                  <p className="mb-2 text-xs font-medium uppercase text-gray-500">
                    {status === "not_started" ? "Not Started" : status === "in_progress" ? "In Progress" : "Done"}
                  </p>
                  <ul className="space-y-1">
                    {delegationByStatus[status].length ? (
                      delegationByStatus[status].map((t) => (
                        <li key={t.id} className="flex flex-wrap items-center gap-1 text-sm">
                          <span className="text-gray-400">{(t.assignee as TeamMember)?.name ?? t.assignee_id}</span>
                          <Link to={`/tasks?highlight=${t.id}`} className="truncate text-white hover:underline">
                            {t.title}
                          </Link>
                          {t.entity && <EntityTag name={t.entity.name} slug={t.entity.slug} color={t.entity.color} />}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-gray-500">—</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Brain Dump */}
          <section className="rounded-xl border border-gray-700 bg-surface-900 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Brain Dump</h3>
              <button
                type="button"
                onClick={saveBrainDump}
                disabled={brainDumpSaving}
                className="text-xs text-blue-400 hover:underline disabled:opacity-50"
              >
                {brainDumpSaving ? "Saving…" : "Save"}
              </button>
            </div>
            <textarea
              value={brainDump}
              onChange={(e) => setBrainDump(e.target.value)}
              onBlur={saveBrainDump}
              placeholder="Offload everything in your head. Save to process later."
              rows={4}
              className="w-full rounded-lg border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </section>
        </div>

        {/* Upcoming events sidebar */}
        <aside className="rounded-xl border border-gray-700 bg-surface-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">Upcoming</h3>
          <Link to="/calendar" className="mb-2 block text-xs text-blue-400 hover:underline">
            View calendar →
          </Link>
          {briefing?.meetings_today?.length ? (
            <ul className="space-y-2">
              {briefing.meetings_today.slice(0, 5).map((m) => (
                <li key={m.id} className="text-sm">
                  <span className="text-gray-400">
                    {new Date(m.scheduled_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </span>
                  <span className="ml-2 text-white">{m.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No upcoming events.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Top3Picker({
  current,
  allTasks,
  onSave,
  top3Ids,
}: {
  current: Task[];
  allTasks: Task[];
  onSave: (t1: string | null, t2: string | null, t3: string | null) => void;
  top3Ids: (string | null)[];
}) {
  const [selected, setSelected] = useState<(string | null)[]>([...top3Ids].slice(0, 3));
  useEffect(() => {
    setSelected([...top3Ids].slice(0, 3));
  }, [top3Ids.join(",")]);

  const handleSelect = (taskId: string, slot: number) => {
    const next = [...selected];
    const existing = next.indexOf(taskId);
    if (existing >= 0) next[existing] = null;
    next[slot] = taskId;
    setSelected(next);
    onSave(next[0] ?? null, next[1] ?? null, next[2] ?? null);
  };

  const taskMap = new Map(allTasks.map((t) => [t.id, t]));

  return (
    <div className="space-y-2">
      {[0, 1, 2].map((slot) => (
        <div key={slot} className="flex items-center gap-2">
          <span className="w-6 text-sm font-medium text-gray-500">{slot + 1}.</span>
          <select
            value={selected[slot] ?? ""}
            onChange={(e) => handleSelect(e.target.value, slot)}
            className="flex-1 rounded border border-gray-600 bg-surface-800 px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select task…</option>
            {allTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} {t.due_date ? `(${new Date(t.due_date).toLocaleDateString()})` : ""}
              </option>
            ))}
          </select>
        </div>
      ))}
      {current.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-gray-400">
          {selected.map((id, i) => id && taskMap.get(id) && <li key={i}>{taskMap.get(id)!.title}</li>)}
        </ul>
      )}
    </div>
  );
}
