/**
 * Migration Script: Re-parse old bank transactions
 * 
 * PURPOSE:
 * Old transactions saved before the parser fix have null values for:
 * - vpa
 * - name
 * - referenceNumber
 * 
 * This script reads the rawBody from old transactions and re-extracts
 * these fields using the updated extractTransactionDetails() function.
 * 
 * USAGE:
 * npm run reparse-transactions
 * 
 * OPTIONAL FILTERS:
 * - Pass a date range to re-parse only old transactions
 * - Pass a limit to avoid updating too many at once
 */

import mongoose from "mongoose";
import BankTransaction from "../models/BankTransaction.js";
import { extractTransactionDetails } from "../services/gmailHelper.js";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

/**
 * Re-parse a single transaction using its rawBody
 * @param {Object} transaction - MongoDB document
 * @returns {Object} Updated fields or null if extraction failed
 */
function reparseTransaction(transaction) {
  if (!transaction.rawBody) {
    console.log(`[Reparse] ⊘ Transaction ${transaction._id} has no rawBody, skipping`);
    return null;
  }

  // Extract using updated parser
  const extracted = extractTransactionDetails(transaction.rawBody, transaction.subject || "");
  
  if (!extracted) {
    console.log(`[Reparse] ✗ Failed to extract from transaction ${transaction._id}`);
    return null;
  }

  return {
    vpa: extracted.vpa,
    name: extracted.name,
    referenceNumber: extracted.referenceNumber,
  };
}

/**
 * Main reparse function
 * @param {Object} options - Filter options
 *   - startDate: ISO date string (default: 90 days ago)
 *   - endDate: ISO date string (default: today)
 *   - limit: Max documents to update (default: 1000)
 *   - dryRun: If true, only show what would be updated (default: false)
 */
async function reparseOldTransactions(options = {}) {
  try {
    // Connect to MongoDB
    console.log("[Reparse] Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/society-db");
    console.log("[Reparse] ✓ Connected to MongoDB");

    // Build filter: transactions with null fields that need reparsing
    const filter = {
      $or: [
        { vpa: null },
        { name: null },
        { referenceNumber: null },
      ],
      rawBody: { $exists: true, $ne: "" }, // Must have rawBody to reparse
    };

    // Optional date range filter
    if (options.startDate || options.endDate) {
      filter.date = {};
      if (options.startDate) {
        filter.date.$gte = new Date(options.startDate);
      }
      if (options.endDate) {
        filter.date.$lte = new Date(options.endDate);
      }
    }

    // Count matching documents
    const count = await BankTransaction.countDocuments(filter);
    console.log(`[Reparse] Found ${count} transactions needing re-parse`);

    if (count === 0) {
      console.log("[Reparse] ✓ No transactions to update!");
      await mongoose.connection.close();
      return { skipped: 0, updated: 0, failed: 0 };
    }

    // Fetch transactions (with limit if specified)
    const limit = options.limit || 1000;
    const transactions = await BankTransaction.find(filter)
      .sort({ date: -1 })
      .limit(limit);

    console.log(`[Reparse] Processing ${transactions.length} transactions...`);
    console.log(`[Reparse] ${options.dryRun ? "DRY RUN MODE" : "PRODUCTION MODE"}`);
    console.log("────────────────────────────────────────────────────────");

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    // Process each transaction
    for (const txn of transactions) {
      const extracted = reparseTransaction(txn);

      if (!extracted) {
        failed++;
        continue;
      }

      // Check if any field changed
      const changed = 
        (extracted.vpa && txn.vpa !== extracted.vpa) ||
        (extracted.name && txn.name !== extracted.name) ||
        (extracted.referenceNumber && txn.referenceNumber !== extracted.referenceNumber);

      if (!changed) {
        skipped++;
        continue;
      }

      if (options.dryRun) {
        console.log(`[Reparse] WOULD UPDATE ${txn._id}:`);
        console.log(`  VPA: ${txn.vpa} → ${extracted.vpa || "(null)"}`);
        console.log(`  Name: ${txn.name} → ${extracted.name || "(null)"}`);
        console.log(`  Reference: ${txn.referenceNumber} → ${extracted.referenceNumber || "(null)"}`);
        updated++;
      } else {
        // Update in MongoDB
        await BankTransaction.updateOne(
          { _id: txn._id },
          {
            $set: {
              vpa: extracted.vpa,
              name: extracted.name,
              referenceNumber: extracted.referenceNumber,
            },
          }
        );

        console.log(`[Reparse] ✓ Updated ${txn._id}:`);
        console.log(`  VPA: ${extracted.vpa || "(null)"}`);
        console.log(`  Name: ${extracted.name || "(null)"}`);
        console.log(`  Reference: ${extracted.referenceNumber || "(null)"}`);
        updated++;
      }
    }

    console.log("────────────────────────────────────────────────────────");
    console.log("[Reparse] Summary:");
    console.log(`  Updated: ${updated}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Skipped (no changes): ${skipped}`);
    console.log(`  Total processed: ${updated + failed + skipped}`);

    // Disconnect
    await mongoose.connection.close();
    console.log("[Reparse] ✓ Done!");

    return { updated, failed, skipped };
  } catch (err) {
    console.error("[Reparse] Fatal error:", err.message);
    process.exit(1);
  }
}

// ============================================================
// CLI Interface
// ============================================================

const args = process.argv.slice(2);
const options = {};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--start-date" && args[i + 1]) {
    options.startDate = args[++i];
  } else if (arg === "--end-date" && args[i + 1]) {
    options.endDate = args[++i];
  } else if (arg === "--limit" && args[i + 1]) {
    options.limit = parseInt(args[++i]);
  } else if (arg === "--dry-run") {
    options.dryRun = true;
  }
}

console.log("[Reparse] Bank Transaction Re-parser");
console.log("[Reparse] ════════════════════════════════════════");

// Run the migration
reparseOldTransactions(options);

// ============================================================
// USAGE EXAMPLES:
// ============================================================
//
// 1. Re-parse all transactions (dry run first):
//    node reparseOldTransactions.js --dry-run
//
// 2. Re-parse with date range (90 days ago to today):
//    node reparseOldTransactions.js --start-date 2025-08-31 --end-date 2025-11-29
//
// 3. Re-parse but limit to 100 documents:
//    node reparseOldTransactions.js --limit 100
//
// 4. Actually update (use after dry-run confirms):
//    node reparseOldTransactions.js
//
// ============================================================
