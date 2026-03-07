import { Router } from "express";
import { google } from "googleapis";
import { getSupabaseAdmin } from "../supabase.js";

const router = Router();

async function fetchGoogleEvents(userId, from, to) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return [];
  try {
    const supabase = getSupabaseAdmin();
    const { data: settings } = await supabase
      .from("user_settings")
      .select("google_calendar_connected, google_refresh_token")
      .eq("user_id", userId)
      .maybeSingle();

    if (!settings?.google_calendar_connected || !settings?.google_refresh_token) return [];

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: settings.google_refresh_token });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: from,
      timeMax: to,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
    });

    return (response.data.items || [])
      .filter((ev) => ev.status !== "cancelled")
      .map((ev) => ({
        id: `gcal_${ev.id}`,
        type: "google",
        title: ev.summary || "(No title)",
        entity_id: null,
        start: ev.start?.dateTime || `${ev.start?.date}T00:00:00`,
        end: ev.end?.dateTime || `${ev.end?.date}T00:00:00`,
        location: ev.location ?? null,
        description: ev.description ?? null,
      }));
  } catch (err) {
    console.error("Google Calendar fetch error:", err.message);
    return [];
  }
}

router.get("/events", async (req, res) => {
  try {
    const from = req.query.from || new Date().toISOString();
    const to = req.query.to || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const userId = req.user?.id;

    const [meetingsRes, tasksRes, googleEvents] = await Promise.all([
      req.supabase
        .from("meetings")
        .select("id, title, entity_id, scheduled_at, location")
        .gte("scheduled_at", from)
        .lte("scheduled_at", to)
        .order("scheduled_at"),
      req.supabase
        .from("tasks")
        .select("id, title, entity_id, due_date")
        .not("due_date", "is", null)
        .gte("due_date", from.slice(0, 10))
        .lte("due_date", to.slice(0, 10))
        .neq("status", "done"),
      userId ? fetchGoogleEvents(userId, from, to) : Promise.resolve([]),
    ]);

    const events = [
      ...(meetingsRes.data || []).map((m) => ({
        id: m.id,
        type: "meeting",
        title: m.title,
        entity_id: m.entity_id,
        start: m.scheduled_at,
        end: m.scheduled_at,
        location: m.location,
      })),
      ...(tasksRes.data || []).map((t) => ({
        id: t.id,
        type: "task",
        title: `📌 ${t.title}`,
        entity_id: t.entity_id,
        start: `${t.due_date}T00:00:00`,
        end: `${t.due_date}T00:00:00`,
      })),
      ...googleEvents,
    ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    res.json({ events });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/events", async (req, res) => {
  try {
    const { title, entity_id, start, end, location } = req.body;
    const body = { title, entity_id, scheduled_at: start || end, location, created_by: req.user?.id, attendees: [] };
    const { data, error } = await req.supabase.from("meetings").insert(body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
