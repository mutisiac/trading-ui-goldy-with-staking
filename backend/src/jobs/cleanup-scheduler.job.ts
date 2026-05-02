import cron from "node-cron";
import { cleanupUploadsFolder } from "../utils/cleanup.utils.js";

export function startCleanupScheduler(): void {
  const task = cron.schedule(
    "0 3 * * *",
    () => {
      const now = new Date();
      console.log("\n========================================");
      console.log(`SCHEDULED CLEANUP STARTED`);
      console.log(
        `Time: ${now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`
      );
      console.log("========================================\n");

      cleanupUploadsFolder();

      console.log("========================================");
      console.log("SCHEDULED CLEANUP FINISHED");
      console.log("========================================\n");
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  task.start();

  console.log("Cleanup scheduler started (daily 3:00 AM IST).");
}

export default startCleanupScheduler;
