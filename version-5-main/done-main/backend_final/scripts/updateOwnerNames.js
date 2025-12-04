// Script to update existing transactions with proper owner names from Maintenance collection
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import BankTransaction from "../models/BankTransaction.js";
import Maintenance from "../models/Maintenance.js";
import LearnedMapping from "../models/LearnedMapping.js";

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

async function updateTransactions() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all maintenance records (member list)
    const members = await Maintenance.find({});
    console.log(`📋 Found ${members.length} members`);

    // Build a lookup map: unitNumber -> ownerName
    const ownerMap = {};
    for (const m of members) {
      const unitNum = extractUnitNumber(m.unit);
      if (unitNum) {
        ownerMap[unitNum] = getPrimaryOwner(m.owner);
      }
    }
    console.log("Owner Map:", Object.keys(ownerMap).length, "entries");

    // Get all transactions with flat numbers
    const transactions = await BankTransaction.find({ flat: { $exists: true, $ne: null } });
    console.log(`📊 Found ${transactions.length} transactions with flat numbers`);

    let updated = 0;
    for (const txn of transactions) {
      const unitNum = txn.flat;
      const properOwnerName = ownerMap[unitNum];

      if (properOwnerName && txn.name !== properOwnerName) {
        // Store original name as payerName if not already set
        const payerName = txn.payerName || txn.name;
        
        await BankTransaction.updateOne(
          { _id: txn._id },
          { 
            $set: { 
              name: properOwnerName,
              payerName: payerName,
              relationship: payerName !== properOwnerName ? "relative" : "self"
            } 
          }
        );
        
        console.log(`Updated: ${txn.flat} - "${txn.name}" -> "${properOwnerName}" (Paid by: ${payerName})`);
        updated++;
      }
    }

    console.log(`\n✅ Updated ${updated} transactions with proper owner names`);

    // Also update LearnedMappings with proper names
    const mappings = await LearnedMapping.find({});
    let mappingUpdated = 0;
    
    for (const mapping of mappings) {
      const properOwnerName = ownerMap[mapping.officeNumber];
      if (properOwnerName && mapping.ownerName !== properOwnerName) {
        await LearnedMapping.updateOne(
          { _id: mapping._id },
          { 
            $set: { 
              ownerName: properOwnerName,
              payerName: mapping.payerName || mapping.key
            } 
          }
        );
        console.log(`Mapping Updated: ${mapping.officeNumber} - "${mapping.ownerName}" -> "${properOwnerName}"`);
        mappingUpdated++;
      }
    }

    console.log(`\n✅ Updated ${mappingUpdated} learned mappings with proper owner names`);

    await mongoose.disconnect();
    console.log("✅ Done!");

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

updateTransactions();
