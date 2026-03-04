import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set; API will use anon key if provided.");
}

export function getSupabase(accessToken) {
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error("SUPABASE_ANON_KEY required for user-scoped client");
  return createClient(process.env.SUPABASE_URL || "", anonKey, {
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
  });
}

export function getSupabaseAdmin() {
  return createClient(supabaseUrl || "", supabaseServiceKey || process.env.SUPABASE_ANON_KEY || "");
}
