import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("tasks")
      .select("*, entity:entities(id, name, slug, color), assignee:team_members(id, name, email)")
      .order("due_date", { nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ tasks: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Sign in to create tasks" });
  try {
    const body = { ...req.body, created_by: req.user?.id };
    const { data, error } = await req.supabase.from("tasks").insert(body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("tasks")
      .select("*, entity:entities(id, name, slug, color), assignee:team_members(id, name, email)")
      .eq("id", req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/:id", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Sign in to update tasks" });
  try {
    const { data, error } = await req.supabase
      .from("tasks")
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

router.patch("/bulk", async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !updates) {
      return res.status(400).json({ error: "ids array and updates object required" });
    }
    const { data, error } = await req.supabase
      .from("tasks")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in("id", ids)
      .select();
    if (error) throw error;
    res.json({ updated: data?.length ?? 0, tasks: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Sign in to delete tasks" });
  try {
    const { error } = await req.supabase.from("tasks").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
