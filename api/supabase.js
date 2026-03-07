import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set; API will use anon key if provided.");
}

// The API validates the user JWT in middleware before any route runs.
// All DB operations use the service role key to bypass RLS — security is
// enforced at the API layer (routes check req.user for writes).
export function getSupabase(_accessToken) {
  const key = supabaseServiceKey || process.env.SUPABASE_ANON_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY required");
  return createClient(supabaseUrl || "", key, {
    auth: { persistSession: false },
  });
}

export function getSupabaseAdmin() {
  return createClient(supabaseUrl || "", supabaseServiceKey || process.env.SUPABASE_ANON_KEY || "", {
    auth: { persistSession: false },
  });
}
