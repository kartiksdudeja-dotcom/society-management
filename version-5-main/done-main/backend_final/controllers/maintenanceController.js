import Maintenance from "../models/Maintenance.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ------------------ Dashboard Summary (Admin Only) ------------------
export const getMaintenanceSummary = async (req, res) => {
  try {
    const totalRecords = await Maintenance.countDocuments();

    let pendingCount = 0;
    let paidCount = 0;

    // Count paid/pending for the current year table
    const all = await Maintenance.find();

    all.forEach((item) => {
      const months = item.months || {};
      const pending = item.pending || {};

      Object.keys(months).forEach((m) => {
        const due = months[m] || 0;
        const pend = pending[m] || 0;

        if (pend === 0 && due > 0) paidCount++;
        else if (pend > 0) pendingCount++;
      });
    });

    res.json({
      totalBills: totalRecords,
      pendingBills: pendingCount,
      paidBills: paidCount
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ------------------ Logged-In User's Maintenance ------------------
export const getUserMaintenance = async (req, res) => {
  try {
    const userFlat = req.user.FlatNumber; // from JWT
    const data = await Maintenance.find({ unit: userFlat });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ------------------ Admin: Get All Maintenance ------------------
export const getAllMaintenance = async (req, res) => {
  try {
    const data = await Maintenance.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ------------------ Save Entire Table to MongoDB ------------------
export const saveMaintenance = async (req, res) => {
  try {
    const { table } = req.body;

    if (!Array.isArray(table)) {
      return res.status(400).json({ message: "Invalid table format" });
    }

    // If a year is provided, only replace rows that belong to that year
    const { year } = req.query;

    if (year) {
      const yearStr = String(year);

      // Find docs for the provided year and remove them
      const all = await Maintenance.find();
      const toDelete = all
        .filter((d) => Object.keys(d.months || {}).some((k) => k.includes(yearStr)))
        .map((d) => d._id);

      if (toDelete.length) {
        await Maintenance.deleteMany({ _id: { $in: toDelete } });
      }
    } else {
      // No year provided — old behaviour: replace entire collection
      await Maintenance.deleteMany({});
    }

    // Insert the new table (assumed to contain rows for the year being saved)
    await Maintenance.insertMany(table);

    res.json({ message: "Maintenance data saved successfully!" });

  } catch (err) {
    console.log("SAVE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};


// DEBUG: Get count and sample of all maintenance records
export const getMaintenanceDebug = async (req, res) => {
  try {
    const total = await Maintenance.countDocuments();
    const sample = await Maintenance.find().limit(5);
    
    console.log("=== DEBUG INFO ===");
    console.log(`Total records: ${total}`);
    console.log("Sample records:");
    sample.forEach((doc, idx) => {
      console.log(`  [${idx}] unit: ${doc.unit}, months keys: ${Object.keys(doc.months || {}).join(", ")}`);
    });
    
    res.json({
      total,
      sample: sample.map(s => ({
        unit: s.unit,
        owner: s.owner,
        monthKeys: Object.keys(s.months || {})
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ------------------ Load Saved Table From MongoDB ------------------
// Supports optional query param `year` (e.g. /get?year=2025) to return only
// records where the `months` object contains month keys for that year
export const getMaintenance = async (req, res) => {
  try {
    const { year } = req.query;

    // Fetch all records and filter server-side if year is provided
    let data = await Maintenance.find();

    console.log(`[GET /maintenance] Total records in DB: ${data.length}, Year filter: ${year}`);

    if (year) {
      const yearStr = String(year);
      data = data.filter((doc) => {
        const months = doc.months || {};
        const monthKeys = Object.keys(months);
        const hasYear = monthKeys.some((k) => k.includes(yearStr));
        
        // Log first few records to debug
        if (data.indexOf(doc) < 3) {
          console.log(`  Doc: ${doc.unit}, months: [${monthKeys.join(", ")}], hasYear(${yearStr}): ${hasYear}`);
        }
        
        return hasYear;
      });
      console.log(`[GET /maintenance] Filtered to ${data.length} records for year ${year}`);
    }

    res.json(data);
  } catch (err) {
    console.error("[GET /maintenance] Error:", err);
    res.status(500).json({ message: err.message });
  }
};


// ------------------ Serve Excel File to Frontend ------------------
export const getExcelFile = (req, res) => {
  const filePath = path.join(__dirname, "../excel/maintenance-2024.xlsx");
  res.sendFile(filePath);
};
