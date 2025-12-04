import express from "express";
import { syncBankEmails, getBankTransactions, trainMapping, getLearnedMappings, updateTransaction, getMemberList } from "../controllers/bankController.js";

const router = express.Router();

// GET /api/bank?month=1&year=2025
router.get("/", getBankTransactions);

// Sync Gmail
router.get("/sync", syncBankEmails);

// Learned Mappings
router.get("/mappings", getLearnedMappings);
router.post("/train", trainMapping);
router.put("/transaction/:id", updateTransaction);

// Member list from Maintenance collection
router.get("/members", getMemberList);

export default router;
