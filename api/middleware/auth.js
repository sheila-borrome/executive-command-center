import { getSupabaseAdmin } from "../supabase.js";

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid authorization" });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    req.supabase = getSupabase(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Authentication failed" });
  }
}
