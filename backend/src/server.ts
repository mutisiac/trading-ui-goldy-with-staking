import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { startCleanupScheduler } from "./jobs/cleanup-scheduler.job.js";
import { startCleanupJob } from "./jobs/cleanup.job.js";

const PORT = env.PORT;

async function bootstrap(): Promise<void> {
  startCleanupScheduler();

  try {
    await connectDatabase();
    const app = createApp();
    const server = app.listen(PORT, () => {
      console.log(`Server listening at http://localhost:${PORT}`);
      startCleanupJob();
    });

    server.on("error", (error: Error) => {
      console.error("Server error:", error);
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Failed to start:", error.message);
    } else {
      console.error("Failed to start:", error);
    }
    process.exit(1);
  }
}

void bootstrap();
