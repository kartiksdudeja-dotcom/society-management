import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");
dotenv.config({ path: envPath });

import GmailToken from "../models/GmailToken.js";
import BankBalance from "../models/BankBalance.js";

const MONGO_URI = process.env.MONGO_URI;

// Parse balance from email
async function parseAndSaveBalance(snippet, messageId) {
  try {
    const lower = snippet.toLowerCase();

    const isBalanceEmail = lower.includes("balance") && 
                          (lower.includes("hdfc") || lower.includes("icici") || lower.includes("axis") || lower.includes("kotak")) &&
                          lower.includes("rs");

    if (!isBalanceEmail) return null;

    const accountMatch = snippet.match(/(?:account\s+ending|ending)\s+([A-Za-z0-9]{2,4})/i);
    if (!accountMatch) return null;
    
    const accountEnding = accountMatch[1].trim();

    const balanceMatch = snippet.match(/Rs\.?\s*(?:INR\s+)?([0-9,]+(?:\.\d{2})?)/i);
    if (!balanceMatch) return null;

    const balanceStr = balanceMatch[1].replace(/,/g, "");
    const balance = parseFloat(balanceStr);

    if (isNaN(balance) || balance <= 0) return null;

    const dateMatch = snippet.match(/(?:as of|date:|updated)\s+(\d{1,2}-[A-Za-z]{3}-\d{2,4})/i);
    let balanceDate = new Date();
    if (dateMatch) {
      const dateStr = dateMatch[1];
      balanceDate = new Date(dateStr) || new Date();
    }

    const bank = snippet.match(/HDFC|ICICI|AXIS|KOTAK|SBI/i)?.[0] || "HDFC";

    // Check if already exists
    const existingBalance = await BankBalance.findOne({ messageId });
    if (existingBalance) {
      console.log(`   ⏭️  Already saved: ${bank} - ₹${balance.toLocaleString('en-IN')}`);
      return existingBalance;
    }

    // Save new balance
    const balanceRecord = await BankBalance.create({
      messageId,
      accountEnding,
      balance,
      balanceDate,
      narration: snippet.substring(0, 500),
      bank,
      currency: "INR"
    });

    console.log(`   ✅ Saved: ${bank} - ₹${balance.toLocaleString('en-IN')} (Account: ...${accountEnding})`);
    return balanceRecord;
  } catch (err) {
    console.error(`   ❌ Error parsing balance:`, err.message);
    return null;
  }
}

async function forceSyncBalanceEmails() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Load token
    const token = await GmailToken.findOne();
    if (!token) {
      console.error("❌ No Gmail token found. Please authenticate first.");
      return;
    }

    if (!token.refresh_token) {
      console.error("❌ No refresh_token found. Please authenticate with consent scope.");
      return;
    }

    console.log("📧 Gmail Token loaded: ✅");
    console.log(`   Account: ${token.email}\n`);

    // Setup OAuth2
    const OAuth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID",
      process.env.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET",
      process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/oauth2callback"
    );

    OAuth2.setCredentials({
      refresh_token: token.refresh_token,
      access_token: token.access_token,
      expiry_date: token.expiry_date
    });

    const gmail = google.gmail({ version: "v1", auth: OAuth2 });

    // Search for balance emails from past 7 days
    console.log("═══════════════════════════════════════════════════════════");
    console.log("FORCE SYNC: Checking emails from past 7 days");
    console.log("═══════════════════════════════════════════════════════════\n");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    const query = `subject:(balance OR statement) from:(hdfc.bank@hdfc.com OR hello@icicibank.com) after:${dateStr}`;

    console.log(`🔍 Search query: ${query}\n`);

    const res = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 50
    });

    if (!res.data.messages) {
      console.log("📭 No balance emails found in past 7 days\n");
      return;
    }

    console.log(`📧 Found ${res.data.messages.length} balance emails\n`);
    console.log("Processing emails...\n");

    let savedCount = 0;
    let parsedCount = 0;

    for (const msg of res.data.messages) {
      try {
        const mail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full"
        });

        const headers = mail.data.payload.headers;
        const subject = headers.find(h => h.name === "Subject")?.value || "No Subject";
        const from = headers.find(h => h.name === "From")?.value || "Unknown";
        const snippet = mail.data.snippet || "";

        console.log(`📬 ${subject}`);
        console.log(`   From: ${from}`);

        const balance = await parseAndSaveBalance(snippet, msg.id);
        if (balance) {
          savedCount++;
        }
        parsedCount++;

      } catch (msgErr) {
        console.error(`   ❌ Error processing email:`, msgErr.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total emails checked: ${res.data.messages.length}`);
    console.log(`   Balance emails parsed: ${parsedCount}`);
    console.log(`   New balances saved: ${savedCount}\n`);

    // Show latest balance
    const latestBalance = await BankBalance.findOne()
      .sort({ balanceDate: -1 })
      .limit(1);

    if (latestBalance) {
      console.log("✨ Latest Balance in Database:");
      console.log(`   Bank: ${latestBalance.bank}`);
      console.log(`   Balance: ₹${latestBalance.balance.toLocaleString('en-IN')}`);
      console.log(`   Account: ...${latestBalance.accountEnding}`);
      console.log(`   Date: ${latestBalance.balanceDate.toLocaleDateString('en-IN')}\n`);
    }

    console.log("✅ Force sync completed!");

  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

forceSyncBalanceEmails();
