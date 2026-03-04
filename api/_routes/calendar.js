import { Router } from "express";

const router = Router();

// Returns merged events: meetings + tasks with due_date in range. Google events added when OAuth is wired.
router.get("/events", async (req, res) => {
  try {
    const from = req.query.from || new Date().toISOString();
    const to = req.query.to || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const [meetingsRes, tasksRes] = await Promise.all([
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
        .lte("due_date", to.slice(0, 10)),
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
        title: t.title,
        entity_id: t.entity_id,
        start: t.due_date,
        end: t.due_date,
      })),
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
