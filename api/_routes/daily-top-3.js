import { Router } from "express";

const router = Router();

function today() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

router.get("/", async (req, res) => {
  try {
    const date = req.query.date || today();
    const { data, error } = await req.supabase
      .from("daily_top_3")
      .select("date, task_id_1, task_id_2, task_id_3")
      .eq("user_id", req.user.id)
      .eq("date", date)
      .maybeSingle();
    if (error) throw error;
    res.json(data || { date, task_id_1: null, task_id_2: null, task_id_3: null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const date = req.body.date || today();
    const { task_id_1, task_id_2, task_id_3 } = req.body;
    const { data, error } = await req.supabase
      .from("daily_top_3")
      .upsert(
        { date, user_id: req.user.id, task_id_1: task_id_1 || null, task_id_2: task_id_2 || null, task_id_3: task_id_3 || null, updated_at: new Date().toISOString() },
        { onConflict: "date,user_id" }
      )
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
