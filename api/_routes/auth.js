import { Router } from "express";
import { google } from "googleapis";
import { getSupabaseAdmin } from "../supabase.js";

const router = Router();

function getOAuthClient(redirectUri) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

function getRedirectUri(req) {
  return process.env.GOOGLE_REDIRECT_URI ||
    `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
}

// Initiate Google OAuth — caller must pass ?userId=<uuid>
router.get("/google", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: "Google Calendar not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
  }
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId query param required" });

  const oauth2Client = getOAuthClient(getRedirectUri(req));
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar.events.readonly"],
    state: userId,
  });
  res.redirect(authUrl);
});

// Callback — Google redirects here after user consents
router.get("/google/callback", async (req, res) => {
  const { code, state: userId, error: oauthError } = req.query;

  if (oauthError) {
    console.error("Google OAuth error:", oauthError);
    return res.redirect("/?calendar=error");
  }
  if (!code || !userId) {
    return res.redirect("/?calendar=error&reason=missing_params");
  }

  try {
    const oauth2Client = getOAuthClient(getRedirectUri(req));
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      // refresh_token only comes on first consent — user may need to revoke and reconnect
      console.warn("No refresh_token received. User may need to revoke access and reconnect.");
    }

    const supabase = getSupabaseAdmin();
    const upsertData = {
      user_id: userId,
      google_calendar_connected: true,
      updated_at: new Date().toISOString(),
    };
    if (tokens.refresh_token) upsertData.google_refresh_token = tokens.refresh_token;

    const { error: dbError } = await supabase
      .from("user_settings")
      .upsert(upsertData, { onConflict: "user_id" });

    if (dbError) throw dbError;
    res.redirect("/settings?calendar=connected");
  } catch (err) {
    console.error("Google callback error:", err.message);
    res.redirect("/settings?calendar=error");
  }
});

// GET /auth/google/status — returns connection state for current user
router.get("/google/status", async (req, res) => {
  try {
    if (!req.user) return res.json({ connected: false });
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("user_settings")
      .select("google_calendar_connected")
      .eq("user_id", req.user.id)
      .maybeSingle();
    res.json({ connected: data?.google_calendar_connected ?? false });
  } catch {
    res.json({ connected: false });
  }
});

// DELETE /auth/google — disconnect Google Calendar
router.delete("/google", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const supabase = getSupabaseAdmin();
    await supabase
      .from("user_settings")
      .upsert(
        { user_id: req.user.id, google_calendar_connected: false, google_refresh_token: null, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
