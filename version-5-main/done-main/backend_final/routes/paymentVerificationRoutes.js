import express from "express";
import PaymentVerification from "../models/PaymentVerification.js";
import User from "../models/User.js";
import BankTransaction from "../models/BankTransaction.js";
import MonthlyExpense from "../models/MonthlyExpense.js";
import uploadFileToFirebase from "../utils/firebaseStorage.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Setup multer for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({
  dest: path.join(__dirname, "../uploads/payment-proofs"),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, GIF, and PDF files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ========== USER ROUTES ==========

/**
 * Submit payment proof
 * POST /payment-verifications/submit
 * Body: { flat, ownerName, amount, monthYear, paymentDetails (optional), file }
 */
router.post("/submit", upload.single("proofImage"), async (req, res) => {
  try {
    const { flat, ownerName, amount, monthYear, paymentDetails } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Payment proof image is required" });
    }

    if (!flat || !ownerName || !amount || !monthYear) {
      return res.status(400).json({ error: "Missing required fields: flat, ownerName, amount, monthYear" });
    }

    // Upload file to Firebase Storage
    let proofImageUrl = "";
    try {
      proofImageUrl = await uploadFileToFirebase(req.file);
    } catch (uploadError) {
      console.error("Firebase upload error:", uploadError);
      return res.status(500).json({ error: "Failed to upload payment proof. Please try again." });
    }

    // Create payment verification record
    const paymentVerification = new PaymentVerification({
      userId,
      flat,
      ownerName,
      amount: parseFloat(amount),
      monthYear,
      proofImageUrl,
      paymentDetails: paymentDetails ? JSON.parse(paymentDetails) : {},
      status: "pending",
    });

    await paymentVerification.save();

    res.status(201).json({
      message: "Payment proof submitted successfully",
      data: paymentVerification,
    });
  } catch (error) {
    console.error("Submit payment proof error:", error);
    res.status(500).json({ error: error.message || "Failed to submit payment proof" });
  }
});

/**
 * Get user's pending payment verifications
 * GET /payment-verifications/my-submissions
 */
router.get("/my-submissions", async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const submissions = await PaymentVerification.find({ userId }).sort({ submittedAt: -1 });

    res.json({ data: submissions });
  } catch (error) {
    console.error("Get my submissions error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========== MANAGER/ADMIN ROUTES ==========

/**
 * Get all pending payment verifications (Manager/Admin only)
 * GET /payment-verifications/pending
 */
router.get("/pending", async (req, res) => {
  try {
    const role = (req.user?.role || "user").toString().trim().toLowerCase();
    const isManagerOrAdmin = role === "admin" || role === "manager" || role === "1";

    if (!isManagerOrAdmin) {
      return res.status(403).json({ error: "Only managers and admins can access this" });
    }

    const pending = await PaymentVerification.find({ status: "pending" })
      .sort({ submittedAt: -1 })
      .populate("userId", "name email");

    res.json({ data: pending });
  } catch (error) {
    console.error("Get pending verifications error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve payment verification and add to monthly collection
 * POST /payment-verifications/:id/approve
 * Body: { notes (optional) }
 */
router.post("/:id/approve", async (req, res) => {
  try {
    const role = (req.user?.role || "user").toString().trim().toLowerCase();
    const isManagerOrAdmin = role === "admin" || role === "manager" || role === "1";

    if (!isManagerOrAdmin) {
      return res.status(403).json({ error: "Only managers and admins can approve payments" });
    }

    const { id } = req.params;
    const { notes } = req.body;

    const verification = await PaymentVerification.findById(id);

    if (!verification) {
      return res.status(404).json({ error: "Payment verification not found" });
    }

    if (verification.status !== "pending") {
      return res.status(400).json({ error: "This payment is already processed" });
    }

    // Update verification status
    verification.status = "approved";
    verification.approvedBy = {
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      approvedAt: new Date(),
    };

    await verification.save();

    // Automatically add to monthly collection (BankTransaction)
    // This makes it appear as a "Paid" transaction in the system
    const bankTransaction = new BankTransaction({
      reference_no: `PROOF-${verification._id}`,
      narration: `Payment proof approved - ${verification.ownerName}`,
      name: verification.ownerName,
      payerName: verification.ownerName,
      flat: verification.flat,
      vpa: "payment-proof@verified",
      date: new Date(),
      amount: verification.amount,
      type: "credit",
      closingBalance: 0, // Will be calculated later
    });

    await bankTransaction.save();

    // Link the bank transaction to payment verification
    verification.bankTransactionId = bankTransaction._id;
    await verification.save();

    res.json({
      message: "Payment approved and added to collection",
      data: verification,
      bankTransaction,
    });
  } catch (error) {
    console.error("Approve payment error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reject payment verification
 * POST /payment-verifications/:id/reject
 * Body: { rejectionReason }
 */
router.post("/:id/reject", async (req, res) => {
  try {
    const role = (req.user?.role || "user").toString().trim().toLowerCase();
    const isManagerOrAdmin = role === "admin" || role === "manager" || role === "1";

    if (!isManagerOrAdmin) {
      return res.status(403).json({ error: "Only managers and admins can reject payments" });
    }

    const { id } = req.params;
    const { rejectionReason } = req.body;

    const verification = await PaymentVerification.findById(id);

    if (!verification) {
      return res.status(404).json({ error: "Payment verification not found" });
    }

    if (verification.status !== "pending") {
      return res.status(400).json({ error: "This payment is already processed" });
    }

    verification.status = "rejected";
    verification.rejectionReason = rejectionReason || "No reason provided";
    verification.approvedBy = {
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      approvedAt: new Date(),
    };

    await verification.save();

    res.json({
      message: "Payment verification rejected",
      data: verification,
    });
  } catch (error) {
    console.error("Reject payment error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all payment verifications (filter by status)
 * GET /payment-verifications?status=pending|approved|rejected
 */
router.get("/", async (req, res) => {
  try {
    const role = (req.user?.role || "user").toString().trim().toLowerCase();
    const isManagerOrAdmin = role === "admin" || role === "manager" || role === "1";

    if (!isManagerOrAdmin) {
      return res.status(403).json({ error: "Only managers and admins can access this" });
    }

    const { status } = req.query;
    const filter = status ? { status } : {};

    const verifications = await PaymentVerification.find(filter)
      .sort({ submittedAt: -1 })
      .populate("userId", "name email");

    res.json({ data: verifications });
  } catch (error) {
    console.error("Get verifications error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
