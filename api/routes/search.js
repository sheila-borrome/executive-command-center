import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").trim().toLowerCase();
    if (!q) return res.json({ tasks: [], projects: [], meetings: [], outreach: [] });

    const [tasksRes, projectsRes, meetingsRes, outreachRes] = await Promise.all([
      req.supabase.from("tasks").select("id, title, entity_id").ilike("title", `%${q}%`).limit(10),
      req.supabase.from("projects").select("id, title, entity_id").ilike("title", `%${q}%`).limit(10),
      req.supabase.from("meetings").select("id, title, entity_id, scheduled_at").ilike("title", `%${q}%`).limit(10),
      req.supabase.from("outreach").select("id, contact_name, organization, entity_id").or(`contact_name.ilike.%${q}%,organization.ilike.%${q}%`).limit(10).catch(() => ({ data: [] })),
    ]);

    res.json({
      tasks: tasksRes.data || [],
      projects: projectsRes.data || [],
      meetings: meetingsRes.data || [],
      outreach: outreachRes.data || [],
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
