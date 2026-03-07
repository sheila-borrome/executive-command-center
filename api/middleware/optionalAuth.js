import { getSupabaseAdmin, getSupabase } from "../supabase.js";

export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    req.user = null;
    req.supabase = getSupabase(null);
    return next();
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) {
      req.user = null;
      req.supabase = getSupabase(null);
    } else {
      req.user = user;
      req.supabase = getSupabase(token);
    }
  } catch {
    req.user = null;
    req.supabase = getSupabase(null);
  }

  next();
}
