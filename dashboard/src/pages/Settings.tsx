import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiGet } from "../lib/api";
import type { Entity } from "../types";

export function Settings() {
  const { user } = useAuth();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [notifOverdue, setNotifOverdue] = useState(true);
  const [notifFollowUps, setNotifFollowUps] = useState(true);
  const [notifMeetings, setNotifMeetings] = useState(true);

  useEffect(() => {
    apiGet<{ entities: Entity[] }>("/entities")
      .then((r) => setEntities(r.entities))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h2 className="mb-6 text-lg font-semibold text-white">Settings</h2>

      <section className="mb-8 rounded-xl border border-gray-700 bg-surface-900 p-4">
        <h3 className="mb-3 text-sm font-medium text-white">User profile</h3>
        <p className="text-sm text-gray-400">{user?.email}</p>
      </section>

      <section className="mb-8 rounded-xl border border-gray-700 bg-surface-900 p-4">
        <h3 className="mb-3 text-sm font-medium text-white">Google Calendar</h3>
        <p className="mb-2 text-sm text-gray-500">Connect your Google account to sync calendar events.</p>
        <a
          href={`${import.meta.env.VITE_API_BASE || "/api"}/auth/google`}
          className="inline-block rounded bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-500"
          title="Redirects to Google to connect Calendar. Configure GOOGLE_CLIENT_ID and redirect URI in API."
        >
          {googleConnected ? "Disconnect" : "Connect Google Calendar"}
        </a>
        <p className="mt-2 text-xs text-gray-500">Add GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI in API env to enable.</p>
      </section>

      <section className="mb-8 rounded-xl border border-gray-700 bg-surface-900 p-4">
        <h3 className="mb-3 text-sm font-medium text-white">Entities</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <ul className="space-y-2">
            {entities.map((e) => (
              <li key={e.id} className="flex items-center gap-3 text-sm">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                <span className="text-white">{e.name}</span>
                <span className="text-gray-500">{e.slug}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-gray-700 bg-surface-900 p-4">
        <h3 className="mb-3 text-sm font-medium text-white">Notification preferences</h3>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={notifOverdue} onChange={(e) => setNotifOverdue(e.target.checked)} className="rounded" />
          Overdue tasks
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={notifFollowUps} onChange={(e) => setNotifFollowUps(e.target.checked)} className="rounded" />
          Follow-ups due today
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={notifMeetings} onChange={(e) => setNotifMeetings(e.target.checked)} className="rounded" />
          Meetings in next 24 hours
        </label>
      </section>
    </div>
  );
}
