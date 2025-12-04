import BankTransaction from "../models/BankTransaction.js";
import LearnedMapping from "../models/LearnedMapping.js";
import Maintenance from "../models/Maintenance.js";
import { readBankEmails } from "../services/gmailReader.js";

export const syncBankEmails = async (req, res) => {
  try {
    await readBankEmails();
    return res.json({ ok: true, message: "Emails synced successfully" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// Get member list from Maintenance collection
export const getMemberList = async (req, res) => {
  try {
    const members = await Maintenance.find({}).sort({ unit: 1 });
    
    // Parse and format the member list
    const memberList = members.map(m => {
      // Extract unit number
      const unitMatch = m.unit.match(/(\d+)/);
      const unitNum = unitMatch ? unitMatch[1] : m.unit;
      
      // Get primary owner (first name if multiple)
      const owners = (m.owner || "").split('\n').map(o => o.trim()).filter(o => o);
      const primaryOwner = owners[0] || m.owner;
      
      return {
        unit: unitNum,
        unitFull: m.unit,
        type: m.type || "office",
        owner: primaryOwner,
        allOwners: owners
      };
    }).filter(m => m.unit !== "Unit No"); // Filter out header row
    
    return res.json({ ok: true, data: memberList });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// Get all learned mappings
export const getLearnedMappings = async (req, res) => {
  try {
    const mappings = await LearnedMapping.find().sort({ officeNumber: 1 });
    return res.json({ ok: true, data: mappings });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// Train new mapping
export const trainMapping = async (req, res) => {
  try {
    const { key, officeNumber, ownerName, payerName, relationship, officeType } = req.body;

    if (!key || !officeNumber) {
      return res.status(400).json({ ok: false, message: "Key and officeNumber required" });
    }

    const searchKey = key.toLowerCase().trim();

    // Update or create mapping
    const mapping = await LearnedMapping.findOneAndUpdate(
      { key: searchKey },
      {
        key: searchKey,
        officeNumber: officeNumber.toString(),
        ownerName: ownerName || key,
        payerName: payerName || key,
        relationship: relationship || "self",
        officeType: officeType || "office",
        confidence: 10,
        $addToSet: { examples: key }
      },
      { upsert: true, new: true }
    );

    // Also update any existing transactions with this name
    await BankTransaction.updateMany(
      { 
        $or: [
          { name: { $regex: searchKey, $options: 'i' } },
          { narration: { $regex: searchKey, $options: 'i' } }
        ]
      },
      { 
        $set: { 
          flat: officeNumber.toString(),
          name: ownerName || key,
          payerName: payerName || key,
          relationship: relationship || "self"
        } 
      }
    );

    return res.json({ ok: true, message: "Mapping trained successfully", data: mapping });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// Update single transaction
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, flat, payerName, relationship } = req.body;

    const txn = await BankTransaction.findByIdAndUpdate(
      id,
      { $set: { name, flat, payerName, relationship } },
      { new: true }
    );

    if (!txn) {
      return res.status(404).json({ ok: false, message: "Transaction not found" });
    }

    return res.json({ ok: true, data: txn });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

export const getBankTransactions = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ ok: false, message: "Month & year required" });
    }

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd   = new Date(year, month, 0, 23, 59, 59);

    const data = await BankTransaction.find({
      date: { $gte: monthStart, $lte: monthEnd }
    }).sort({ date: -1 });

    return res.json({ ok: true, data });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};
