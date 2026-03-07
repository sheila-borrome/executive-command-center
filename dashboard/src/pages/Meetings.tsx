import { useEffect, useState } from "react";
import { EntityTag } from "../components/EntityTag";
import { apiGet, apiPost } from "../lib/api";
import type { Meeting, Entity } from "../types";

export function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [prepMode, setPrepMode] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Meeting | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", entity_id: "", scheduled_at: "", attendees: "", agenda: "", notes: "" });

  const load = async () => {
    try {
      setLoading(true);
      const [mRes, eRes] = await Promise.all([
        apiGet<{ meetings: Meeting[] }>("/meetings"),
        apiGet<{ entities: Entity[] }>("/entities"),
      ]);
      setMeetings(mRes.meetings);
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
    apiGet<Meeting & { action_items?: unknown[] }>(`/meetings/${detailId}`).then(setDetail).catch(console.error);
  }, [detailId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.scheduled_at) return;
    try {
      await apiPost("/meetings", {
        title: createForm.title.trim(),
        entity_id: createForm.entity_id || null,
        scheduled_at: new Date(createForm.scheduled_at).toISOString(),
        attendees: createForm.attendees ? createForm.attendees.split(",").map((s) => s.trim()).filter(Boolean) : [],
        agenda: createForm.agenda ? createForm.agenda.split("\n").map((line) => ({ title: line.trim(), completed: false })).filter((a) => a.title) : [],
        notes: createForm.notes.trim() || null,
      });
      setCreateForm({ title: "", entity_id: "", scheduled_at: "", attendees: "", agenda: "", notes: "" });
      setShowCreate(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const now = new Date().toISOString();
  const upcoming = meetings.filter((m) => m.scheduled_at >= now);
  const past = meetings.filter((m) => m.scheduled_at < now);
  const displayList = prepMode ? upcoming : [...upcoming, ...past];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-white">Meetings & Agendas</h2>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
          >
            New meeting
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input type="checkbox" checked={prepMode} onChange={(e) => setPrepMode(e.target.checked)} className="rounded" />
            Prep mode (upcoming only)
          </label>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-gray-700 bg-surface-900 p-4">
          <h3 className="mb-3 text-sm font-medium text-white">Create meeting</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title"
              className="rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white sm:col-span-2"
            />
            <select
              value={createForm.entity_id}
              onChange={(e) => setCreateForm((f) => ({ ...f, entity_id: e.target.value }))}
              className="rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white"
            >
              <option value="">Entity</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <input
              required
              type="datetime-local"
              value={createForm.scheduled_at}
              onChange={(e) => setCreateForm((f) => ({ ...f, scheduled_at: e.target.value }))}
              className="rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white"
            />
            <input
              value={createForm.attendees}
              onChange={(e) => setCreateForm((f) => ({ ...f, attendees: e.target.value }))}
              placeholder="Attendees (comma-separated)"
              className="rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white sm:col-span-2"
            />
            <textarea
              value={createForm.agenda}
              onChange={(e) => setCreateForm((f) => ({ ...f, agenda: e.target.value }))}
              placeholder="Agenda (one item per line)"
              rows={3}
              className="rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white sm:col-span-2"
            />
            <textarea
              value={createForm.notes}
              onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Notes"
              rows={2}
              className="rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white sm:col-span-2"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded bg-orange-500 px-3 py-1.5 text-sm text-white">Create</button>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded bg-surface-700 px-3 py-1.5 text-sm text-gray-300">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <ul className="space-y-2">
          {displayList.map((m) => (
            <li
              key={m.id}
              onClick={() => setDetailId(m.id)}
              className="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-700 bg-surface-900 p-4 hover:border-gray-600"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{m.title}</p>
                {m.entity && <EntityTag name={m.entity.name} slug={m.entity.slug} color={m.entity.color} />}
              </div>
              <span className="text-sm text-gray-500">{new Date(m.scheduled_at).toLocaleString()}</span>
              {m.attendees?.length ? <span className="text-xs text-gray-500">{m.attendees.length} attendees</span> : null}
            </li>
          ))}
        </ul>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailId(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border border-gray-700 bg-surface-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-white">{detail.title}</h2>
            {detail.entity && <EntityTag name={detail.entity.name} slug={detail.entity.slug} color={detail.entity.color} />}
            <p className="mt-2 text-sm text-gray-400">{new Date(detail.scheduled_at).toLocaleString()}</p>
            {detail.attendees?.length ? <p className="mt-1 text-sm text-gray-500">Attendees: {detail.attendees.join(", ")}</p> : null}
            {Array.isArray(detail.agenda) && detail.agenda.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400">Agenda</h4>
                <ul className="mt-1 space-y-1">
                  {detail.agenda.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={a.completed} readOnly className="rounded" />
                      <span className={a.completed ? "text-gray-500 line-through" : "text-white"}>{a.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detail.notes && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400">Notes</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-300">{detail.notes}</p>
              </div>
            )}
            <button type="button" onClick={() => setDetailId(null)} className="mt-4 rounded bg-surface-700 px-3 py-1.5 text-sm text-white">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
