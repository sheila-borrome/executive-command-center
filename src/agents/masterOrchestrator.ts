import type { Task } from "../models/task";
import { runPlanningAgent } from "./planningAgent";

export interface OrchestratorResult {
  task: Task;
  notes?: string;
}

/**
 * Master orchestrator.
 * For now, it runs the Planning subagent and then routes to needs_approval.
 * Later, this can call additional subagents (scheduling, content, etc.).
 */
export async function runMasterOrchestrator(task: Task): Promise<OrchestratorResult> {
  const nowIso = new Date().toISOString();

  const planning = await runPlanningAgent(task);

  const updated: Task = {
    ...planning.task,
    status: "needs_approval",
    updatedAt: nowIso,
  };

  return {
    task: updated,
    notes: planning.notes,
  };
}

