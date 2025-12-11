import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { fileURLToPath } from "url";
import monthlyStatementService from "./monthlyStatementService.js";
import { processPayment } from "./paymentProcessor.js";
import BankTransaction from "../models/BankTransaction.js";
import SyncState from "../models/SyncState.js";
import GmailToken from "../models/GmailToken.js";

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CRED_PATH = path.join(__dirname, "../credentials/google-oauth.json");

console.log("📌 OAuth Path:", CRED_PATH);
console.log("📌 Token: Loading from MongoDB");

// -------------------------------------------------------
// 1) AUTHORIZE GMAIL (LOAD TOKEN FROM MONGODB)
// -------------------------------------------------------
async function authorize() {
  const creds = JSON.parse(fs.readFileSync(CRED_PATH, "utf8"));
  const conf = creds.installed || creds.web;

  if (!conf) throw new Error("❌ google-oauth.json missing installed/web key.");

  const OAuth2 = new google.auth.OAuth2(
    conf.client_id,
    conf.client_secret,
    conf.redirect_uris[0]
  );

  // ✅ LOAD TOKEN FROM MONGODB
  const token = await GmailToken.findOne();
  if (!token) {
    throw new Error("❌ No Gmail token found in database. Please authenticate via /auth/google");
  }

  console.log("✅ Token loaded from MongoDB");

  // Convert MongoDB document to plain object for setCredentials
  OAuth2.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    scope: token.scope,
    token_type: token.token_type,
    expiry_date: token.expiry_date
  });

  return OAuth2;
}

// -------------------------------------------------------
// 2) READ BANK EMAILS (ONLY NEW EMAILS)
// -------------------------------------------------------
export async function readBankEmails() {
  try {
    const auth = await authorize();
    const gmail = google.gmail({ version: "v1", auth });

    console.log("🔄 Auto-sync: Checking new bank emails...");

    // Load previous sync state
    let state = await SyncState.findOne();
    let lastHistoryId = state?.lastHistoryId || null;

    const profile = await gmail.users.getProfile({ userId: "me" });
    const currentHistoryId = profile.data.historyId;

    // FIRST TIME SYNC
    if (!lastHistoryId) {
      console.log("📩 Initial Sync. Fetching December 2025 Emails...");

      // Fetch credit/debit emails from December 1, 2025 onwards
      const query = '("credited" OR "debited") after:2025/11/30';

      let next = null;
      let total = 0;
      let pageCount = 0;

      do {
        pageCount++;
        console.log(`📄 Fetching page ${pageCount}...`);
        
        const res = await gmail.users.messages.list({
          userId: "me",
          q: query,
          maxResults: 100, // Reduced from 500 to avoid rate limits
          pageToken: next,
        });

        if (!res.data.messages) {
          console.log("📭 No more messages found.");
          break;
        }
        
        console.log(`📧 Found ${res.data.messages.length} messages on page ${pageCount}`);

        for (const msg of res.data.messages) {
          try {
            const mail = await gmail.users.messages.get({
              userId: "me",
              id: msg.id,
              format: "full",
            });

            const snippet = mail.data.snippet || "";

            // ❗❗ NOW USING AWAIT SO MEMBER MATCHING WORKS ❗❗
            const txn = await monthlyStatementService.parseTransaction(snippet);

            if (!txn) continue;

            txn.messageId = msg.id;

            // 🔥 Process payment intelligently (split, sinking fund, interest)
            const processedTxns = await processPayment(txn);

            // Save all processed transactions
            for (const processedTxn of processedTxns) {
              await BankTransaction.updateOne(
                { messageId: msg.id, flat: processedTxn.flat },
                { $set: processedTxn },
                { upsert: true }
              );
            }

            total += processedTxns.length;
          } catch (msgErr) {
            console.error(`❌ Error processing message ${msg.id}:`, msgErr.message);
          }
        }

        next = res.data.nextPageToken;
        
        // Add a small delay between pages to avoid rate limiting
        if (next) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } while (next);

      console.log(`🔥 Initial Sync Completed. Saved: ${total} transactions`);

      await SyncState.updateOne(
        {},
        { lastHistoryId: currentHistoryId },
        { upsert: true }
      );

      return;
    }

    // -------------------------------------------------------
    // 3) NEW EMAILS ONLY (History API)
    // -------------------------------------------------------
    console.log(`📬 Checking new emails since historyId: ${lastHistoryId}...`);
    
    const history = await gmail.users.history.list({
      userId: "me",
      startHistoryId: lastHistoryId,
      historyTypes: ["messageAdded"],
    });

    let totalNew = 0;

    for (const record of history.data.history || []) {
      for (const m of record.messages || []) {
        try {
          const mail = await gmail.users.messages.get({
            userId: "me",
            id: m.id,
            format: "full",
          });

          const snippet = mail.data.snippet || "";

          // ❗❗ FIX: use await so name + flat extracted ❗❗
          const txn = await monthlyStatementService.parseTransaction(snippet);

          if (!txn) continue;

          txn.messageId = m.id;

          // 🔥 Process payment intelligently (split, sinking fund, interest)
          const processedTxns = await processPayment(txn);

          // Save all processed transactions
          for (const processedTxn of processedTxns) {
            await BankTransaction.updateOne(
              { messageId: m.id, flat: processedTxn.flat },
              { $set: processedTxn },
              { upsert: true }
            );
          }

          totalNew += processedTxns.length;
        } catch (msgErr) {
          console.error(`❌ Error processing new message ${m.id}:`, msgErr.message);
        }
      }
    }

    console.log(`🔥 New Emails Saved: ${totalNew}`);

    // Save updated historyId
    await SyncState.updateOne(
      {},
      { lastHistoryId: currentHistoryId },
      { upsert: true }
    );
  } catch (err) {
    console.error("❌ Gmail Sync Error:", err.message);
    console.error(err.stack);
    // Don't throw - let the server continue running
  }
}
