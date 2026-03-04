# Executive Command Center

React + Tailwind (dark theme) dashboard with Node/Express API, Supabase (DB + Auth), and optional Google Calendar. Tabs: Command Center, Projects, Tasks, Outreach, Meetings, Calendar, Team, Settings.

## Run locally

**Terminal 1 — API**
```bash
cd api
npm install
# create api/.env with SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (see DEPLOY.md)
npm run dev
```
API: `http://localhost:4000`

**Terminal 2 — Dashboard**
```bash
cd dashboard
npm install
# create dashboard/.env.local with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE=/api (see DEPLOY.md)
npm run dev
```
Open the URL shown (e.g. `http://localhost:5174`). Sign up on the login page to create a user.

## Deploy

See **[DEPLOY.md](./DEPLOY.md)** for Supabase setup, Google Calendar (optional), env vars, and Vercel deployment (monorepo with `vercel.json`).

## Repo layout

- `dashboard/` — React + Vite + TypeScript, Tailwind
- `api/` — Express API, Supabase auth middleware, routes for tasks, projects, meetings, etc.
- `supabase/migrations/` — SQL migrations and entity seed
