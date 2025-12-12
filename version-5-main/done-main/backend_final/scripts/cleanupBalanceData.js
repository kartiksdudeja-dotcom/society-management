import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");
console.log("📁 Loading .env from:", envPath);
dotenv.config({ path: envPath });

// Import models
import BankBalance from "../models/BankBalance.js";

const MONGO_URI = process.env.MONGO_URI;

console.log("🔑 MONGO_URI loaded:", MONGO_URI ? "✅ Yes" : "❌ No");

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not set in environment variables");
  process.exit(1);
}

async function cleanupBalanceData() {
  try {
    console.log("🔄 Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI);

    console.log("✅ Connected to MongoDB");

    // Get all balance records
    const allBalances = await BankBalance.find().sort({ createdAt: -1 });
    console.log(`\n📊 Total balance records in database: ${allBalances.length}`);

    if (allBalances.length === 0) {
      console.log("No balance records found. Database is clean!");
      return;
    }

    // Display all balances
    console.log("\n📋 All balance records:");
    allBalances.forEach((balance, idx) => {
      console.log(`${idx + 1}. ₹${balance.balance.toLocaleString('en-IN')} | Account: ...${balance.accountEnding} | Date: ${balance.balanceDate.toLocaleDateString('en-IN')} | Created: ${balance.createdAt.toLocaleDateString('en-IN')}`);
    });

    // Ask user if they want to delete old records
    console.log("\n🗑️  Keeping only the LATEST balance record, deleting old ones...");

    if (allBalances.length > 1) {
      const latestBalance = allBalances[0];
      const oldBalances = allBalances.slice(1);

      const deleteResult = await BankBalance.deleteMany({
        _id: { $in: oldBalances.map(b => b._id) }
      });

      console.log(`✅ Deleted ${deleteResult.deletedCount} old balance records`);
      console.log(`\n✨ Keeping latest balance:`);
      console.log(`   ₹${latestBalance.balance.toLocaleString('en-IN')} | Account: ...${latestBalance.accountEnding} | Date: ${latestBalance.balanceDate.toLocaleDateString('en-IN')}`);
    } else {
      console.log("✅ Only one balance record exists - keeping it");
    }

    // Verify cleanup
    const remainingBalances = await BankBalance.find();
    console.log(`\n📊 Balance records after cleanup: ${remainingBalances.length}`);

  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

cleanupBalanceData();
