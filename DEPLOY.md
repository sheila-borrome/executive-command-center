# Executive Command Center — Deployment

## Prerequisites

- Node.js 18+
- A Supabase account
- A Google Cloud account (for Calendar)
- A Vercel account

---

## 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migrations in order:
   - `supabase/migrations/001_initial.sql`
   - `supabase/migrations/002_seed_entities.sql`
3. In **Project Settings → API**, copy:
   - **Project URL**
   - **anon public** key (for the frontend and for API user-scoped RLS)
   - **service_role** key (for the API auth middleware only; keep secret)
4. Enable **Email** auth in **Authentication → Providers** if you want email sign-in.

---

## 2. Google Calendar (optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project or select one.
3. Enable **Google Calendar API** (APIs & Services → Library → search “Calendar API”).
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
5. Application type: **Web application**.
6. Add **Authorized redirect URIs**:
   - Local: `http://localhost:5174/api/auth/google/callback` (or your frontend port if different)
   - Production: `https://<your-vercel-domain>/api/auth/google/callback`
7. Copy **Client ID** and **Client Secret**.

---

## 3. API (Node.js + Express)

1. From the repo root:
   ```bash
   cd api
   npm install
   ```
2. Create `api/.env`:
   ```env
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   PORT=4000
   ```
   For Google Calendar later:
   ```env
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx
   ```
3. Run locally:
   ```bash
   npm run dev
   ```
   API will be at `http://localhost:4000`.

---

## 4. Frontend (React + Vite)

1. From the repo root:
   ```bash
   cd dashboard
   npm install
   npm run build
   ```
2. Create `dashboard/.env.local`:
   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_API_BASE=/api
   ```
   `VITE_API_BASE=/api` is correct when the frontend is served with a proxy or on the same origin as the API (e.g. Vercel rewrites).
3. Run locally (with API on 4000):
   ```bash
   npm run dev
   ```
   Open the URL shown (e.g. `http://localhost:5174`). Sign up with email in the app (Supabase Auth will create the user).

---

## 5. Vercel

### Option A: Monorepo (frontend + API in one project)

1. Push the repo to GitHub and import the project in Vercel.
2. **Root Directory**: leave empty or set to repo root.
3. **Build and Output**:
   - Build command: `cd dashboard && npm install && npm run build`
   - Output directory: `dashboard/dist`
   - Install command: `cd dashboard && npm install`
4. **Environment variables** (Vercel → Settings → Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE` = `/api`
5. Add a **serverless function** for the API:
   - Create `api/index.js` (or use existing `api/vercel.js`) that exports the Express app.
   - In Vercel, add a function that runs `api/vercel.js` (or the path you use) and set **Rewrites** so `/api/*` is handled by that function.
6. In the same Vercel project, add **server-side** env vars for the API (so the serverless function can read them):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Optionally `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Option B: Two Vercel projects

- **Project 1 (frontend)**: Root = `dashboard`, build = `npm run build`, output = `dist`. Env: `VITE_*` and `VITE_API_BASE` = full URL of the API (e.g. `https://ecc-api.vercel.app`).
- **Project 2 (API)**: Root = `api`, build = none (or a simple `npm install`), add a serverless function that runs the Express app. Env: `SUPABASE_*`, `GOOGLE_*`.

### Rewrites (single project)

In the project root, add `vercel.json`:

```json
{
  "buildCommand": "cd dashboard && npm install && npm run build",
  "outputDirectory": "dashboard/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/route" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The exact `destination` for the API depends on how you define the serverless function (e.g. `api/route.js` or Vercel’s default function routing). Adjust so that requests to `/api/tasks` etc. hit your Express app and that the app strips the `/api` prefix (already done in `api/server.js`).

---

## 6. Post-deploy

1. In Supabase **Authentication → URL Configuration**, set **Site URL** to your Vercel frontend URL (e.g. `https://xxx.vercel.app`).
2. Add the same URL under **Redirect URLs** if you use OAuth or email redirects.
3. Create a user via the app (Sign up on the login page) or via Supabase Dashboard → Authentication → Users.
4. To enable Google Calendar: in Settings of the app, click “Connect Google Calendar” and complete the OAuth flow (requires the API route for Google OAuth to be implemented and the redirect URI to be set in Google Cloud and in your app).

---

## Credentials checklist

| What              | Where to get it                    | Where to set it                          |
|-------------------|------------------------------------|------------------------------------------|
| Supabase URL      | Supabase → Settings → API         | `SUPABASE_URL`, `VITE_SUPABASE_URL`      |
| Supabase anon key | Supabase → Settings → API         | `SUPABASE_ANON_KEY`, `VITE_SUPABASE_ANON_KEY` |
| Supabase service_role | Supabase → Settings → API     | `SUPABASE_SERVICE_ROLE_KEY` (API only)   |
| Google Client ID  | Google Cloud → Credentials        | `GOOGLE_CLIENT_ID` (API env)             |
| Google Client Secret | Google Cloud → Credentials     | `GOOGLE_CLIENT_SECRET` (API env)         |
