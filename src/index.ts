import dotenv from "dotenv";
import { createServer } from "./server/server";

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

async function main() {
  const app = createServer();

  app.listen(port, () => {
    console.log(`[agentic-command-center] Listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error("[agentic-command-center] Fatal error during startup:", err);
  process.exit(1);
});

