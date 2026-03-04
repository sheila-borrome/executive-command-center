export type TaskStatus = "not_started" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "critical" | "high" | "normal" | "low";
export type ProjectStatus = "not_started" | "in_progress" | "done" | "on_hold";
export type OutreachStatus = "contacted" | "awaiting_response" | "follow_up_due" | "completed" | "stalled";
export type OutreachMethod = "email" | "call" | "meeting";
export type DelegationStatus = "not_started" | "in_progress" | "done";

export interface Entity {
  id: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  entity_id: string | null;
  entity?: Entity | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: string | null;
  assignee?: TeamMember | null;
  recurrence: "daily" | "weekly" | "monthly" | null;
  project_id: string | null;
  meeting_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  entity_id: string | null;
  entity?: Entity | null;
  status: ProjectStatus;
  owner_id: string | null;
  owner?: TeamMember | null;
  due_date: string | null;
  percent_complete: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  checklist?: ProjectChecklistItem[];
  team?: unknown[];
  files?: ProjectFile[];
  activity?: ProjectActivity[];
}

export interface ProjectChecklistItem {
  id: string;
  project_id: string;
  title: string;
  order: number;
  completed: boolean;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  label: string;
  url: string;
  type: string | null;
  created_at: string;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  user_id: string | null;
  action: string;
  payload: unknown;
  created_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  entity_id: string | null;
  entity?: Entity | null;
  scheduled_at: string;
  attendees: string[] | null;
  agenda: { title: string; completed?: boolean }[];
  notes: string | null;
  location: string | null;
  google_event_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  action_items?: { task_id: string; task?: Task }[];
}

export interface Outreach {
  id: string;
  contact_name: string;
  organization: string | null;
  entity_id: string | null;
  entity?: Entity | null;
  method: OutreachMethod;
  last_contact_at: string | null;
  follow_up_date: string | null;
  status: OutreachStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyTop3 {
  date: string;
  task_id_1: string | null;
  task_id_2: string | null;
  task_id_3: string | null;
  task_1?: Task | null;
  task_2?: Task | null;
  task_3?: Task | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  type: "meeting" | "task";
  title: string;
  entity_id: string | null;
  start: string;
  end: string;
  location?: string;
}
