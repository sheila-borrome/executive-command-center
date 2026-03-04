export type TaskStatus =
  | "new"
  | "enriched"
  | "needs_approval"
  | "approved"
  | "executing"
  | "completed"
  | "error";

export interface TaskLink {
  type: "taskade" | "calendar" | "doc" | "email" | "other";
  url: string;
  description?: string;
}

export interface TaskLabels {
  autoOk?: boolean;
  needsReview?: boolean;
  [key: string]: boolean | undefined;
}

export interface Task {
  id: string;
  source: "taskade" | "local";
  title: string;
  description?: string;
  area?: string;
  priority?: "low" | "medium" | "high";
  deadline?: string; // ISO string
  owner?: "you" | "agent" | string;
  status: TaskStatus;
  labels: TaskLabels;
  links: TaskLink[];
  createdAt: string;
  updatedAt: string;
  rawPayload?: unknown;
  planningSummary?: string;
}

