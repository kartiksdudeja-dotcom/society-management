# Bank Balance Sync Feature

This document explains how the bank balance feature works and how to use it.

## Overview

The system automatically extracts bank balances from HDFC Bank emails and displays them on the admin dashboard.

**Current Balance:** ₹3,75,953.71 (from HDFC Bank email on 11-DEC-25)

---

## How It Works

### 1. **Automatic Email Parsing**
- Cron job runs every 5 minutes: `*/5 * * * *`
- Checks for new emails in Gmail
- When a balance email is found, extracts:
  - Balance amount (₹3,75,953.71)
  - Account ending (3306)
  - Balance date (11-DEC-25)
  - Bank name (HDFC)

### 2. **Email Format Recognized**

The system parses emails with this format:

```
Dear Customer,

Greetings from HDFC Bank!

The available balance in your account ending XX3306 is Rs. INR 3,75,953.71 as of 11-DEC-25.

...
```

**Key patterns detected:**
- `"account ending XX3306"` → Account number extracted
- `"Rs. INR 3,75,953.71"` → Balance amount extracted
- `"as of 11-DEC-25"` → Date extracted
- `"HDFC"` → Bank name extracted

### 3. **Dashboard Display**

Admin users see a "Bank Balance" card at the top of the dashboard showing:
- 💰 **Amount:** ₹3,75,953.71 (formatted in Indian locale)
- 🏦 **Account:** ...3306 (showing last 4 digits only)
- 📅 **Date:** 11/12/2025 (in Indian date format)
- 🔄 **Auto-refresh:** Every 30 seconds

---

## API Endpoints

### 1. Get Latest Balance
```
GET /api/bank/balance
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "balance": 375953.71,
    "accountEnding": "3306",
    "balanceDate": "2025-12-11T00:00:00.000Z",
    "bank": "HDFC",
    "currency": "INR"
  }
}
```

### 2. Manually Sync Balance (Force Update)
```
GET /api/bank/sync-balance
```

This endpoint searches the past 30 days of emails for balance statements and updates the database.

**Response:**
```json
{
  "ok": true,
  "message": "Balance sync completed",
  "result": {
    "ok": true,
    "totalEmailsChecked": 15,
    "newBalancesSaved": 2,
    "latestBalance": {
      "balance": 375953.71,
      "accountEnding": "3306",
      "balanceDate": "2025-12-11T00:00:00.000Z",
      "bank": "HDFC"
    }
  }
}
```

---

## Manual Testing

### Test 1: Verify Balance Parsing
```bash
node scripts/testBalanceParsing.js
```

This script:
- Tests regex patterns on the HDFC email format
- Saves a test balance to the database
- Retrieves and displays all balances
- Verifies the parsing logic works correctly

**Output:**
```
✅ Balance Saved Successfully!
   Account Ending: ...XX33
   Balance: ₹3,75,953.71
   Date: 11/12/2025
   Bank: HDFC
```

### Test 2: Force Sync from Emails
```bash
node scripts/forceSyncBalance.js
```

This script:
- Loads Gmail token from database
- Searches the past 7 days for balance emails
- Parses and saves each balance found
- Shows summary and latest balance

**Output:**
```
Found 3 balance emails
Processing emails...
✅ Saved: HDFC - ₹3,75,953.71 (Account: ...3306)

Summary:
   Total emails checked: 3
   New balances saved: 1

Latest Balance in Database:
   Bank: HDFC
   Balance: ₹3,75,953.71
   Account: ...3306
   Date: 11/12/2025
```

### Test 3: Clean Up Old Balances
```bash
node scripts/cleanupBalanceData.js
```

This script:
- Shows all balance records in database
- Keeps only the latest balance
- Deletes old/test records
- Useful for removing duplicates

---

## Database Model

**Collection:** `bankbalances`

**Schema:**
```javascript
{
  _id: ObjectId,
  messageId: String,           // Gmail message ID (unique per email)
  accountEnding: String,       // "3306" or "XX33"
  balance: Number,             // 375953.71
  currency: String,            // "INR"
  balanceDate: Date,          // 2025-12-11
  bank: String,               // "HDFC"
  narration: String,          // First 500 chars of email
  createdAt: Date,            // When record was saved
  updatedAt: Date
}
```

**Indexes:**
- `balanceDate: -1` (sorted descending)
- `messageId: 1` (unique, prevents duplicates)

---

## Troubleshooting

### Issue: Balance not showing on dashboard
**Solution:**
1. Check if you're logged in as an admin
2. Manually trigger balance sync: `GET /api/bank/sync-balance`
3. Check browser console for errors
4. Verify balance exists in database: `node scripts/cleanupBalanceData.js`

### Issue: "No balance data available yet"
**Solution:**
1. HDFC Bank hasn't sent a balance email yet
2. Run force sync: `node scripts/forceSyncBalance.js`
3. Check Gmail account for balance emails (search for "balance" or "statement")

### Issue: Wrong balance amount
**Solution:**
1. Check the original email from HDFC Bank
2. Run test: `node scripts/testBalanceParsing.js`
3. Verify regex patterns are extracting correctly

### Issue: Gmail token expired
**Solution:**
1. This should auto-refresh with the token listener
2. If not working, re-authenticate: visit `/auth/google` in browser
3. Ensure `prompt: "consent"` parameter is set (forces new refresh_token)

---

## How It's Different from Collection Balance

| | Bank Balance | Collection Balance |
|---|---|---|
| **Source** | HDFC Bank emails | Manual collection entries |
| **Purpose** | Account balance tracking | Member payments tracking |
| **Update Frequency** | When bank sends email | Manual entry by admin |
| **Display Location** | Top of dashboard | Below bank balance |
| **Scope** | Entire bank account | Society members' collections |

---

## Frontend Integration

The Dashboard component auto-refreshes the balance every 30 seconds:

```javascript
// Auto-refresh balance every 30 seconds
const balanceRefreshInterval = setInterval(async () => {
  try {
    const balanceRes = await API.get("/bank/balance", {
      params: { _t: Date.now() } // Prevent caching
    });
    if (balanceRes.data.ok && balanceRes.data.data) {
      setBankBalance(balanceRes.data.data);
    }
  } catch (err) {
    console.error("Error refreshing balance:", err);
  }
}, 30000);
```

---

## Next Steps

1. ✅ Set up Gmail OAuth authentication with `prompt: "consent"`
2. ✅ Configure automatic email sync (5-minute cron)
3. ✅ Test balance parsing with real HDFC emails
4. ✅ View balance on admin dashboard
5. Monitor cron job logs for any issues
6. Set up email alerts if balance drops below threshold (future feature)

---

## Support

For issues or questions, check:
1. Backend logs: `npm start`
2. Test scripts output
3. MongoDB balance records: `node scripts/cleanupBalanceData.js`
4. Gmail API authentication status
