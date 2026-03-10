import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("projects")
      .select("*, entity:entities(id, name, slug, color), owner:team_members(id, name, email)")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    res.json({ projects: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = { ...req.body, created_by: req.user?.id, user_id: req.user?.id };
    const { data, error } = await req.supabase.from("projects").insert(body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { data: project, error: projectError } = await req.supabase
      .from("projects")
      .select("*, entity:entities(id, name, slug, color), owner:team_members(id, name, email)")
      .eq("id", req.params.id)
      .single();
    if (projectError || !project) return res.status(404).json({ error: "Not found" });

    const [checklist, team, files, activity] = await Promise.all([
      req.supabase.from("project_checklist").select("*").eq("project_id", req.params.id).order("order"),
      req.supabase.from("project_team").select("*, team_member:team_members(id, name, email, role)").eq("project_id", req.params.id),
      req.supabase.from("project_files").select("*").eq("project_id", req.params.id),
      req.supabase.from("project_activity").select("*").eq("project_id", req.params.id).order("created_at", { ascending: false }).limit(50),
    ]);

    res.json({
      ...project,
      checklist: checklist.data || [],
      team: team.data || [],
      files: files.data || [],
      activity: activity.data || [],
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("projects")
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
    const { error } = await req.supabase.from("projects").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Nested: checklist
router.get("/:id/checklist", async (req, res) => {
  const { data, error } = await req.supabase.from("project_checklist").select("*").eq("project_id", req.params.id).order("order");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});
router.post("/:id/checklist", async (req, res) => {
  const { data, error } = await req.supabase.from("project_checklist").insert({ project_id: req.params.id, ...req.body }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});
router.patch("/:id/checklist/:cid", async (req, res) => {
  const { data, error } = await req.supabase.from("project_checklist").update(req.body).eq("id", req.params.cid).eq("project_id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
router.delete("/:id/checklist/:cid", async (req, res) => {
  const { error } = await req.supabase.from("project_checklist").delete().eq("id", req.params.cid).eq("project_id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// Nested: files
router.post("/:id/files", async (req, res) => {
  const { data, error } = await req.supabase.from("project_files").insert({ project_id: req.params.id, ...req.body }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});
router.delete("/:id/files/:fid", async (req, res) => {
  const { error } = await req.supabase.from("project_files").delete().eq("id", req.params.fid).eq("project_id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// Nested: activity (append)
router.post("/:id/activity", async (req, res) => {
  const { data, error } = await req.supabase.from("project_activity").insert({ project_id: req.params.id, user_id: req.user?.id, ...req.body }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
