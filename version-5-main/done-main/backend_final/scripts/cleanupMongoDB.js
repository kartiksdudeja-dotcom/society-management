/**
 * MongoDB Cleanup Script for Bank Transactions
 * Removes all unwanted emails and transactions from the database
 * 
 * USAGE: node cleanupMongoDB.js
 * 
 * This script:
 * 1. Removes all processedEmails older than Nov 1, 2025
 * 2. Removes all non-transaction emails (OTPs, alerts without Rs.)
 * 3. Removes all bankTransactions older than Nov 1, 2025
 * 4. Removes all invalid transaction types
 * 5. Removes all transactions with null/missing amounts
 */

import mongoose from "mongoose";
import ProcessedEmail from "../models/ProcessedEmail.js";
import BankTransaction from "../models/BankTransaction.js";
import config from "../config/firebaseConfig.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/society-management";

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB Connected");
    return true;
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    return false;
  }
}

async function cleanupEmails() {
  console.log("\n📧 CLEANING UP processedEmails...");
  
  try {
    // Step 1: Delete emails older than Nov 1, 2025
    console.log("  Step 1: Deleting emails before Nov 1, 2025...");
    const result1 = await ProcessedEmail.deleteMany({
      date: { $lt: new Date("2025-11-01") }
    });
    console.log(`    ✓ Deleted ${result1.deletedCount} old emails`);

    // Step 2: Delete non-transaction emails (no "Rs." in content)
    console.log("  Step 2: Deleting non-transaction emails (no Rs. amount)...");
    const result2 = await ProcessedEmail.deleteMany({
      $or: [
        { rawBody: { $not: /Rs\./i } },
        { rawBody: null },
        { rawBody: "" }
      ]
    });
    console.log(`    ✓ Deleted ${result2.deletedCount} non-transaction emails (OTP/alerts/etc)`);

    const remaining = await ProcessedEmail.countDocuments();
    console.log(`\n  📊 Remaining processedEmails: ${remaining}`);
    
    return {
      old: result1.deletedCount,
      nonTransaction: result2.deletedCount,
      remaining
    };
  } catch (err) {
    console.error("❌ Error cleaning emails:", err.message);
    throw err;
  }
}

async function cleanupTransactions() {
  console.log("\n💳 CLEANING UP bankTransactions...");
  
  try {
    // Step 1: Delete transactions older than Nov 1, 2025
    console.log("  Step 1: Deleting transactions before Nov 1, 2025...");
    const result1 = await BankTransaction.deleteMany({
      date: { $lt: new Date("2025-11-01") }
    });
    console.log(`    ✓ Deleted ${result1.deletedCount} old transactions`);

    // Step 2: Delete invalid transaction types
    console.log("  Step 2: Deleting invalid transaction types...");
    const result2 = await BankTransaction.deleteMany({
      type: { $nin: ["credit", "debit"] }
    });
    console.log(`    ✓ Deleted ${result2.deletedCount} invalid type transactions`);

    // Step 3: Delete transactions with null/missing amounts
    console.log("  Step 3: Deleting transactions with null amounts...");
    const result3 = await BankTransaction.deleteMany({
      $or: [
        { amount: null },
        { amount: undefined },
        { amount: { $lte: 0 } }
      ]
    });
    console.log(`    ✓ Deleted ${result3.deletedCount} transactions with invalid amounts`);

    const remaining = await BankTransaction.countDocuments();
    const creditCount = await BankTransaction.countDocuments({ type: "credit" });
    const debitCount = await BankTransaction.countDocuments({ type: "debit" });
    
    console.log(`\n  📊 Remaining bankTransactions: ${remaining}`);
    console.log(`     - Credits: ${creditCount}`);
    console.log(`     - Debits: ${debitCount}`);
    
    return {
      old: result1.deletedCount,
      invalidType: result2.deletedCount,
      nullAmount: result3.deletedCount,
      remaining,
      creditCount,
      debitCount
    };
  } catch (err) {
    console.error("❌ Error cleaning transactions:", err.message);
    throw err;
  }
}

async function verifyCleanup() {
  console.log("\n✔️ VERIFICATION...");
  
  try {
    // Check for old emails
    const oldEmails = await ProcessedEmail.countDocuments({
      date: { $lt: new Date("2025-11-01") }
    });
    console.log(`  Old emails (should be 0): ${oldEmails}`);

    // Check for OTPs in remaining emails
    const otpEmails = await ProcessedEmail.countDocuments({
      rawBody: { $not: /Rs\./i }
    });
    console.log(`  OTP/alert emails (should be 0): ${otpEmails}`);

    // Check for old transactions
    const oldTransactions = await BankTransaction.countDocuments({
      date: { $lt: new Date("2025-11-01") }
    });
    console.log(`  Old transactions (should be 0): ${oldTransactions}`);

    // Check for invalid types
    const invalidTypes = await BankTransaction.countDocuments({
      type: { $nin: ["credit", "debit"] }
    });
    console.log(`  Invalid type transactions (should be 0): ${invalidTypes}`);

    // Check for null amounts
    const nullAmounts = await BankTransaction.countDocuments({
      amount: { $lte: 0 }
    });
    console.log(`  Null/invalid amount transactions (should be 0): ${nullAmounts}`);

    // Show sample of remaining November data
    console.log("\n  📋 Sample of remaining November transactions:");
    const samples = await BankTransaction.find()
      .sort({ date: -1 })
      .limit(3);
    
    samples.forEach((tx, i) => {
      console.log(`    ${i+1}. ${tx.date.toDateString()} | ${tx.type.toUpperCase()} | ₹${tx.amount} | ${tx.name || tx.vpa}`);
    });

    return {
      allClean: oldEmails === 0 && otpEmails === 0 && oldTransactions === 0 && invalidTypes === 0 && nullAmounts === 0
    };
  } catch (err) {
    console.error("❌ Error during verification:", err.message);
    throw err;
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║    MongoDB BANK TRANSACTION CLEANUP SCRIPT     ║");
  console.log("╚════════════════════════════════════════════════╝");
  
  try {
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      process.exit(1);
    }

    // Run cleanup
    const emailResults = await cleanupEmails();
    const txResults = await cleanupTransactions();
    const verifyResults = await verifyCleanup();

    // Summary
    console.log("\n╔════════════════════════════════════════════════╗");
    console.log("║                   SUMMARY                      ║");
    console.log("╚════════════════════════════════════════════════╝");
    
    console.log(`\n✉️  Emails Cleaned:`);
    console.log(`   - Old emails (< Nov 1): ${emailResults.old}`);
    console.log(`   - Non-transaction emails: ${emailResults.nonTransaction}`);
    console.log(`   - Total deleted: ${emailResults.old + emailResults.nonTransaction}`);
    console.log(`   - Remaining valid emails: ${emailResults.remaining}`);

    console.log(`\n💳 Transactions Cleaned:`);
    console.log(`   - Old transactions (< Nov 1): ${txResults.old}`);
    console.log(`   - Invalid types: ${txResults.invalidType}`);
    console.log(`   - Null/invalid amounts: ${txResults.nullAmount}`);
    console.log(`   - Total deleted: ${txResults.old + txResults.invalidType + txResults.nullAmount}`);
    console.log(`   - Remaining valid transactions: ${txResults.remaining}`);
    console.log(`     • Credits: ${txResults.creditCount}`);
    console.log(`     • Debits: ${txResults.debitCount}`);

    if (verifyResults.allClean) {
      console.log(`\n✅ DATABASE CLEANUP SUCCESSFUL!`);
      console.log(`   All invalid data has been removed.`);
      console.log(`   Only valid November 2025 data remains.`);
    } else {
      console.log(`\n⚠️  WARNING: Some invalid data may still remain.`);
      console.log(`   Please review the verification results above.`);
    }

    console.log("\n" + "═".repeat(50) + "\n");
    
  } catch (err) {
    console.error("\n❌ CLEANUP FAILED:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("✅ MongoDB Disconnected");
  }
}

// Run the script
main().then(() => {
  console.log("✔️ Script completed successfully");
  process.exit(0);
}).catch(err => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
