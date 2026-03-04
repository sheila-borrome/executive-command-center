import "dotenv/config";
import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.js";
import tasksRouter from "./routes/tasks.js";
import entitiesRouter from "./routes/entities.js";
import dailyTop3Router from "./routes/daily-top-3.js";
import brainDumpRouter from "./routes/brain-dump.js";
import projectsRouter from "./routes/projects.js";
import meetingsRouter from "./routes/meetings.js";
import outreachRouter from "./routes/outreach.js";
import teamMembersRouter from "./routes/team-members.js";
import searchRouter from "./routes/search.js";
import notificationsRouter from "./routes/notifications.js";
import calendarRouter from "./routes/calendar.js";
import briefingRouter from "./routes/briefing.js";
import authRouter from "./routes/auth.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// When deployed behind /api (e.g. Vercel), strip prefix so routes match
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }
  next();
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/tasks", authMiddleware, tasksRouter);
app.use("/entities", authMiddleware, entitiesRouter);
app.use("/daily-top-3", authMiddleware, dailyTop3Router);
app.use("/brain-dump", authMiddleware, brainDumpRouter);
app.use("/projects", authMiddleware, projectsRouter);
app.use("/meetings", authMiddleware, meetingsRouter);
app.use("/outreach", authMiddleware, outreachRouter);
app.use("/team-members", authMiddleware, teamMembersRouter);
app.use("/search", authMiddleware, searchRouter);
app.use("/notifications", authMiddleware, notificationsRouter);
app.use("/calendar", authMiddleware, calendarRouter);
app.use("/briefing", authMiddleware, briefingRouter);
app.use("/auth", authRouter);

const PORT = process.env.PORT || 4000;
// Only listen when running locally (Vercel invokes the app per request)
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`API listening on ${PORT}`));
}

export default app;
