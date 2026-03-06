import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { data, error } = await req.supabase.from("team_members").select("*").order("name");
    if (error) throw error;
    res.json({ team_members: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Sign in to add team members" });
  try {
    const { data, error } = await req.supabase.from("team_members").insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await req.supabase.from("team_members").select("*").eq("id", req.params.id).single();
    if (error || !data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("team_members")
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
  if (!req.user) return res.status(401).json({ error: "Sign in to delete team members" });
  try {
    const { error } = await req.supabase.from("team_members").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
