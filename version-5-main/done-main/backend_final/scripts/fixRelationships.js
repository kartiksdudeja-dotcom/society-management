// Script to fix relationship and clean up data
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import BankTransaction from "../models/BankTransaction.js";

const MONGO_URI = process.env.MONGO_URI;

async function fixData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Fix Office 111 - Rachna Daraka is wife
    const result111 = await BankTransaction.updateMany(
      { flat: "111" },
      { 
        $set: { 
          relationship: "wife"
        } 
      }
    );
    console.log(`Office 111: Updated ${result111.modifiedCount} transactions`);

    // For others where payer = owner name, set relationship to "self"
    const transactions = await BankTransaction.find({ type: "credit" });
    
    for (const txn of transactions) {
      // If payer name matches owner name (similar), set to self
      const ownerLower = (txn.name || "").toLowerCase();
      const payerLower = (txn.payerName || "").toLowerCase();
      
      // Check if they're similar (one contains the other)
      if (payerLower.includes(ownerLower.split(" ")[0]) || 
          ownerLower.includes(payerLower.split(" ")[0])) {
        // Likely same person
        if (txn.flat !== "111") { // Skip 111 which we know is wife
          await BankTransaction.updateOne(
            { _id: txn._id },
            { $set: { relationship: "self" } }
          );
          console.log(`Fixed ${txn.flat}: ${txn.name} -> self`);
        }
      }
    }

    console.log("\n✅ Done!");
    await mongoose.disconnect();

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

fixData();
