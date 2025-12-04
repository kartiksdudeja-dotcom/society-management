// Script to check current transaction data
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import BankTransaction from "../models/BankTransaction.js";
import Maintenance from "../models/Maintenance.js";

const MONGO_URI = process.env.MONGO_URI;

// Get primary owner (first name)
function getPrimaryOwner(ownerStr) {
  if (!ownerStr) return null;
  const owners = ownerStr.split('\n').map(o => o.trim()).filter(o => o);
  return owners[0] || ownerStr;
}

// Extract unit number
function extractUnitNumber(unitStr) {
  if (!unitStr) return null;
  const match = unitStr.match(/(\d+)/);
  return match ? match[1] : null;
}

async function checkData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all transactions
    const transactions = await BankTransaction.find({ type: "credit" }).sort({ date: -1 });
    
    console.log("=== Current Bank Transactions ===\n");
    for (const txn of transactions) {
      console.log(`Date: ${txn.date?.toLocaleDateString()}`);
      console.log(`  Name (Owner): ${txn.name}`);
      console.log(`  PayerName: ${txn.payerName || "(not set)"}`);
      console.log(`  Relationship: ${txn.relationship || "(not set)"}`);
      console.log(`  Flat: ${txn.flat || "(not set)"}`);
      console.log(`  Amount: ₹${txn.amount}`);
      console.log("");
    }

    // Show what member data looks like for comparison
    console.log("\n=== Member List Sample (for comparison) ===\n");
    const members = await Maintenance.find({}).limit(10);
    for (const m of members) {
      const unitNum = extractUnitNumber(m.unit);
      console.log(`${m.unit} (${unitNum}): ${getPrimaryOwner(m.owner)}`);
    }

    await mongoose.disconnect();

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

checkData();
