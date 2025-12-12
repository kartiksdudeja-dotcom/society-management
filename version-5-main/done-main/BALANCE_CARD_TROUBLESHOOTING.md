# Balance Card Troubleshooting Checklist

## ✅ What We've Verified

1. **Backend API** ✅
   - GET /api/bank/balance endpoint exists
   - Returns balance data in correct format
   - Balance record exists in MongoDB: ₹3,75,953.71

2. **Database** ✅
   - Balance is stored: ₹3,75,953.71
   - Account ending: XX33
   - Date: 11/12/2025
   - Bank: HDFC

3. **Frontend Code** ✅
   - Dashboard component has balance card code
   - Fetches from /api/bank/balance
   - Auto-refreshes every 30 seconds
   - Only shows for admin users

---

## 🔍 Why Balance Card Might NOT Be Showing

### Issue 1: User is NOT logged in as Admin
**Check:**
- Are you logged in to the website?
- What is your user role?
- Look at browser console (F12) > Application > Local Storage > "user"

**Solution:**
- Log in as admin user
- Check that role is "admin" or "1"

### Issue 2: Balance API Not Responding
**Check:**
- Open browser console (F12)
- Look for any error messages about /api/bank/balance
- Check if backend server is running

**Solution:**
- Start backend: `npm start` in backend_final folder
- Verify server logs show "Server running on port 5000"

### Issue 3: Balance Data Not in Database
**Check:**
- Run: `node scripts/checkBalance.js`
- Should show 1 balance record

**Solution:**
- Run: `node scripts/testBalanceParsing.js` to create test balance
- Or run: `node scripts/forceSyncBalance.js` to sync from Gmail

---

## 🧪 Testing Steps

### Step 1: Check User Role
```javascript
// In browser console
JSON.parse(localStorage.getItem('user'))
// Look for role: "admin" or "1"
```

### Step 2: Check API Response
```javascript
// In browser console
fetch('/api/bank/balance')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Step 3: Check Balance in Database
```bash
node scripts/checkBalance.js
# Should show: Total balance records: 1
```

### Step 4: Check Server Logs
```bash
# In another terminal, run
npm start
# Look for any error messages
```

---

## 📊 Expected Balance Display

If everything is working:

```
┌─────────────────────────────────┐
│ SOCIETY BALANCE                 │
│ ₹3,75,953.71                    │
│                                 │
│ Account: ...XX33                │
│ Date: 11/12/2025                │
│ Bank: HDFC                      │
└─────────────────────────────────┘
```

---

## 🛠️ Quick Fixes

### Fix 1: Create Test Balance
```bash
cd backend_final
node scripts/testBalanceParsing.js
```

### Fix 2: Force Sync from Gmail
```bash
cd backend_final
node scripts/forceSyncBalance.js
```

### Fix 3: Clean Database
```bash
cd backend_final
node scripts/cleanupBalanceData.js
```

### Fix 4: Check API Endpoint
```bash
# In browser, go to:
http://localhost:5000/api/bank/balance
# Should return JSON with balance data
```

---

## 📱 Diagnostic Component

We've created a diagnostic component to help debug:

```
Visit: /balance-diagnostics
(You need to add this route in your router)
```

This component shows:
- ✅ User login status
- ✅ Admin role verification
- ✅ API response
- ✅ Troubleshooting suggestions

---

## 🚀 If Still Not Working

1. Check browser console for errors
2. Check backend server logs
3. Run diagnostic tests
4. Verify user is admin role
5. Verify balance data exists in database
6. Verify API endpoint responds

Contact support with:
- Browser console errors
- Backend server logs
- Output of checkBalance.js script
