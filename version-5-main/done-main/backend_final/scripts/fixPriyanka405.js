// Fix PRIYANKA 405 mapping - she is different from PRIYA 103
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import BankTransaction from "../models/BankTransaction.js";
import LearnedMapping from "../models/LearnedMapping.js";

const MONGO_URI = process.env.MONGO_URI;

async function fixPriyanka() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // 1. Add LearnedMapping for PRIYANKA 405
    await LearnedMapping.findOneAndUpdate(
      { key: "priyanka sanjay abbad" },
      {
        key: "priyanka sanjay abbad",
        officeNumber: "405",
        ownerName: "PRIYANKA HIMANSHU CHORDIYA",  // Actual owner of 405
        payerName: "PRIYANKA SANJAY ABBAD",
        relationship: "tenant",  // or could be relative/other
        officeType: "office",
        confidence: 10,
        examples: ["priyanka sanjay abbad", "PRIYANKA SANJAY ABBAD"]
      },
      { upsert: true, new: true }
    );
    console.log("✅ Added LearnedMapping for PRIYANKA SANJAY ABBAD -> Office 405");

    // 2. Also add mapping for just "priyanka" with VPA pattern to differentiate
    await LearnedMapping.findOneAndUpdate(
      { key: "priyanka860212" },
      {
        key: "priyanka860212",
        officeNumber: "405",
        ownerName: "PRIYANKA HIMANSHU CHORDIYA",
        payerName: "PRIYANKA SANJAY ABBAD",
        relationship: "tenant",
        officeType: "office",
        confidence: 10,
        examples: ["priyanka860212-2@okhdfcbank"]
      },
      { upsert: true, new: true }
    );
    console.log("✅ Added VPA-based mapping for priyanka860212 -> Office 405");

    // 3. Update the wrongly mapped transaction
    const result = await BankTransaction.updateMany(
      { 
        narration: { $regex: "PRIYANKA SANJAY ABBAD", $options: 'i' }
      },
      { 
        $set: { 
          name: "PRIYANKA HIMANSHU CHORDIYA",
          payerName: "PRIYANKA SANJAY ABBAD",
          relationship: "tenant",
          flat: "405"
        } 
      }
    );
    console.log(`✅ Updated ${result.modifiedCount} transactions for PRIYANKA SANJAY ABBAD`);

    // 4. Make sure PRIYA 103 mapping is correct
    await LearnedMapping.findOneAndUpdate(
      { key: "priya" },
      {
        key: "priya",
        officeNumber: "103",
        ownerName: "PRIYA RAMANI",
        payerName: "PRIYA RAMANI",
        relationship: "self",
        officeType: "office",
        confidence: 10,
        examples: ["priya", "PRIYA RAMANI"]
      },
      { upsert: true, new: true }
    );
    console.log("✅ Confirmed mapping for PRIYA -> Office 103");

    // Show current state
    console.log("\n=== Current Transactions ===");
    const txns = await BankTransaction.find({ type: "credit" }).sort({ date: -1 });
    for (const t of txns) {
      console.log(`${t.date?.toLocaleDateString()} | ${t.name} | Paid by: ${t.payerName} (${t.relationship}) | Office: ${t.flat}`);
    }

    await mongoose.disconnect();
    console.log("\n✅ Done!");

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

fixPriyanka();
