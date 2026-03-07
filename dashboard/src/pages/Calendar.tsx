import { useEffect, useState, useMemo } from "react";
import { apiGet } from "../lib/api";
import type { CalendarEvent, Entity } from "../types";

type CalView = "month" | "week" | "day";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Bold header gradient per month — inspired by reference image
const MONTH_GRADIENTS = [
  "linear-gradient(135deg,#ec4899,#f43f5e)",   // Jan  – hot pink
  "linear-gradient(135deg,#065f46,#10b981)",   // Feb  – dark green
  "linear-gradient(135deg,#1e293b,#475569)",   // Mar  – slate
  "linear-gradient(135deg,#7c3aed,#a78bfa)",   // Apr  – purple
  "linear-gradient(135deg,#0369a1,#38bdf8)",   // May  – blue
  "linear-gradient(135deg,#ca8a04,#facc15)",   // Jun  – yellow
  "linear-gradient(135deg,#111111,#374151)",   // Jul  – black
  "linear-gradient(135deg,#ea580c,#f97316)",   // Aug  – orange
  "linear-gradient(135deg,#0891b2,#67e8f9)",   // Sep  – cyan
  "linear-gradient(135deg,#dc2626,#f87171)",   // Oct  – red
  "linear-gradient(135deg,#78350f,#b45309)",   // Nov  – brown
  "linear-gradient(135deg,#0d9488,#2dd4bf)",   // Dec  – teal
];

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startPad = firstDay.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function eventsOnDay(events: CalendarEvent[], day: Date) {
  return events.filter((ev) => {
    const s = new Date(ev.start);
    return isSameDay(s, day);
  });
}

export function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [view, setView] = useState<CalView>("month");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [loading, setLoading] = useState(true);

  const today = new Date();

  const { start, end } = useMemo(() => {
    const s = new Date(cursor);
    const e = new Date(cursor);
    if (view === "month") {
      s.setDate(1);
      e.setMonth(e.getMonth() + 1);
      e.setDate(0);
    } else if (view === "week") {
      s.setDate(s.getDate() - s.getDay());
      e.setDate(s.getDate() + 6);
    } else {
      e.setDate(e.getDate() + 1);
    }
    return { start: s, end: e };
  }, [cursor, view]);

  useEffect(() => {
    apiGet<{ entities: Entity[] }>("/entities").then((r) => setEntities(r.entities)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    apiGet<{ events: CalendarEvent[] }>(`/calendar/events?from=${start.toISOString()}&to=${end.toISOString()}`)
      .then((r) => setEvents(r.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [start.getTime(), end.getTime()]);

  const entityColorMap = new Map(entities.map((e) => [e.id, e.color]));
  const getColor = (entityId: string | null) => entityId ? (entityColorMap.get(entityId) ?? "#f97316") : "#f97316";

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

  const goToday = () => {
    const d = new Date();
    d.setDate(view === "month" ? 1 : d.getDate());
    d.setHours(0, 0, 0, 0);
    setCursor(d);
  };

  const monthGrad = MONTH_GRADIENTS[cursor.getMonth()];
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" }).toUpperCase();
  const weekDays = getWeekDays(cursor);
  const monthGrid = getMonthGrid(cursor.getFullYear(), cursor.getMonth());

  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prev} className="rounded-lg border border-gray-600 bg-surface-800 px-3 py-1.5 text-sm text-white hover:border-orange-500/50 hover:text-orange-400">‹</button>
          <button onClick={goToday} className="rounded-lg border border-gray-600 bg-surface-800 px-3 py-1.5 text-sm text-white hover:border-orange-500/50 hover:text-orange-400">Today</button>
          <button onClick={next} className="rounded-lg border border-gray-600 bg-surface-800 px-3 py-1.5 text-sm text-white hover:border-orange-500/50 hover:text-orange-400">›</button>
        </div>
        <div className="flex gap-1 rounded-lg border border-gray-700 bg-surface-900 p-1">
          {(["month", "week", "day"] as CalView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded px-3 py-1.5 text-sm capitalize font-medium transition-colors ${view === v ? "text-white" : "text-gray-400 hover:text-orange-300"}`}
              style={view === v ? { background: "linear-gradient(90deg,#f97316,#ec4899)" } : {}}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── MONTH VIEW ── */}
      {view === "month" && (
        <div className="flex flex-1 flex-col rounded-2xl overflow-hidden border border-gray-700">
          {/* Colorful month header */}
          <div className="flex items-center justify-center py-6" style={{ background: monthGrad }}>
            <h2 className="text-3xl font-black tracking-widest text-white drop-shadow-lg">{monthLabel}</h2>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-700 bg-surface-900">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-auto bg-surface-800">
            <div className="grid grid-cols-7 h-full" style={{ gridAutoRows: "minmax(80px, 1fr)" }}>
              {monthGrid.map((day, i) => {
                const isToday = day ? isSameDay(day, today) : false;
                const dayEvents = day ? eventsOnDay(events, day) : [];
                return (
                  <div
                    key={i}
                    className={`border-b border-r border-gray-700/50 p-1 min-h-[80px] ${!day ? "bg-surface-900/50" : ""} ${isToday ? "ring-2 ring-inset ring-orange-500/60" : ""}`}
                  >
                    {day && (
                      <>
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            isToday
                              ? "text-white"
                              : "text-gray-400"
                          }`}
                          style={isToday ? { background: "linear-gradient(135deg,#f97316,#ec4899)" } : {}}
                        >
                          {day.getDate()}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <div
                              key={ev.id}
                              className="truncate rounded px-1 py-0.5 text-[10px] font-medium text-white"
                              style={{ backgroundColor: `${getColor(ev.entity_id)}30`, borderLeft: `2px solid ${getColor(ev.entity_id)}` }}
                              title={ev.title}
                            >
                              {ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-gray-500 pl-1">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><p className="text-gray-400">Loading events…</p></div>}
        </div>
      )}

      {/* ── WEEK VIEW ── */}
      {view === "week" && (
        <div className="flex flex-1 flex-col rounded-2xl overflow-hidden border border-gray-700">
          {/* Colorful week header */}
          <div className="grid grid-cols-7 border-b border-gray-700" style={{ background: monthGrad }}>
            {weekDays.map((d) => {
              const isToday = isSameDay(d, today);
              return (
                <div key={d.toISOString()} className={`py-3 text-center ${isToday ? "bg-black/20" : ""}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{DAYS[d.getDay()]}</p>
                  <p className={`mt-0.5 text-xl font-black text-white ${isToday ? "underline decoration-yellow-400 decoration-2" : ""}`}>{d.getDate()}</p>
                </div>
              );
            })}
          </div>

          {/* Events per day */}
          <div className="grid flex-1 grid-cols-7 overflow-auto bg-surface-800 divide-x divide-gray-700/50">
            {weekDays.map((d) => {
              const dayEvents = eventsOnDay(events, d);
              const isToday = isSameDay(d, today);
              return (
                <div key={d.toISOString()} className={`p-2 space-y-1.5 min-h-[200px] ${isToday ? "bg-orange-500/5" : ""}`}>
                  {dayEvents.length === 0 && (
                    <p className="mt-4 text-center text-xs text-gray-600">—</p>
                  )}
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg px-2 py-1.5 text-xs font-medium text-white"
                      style={{ backgroundColor: `${getColor(ev.entity_id)}25`, borderLeft: `3px solid ${getColor(ev.entity_id)}` }}
                    >
                      <p className="font-semibold truncate">{ev.title}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">
                        {new Date(ev.start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DAY VIEW ── */}
      {view === "day" && (
        <div className="flex flex-1 flex-col rounded-2xl overflow-hidden border border-gray-700">
          {/* Colorful day header */}
          <div className="py-6 text-center" style={{ background: monthGrad }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{DAYS[cursor.getDay()]}</p>
            <p className="text-5xl font-black text-white leading-none mt-1">{cursor.getDate()}</p>
            <p className="text-sm text-white/60 mt-1">{cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
          </div>

          {/* Events */}
          <div className="flex-1 overflow-auto bg-surface-800 p-4">
            {loading ? (
              <p className="text-center text-gray-400">Loading…</p>
            ) : eventsOnDay(events, cursor).length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-gray-500">Nothing scheduled today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventsOnDay(events, cursor)
                  .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                  .map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start gap-4 rounded-xl p-4"
                      style={{ backgroundColor: `${getColor(ev.entity_id)}15`, borderLeft: `4px solid ${getColor(ev.entity_id)}` }}
                    >
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold" style={{ color: getColor(ev.entity_id) }}>
                          {new Date(ev.start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </p>
                        {ev.end && (
                          <p className="text-xs text-gray-500">
                            → {new Date(ev.end).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{ev.title}</p>
                        {ev.location && <p className="mt-1 text-xs text-gray-400">📍 {ev.location}</p>}
                        <p className="mt-1 text-xs text-gray-500 capitalize">{ev.type}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
