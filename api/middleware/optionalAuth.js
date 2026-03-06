import { getSupabaseAdmin, getSupabase } from "../supabase.js";

/**
 * Like authMiddleware but does not 401 when no token.
 * Sets req.user = null and req.supabase = admin client so GET requests can still return data.
 * Use for routes that should allow read-only access without login (e.g. tasks/entities list on live site).
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    req.user = null;
    req.supabase = getSupabaseAdmin();
    return next();
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      req.user = null;
      req.supabase = getSupabaseAdmin();
      return next();
    }
    req.user = user;
    req.supabase = getSupabase(token);
    next();
  } catch (err) {
    req.user = null;
    req.supabase = getSupabaseAdmin();
    next();
  }
}
