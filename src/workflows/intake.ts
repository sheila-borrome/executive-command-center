import type { Task } from "../models/task";
import { runMasterOrchestrator } from "../agents/masterOrchestrator";

// Minimal in-memory store for now; later we can swap for a real DB.
const tasks = new Map<string, Task>();

interface TaskadeWebhookPayload {
  id?: string;
  title?: string;
  description?: string;
  area?: string;
  priority?: "low" | "medium" | "high";
  deadline?: string;
  url?: string;
  [key: string]: unknown;
}

export async function handleTaskadeWebhook(payload: TaskadeWebhookPayload): Promise<void> {
  const nowIso = new Date().toISOString();
  const id =
    (payload.id as string | undefined) ??
    // Fallback ID using timestamp + random segment; avoids external deps.
    `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const existing = tasks.get(id);

  const baseTask: Task =
    existing ??
    {
      id,
      source: "taskade",
      title: payload.title ?? "Untitled",
      description: payload.description,
      area: payload.area,
      priority: payload.priority,
      deadline: payload.deadline,
      owner: "agent",
      status: "new",
      labels: {},
      links: payload.url
        ? [
            {
              type: "taskade",
              url: payload.url,
            },
          ]
        : [],
      createdAt: nowIso,
      updatedAt: nowIso,
      rawPayload: payload,
    };

  const result = await runMasterOrchestrator(baseTask);

  tasks.set(result.task.id, result.task);

  // TODO: push updates back to Taskade via API integration module.
}

export function getAllTasks(): Task[] {
  return Array.from(tasks.values());
}

export function getTaskById(id: string): Task | undefined {
  return tasks.get(id);
}

