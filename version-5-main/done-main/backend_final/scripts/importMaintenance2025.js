// Simple script to import 2025 maintenance data into MongoDB
// Run: node scripts/importMaintenance2025.js

import dotenv from "dotenv";
import mongoose from "mongoose";
import Maintenance from "../models/Maintenance.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config({ path: ".env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to your JSON file
const jsonFilePath = path.join(__dirname, "../maintenance_2025_pending.json");

async function importData() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB Connected");

    // Read JSON
    console.log("Reading JSON file...");
    const rawData = fs.readFileSync(jsonFilePath, "utf-8");
    const records = JSON.parse(rawData);
    console.log(`✓ Read ${records.length} records from JSON`);

    // Filter out the placeholder header row
    const validRecords = records.filter(r => {
      const unit = (r.unit || "").toLowerCase().trim();
      const owner = (r.owner || "").toLowerCase().trim();
      return unit !== "unit no" && owner !== "owner name";
    });
    console.log(`✓ Filtered to ${validRecords.length} valid records (removed headers)`);

    // Clean up each record (remove MongoDB internal fields if present)
    const cleanRecords = validRecords.map(r => ({
      unit: r.unit || "",
      owner: r.owner || "",
      type: r.type || "other",
      months: r.months || {},
      pending: r.pending || {},
      extra: r.extra || ""
    }));

    // Option 1: DELETE all 2025 records first, then insert
    // This ensures we have a clean import without duplicates
    console.log("Deleting existing 2025 records...");
    const yearStr = "2025";
    const all = await Maintenance.find();
    const toDelete = all
      .filter(d => Object.keys(d.months || {}).some(k => k.includes(yearStr)))
      .map(d => d._id);
    
    if (toDelete.length > 0) {
      await Maintenance.deleteMany({ _id: { $in: toDelete } });
      console.log(`✓ Deleted ${toDelete.length} existing 2025 records`);
    } else {
      console.log("✓ No existing 2025 records found");
    }

    // Insert new records
    console.log("Inserting 2025 records...");
    const result = await Maintenance.insertMany(cleanRecords);
    console.log(`✓ Successfully inserted ${result.length} records into MongoDB`);

    // Verify
    const count = await Maintenance.countDocuments();
    console.log(`✓ Total records in DB: ${count}`);

    console.log("\n✅ Import complete! 2025 data is now in MongoDB.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Import failed:", err.message);
    process.exit(1);
  }
}

importData();
