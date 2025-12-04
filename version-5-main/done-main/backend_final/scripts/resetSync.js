/**
 * Reset Sync Script
 * 
 * This script clears the SyncState and optionally all BankTransactions
 * to force a full re-sync from Gmail.
 * 
 * USAGE:
 *   node scripts/resetSync.js            - Reset sync state only (keeps existing transactions)
 *   node scripts/resetSync.js --clear    - Reset sync state AND clear all transactions
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function resetSync() {
  try {
    const clearAll = process.argv.includes("--clear");

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/society-db");
    console.log("✅ Connected!");

    // Reset SyncState
    const SyncState = mongoose.model("SyncState", new mongoose.Schema({ lastHistoryId: String }));
    await SyncState.deleteMany({});
    console.log("✅ SyncState cleared (will force full re-sync)");

    // Optionally clear all transactions
    if (clearAll) {
      const BankTransaction = mongoose.model("BankTransaction", new mongoose.Schema({}, { strict: false }));
      const result = await BankTransaction.deleteMany({});
      console.log(`✅ Cleared ${result.deletedCount} bank transactions`);
    } else {
      console.log("ℹ️  Keeping existing transactions (use --clear to remove them)");
    }

    await mongoose.connection.close();
    console.log("\n🎉 Done! Now restart your server and click 'Sync Emails' button.");

  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

resetSync();
