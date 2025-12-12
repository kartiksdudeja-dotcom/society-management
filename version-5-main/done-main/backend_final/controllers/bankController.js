import BankTransaction from "../models/BankTransaction.js";
import BankBalance from "../models/BankBalance.js";
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
    const { month, year, flat, type, limit, offset } = req.query;

    let query = {};

    // Filter by month and year if provided
    if (month && year) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: monthStart, $lte: monthEnd };
      console.log(`[GET /bank] Fetching transactions for ${year}-${String(month).padStart(2, '0')}`);
    } else {
      console.log(`[GET /bank] Fetching ALL transactions`);
    }

    // Filter by flat number if provided
    if (flat) {
      query.flat = flat;
      console.log(`[GET /bank] Filtering by flat: ${flat}`);
    }

    // Filter by type (credit/debit) if provided
    if (type && ['credit', 'debit'].includes(type)) {
      query.type = type;
      console.log(`[GET /bank] Filtering by type: ${type}`);
    }

    // Total count
    const totalCount = await BankTransaction.countDocuments(query);

    // Apply pagination if provided
    let dbQuery = BankTransaction.find(query).sort({ date: -1 });
    
    if (limit) {
      dbQuery = dbQuery.limit(parseInt(limit));
    }
    if (offset) {
      dbQuery = dbQuery.skip(parseInt(offset));
    }

    const data = await dbQuery;

    // Calculate statistics
    const creditTxns = data.filter(t => t.type === 'credit');
    const debitTxns = data.filter(t => t.type === 'debit');

    const creditTotal = creditTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
    const debitTotal = debitTxns.reduce((sum, t) => sum + (t.amount || 0), 0);

    console.log(`[GET /bank] Total records in DB: ${totalCount}, Year filter: ${year || 'undefined'}`);

    return res.json({
      ok: true,
      stats: {
        totalCount,
        creditCount: creditTxns.length,
        debitCount: debitTxns.length,
        creditTotal,
        debitTotal,
        netTotal: creditTotal - debitTotal
      },
      data,
      pagination: {
        limit: limit ? parseInt(limit) : null,
        offset: offset ? parseInt(offset) : null
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};

// Get latest bank balance
export const getBankBalance = async (req, res) => {
  try {
    console.log(`[GET /bank/balance] Fetching latest balance`);

    // Get the most recent balance
    const latestBalance = await BankBalance.findOne()
      .sort({ balanceDate: -1 })
      .limit(1);

    if (!latestBalance) {
      console.log(`[GET /bank/balance] No balance found`);
      return res.json({
        ok: true,
        data: null,
        message: "No balance data available yet"
      });
    }

    console.log(`[GET /bank/balance] Found: ₹${latestBalance.balance.toLocaleString('en-IN')} (${latestBalance.accountEnding})`);

    return res.json({
      ok: true,
      data: {
        balance: latestBalance.balance,
        accountEnding: latestBalance.accountEnding,
        balanceDate: latestBalance.balanceDate,
        bank: latestBalance.bank,
        currency: latestBalance.currency
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message });
  }
};
