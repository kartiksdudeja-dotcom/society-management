import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import monthlyStatementService from "../services/monthlyStatementService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");
dotenv.config({ path: envPath });

import BankBalance from "../models/BankBalance.js";

const MONGO_URI = process.env.MONGO_URI;

// Test HDFC email format from user
const testHDFCEmail = `Dear Customer,

Greetings from HDFC Bank!

The available balance in your account ending XX3306 is Rs. INR 3,75,953.71 as of 11-DEC-25.

The balance in the account does not include the uncleared cheque amount, if any.

For real-time balance updates, call us at 1800 270 3333.

Thank you for banking with us!

Warm Regards,
HDFC Bank`;

async function testBalanceParsing() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Test 1: Verify regex patterns work on the email
    console.log("═══════════════════════════════════════════════════════════");
    console.log("TEST 1: Balance Extraction Regex Patterns");
    console.log("═══════════════════════════════════════════════════════════\n");

    const lower = testHDFCEmail.toLowerCase();
    console.log("📧 Email content (first 200 chars):");
    console.log(testHDFCEmail.substring(0, 200) + "...\n");

    // Test account ending extraction
    const accountMatch = testHDFCEmail.match(/(?:account\s+ending|ending)\s+([A-Za-z0-9]{2,4})/i);
    console.log("🔍 Account Ending Regex Match:");
    console.log(`   Pattern: /(?:account\\s+ending|ending)\\s+([A-Za-z0-9]{2,4})/i`);
    console.log(`   Found: ${accountMatch ? accountMatch[1] : "❌ NO MATCH"}\n`);

    // Test balance extraction
    const balanceMatch = testHDFCEmail.match(/Rs\.?\s*(?:INR\s+)?([0-9,]+(?:\.\d{2})?)/i);
    console.log("💰 Balance Amount Regex Match:");
    console.log(`   Pattern: /Rs\\.?\\s*(?:INR\\s+)?([0-9,]+(?:\\.\\d{2})?)/i`);
    console.log(`   Found: ${balanceMatch ? balanceMatch[1] : "❌ NO MATCH"}\n`);

    if (balanceMatch) {
      const balanceStr = balanceMatch[1].replace(/,/g, "");
      const balance = parseFloat(balanceStr);
      console.log(`   Cleaned value: ${balanceStr}`);
      console.log(`   Parsed number: ${balance}`);
      console.log(`   Valid: ${isNaN(balance) || balance <= 0 ? "❌ NO" : "✅ YES"}\n`);
    }

    // Test date extraction
    const dateMatch = testHDFCEmail.match(/(?:as of|date:|updated)\s+(\d{1,2}-[A-Za-z]{3}-\d{2,4})/i);
    console.log("📅 Date Regex Match:");
    console.log(`   Pattern: /(?:as of|date:|updated)\\s+(\\d{1,2}-[A-Za-z]{3}-\\d{2,4})/i`);
    console.log(`   Found: ${dateMatch ? dateMatch[1] : "❌ NO MATCH"}\n`);

    if (dateMatch) {
      const dateStr = dateMatch[1];
      const balanceDate = new Date(dateStr);
      console.log(`   Parsed date: ${balanceDate.toLocaleDateString('en-IN')}\n`);
    }

    // Test 2: Actually save the balance
    console.log("═══════════════════════════════════════════════════════════");
    console.log("TEST 2: Saving Balance to Database");
    console.log("═══════════════════════════════════════════════════════════\n");

    const testMessageId = `test-hdfc-${Date.now()}`;
    
    if (accountMatch && balanceMatch && dateMatch) {
      const accountEnding = accountMatch[1].trim();
      const balanceStr = balanceMatch[1].replace(/,/g, "");
      const balance = parseFloat(balanceStr);
      const dateStr = dateMatch[1];
      const balanceDate = new Date(dateStr);
      const bank = "HDFC";

      const balanceRecord = await BankBalance.create({
        messageId: testMessageId,
        accountEnding,
        balance,
        balanceDate,
        narration: testHDFCEmail.substring(0, 500),
        bank,
        currency: "INR"
      });

      console.log("✅ Balance Saved Successfully!\n");
      console.log("📊 Saved Data:");
      console.log(`   Account Ending: ...${accountEnding}`);
      console.log(`   Balance: ₹${balance.toLocaleString('en-IN')}`);
      console.log(`   Date: ${balanceDate.toLocaleDateString('en-IN')}`);
      console.log(`   Bank: ${bank}`);
      console.log(`   Message ID: ${testMessageId}\n`);
    } else {
      console.log("❌ Failed to extract data from email\n");
    }

    // Test 3: Retrieve the balance
    console.log("═══════════════════════════════════════════════════════════");
    console.log("TEST 3: Retrieving Latest Balance from Database");
    console.log("═══════════════════════════════════════════════════════════\n");

    const latestBalance = await BankBalance.findOne()
      .sort({ balanceDate: -1 })
      .limit(1);

    if (latestBalance) {
      console.log("✅ Balance Found in Database!\n");
      console.log("📊 Retrieved Data:");
      console.log(`   Account Ending: ...${latestBalance.accountEnding}`);
      console.log(`   Balance: ₹${latestBalance.balance.toLocaleString('en-IN')}`);
      console.log(`   Date: ${latestBalance.balanceDate.toLocaleDateString('en-IN')}`);
      console.log(`   Bank: ${latestBalance.bank}`);
      console.log(`   Created: ${latestBalance.createdAt.toLocaleDateString('en-IN')}\n`);
    } else {
      console.log("⏭️ No balance records in database\n");
    }

    // Test 4: Check all balances
    console.log("═══════════════════════════════════════════════════════════");
    console.log("TEST 4: All Balances in Database");
    console.log("═══════════════════════════════════════════════════════════\n");

    const allBalances = await BankBalance.find().sort({ balanceDate: -1 });
    console.log(`📊 Total records: ${allBalances.length}\n`);

    if (allBalances.length > 0) {
      console.log("Balances:");
      allBalances.forEach((balance, idx) => {
        console.log(`${idx + 1}. ₹${balance.balance.toLocaleString('en-IN')} | Account: ...${balance.accountEnding} | Date: ${balance.balanceDate.toLocaleDateString('en-IN')}`);
      });
    }

    console.log("\n✅ All tests completed successfully!");

  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

testBalanceParsing();
