import { useEffect, useState } from "react";
import { EntityTag } from "../components/EntityTag";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api";
import type { Outreach as OutreachType, Entity } from "../types";

const STATUS_COLORS: Record<OutreachType["status"], string> = {
  contacted: "bg-gray-500/20 text-gray-300 border-gray-500/50",
  awaiting_response: "bg-amber-500/20 text-amber-300 border-amber-500/50",
  follow_up_due: "bg-orange-500/20 text-orange-300 border-orange-500/50",
  completed: "bg-green-500/20 text-green-300 border-green-500/50",
  stalled: "bg-red-500/20 text-red-300 border-red-500/50",
};

export function Outreach() {
  const [list, setList] = useState<OutreachType[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [quickForm, setQuickForm] = useState({ contact_name: "", organization: "", entity_id: "", method: "email" as const, notes: "" });

  const load = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [oRes, eRes] = await Promise.all([
        apiGet<{ outreach: OutreachType[] }>("/outreach"),
        apiGet<{ entities: Entity[] }>("/entities"),
      ]);
      setList(oRes.outreach);
      setEntities(eRes.entities);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load outreach");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.contact_name.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await apiPost("/outreach", {
        contact_name: quickForm.contact_name.trim(),
        organization: quickForm.organization.trim() || null,
        entity_id: quickForm.entity_id || null,
        method: quickForm.method,
        status: "contacted",
        notes: quickForm.notes.trim() || null,
      });
      setQuickForm({ contact_name: "", organization: "", entity_id: "", method: "email", notes: "" });
      setShowQuickLog(false);
      load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save outreach record");
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...list].sort((a, b) => {
    if (!a.follow_up_date) return 1;
    if (!b.follow_up_date) return -1;
    return new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime();
  });

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex justify-between">
        <h2 className="text-lg font-semibold text-white">Outreach & Follow-Up</h2>
        <button
          type="button"
          onClick={() => setShowQuickLog(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
        >
          Quick-log outreach
        </button>
      </div>

      {showQuickLog && (
        <form onSubmit={handleQuickLog} className="mb-6 rounded-xl border border-gray-700 bg-surface-900 p-4">
          <h3 className="mb-3 text-sm font-medium text-white">New outreach</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              value={quickForm.contact_name}
              onChange={(e) => setQuickForm((f) => ({ ...f, contact_name: e.target.value }))}
              placeholder="Contact name"
              className="rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white"
            />
            <input
              value={quickForm.organization}
              onChange={(e) => setQuickForm((f) => ({ ...f, organization: e.target.value }))}
              placeholder="Organization"
              className="rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white"
            />
            <select
              value={quickForm.entity_id}
              onChange={(e) => setQuickForm((f) => ({ ...f, entity_id: e.target.value }))}
              className="rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white"
            >
              <option value="">Entity</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select
              value={quickForm.method}
              onChange={(e) => setQuickForm((f) => ({ ...f, method: e.target.value as "email" | "call" | "meeting" }))}
              className="rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white"
            >
              <option value="email">Email</option>
              <option value="call">Call</option>
              <option value="meeting">Meeting</option>
            </select>
          </div>
          <textarea
            value={quickForm.notes}
            onChange={(e) => setQuickForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes"
            rows={2}
            className="mt-3 w-full rounded border border-gray-600 bg-surface-800 px-3 py-2 text-sm text-white"
          />
          {saveError && (
            <div className="mt-2 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{saveError}</div>
          )}
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={saving} className="rounded px-3 py-1.5 text-sm text-white disabled:opacity-50" style={{ background: "linear-gradient(90deg,#f97316,#ec4899)" }}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => { setShowQuickLog(false); setSaveError(null); }} className="rounded bg-surface-700 px-3 py-1.5 text-sm text-gray-300">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : loadError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">{loadError}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left text-gray-400">
                <th className="pb-2 pr-4">Contact</th>
                <th className="pb-2 pr-4">Organization</th>
                <th className="pb-2 pr-4">Entity</th>
                <th className="pb-2 pr-4">Method</th>
                <th className="pb-2 pr-4">Last contact</th>
                <th className="pb-2 pr-4">Follow-up</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Notes</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((o) => (
                <tr key={o.id} className="border-b border-gray-800">
                  <td className="py-2 pr-4 font-medium text-white">{o.contact_name}</td>
                  <td className="py-2 pr-4 text-gray-400">{o.organization ?? "—"}</td>
                  <td className="py-2 pr-4">{o.entity ? <EntityTag name={o.entity.name} slug={o.entity.slug} color={o.entity.color} /> : "—"}</td>
                  <td className="py-2 pr-4 text-gray-400">{o.method}</td>
                  <td className="py-2 pr-4 text-gray-400">{o.last_contact_at ? new Date(o.last_contact_at).toLocaleDateString() : "—"}</td>
                  <td className="py-2 pr-4 text-gray-400">{o.follow_up_date ? new Date(o.follow_up_date).toLocaleDateString() : "—"}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded border px-2 py-0.5 text-xs ${STATUS_COLORS[o.status]}`}>{o.status.replace("_", " ")}</span>
                  </td>
                  <td className="max-w-[200px] truncate py-2 pr-4 text-gray-500">{o.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
