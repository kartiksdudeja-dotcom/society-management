# Balance Card - Complete System Flow Diagram

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    BALANCE CARD SYSTEM ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────────┐
│                         EMAIL SOURCE                             │
│                                                                  │
│  HDFC Bank sends balance email:                                 │
│  "The available balance in your account ending XX3306           │
│   is Rs. INR 3,75,953.71 as of 11-DEC-25."                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND - AUTOMATIC SYNC                      │
│                                                                  │
│  ┌─ Cron Job (Every 5 minutes) ─┐                              │
│  │  readBankEmails()            │                              │
│  │  - Fetches new Gmail emails  │                              │
│  │  - For each email:           │                              │
│  └──────────┬────────────────────┘                              │
│             │                                                   │
│             ▼                                                   │
│  ┌─ parseAndSaveBalance() ─────────────────────┐              │
│  │ 1. Detect balance email?                    │              │
│  │    ✅ Contains "balance" + "HDFC" + "Rs"    │              │
│  │                                             │              │
│  │ 2. Extract data with regex:                 │              │
│  │    ✅ Account: /account\s+ending\s+([...]) │              │
│  │    ✅ Amount: /Rs\.\s*INR\s+([0-9,]+)     │              │
│  │    ✅ Date: /as of\s+(\d{1,2}-[A-Z]{3}-)   │              │
│  │    ✅ Bank: /HDFC|ICICI|AXIS|KOTAK|SBI/    │              │
│  │                                             │              │
│  │ 3. Check for duplicates:                    │              │
│  │    ✅ Look up by messageId                  │              │
│  │    ✅ Skip if already saved                 │              │
│  │                                             │              │
│  │ 4. Save to database:                        │              │
│  │    ✅ BankBalance.create({...})             │              │
│  └────────────┬────────────────────────────────┘              │
└───────────────┼─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MONGODB DATABASE                              │
│                                                                  │
│  Collection: bankbalances                                       │
│  ┌────────────────────────────────────────────┐               │
│  │ Document:                                  │               │
│  │ {                                          │               │
│  │   _id: ObjectId(...),                      │               │
│  │   messageId: "hdfc-...",   ← Unique       │               │
│  │   accountEnding: "XX33",                   │               │
│  │   balance: 375953.71,    ← Latest        │               │
│  │   currency: "INR",                         │               │
│  │   balanceDate: 2025-12-11,                │               │
│  │   bank: "HDFC",                            │               │
│  │   narration: "The available balance...",  │               │
│  │   createdAt: 2025-12-12,                  │               │
│  │   updatedAt: 2025-12-12                   │               │
│  │ }                                          │               │
│  └────────────────────────────────────────────┘               │
└──────────────────────┬────────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
  ┌─────────────────┐         ┌──────────────────────┐
  │  AUTO SYNC      │         │  MANUAL SYNC         │
  │  (Cron 5min)    │         │  (On demand)         │
  │                 │         │                      │
  │ readBankEmails()│         │ GET /api/bank/       │
  │                 │         │    sync-balance      │
  └────────┬────────┘         └──────────┬───────────┘
           │                             │
           └──────────────┬──────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────┐
    │      BACKEND API ENDPOINT                │
    │                                          │
    │  GET /api/bank/balance                  │
    │                                          │
    │  bankController.js:                      │
    │  ┌──────────────────────────────────┐   │
    │  │ getBankBalance() {               │   │
    │  │   const balance =                │   │
    │  │     BankBalance.findOne()        │   │
    │  │       .sort({balanceDate: -1})   │   │
    │  │       .limit(1)                  │   │
    │  │                                  │   │
    │  │   return {                       │   │
    │  │     ok: true,                    │   │
    │  │     data: {                      │   │
    │  │       balance: 375953.71,       │   │
    │  │       accountEnding: "XX33",     │   │
    │  │       balanceDate: 2025-12-11,   │   │
    │  │       bank: "HDFC",              │   │
    │  │       currency: "INR"            │   │
    │  │     }                            │   │
    │  │   }                              │   │
    │  │ }                                │   │
    │  └──────────────────────────────────┘   │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────────┐
    │         FRONTEND COMPONENT               │
    │                                          │
    │  Dashboard.jsx:                         │
    │  ┌──────────────────────────────────┐   │
    │  │ 1. Check: isAdmin?               │   │
    │  │    (role === "admin" || "1")     │   │
    │  │                                  │   │
    │  │ 2. On mount (useEffect):         │   │
    │  │    if (isAdmin) {                │   │
    │  │      fetch("/api/bank/balance")  │   │
    │  │      setBankBalance(data)        │   │
    │  │    }                             │   │
    │  │                                  │   │
    │  │ 3. Auto-refresh:                 │   │
    │  │    setInterval(refetch, 30000)   │   │
    │  │                                  │   │
    │  │ 4. Render (if bankBalance):      │   │
    │  │    {bankBalance ? (              │   │
    │  │      <BalanceCard>               │   │
    │  │        ₹{balance}                │   │
    │  │        Account: ...{ending}      │   │
    │  │        Date: {localizedDate}     │   │
    │  │        Bank: {bank}              │   │
    │  │      </BalanceCard>              │   │
    │  │    ) : (                         │   │
    │  │      <Placeholder />             │   │
    │  │    )}                            │   │
    │  └──────────────────────────────────┘   │
    └──────────────────┬───────────────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────────┐
    │      BROWSER - USER SEES                │
    │                                          │
    │  ┌───────────────────────────────────┐ │
    │  │ Bank Balance                      │ │
    │  │ ₹3,75,953.71                      │ │
    │  │                                   │ │
    │  │ Account: ...XX33                  │ │
    │  │ 11/12/2025                        │ │
    │  │ HDFC                              │ │
    │  └───────────────────────────────────┘ │
    │                                          │
    │  (Updates every 30 seconds)              │
    └─────────────────────────────────────────┘


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                           DATA FLOW SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email (HDFC)
    ↓
Cron Job (5 min)
    ↓
parseAndSaveBalance()
    ↓
MongoDB Database
    ↓
API Endpoint: /api/bank/balance
    ↓
Frontend Component (if isAdmin)
    ↓
Browser Display (auto-refresh 30 sec)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        CRITICAL DECISION POINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ EMAIL DETECTION
   └─ Is "balance" + "HDFC" + "Rs" in email?
      ├─ YES → Continue
      └─ NO  → Skip email

2️⃣ DATA EXTRACTION
   └─ Can regex extract account, amount, date?
      ├─ YES → Continue
      └─ NO  → Skip email

3️⃣ DUPLICATE CHECK
   └─ Does messageId already exist?
      ├─ YES → Skip (already saved)
      └─ NO  → Save to database

4️⃣ ADMIN CHECK (Frontend)
   └─ Is user role "admin" or "1"?
      ├─ YES → Fetch balance
      └─ NO  → Don't show card

5️⃣ API RESPONSE
   └─ Is database record available?
      ├─ YES → Display balance
      └─ NO  → Show placeholder


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      TROUBLESHOOTING DECISION TREE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Balance card not showing?
    │
    ├─→ Are you logged in as admin? NO → LOG IN AS ADMIN
    │                                YES ↓
    ├─→ Is backend running? NO → npm start
    │                      YES ↓
    ├─→ Check database: node scripts/checkBalance.js
    │   └─→ Records found? NO  → Create test: node scripts/testBalanceParsing.js
    │                    YES ↓
    ├─→ Check API: curl http://localhost:5000/api/bank/balance
    │   └─→ Returns data? NO  → Check server logs
    │                    YES ↓
    ├─→ Check browser console (F12)
    │   └─→ Error messages? NO  → Force refresh page
    │                      YES ↓
    ├─→ Check network tab: /api/bank/balance request
    │   └─→ Response OK? NO  → Restart backend
    │                   YES ↓
    └─→ Check component code
        └─→ isAdmin correct? Check localStorage user object
```

