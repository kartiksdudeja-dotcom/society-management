import express from "express";
import { syncBankEmails, getBankTransactions } from "../controllers/bankController.js";

const router = express.Router();

// GET /api/bank?month=1&year=2025
router.get("/", getBankTransactions);

// Sync Gmail
router.get("/sync", syncBankEmails);

export default router;
