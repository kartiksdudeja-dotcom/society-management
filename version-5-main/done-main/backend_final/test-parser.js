/**
 * Quick Test: Bank Transaction Parser
 * 
 * Run this to verify the parser works correctly
 * 
 * Usage:
 * node test-parser.js
 */

import { extractTransactionDetails } from "./services/gmailHelper.js";

// Test emails
const testEmails = [
  {
    name: "HDFC UPI Debit",
    subject: "HDFC Bank Alert",
    body: `Dear Customer,

Rs.110.00 has been debited from account 6169 to VPA gpay123@ybl KAILASH MANGARAM DHANWANI on 01-11-25.

Your UPI transaction reference number is 530746181005.

Thank you for banking with HDFC Bank.`,
    expected: {
      type: "debit",
      amount: 110,
      vpa: "gpay123@ybl",
      name: "KAILASH MANGARAM DHANWANI",
      referenceNumber: "530746181005",
    },
  },
  {
    name: "HDFC UPI Credit",
    subject: "Money Received",
    body: `Dear Customer,

Rs. 5000.00 has been credited to your account 6169 by VPA rajesh.patel@hdfc RAJESH KUMAR PATEL on 15-11-25.

Your UPI transaction reference number is 123456789012.

Balance: Rs. 50,000.00`,
    expected: {
      type: "credit",
      amount: 5000,
      vpa: "rajesh.patel@hdfc",
      name: "RAJESH KUMAR PATEL",
      referenceNumber: "123456789012",
    },
  },
  {
    name: "HDFC ATM Withdrawal",
    subject: "Cash Withdrawal Alert",
    body: `Rs. 2000.00 has been withdrawn from ATM at Mumbai on 20-11-25.
Available balance: Rs. 48,000.00`,
    expected: null, // No VPA, should fail
  },
  {
    name: "NEFT Credit",
    subject: "NEFT Received",
    body: `Dear Customer,
Rs. 25000.00 has been credited from NEFT Cr-HDF123-ACME CORPORATION LIMITED on 10-11-25.
Reference: 789012345678`,
    expected: {
      type: "credit",
      amount: 25000,
      vpa: null,
      name: "ACME CORPORATION LIMITED",
      referenceNumber: "789012345678",
    },
  },
];

// Test function
function runTests() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  BANK TRANSACTION PARSER - TEST SUITE                     ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  let passed = 0;
  let failed = 0;

  testEmails.forEach((test, idx) => {
    console.log(`Test ${idx + 1}: ${test.name}`);
    console.log("─".repeat(60));

    const result = extractTransactionDetails(test.body, test.subject);

    if (test.expected === null) {
      if (result === null) {
        console.log("✅ PASS - Correctly rejected invalid email");
        passed++;
      } else {
        console.log("❌ FAIL - Should have returned null");
        console.log("  Got:", result);
        failed++;
      }
    } else {
      let allMatch = true;
      const checks = [];

      // Check each field
      if (result?.type !== test.expected.type) {
        checks.push(`❌ type: expected "${test.expected.type}", got "${result?.type}"`);
        allMatch = false;
      } else {
        checks.push(`✅ type: ${result.type}`);
      }

      if (result?.amount !== test.expected.amount) {
        checks.push(`❌ amount: expected ${test.expected.amount}, got ${result?.amount}`);
        allMatch = false;
      } else {
        checks.push(`✅ amount: ${result.amount}`);
      }

      if (result?.vpa !== test.expected.vpa) {
        checks.push(`❌ vpa: expected "${test.expected.vpa}", got "${result?.vpa}"`);
        allMatch = false;
      } else {
        checks.push(`✅ vpa: ${result.vpa || "(null)"}`);
      }

      if (result?.name !== test.expected.name) {
        checks.push(`❌ name: expected "${test.expected.name}", got "${result?.name}"`);
        allMatch = false;
      } else {
        checks.push(`✅ name: ${result.name || "(null)"}`);
      }

      if (result?.referenceNumber !== test.expected.referenceNumber) {
        checks.push(
          `❌ referenceNumber: expected "${test.expected.referenceNumber}", got "${result?.referenceNumber}"`
        );
        allMatch = false;
      } else {
        checks.push(`✅ referenceNumber: ${result.referenceNumber || "(null)"}`);
      }

      checks.forEach(check => console.log("  " + check));

      if (allMatch) {
        console.log("\n✅ PASS - All fields match");
        passed++;
      } else {
        console.log("\n❌ FAIL - Some fields don't match");
        failed++;
      }
    }

    console.log();
  });

  // Summary
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log(`║  SUMMARY: ${passed} passed, ${failed} failed                        ║`);
  console.log("╚════════════════════════════════════════════════════════════╝");

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests();
