import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("brain_dumps")
      .select("content, updated_at")
      .eq("user_id", req.user.id)
      .maybeSingle();
    if (error) throw error;
    res.json({ content: data?.content ?? "", updated_at: data?.updated_at ?? null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const content = req.body.content ?? "";
    const { data, error } = await req.supabase
      .from("brain_dumps")
      .upsert(
        { user_id: req.user.id, content, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
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
