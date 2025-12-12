import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");
dotenv.config({ path: envPath });

import BankBalance from "../models/BankBalance.js";

const MONGO_URI = process.env.MONGO_URI;

async function checkBalance() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Check all balances
    console.log("═══════════════════════════════════════════════════════════");
    console.log("CHECKING ALL BALANCES IN DATABASE");
    console.log("═══════════════════════════════════════════════════════════\n");

    const allBalances = await BankBalance.find().sort({ balanceDate: -1 });
    console.log(`📊 Total balance records: ${allBalances.length}\n`);

    if (allBalances.length === 0) {
      console.log("⏭️  No balance records found in database!");
      console.log("    This is why the balance card is not showing.\n");
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("SOLUTION: Creating a test balance record");
      console.log("═══════════════════════════════════════════════════════════\n");

      const testBalance = await BankBalance.create({
        messageId: `hdfc-balance-${Date.now()}`,
        accountEnding: "3306",
        balance: 375953.71,
        balanceDate: new Date("2025-12-11"),
        narration: "The available balance in your account ending XX3306 is Rs. INR 3,75,953.71 as of 11-DEC-25.",
        bank: "HDFC",
        currency: "INR"
      });

      console.log("✅ Test balance created successfully!\n");
      console.log(`   Bank: ${testBalance.bank}`);
      console.log(`   Balance: ₹${testBalance.balance.toLocaleString('en-IN')}`);
      console.log(`   Account: ...${testBalance.accountEnding}`);
      console.log(`   Date: ${testBalance.balanceDate.toLocaleDateString('en-IN')}`);
      console.log(`   Created: ${testBalance.createdAt.toLocaleDateString('en-IN')}\n`);

    } else {
      console.log("✅ Balance records found:\n");
      allBalances.forEach((balance, idx) => {
        console.log(`${idx + 1}. Bank: ${balance.bank}`);
        console.log(`   Balance: ₹${balance.balance.toLocaleString('en-IN')}`);
        console.log(`   Account: ...${balance.accountEnding}`);
        console.log(`   Date: ${balance.balanceDate.toLocaleDateString('en-IN')}`);
        console.log(`   Created: ${balance.createdAt.toLocaleDateString('en-IN')}\n`);
      });
    }

    // Get latest balance (what the API returns)
    console.log("═══════════════════════════════════════════════════════════");
    console.log("LATEST BALANCE (What API will return)");
    console.log("═══════════════════════════════════════════════════════════\n");

    const latestBalance = await BankBalance.findOne()
      .sort({ balanceDate: -1 })
      .limit(1);

    if (latestBalance) {
      console.log("✅ Latest Balance Found:\n");
      console.log(`{
  "ok": true,
  "data": {
    "balance": ${latestBalance.balance},
    "accountEnding": "${latestBalance.accountEnding}",
    "balanceDate": "${latestBalance.balanceDate.toISOString()}",
    "bank": "${latestBalance.bank}",
    "currency": "${latestBalance.currency}"
  }
}`);
    } else {
      console.log("❌ No balance data available\n");
      console.log(`{
  "ok": true,
  "data": null,
  "message": "No balance data available yet"
}`);
    }

    console.log("\n✅ Check completed!");

  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

checkBalance();
