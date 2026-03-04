import type { Task } from "../models/task";

export interface PlanningResult {
  task: Task;
  notes: string;
}

/**
 * Very simple, rule-based planning subagent.
 * Later this can be upgraded to call an LLM.
 */
export async function runPlanningAgent(task: Task): Promise<PlanningResult> {
  const parts: string[] = [];

  parts.push(`Planning for task: "${task.title}"`);

  if (task.description) {
    parts.push(`Description: ${task.description}`);
  }

  if (task.area) {
    parts.push(`Area: ${task.area}`);
  }

  if (task.priority) {
    parts.push(`Priority: ${task.priority}`);
  }

  // Very lightweight heuristic checklist
  const checklist: string[] = [];
  checklist.push("- Clarify the desired outcome in one sentence.");
  checklist.push("- Identify 3–5 concrete steps to complete this task.");
  checklist.push("- Estimate how long each step will take.");

  if (task.deadline) {
    checklist.push(`- Ensure all steps fit before deadline ${task.deadline}.`);
  } else {
    checklist.push("- Decide a realistic deadline or timebox.");
  }

  parts.push("Suggested planning checklist:");
  parts.push(...checklist);

  const planningSummary = parts.join("\n");

  const updatedTask: Task = {
    ...task,
    planningSummary,
  };

  return {
    task: updatedTask,
    notes: "Rule-based planning applied. Upgrade to LLM-backed planning later.",
  };
}

