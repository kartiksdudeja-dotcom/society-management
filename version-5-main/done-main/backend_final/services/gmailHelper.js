// ======================================================
// gmailHelper.js - FINAL UPDATED VERSION
// ======================================================

import fs from "fs";
import { google } from "googleapis";
import GmailToken from "../models/GmailToken.js";

// Gmail OAuth Scopes
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const CRED_PATH = "./credentials/google-oauth.json";

// Valid HDFC senders
export const HDFC_SENDERS = [
  "alerts@hdfcbank.net",
  "noreply@alerts.hdfcbank.com",
  "noreply@hdfcbank.net",
  "hdfcbankalerts@hdfcbank.com",
  "noreply@upi.com",
];

// Gmail categories
export const GMAIL_CATEGORIES = [
  "INBOX",
  "CATEGORY_UPDATES",
  "CATEGORY_PROMOTIONS",
  "CATEGORY_FORUMS",
];

// ======================================================
// Load OAuth Credentials
// ======================================================
function loadCredentials() {
  try {
    const content = fs.readFileSync(CRED_PATH);
    return JSON.parse(content);
  } catch (err) {
    throw new Error("Failed to load Google OAuth credentials");
  }
}

// ======================================================
// Create OAuth Client
// ======================================================
function createOAuthClient() {
  const creds = loadCredentials();
  const cfg = creds.installed || creds.web;

  if (!cfg) throw new Error("Invalid credentials: missing installed/web");

  return new google.auth.OAuth2(
    cfg.client_id,
    cfg.client_secret,
    cfg.redirect_uris[0]
  );
}

// ======================================================
// Load Saved Token (FROM MONGODB)
// ======================================================
async function loadSavedToken() {
  try {
    const token = await GmailToken.findOne();
    return token;
  } catch (err) {
    console.log("Token load error:", err.message);
  }
  return null;
}

// ======================================================
// Gmail API Instance
// ======================================================
export async function getGmailService() {
  const auth = createOAuthClient();
  const token = await loadSavedToken();

  if (!token) throw new Error("No Gmail token — Authenticate at /auth/google");

  auth.setCredentials(token);
  return google.gmail({ version: "v1", auth });
}

// ======================================================
// FIXED QUERY FOR NOVEMBER 2025 ONLY
// ======================================================
function buildGmailQuery() {
  // Query for TRANSACTION emails from HDFC
  // Look for emails with transaction-related keywords in subject or body
  return `from:alerts@hdfcbank.net OR from:noreply@alerts.hdfcbank.com
          OR from:alerts.hdfcbank.com
          OR from:hdfcbankalerts@hdfcbank.com
          OR from:noreply@upi.com
          AND after:2025/10/31 
          AND before:2025/12/01`;
}

// ======================================================
// MASTER FUNCTION — Extract Transaction Details
// ======================================================
function extractTransactionDetails(bodyText, subject = "") {
  if (!bodyText) return null;

  const text = bodyText + " " + subject;

  // Reject non-transaction emails
  const rejectPatterns = [
    /OTP/i,
    /login/i,
    /password/i,
    /PIN/i,
    /netbanking/i,
    /secure/i,
    /verification/i,
    /blocked/i,
    /attempt/i,
    /congratulations/i,
    /update your/i,
    /set.{0,5}up/i,
  ];
  if (rejectPatterns.some((p) => p.test(text))) return null;

  // ----------------------------
  // AMOUNT
  // ----------------------------
  let amountMatch =
    text.match(/Rs\.?\s*([0-9,]+\.?\d*)/i) ||
    text.match(/₹\s*([0-9,]+\.?\d*)/i) ||
    text.match(/INR\s*([0-9,]+\.?\d*)/i) ||
    text.match(/Amount[:\s]+Rs\.?\s*([0-9,]+\.?\d*)/i);

  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
  if (!amount || amount <= 0) return null;

  // ----------------------------
  // TYPE (Debit / Credit)
  // ----------------------------
  let type = "unknown";

  const creditKeywords = [
    /credited/i,
    /received/i,
    /deposit/i,
    /added/i,
    /refund/i,
    /reversed/i,
    /inward/i,
  ];

  const debitKeywords = [
    /debited/i,
    /debit/i,
    /paid/i,
    /sent/i,
    /transfer/i,
    /withdrawal/i,
    /outward/i,
  ];

  if (creditKeywords.some((p) => p.test(text))) type = "credit";
  if (debitKeywords.some((p) => p.test(text))) type = "debit";

  if (type === "unknown") return null;

  // ----------------------------
  // VPA
  // ----------------------------
  let vpaMatch =
    text.match(/VPA\s*[:\-]?\s*([a-zA-Z0-9@._\-]+)/i) ||
    text.match(/([a-zA-Z0-9._\-]+@[a-zA-Z0-9._\-]+)/i) ||
    text.match(/UPI\s*[:\-]?\s*([a-zA-Z0-9@._\-]+)/i);

  if (!vpaMatch) return null;

  const vpa = vpaMatch[1].toLowerCase();

  // ----------------------------
  // NAME (Full Name after VPA)
  // ----------------------------
  let name = null;

  let nameMatch =
    text.match(/VPA\s+[a-zA-Z0-9@._\-]+\s+([A-Z][A-Z\s]{3,100})\s+on/i) ||
    text.match(/VPA\s+[a-zA-Z0-9@._\-]+\s+-\s+([A-Z][A-Z\s]{3,100})/i) ||
    text.match(/VPA\s+[a-zA-Z0-9@._\-]+\s+([A-Z][A-Z\s]{3,100})/i) ||
    text.match(/by\s+VPA\s+[a-zA-Z0-9@._\-]+\s+([A-Z][A-Z\s]{3,100})/i) ||
    text.match(/Name\s*[:\-]?\s*([A-Z][A-Za-z\s]+)/i);

  if (nameMatch) {
    name = nameMatch[1].replace(/\s+/g, " ").trim();
  }

  // fallback: extract name from vpa
  if (!name || name.length < 2) {
    const possible = vpa.split("@")[0].match(/[a-z]+/gi);
    if (possible && possible.length > 0) {
      name = possible
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
    } else {
      name = vpa.split("@")[0]; // fallback to vpa prefix
    }
  }

  // ----------------------------
  // REF NUMBER (Try multiple patterns)
  // ----------------------------
  let refMatch =
    text.match(/reference\s+number\s+is\s+([0-9A-Z]{8,20})/i) ||
    text.match(/reference[:\s]+([0-9A-Z]{8,20})/i) ||
    text.match(/RRN[:\s]+([0-9A-Z]{8,20})/i) ||
    text.match(/UTR[:\s]+([0-9A-Z]{8,20})/i) ||
    text.match(/Ref[:\s]+([0-9A-Z]{8,20})/i) ||
    text.match(/transaction\s+id[:\s]+([0-9A-Z]{8,20})/i) ||
    text.match(/txn[.\s]+id[:\s]+([0-9A-Z]{8,20})/i) ||
    text.match(/Trans[.]*[:\s]+([0-9A-Z]{8,20})/i) ||
    text.match(/Ref[.]*[:\s]+([0-9A-Z]{8,20})/i) ||
    // Extract from patterns like "1234567890123456" (12+ digits)
    text.match(/[^a-zA-Z0-9]([0-9]{12,20})[^a-zA-Z0-9]/);

  if (!refMatch) return null;
  
  let referenceNumber = refMatch[1];
  if (!referenceNumber || referenceNumber.length < 8) return null;

  // ----------------------------
  // DATE
  // ----------------------------
  let dateMatch = text.match(/(\d{2})-(\d{2})-(\d{2})/);
  let date = new Date();

  if (dateMatch) {
    let [_, dd, mm, yy] = dateMatch;
    const year = yy > 50 ? 1900 + parseInt(yy) : 2000 + parseInt(yy);
    date = new Date(year, mm - 1, dd);
  }

  return {
    type,
    amount,
    vpa,
    name,
    referenceNumber,
    date: date.toISOString().split("T")[0],
  };
}

// ======================================================
// VALIDATION: Must include all fields
// ======================================================
function isValidTransaction(parsed) {
  if (!parsed) return false;
  if (!parsed.type) return false;
  if (!parsed.amount) return false;
  if (!parsed.vpa) return false;
  if (!parsed.referenceNumber) return false;
  if (!parsed.date) return false;
  return true;
}

// ======================================================
// EXPORTS
// ======================================================
export {
  createOAuthClient,
  loadSavedToken,
  loadCredentials,
  buildGmailQuery,
  extractTransactionDetails,
  isValidTransaction,
};
