import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { from, to } = req.query;
    let q = req.supabase
      .from("meetings")
      .select("*, entity:entities(id, name, slug, color)")
      .order("scheduled_at", { ascending: true });
    if (from) q = q.gte("scheduled_at", from);
    if (to) q = q.lte("scheduled_at", to);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ meetings: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = { ...req.body, created_by: req.user?.id };
    const { data, error } = await req.supabase.from("meetings").insert(body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("meetings")
      .select("*, entity:entities(id, name, slug, color)")
      .eq("id", req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: "Not found" });
    const { data: actionItems } = await req.supabase.from("meeting_action_items").select("*, task:tasks(id, title, status, due_date)").eq("meeting_id", req.params.id);
    res.json({ ...data, action_items: actionItems || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("meetings")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { error } = await req.supabase.from("meetings").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
