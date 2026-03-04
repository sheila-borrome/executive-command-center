# Ship in 3 steps

Do these in order. Your code is already committed; you just push, then set Vercel, then Supabase/Google.

---

## Step 1: Push to GitHub

**Run this in your terminal** (Cursor’s terminal or Terminal.app):

```bash
cd /Users/sheilaborrome/agentic-command-center
git push -u origin main
```

If it asks for credentials, use your GitHub username and a **Personal Access Token** (not your password).  
Create a token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (repo scope).

---

## Step 2: Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. **Add New Project** → **Import** the repo `sheila-borrome/executive-command-center`.
3. Leave **Root Directory** blank. **Build** and **Output** are already set by `vercel.json`.
4. Before deploying, add **Environment Variables** (click “Environment Variables”):

   Copy these from your **dashboard/.env.local** (same values you use locally):

   | Name | Value | Where to copy from |
   |------|--------|---------------------|
   | `VITE_SUPABASE_URL` | Your Supabase URL | dashboard/.env.local |
   | `VITE_SUPABASE_ANON_KEY` | Your anon key | dashboard/.env.local |
   | `VITE_API_BASE` | `/api` | type exactly: `/api` |

   Copy these from your **api/.env**:

   | Name | Value | Where to copy from |
   |------|--------|---------------------|
   | `SUPABASE_URL` | Same as above | api/.env |
   | `SUPABASE_ANON_KEY` | Same as above | api/.env |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role key | api/.env |

   If you use Google Calendar, also add:

   | Name | Value |
   |------|--------|
   | `GOOGLE_CLIENT_ID` | From api/.env |
   | `GOOGLE_CLIENT_SECRET` | From api/.env |

   Add each variable for **Production** (and optionally Preview/Development if you want).

5. Click **Deploy**. Wait for the build to finish.
6. Note your live URL (e.g. `https://executive-command-center-xxx.vercel.app`).

---

## Step 3: Post-deploy (Supabase + Google)

**Supabase**

1. Supabase Dashboard → **Authentication** → **URL Configuration**.
2. **Site URL**: set to your Vercel URL (e.g. `https://executive-command-center-xxx.vercel.app`).
3. **Redirect URLs**: add the same URL (and `https://your-domain.vercel.app/**` if you want to allow all paths).

**Google (only if you use Calendar)**

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth client.
2. **Authorized redirect URIs** → Add: `https://<your-vercel-domain>/api/auth/google/callback`  
   Example: `https://executive-command-center-xxx.vercel.app/api/auth/google/callback`.

---

## Done

Open your Vercel URL, sign up on the login page, and use the app. If anything fails, check the **Vercel** deployment logs and **Supabase** Auth logs.
