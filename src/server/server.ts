import express, { Request, Response } from "express";
import { json } from "body-parser";
import { handleTaskadeWebhook, getAllTasks, getTaskById } from "../workflows/intake";

export function createServer() {
  const app = express();

  app.use(json());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.get("/tasks", (_req: Request, res: Response) => {
    const tasks = getAllTasks();
    res.json({ tasks });
  });

  app.get("/tasks/:id", (req: Request, res: Response) => {
    const task = getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "not_found" });
    }
    res.json({ task });
  });

  // Placeholder Taskade webhook endpoint
  app.post("/webhooks/taskade", async (req: Request, res: Response) => {
    try {
      await handleTaskadeWebhook(req.body);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[webhooks/taskade] Error handling webhook:", err);
      res.status(500).json({ ok: false, error: "internal_error" });
    }
  });

  return app;
}

