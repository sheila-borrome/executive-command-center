import { Router } from "express";

const router = Router();

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function todayEnd() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
function in24h() {
  const d = new Date();
  d.setHours(d.getHours() + 24, 0, 0, 0);
  return d.toISOString();
}

router.get("/", async (req, res) => {
  try {
    const uid = req.user?.id;
    const [tasksToday, meetingsToday, urgentTasks, top3] = await Promise.all([
      req.supabase
        .from("tasks")
        .select("id, title, due_date, priority, entity_id, status, entity:entities(id, name, slug, color)")
        .lte("due_date", todayEnd().slice(0, 10))
        .gte("due_date", todayStart().slice(0, 10))
        .neq("status", "done")
        .neq("status", "cancelled")
        .order("priority")
        .limit(20),
      req.supabase
        .from("meetings")
        .select("id, title, scheduled_at, entity_id")
        .gte("scheduled_at", todayStart())
        .lte("scheduled_at", todayEnd())
        .order("scheduled_at"),
      req.supabase
        .from("tasks")
        .select("id, title, due_date, priority, entity_id, entity:entities(id, name, slug, color)")
        .lte("due_date", in24h().slice(0, 10))
        .neq("status", "done")
        .neq("status", "cancelled")
        .order("due_date")
        .limit(10),
      req.supabase.from("daily_top_3").select("task_id_1, task_id_2, task_id_3").eq("user_id", uid).eq("date", todayStart().slice(0, 10)).maybeSingle(),
    ]);

    res.json({
      tasks_today: tasksToday.data || [],
      meetings_today: meetingsToday.data || [],
      urgent: urgentTasks.data || [],
      top3: top3.data ? [top3.data.task_id_1, top3.data.task_id_2, top3.data.task_id_3].filter(Boolean) : [],
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
