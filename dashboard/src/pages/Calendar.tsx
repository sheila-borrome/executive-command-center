import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import type { CalendarEvent } from "../types";
import type { Entity } from "../types";

export function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [loading, setLoading] = useState(true);

  const start = new Date(cursor);
  const end = new Date(cursor);
  if (view === "month") {
    end.setMonth(end.getMonth() + 1);
  } else if (view === "week") {
    start.setDate(start.getDate() - start.getDay());
    end.setDate(start.getDate() + 7);
  } else {
    end.setDate(end.getDate() + 1);
  }

  useEffect(() => {
    apiGet<{ entities: Entity[] }>("/entities").then((r) => setEntities(r.entities)).catch(console.error);
  }, []);

  useEffect(() => {
    const from = start.toISOString();
    const to = end.toISOString();
    setLoading(true);
    apiGet<{ events: CalendarEvent[] }>(`/calendar/events?from=${from}&to=${to}`)
      .then((r) => setEvents(r.events))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [start.getTime(), end.getTime()]);

  const entityColorMap = new Map(entities.map((e) => [e.id, e.color]));
  const getColor = (entityId: string | null) => (entityId ? entityColorMap.get(entityId) ?? "#6b7280" : "#6b7280");

  const prev = () => {
    const d = new Date(cursor);
    if (view === "month") d.setMonth(d.getMonth() - 1);
    else if (view === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCursor(d);
  };

  const next = () => {
    const d = new Date(cursor);
    if (view === "month") d.setMonth(d.getMonth() + 1);
    else if (view === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCursor(d);
  };

  const today = () => setCursor(new Date());

  const title =
    view === "month"
      ? cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : view === "week"
        ? `Week of ${start.toLocaleDateString()}`
        : cursor.toLocaleDateString();

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button type="button" onClick={prev} className="rounded border border-gray-600 bg-surface-800 px-3 py-1.5 text-sm text-white hover:bg-surface-700">
            Prev
          </button>
          <button type="button" onClick={today} className="rounded border border-gray-600 bg-surface-800 px-3 py-1.5 text-sm text-white hover:bg-surface-700">
            Today
          </button>
          <button type="button" onClick={next} className="rounded border border-gray-600 bg-surface-800 px-3 py-1.5 text-sm text-white hover:bg-surface-700">
            Next
          </button>
          <span className="ml-2 font-medium text-white">{title}</span>
        </div>
        <div className="flex gap-1">
          {(["month", "week", "day"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded px-3 py-1.5 text-sm capitalize ${view === v ? "bg-orange-500 text-white" : "bg-surface-700 text-gray-400"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading events…</p>
      ) : (
        <div className="rounded-xl border border-gray-700 bg-surface-900 p-4">
          <ul className="space-y-2">
            {events.map((ev) => (
              <li
                key={`${ev.id}-${ev.start}`}
                className="flex items-center gap-3 rounded-lg border border-gray-700 bg-surface-800 px-3 py-2"
                style={{ borderLeftColor: getColor(ev.entity_id), borderLeftWidth: 4 }}
              >
                <span className="text-xs text-gray-500">
                  {new Date(ev.start).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span className="font-medium text-white">{ev.title}</span>
                <span className="text-xs text-gray-500">({ev.type})</span>
              </li>
            ))}
          </ul>
          {events.length === 0 && <p className="py-8 text-center text-gray-500">No events in this range.</p>}
        </div>
      )}
    </div>
  );
}
