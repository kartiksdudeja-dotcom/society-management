import cron from "node-cron";
import { readBankEmails } from "../services/gmailReader.js";

export function initCronJobs() {
  console.log("---------------------------------------------------");
  console.log("[Cron] Auto Email Sync Enabled (Runs every 30s)");
  console.log("---------------------------------------------------");

  cron.schedule("*/30 * * * * *", async () => {
    console.log("🔄 Auto-sync: Checking new bank emails...");
    await readBankEmails();
  });
}
