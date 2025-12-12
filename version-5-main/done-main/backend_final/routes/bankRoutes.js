import express from "express";
import { syncBankEmails, syncBalanceEmails, getBankTransactions, getBankBalance, trainMapping, getLearnedMappings, updateTransaction, getMemberList } from "../controllers/bankController.js";

const router = express.Router();

// GET /api/bank?month=1&year=2025
router.get("/", getBankTransactions);

// GET /api/bank/balance
router.get("/balance", getBankBalance);

// GET /api/bank/sync - sync all emails (transactions + balance)
router.get("/sync", syncBankEmails);

// GET /api/bank/sync-balance - force sync balance from emails
router.get("/sync-balance", syncBalanceEmails);

// Learned Mappings
router.get("/mappings", getLearnedMappings);
router.post("/train", trainMapping);
router.put("/transaction/:id", updateTransaction);

// Member list from Maintenance collection
router.get("/members", getMemberList);

export default router;
