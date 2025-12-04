/**
 * Test Script: Quick sync test
 * Run: node scripts/testSync.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { readBankEmails } from "../services/gmailReader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function test() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected!");

    console.log("📩 Starting email sync...");
    await readBankEmails();
    console.log("✅ Sync completed!");

    // Check results
    const BankTransaction = mongoose.model("BankTransaction");
    const count = await BankTransaction.countDocuments();
    const credits = await BankTransaction.countDocuments({ type: "credit" });
    const debits = await BankTransaction.countDocuments({ type: "debit" });

    console.log("\n📊 Results:");
    console.log(`  Total transactions: ${count}`);
    console.log(`  Credits: ${credits}`);
    console.log(`  Debits: ${debits}`);

    // Show a few samples
    const samples = await BankTransaction.find({ type: "credit" }).limit(5).sort({ date: -1 });
    console.log("\n📄 Recent CREDIT transactions:");
    samples.forEach(t => {
      console.log(`  ${t.date?.toLocaleDateString()} | ${t.name || 'Unknown'} | Office: ${t.flat || '-'} | ₹${t.amount}`);
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

test();
