import BankTransaction from "../models/BankTransaction.js";
import { readBankEmails } from "../services/gmailReader.js";

export const syncBankEmails = async (req, res) => {
  try {
    await readBankEmails();
    return res.json({ ok: true, message: "Emails synced successfully" });
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
