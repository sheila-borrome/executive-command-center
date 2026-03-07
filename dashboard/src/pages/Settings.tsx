import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiGet, apiDelete } from "../lib/api";
import type { Entity } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export function Settings() {
  const { user } = useAuth();
  const location = useLocation();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [notifOverdue, setNotifOverdue] = useState(true);
  const [notifFollowUps, setNotifFollowUps] = useState(true);
  const [notifMeetings, setNotifMeetings] = useState(true);

  // Check Google connection status on load (and after OAuth callback)
  useEffect(() => {
    apiGet<{ connected: boolean }>("/auth/google/status")
      .then((r) => setGoogleConnected(r.connected))
      .catch(() => setGoogleConnected(false))
      .finally(() => setGoogleLoading(false));
  }, [location.search]);

  useEffect(() => {
    apiGet<{ entities: Entity[] }>("/entities")
      .then((r) => setEntities(r.entities))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDisconnect = async () => {
    try {
      await apiDelete("/auth/google");
      setGoogleConnected(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h2 className="mb-6 text-lg font-semibold text-white">Settings</h2>

      <section className="mb-8 rounded-xl border border-gray-700 bg-surface-900 p-4">
        <h3 className="mb-3 text-sm font-medium text-white">User profile</h3>
        <p className="text-sm text-gray-400">{user?.email}</p>
      </section>

      <section className="mb-8 rounded-xl border border-gray-700 bg-surface-900 p-4 card-accent-orange">
        <h3 className="mb-1 text-sm font-medium text-orange-400">Google Calendar</h3>
        <p className="mb-3 text-sm text-gray-500">Sync your Google Calendar events into the Calendar tab.</p>

        {/* Show banner if just connected/errored via OAuth redirect */}
        {location.search.includes("calendar=connected") && (
          <div className="mb-3 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400">
            ✓ Google Calendar connected successfully!
          </div>
        )}
        {location.search.includes("calendar=error") && (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            Something went wrong. Try connecting again.
          </div>
        )}

        {googleLoading ? (
          <p className="text-sm text-gray-500">Checking status…</p>
        ) : googleConnected ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Connected
            </span>
            <button
              type="button"
              onClick={handleDisconnect}
              className="rounded border border-red-500/40 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <a
            href={`${API_BASE}/auth/google?userId=${user?.id ?? ""}`}
            className="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: "linear-gradient(90deg,#f97316,#ec4899)" }}
          >
            Connect Google Calendar
          </a>
        )}
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
