# MongoDB Connection & Email Sync Fix Guide

## 🎯 QUICK CHECKLIST - DO THIS NOW

### Step 1: Update Render Environment Variables
1. Go to: https://dashboard.render.com
2. Click your project: **society-management**
3. Click **Environment** (or Settings → Environment)
4. Find `MONGO_URI` and set it to:
```
mongodb+srv://kartikdudeja_one:KARTIK12345@cluster0.gwswykf.mongodb.net/test
```
5. **Click Save** → Render will auto-redeploy

### Step 2: Verify MongoDB Atlas Whitelist
1. Go to: https://cloud.mongodb.com
2. Click **Network Access** (or Security → Network Access)
3. Look for whitelist entry
4. Ensure `0.0.0.0/0` is present (allows all IPs)
5. If not present, click **Add IP Address** → Enter `0.0.0.0/0` → Confirm

### Step 3: Re-authenticate Gmail
Once Render redeploys (look for "Deployed" status):
1. Visit: `https://society-management-k98t.onrender.com/auth/google`
2. Click Google login and authenticate
3. Check Render logs for: `✅ Gmail token saved to MongoDB`
4. Token will be saved automatically

---

## 🔍 What We Fixed

### ✅ MongoDB Connection Code (server.js)
**Before:** Basic error handling, no connection details
```javascript
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));
```

**After:** Detailed error logging + connection pooling
```javascript
mongoose.connect(MONGO_URI, {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: "majority",
})
.then(async () => {
  console.log("✅ MongoDB Connected successfully!");
  console.log(`📊 Connected to database: ${mongoose.connection.db.name}`);
  // ... start email sync
})
.catch((err) => {
  console.error("❌ MONGODB CONNECTION FAILED!");
  console.error("Error Message:", err.message);
  console.error("\n🔧 TROUBLESHOOTING CHECKLIST:");
  console.error("1. Is MONGO_URI set in environment variables?");
  console.error("2. Does MONGO_URI end with /test?");
  console.error("3. Is 0.0.0.0/0 whitelisted in MongoDB Atlas?");
  process.exit(1);
});
```

### ✅ Duplicate Schema Indexes Fixed
Removed `index: true` from fields that already have `Schema.index()` calls:
- `BankTransaction.messageId`: Had both `index: true` AND `Schema.index()` ❌ → NOW: Only `unique: true` ✅
- `LearnedMapping.key`: Added `sparse: true` for NULL handling ✅

---

## 📊 How to Verify It's Working

### Check 1: Monitor Render Logs
```
✅ MongoDB Connected successfully!
📊 Connected to database: test
📩 Starting Email Sync...
✅ Token loaded from MongoDB
🔑 Setting credentials with refresh_token: ✅ Present
🔄 Auto-sync: Checking new bank emails...
✅ Parsed: OWNER NAME - ₹AMOUNT (credit)
💾 Saved: OWNER NAME (FLAT) - ₹AMOUNT
```

### Check 2: Test MongoDB Connection Locally
```bash
cd backend_final
node scripts/testTokenLoad.js
```

Expected output:
```
✅ Connected to MongoDB via Mongoose
Token fields:
  - access_token: ✅ Present
  - refresh_token: ✅ Present
  - scope: https://www.googleapis.com/auth/gmail.readonly
✅ Token is complete and ready for use
```

### Check 3: Verify Gmail Sync is Processing Emails
Look for messages like:
```
✅ Parsed: PRIYANKA PATEL - ₹5000 (credit)
✅ Parsed: HARISH SHAMLAL - ₹3000 (debit)
💾 Saved: PRIYANKA PATEL (405) - ₹5000
```

---

## 🛠️ If It Still Doesn't Work

### Issue 1: "Operation `gmailtokens.findOne()` buffering timed out"
**Cause:** MongoDB not reachable
**Fix:**
- Check MONGO_URI is in Render environment
- Verify 0.0.0.0/0 is whitelisted in MongoDB Atlas
- Check internet connection from Render (usually works)

### Issue 2: "invalid_grant" Gmail error
**Cause:** Gmail token expired (normal after 6 months)
**Fix:**
- Visit `/auth/google` to re-authenticate
- Follow Google login
- New token will be saved automatically

### Issue 3: Email sync not parsing new emails
**Cause:** Parser might not recognize the email format
**Check:**
- New emails have "credited" or "debited" keyword
- Amount is in format: "Rs. 5000" or "INR 5000"
- Date matches bank statement format

### Issue 4: Mongoose warnings still appear
**Cause:** Schema index warnings (non-critical)
**Impact:** None - application works fine
**Info:** Warnings are just reminders to clean up duplicate indexes

---

## 📝 Environment Variables Checklist

On **Render Dashboard**, make sure you have:

```
PORT=5000
MONGO_URI=mongodb+srv://kartikdudeja_one:KARTIK12345@cluster0.gwswykf.mongodb.net/test
JWT_SECRET=bce8d0abca2aabd17b52d5100f74b91e
FIREBASE_BUCKET=society-management-ddabb.firebasestorage.app
```

**Key point:** MONGO_URI MUST end with `/test` (or `/society-management`)

---

## 🚀 Full Workflow

1. **Update MONGO_URI on Render** ← DO THIS FIRST
2. **Render redeploys** (automatic)
3. **Visit /auth/google** to authenticate
4. **Gmail token saved** to MongoDB automatically
5. **Email sync starts** (every 5 minutes via cron)
6. **New emails parsed** and saved to BankTransaction collection
7. **You can see transactions in your dashboard** ✅

---

## 📞 Quick Reference

| Issue | Check | Solution |
|-------|-------|----------|
| Timeout error | MONGO_URI in Render | Update environment variable |
| OAuth fails | Google callback URL | Check Render domain whitelist |
| No emails parsed | Email format | Check "credited" or "debited" keyword |
| Old token | Expired | Visit /auth/google to refresh |
| Warnings | Schema indexes | Safe to ignore - non-critical |

---

## ✅ What's Automated

Once set up:
- ✅ Token refreshes automatically (Google handles it)
- ✅ Token saves to MongoDB automatically (we added event listener)
- ✅ Email sync runs every 5 minutes (cron job)
- ✅ New emails are parsed automatically
- ✅ Transactions saved to database automatically

You don't need to do anything after the initial setup! 🎉
