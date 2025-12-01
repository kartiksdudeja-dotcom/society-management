#!/usr/bin/env node
// backend_final/scripts/seedTransactions.js
// ===============================================
// Seed sample transaction data for November 2025
// ===============================================

import mongoose from "mongoose";
import BankTransaction from "../models/BankTransaction.js";
import path from "path";

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/bank-portal";

// Sample transaction data
const sampleTransactions = [
  {
    messageId: "sample-001",
    date: new Date("2025-11-01T09:30:00Z"),
    subject: "Rs. 5000 debited from your account",
    from: "alerts@hdfcbank.net",
    amount: 5000,
    type: "debit",
    name: "Raj Patel",
    vpa: "raj.patel@ybl",
    referenceNumber: "UPI123456789001",
    accountLast4: "1234",
    description: "Payment to Raj Patel",
    rawBody: "Rs. 5000 debited from your A/C 1234 on 01-Nov-2025. VPA: raj.patel@ybl. Reference: UPI123456789001",
  },
  {
    messageId: "sample-002",
    date: new Date("2025-11-02T14:45:00Z"),
    subject: "Rs. 12500 credited to your account",
    from: "noreply@alerts.hdfcbank.com",
    amount: 12500,
    type: "credit",
    name: "Salary Deposit",
    vpa: "employer@corp.com",
    referenceNumber: "NEFT987654321002",
    accountLast4: "1234",
    description: "Salary credited",
    rawBody: "Rs. 12500 credited to your A/C 1234 on 02-Nov-2025. Salary deposit. Reference: NEFT987654321002",
  },
  {
    messageId: "sample-003",
    date: new Date("2025-11-03T11:20:00Z"),
    subject: "Rs. 2500 debited from your account",
    from: "alerts@hdfcbank.net",
    amount: 2500,
    type: "debit",
    name: "Amazon Pay",
    vpa: "amazon@okhdfcbank",
    referenceNumber: "UPI123456789003",
    accountLast4: "1234",
    description: "Online purchase",
    rawBody: "Rs. 2500 debited from your A/C 1234 on 03-Nov-2025. VPA: amazon@okhdfcbank. Reference: UPI123456789003",
  },
  {
    messageId: "sample-004",
    date: new Date("2025-11-05T16:30:00Z"),
    subject: "Rs. 3000 debited from your account",
    from: "alerts@hdfcbank.net",
    amount: 3000,
    type: "debit",
    name: "Priya Sharma",
    vpa: "priya.sharma@ibl",
    referenceNumber: "UPI123456789004",
    accountLast4: "1234",
    description: "Money transfer",
    rawBody: "Rs. 3000 debited from your A/C 1234 on 05-Nov-2025. VPA: priya.sharma@ibl. Reference: UPI123456789004",
  },
  {
    messageId: "sample-005",
    date: new Date("2025-11-07T10:15:00Z"),
    subject: "Rs. 8000 credited to your account",
    from: "noreply@alerts.hdfcbank.com",
    amount: 8000,
    type: "credit",
    name: "Client Payment",
    vpa: "client@business.com",
    referenceNumber: "IMPS123456789005",
    accountLast4: "1234",
    description: "Client payment received",
    rawBody: "Rs. 8000 credited to your A/C 1234 on 07-Nov-2025. Client payment. Reference: IMPS123456789005",
  },
  {
    messageId: "sample-006",
    date: new Date("2025-11-10T13:45:00Z"),
    subject: "Rs. 1500 debited from your account",
    from: "alerts@hdfcbank.net",
    amount: 1500,
    type: "debit",
    name: "Flipkart",
    vpa: "flipkart@okhdfcbank",
    referenceNumber: "UPI123456789006",
    accountLast4: "1234",
    description: "Online shopping",
    rawBody: "Rs. 1500 debited from your A/C 1234 on 10-Nov-2025. VPA: flipkart@okhdfcbank. Reference: UPI123456789006",
  },
  {
    messageId: "sample-007",
    date: new Date("2025-11-12T09:00:00Z"),
    subject: "Rs. 25000 credited to your account",
    from: "noreply@alerts.hdfcbank.com",
    amount: 25000,
    type: "credit",
    name: "Freelance Income",
    vpa: "freelance@upay.com",
    referenceNumber: "NEFT987654321007",
    accountLast4: "1234",
    description: "Project payment",
    rawBody: "Rs. 25000 credited to your A/C 1234 on 12-Nov-2025. Freelance project payment. Reference: NEFT987654321007",
  },
  {
    messageId: "sample-008",
    date: new Date("2025-11-15T15:20:00Z"),
    subject: "Rs. 4200 debited from your account",
    from: "alerts@hdfcbank.net",
    amount: 4200,
    type: "debit",
    name: "Utilities Bill",
    vpa: "utility@company.com",
    referenceNumber: "BILL123456789008",
    accountLast4: "1234",
    description: "Utility payment",
    rawBody: "Rs. 4200 debited from your A/C 1234 on 15-Nov-2025. VPA: utility@company.com. Reference: BILL123456789008",
  },
  {
    messageId: "sample-009",
    date: new Date("2025-11-18T11:30:00Z"),
    subject: "Rs. 6500 debited from your account",
    from: "alerts@hdfcbank.net",
    amount: 6500,
    type: "debit",
    name: "Restaurant",
    vpa: "restaurant@ybl",
    referenceNumber: "UPI123456789009",
    accountLast4: "1234",
    description: "Dining out",
    rawBody: "Rs. 6500 debited from your A/C 1234 on 18-Nov-2025. VPA: restaurant@ybl. Reference: UPI123456789009",
  },
  {
    messageId: "sample-010",
    date: new Date("2025-11-20T12:00:00Z"),
    subject: "Rs. 15000 credited to your account",
    from: "noreply@alerts.hdfcbank.com",
    amount: 15000,
    type: "credit",
    name: "Tax Refund",
    vpa: "government@refund.com",
    referenceNumber: "RTGS987654321010",
    accountLast4: "1234",
    description: "Tax refund",
    rawBody: "Rs. 15000 credited to your A/C 1234 on 20-Nov-2025. Tax refund processed. Reference: RTGS987654321010",
  },
  {
    messageId: "sample-011",
    date: new Date("2025-11-22T14:15:00Z"),
    subject: "Rs. 2800 debited from your account",
    from: "alerts@hdfcbank.net",
    amount: 2800,
    type: "debit",
    name: "Insurance Premium",
    vpa: "insurance@provider.com",
    referenceNumber: "INS123456789011",
    accountLast4: "1234",
    description: "Insurance payment",
    rawBody: "Rs. 2800 debited from your A/C 1234 on 22-Nov-2025. VPA: insurance@provider.com. Reference: INS123456789011",
  },
  {
    messageId: "sample-012",
    date: new Date("2025-11-25T16:45:00Z"),
    subject: "Rs. 5500 debited from your account",
    from: "alerts@hdfcbank.net",
    amount: 5500,
    type: "debit",
    name: "Gym Membership",
    vpa: "gym@membership.com",
    referenceNumber: "REC123456789012",
    accountLast4: "1234",
    description: "Gym subscription",
    rawBody: "Rs. 5500 debited from your A/C 1234 on 25-Nov-2025. VPA: gym@membership.com. Reference: REC123456789012",
  },
  {
    messageId: "sample-013",
    date: new Date("2025-11-27T10:30:00Z"),
    subject: "Rs. 18000 credited to your account",
    from: "noreply@alerts.hdfcbank.com",
    amount: 18000,
    type: "credit",
    name: "Bonus Payment",
    vpa: "company@payroll.com",
    referenceNumber: "NEFT987654321013",
    accountLast4: "1234",
    description: "Performance bonus",
    rawBody: "Rs. 18000 credited to your A/C 1234 on 27-Nov-2025. Performance bonus. Reference: NEFT987654321013",
  },
  {
    messageId: "sample-014",
    date: new Date("2025-11-28T13:20:00Z"),
    subject: "Rs. 3500 debited from your account",
    from: "alerts@hdfcbank.net",
    amount: 3500,
    type: "debit",
    name: "Movie Ticket",
    vpa: "bookmyshow@ybl",
    referenceNumber: "UPI123456789014",
    accountLast4: "1234",
    description: "Entertainment",
    rawBody: "Rs. 3500 debited from your A/C 1234 on 28-Nov-2025. VPA: bookmyshow@ybl. Reference: UPI123456789014",
  },
];

async function seedTransactions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ Connected to MongoDB");

    // Clear existing sample transactions
    const result = await BankTransaction.deleteMany({
      messageId: { $regex: "^sample-" },
    });
    console.log(`✓ Cleared ${result.deletedCount} sample transactions`);

    // Insert new transactions
    const inserted = await BankTransaction.insertMany(sampleTransactions);
    console.log(`✓ Inserted ${inserted.length} sample transactions`);

    // Calculate summary
    const credits = sampleTransactions.filter((t) => t.type === "credit");
    const debits = sampleTransactions.filter((t) => t.type === "debit");

    const creditTotal = credits.reduce((sum, t) => sum + t.amount, 0);
    const debitTotal = debits.reduce((sum, t) => sum + t.amount, 0);

    console.log("\n═════════════════════════════════");
    console.log("November 2025 Summary:");
    console.log(`Total Credit: ₹${creditTotal.toLocaleString("en-IN")}`);
    console.log(`Total Debit:  ₹${debitTotal.toLocaleString("en-IN")}`);
    console.log(`Net Balance:  ₹${(creditTotal - debitTotal).toLocaleString("en-IN")}`);
    console.log(`Transactions: ${sampleTransactions.length}`);
    console.log("═════════════════════════════════\n");

    process.exit(0);
  } catch (err) {
    console.error("✗ Error seeding transactions:", err.message);
    process.exit(1);
  }
}

seedTransactions();
