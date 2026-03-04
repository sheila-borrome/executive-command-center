-- Executive Command Center - Initial schema
-- Run in Supabase SQL Editor or via supabase db push

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  notification_overdue_tasks boolean default true,
  notification_follow_ups boolean default true,
  notification_meetings_24h boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Entities (LDU, LDG, SLDG, LA County, Big Kika)
create table if not exists public.entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Team members (for assignees / delegation)
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  role text,
  notes text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  entity_id uuid references public.entities(id) on delete set null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done', 'cancelled')),
  priority text not null default 'normal' check (priority in ('critical', 'high', 'normal', 'low')),
  due_date date,
  assignee_id uuid references public.team_members(id) on delete set null,
  recurrence text check (recurrence in ('daily', 'weekly', 'monthly')),
  project_id uuid,
  meeting_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  entity_id uuid references public.entities(id) on delete set null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done', 'on_hold')),
  owner_id uuid references public.team_members(id) on delete set null,
  due_date date,
  percent_complete int default 0 check (percent_complete >= 0 and percent_complete <= 100),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tasks add constraint tasks_project_fk foreign key (project_id) references public.projects(id) on delete set null;

-- Project checklist
create table if not exists public.project_checklist (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  "order" int not null default 0,
  completed boolean default false,
  created_at timestamptz default now()
);

-- Project team (many-to-many)
create table if not exists public.project_team (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  role text,
  unique(project_id, team_member_id)
);

-- Project files
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null,
  url text not null,
  type text,
  created_at timestamptz default now()
);

-- Project activity log
create table if not exists public.project_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  payload jsonb,
  created_at timestamptz default now()
);

-- Meetings
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  entity_id uuid references public.entities(id) on delete set null,
  scheduled_at timestamptz not null,
  attendees text[],
  agenda jsonb default '[]',
  notes text,
  location text,
  google_event_id text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Meeting action items (link meeting -> task)
create table if not exists public.meeting_action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  unique(meeting_id, task_id)
);

alter table public.tasks add constraint tasks_meeting_fk foreign key (meeting_id) references public.meetings(id) on delete set null;

-- Outreach
create table if not exists public.outreach (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  organization text,
  entity_id uuid references public.entities(id) on delete set null,
  method text not null check (method in ('email', 'call', 'meeting')),
  last_contact_at date,
  follow_up_date date,
  status text not null default 'contacted' check (status in ('contacted', 'awaiting_response', 'follow_up_due', 'completed', 'stalled')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Daily top 3 (user's manual top 3 tasks per day)
create table if not exists public.daily_top_3 (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id_1 uuid references public.tasks(id) on delete set null,
  task_id_2 uuid references public.tasks(id) on delete set null,
  task_id_3 uuid references public.tasks(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(date, user_id)
);

-- Brain dump (one row per user, upserted)
create table if not exists public.brain_dumps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  content text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Generic activity log
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  changes jsonb,
  created_at timestamptz default now()
);

-- User settings (Google Calendar etc.)
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  google_calendar_connected boolean default false,
  google_refresh_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.entities enable row level security;
alter table public.team_members enable row level security;
alter table public.tasks enable row level security;
alter table public.projects enable row level security;
alter table public.project_checklist enable row level security;
alter table public.project_team enable row level security;
alter table public.project_files enable row level security;
alter table public.project_activity enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_action_items enable row level security;
alter table public.outreach enable row level security;
alter table public.daily_top_3 enable row level security;
alter table public.brain_dumps enable row level security;
alter table public.activity_log enable row level security;
alter table public.user_settings enable row level security;
alter table public.notifications enable row level security;

-- Policies: profiles (own only)
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Entities: all authenticated can read
create policy "Authenticated can read entities" on public.entities for select to authenticated using (true);
create policy "Authenticated can manage entities" on public.entities for all to authenticated using (true);

-- Team members: all authenticated can read/write (single-tenant)
create policy "Authenticated can read team_members" on public.team_members for select to authenticated using (true);
create policy "Authenticated can insert team_members" on public.team_members for insert to authenticated with check (true);
create policy "Authenticated can update team_members" on public.team_members for update to authenticated using (true);
create policy "Authenticated can delete team_members" on public.team_members for delete to authenticated using (true);

-- Tasks: by created_by or assignee
create policy "Users can read tasks" on public.tasks for select to authenticated using (true);
create policy "Users can insert tasks" on public.tasks for insert to authenticated with check (auth.uid() = created_by or created_by is null);
create policy "Users can update tasks" on public.tasks for update to authenticated using (true);
create policy "Users can delete tasks" on public.tasks for delete to authenticated using (true);

-- Projects
create policy "Users can read projects" on public.projects for select to authenticated using (true);
create policy "Users can insert projects" on public.projects for insert to authenticated with check (auth.uid() = created_by or created_by is null);
create policy "Users can update projects" on public.projects for update to authenticated using (true);
create policy "Users can delete projects" on public.projects for delete to authenticated using (true);

-- Project checklist, team, files, activity
create policy "Users can manage project_checklist" on public.project_checklist for all to authenticated using (true);
create policy "Users can manage project_team" on public.project_team for all to authenticated using (true);
create policy "Users can manage project_files" on public.project_files for all to authenticated using (true);
create policy "Users can manage project_activity" on public.project_activity for all to authenticated using (true);

-- Meetings
create policy "Users can manage meetings" on public.meetings for all to authenticated using (true);
create policy "Users can manage meeting_action_items" on public.meeting_action_items for all to authenticated using (true);

-- Outreach
create policy "Users can manage outreach" on public.outreach for all to authenticated using (true);

-- Daily top 3: own only
create policy "Users can manage own daily_top_3" on public.daily_top_3 for all to authenticated using (auth.uid() = user_id);

-- Brain dumps: own only
create policy "Users can manage own brain_dumps" on public.brain_dumps for all to authenticated using (auth.uid() = user_id);

-- Activity log: read own or related
create policy "Users can read activity_log" on public.activity_log for select to authenticated using (true);
create policy "Users can insert activity_log" on public.activity_log for insert to authenticated with check (true);

-- User settings: own only
create policy "Users can manage own user_settings" on public.user_settings for all to authenticated using (auth.uid() = user_id);

-- Notifications: own only
create policy "Users can manage own notifications" on public.notifications for all to authenticated using (auth.uid() = user_id);

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
