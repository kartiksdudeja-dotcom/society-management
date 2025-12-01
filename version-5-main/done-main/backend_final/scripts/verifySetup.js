#!/usr/bin/env node
// Quick verification script for bank feature
// backend_final/scripts/verifySetup.js

import mongoose from "mongoose";
import BankTransaction from "../models/BankTransaction.js";

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/bank-portal";

async function verify() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("\n🔍 BANK FEATURE VERIFICATION\n");
    console.log("=" .repeat(50));
    
    // Count total transactions
    const total = await BankTransaction.countDocuments();
    console.log(`✓ Total transactions in DB: ${total}`);
    
    // Count November 2025 transactions
    const nov2025Start = new Date("2025-11-01");
    const nov2025End = new Date("2025-12-01");
    const november = await BankTransaction.countDocuments({
      date: { $gte: nov2025Start, $lt: nov2025End }
    });
    console.log(`✓ November 2025 transactions: ${november}`);
    
    if (november === 0) {
      console.log("\n⚠️  No November transactions found!");
      console.log("Run: node scripts/seedTransactions.js");
      process.exit(1);
    }
    
    // Get summary for November
    const transactions = await BankTransaction.find({
      date: { $gte: nov2025Start, $lt: nov2025End }
    }).sort({ date: -1 });
    
    let credit = 0, debit = 0;
    transactions.forEach(t => {
      if (t.type === "credit") credit += t.amount;
      else if (t.type === "debit") debit += t.amount;
    });
    
    console.log("\n📊 NOVEMBER 2025 SUMMARY");
    console.log("=" .repeat(50));
    console.log(`✓ Total Credit:  ₹${credit.toLocaleString("en-IN")}`);
    console.log(`✓ Total Debit:   ₹${debit.toLocaleString("en-IN")}`);
    console.log(`✓ Net Balance:   ₹${(credit - debit).toLocaleString("en-IN")}`);
    console.log(`✓ Transactions:  ${transactions.length}`);
    
    // Show sample transactions
    console.log("\n📋 SAMPLE TRANSACTIONS (Latest 3)");
    console.log("=" .repeat(50));
    transactions.slice(0, 3).forEach((t, i) => {
      console.log(`${i + 1}. ${t.type.toUpperCase()} ₹${t.amount} - ${t.name} (${t.date.toLocaleDateString("en-IN")})`);
    });
    
    console.log("\n✅ VERIFICATION COMPLETE\n");
    console.log("API ENDPOINT: GET /api/bank/month?month=11&year=2025");
    console.log("=" .repeat(50) + "\n");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Verification failed:", err.message);
    process.exit(1);
  }
}

verify();
