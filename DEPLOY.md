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
   - Local: `http://localhost:4000/api/auth/google/callback` (API port; frontend proxies /api to it)
   - Production: `https://<your-vercel-domain>/api/auth/google/callback` (add after first deploy)
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

### Option A: Monorepo (recommended; uses root `vercel.json`)

1. Push the repo to GitHub and import the project in Vercel (root = repo root).
2. The repo’s **vercel.json** already sets:
   - Build: `cd dashboard && npm ci && npm run build`
   - Output: `dashboard/dist`
   - Rewrites: `/api/(.*)` → serverless `api/index.js`, all other routes → `index.html` (SPA)
   - Function: `api/index.js` with `@vercel/node@3`
3. **Environment variables** (Vercel → Settings → Environment Variables):
   - For **build** (dashboard): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE` = `/api` (same-origin rewrites).
   - For **serverless API**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; optionally `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
4. Deploy. After first deploy, add the production callback URL in Google Cloud (see §2) if using Calendar.

### Option B: Two Vercel projects

- **Project 1 (frontend)**: Root = `dashboard`, build = `npm run build`, output = `dist`. Env: `VITE_*` and `VITE_API_BASE` = full URL of the API (e.g. `https://ecc-api.vercel.app`).
- **Project 2 (API)**: Root = `api`, serverless entry = `api/index.js`. Env: `SUPABASE_*`, `GOOGLE_*`.

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

---

## Final review checklist

- [ ] **Local:** `cd api && npm run dev` → API on 4000; `cd dashboard && npm run dev` → app loads, sign up works.
- [ ] **Build:** `cd dashboard && npm run build` → `dashboard/dist` produced (can take ~2 min).
- [ ] **Env:** `.env` and `.env.local` are in `.gitignore`; never commit service_role key. Rotate it in Supabase if it was ever committed.
- [ ] **Git:** `git push` to GitHub; Vercel connected to repo.
- [ ] **Vercel env:** All variables from §5 set (VITE_* for build, SUPABASE_* and optional GOOGLE_* for API).
- [ ] **Post-deploy:** Supabase Site URL and Redirect URLs set to your Vercel URL; Google production callback added if using Calendar.
