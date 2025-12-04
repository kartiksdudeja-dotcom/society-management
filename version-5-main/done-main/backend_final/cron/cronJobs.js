import cron from "node-cron";
import { readBankEmails } from "../services/gmailReader.js";

let isSyncing = false;

export function initCronJobs() {
  console.log("---------------------------------------------------");
  console.log("[Cron] Auto Email Sync Enabled (Runs every 5 minutes)");
  console.log("---------------------------------------------------");

  // Run every 5 minutes instead of 30 seconds
  cron.schedule("*/5 * * * *", async () => {
    if (isSyncing) {
      console.log("⏳ Sync already in progress, skipping...");
      return;
    }
    
    try {
      isSyncing = true;
      console.log("🔄 Auto-sync: Checking new bank emails...");
      await readBankEmails();
    } catch (err) {
      console.error("❌ Cron sync error:", err.message);
    } finally {
      isSyncing = false;
    }
  });
}

export function setSyncing(value) {
  isSyncing = value;
}
