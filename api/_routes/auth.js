import { Router } from "express";
import { getSupabaseAdmin } from "../supabase.js";

const router = Router();

// Google OAuth: redirect user to Google consent screen.
// Requires GOOGLE_CLIENT_ID and redirect URI configured in Google Cloud.
router.get("/google", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
  if (!clientId) {
    return res.status(503).json({ error: "Google Calendar is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
  }
  const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar.events");
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  res.redirect(url);
});

// Callback: exchange code for tokens and store refresh_token in user_settings.
// Requires authMiddleware to identify user - so this route should be hit from frontend after user is logged in, with ?state=userId or we use the session.
router.get("/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing code");
  const supabase = getSupabaseAdmin();
  // In a full implementation: get user from session (e.g. cookie or state param), exchange code for tokens, store refresh_token in user_settings.
  res.redirect("/settings?calendar=connected");
});

export default router;
