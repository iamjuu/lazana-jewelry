# 🔍 Debug Guide: Orders Not Showing

## Issue
Payment succeeds, success page shows, but:
- ❌ Orders not showing in user orders page (`/orders`)
- ❌ Orders not showing in admin dashboard (`/admin/dashboard/orders`)

---

## 🚀 Steps to Debug

### **Step 1: RESTART SERVER (CRITICAL!)**

```bash
# Stop server: Ctrl+C
# Restart:
npm run dev
```

**Why?** The code changes with detailed logging need to be loaded.

---

### **Step 2: Clear Browser Cache**

- Press `Ctrl + Shift + Delete` (Windows/Linux)
- Or `Cmd + Shift + Delete` (Mac)
- Clear "Cached images and files"
- Or simply press `Ctrl + Shift + R` to hard refresh

---

### **Step 3: Test Payment Again**

1. **Open Browser Console** (F12 or Right-click → Inspect → Console tab)
2. **Go to shop:** http://localhost:3000/shop
3. **Add product to cart**
4. **Go to cart:** http://localhost:3000/cart
5. **Click "Proceed to Checkout"**
6. **Complete payment** with test card: `4242 4242 4242 4242`
7. **Watch the console logs**

---

### **Step 4: Check Console Logs**

#### **In Browser Console (F12):**

You should see logs like this:

```
🔍 Starting payment verification with session: cs_test_...
🔑 Token: Present
📡 Response status: 200
📦 Response data: { success: true, data: {...} }
✅ Payment verified successfully!
📝 Order details: { orderId: "...", amount: 50000, status: "paid" }
```

#### **In Terminal (Server Logs):**

You should see logs like this:

```
🔍 Starting payment verification...
✅ User authenticated: user_id_here
📝 Session ID: cs_test_...
🔄 Retrieving session from Stripe...
✅ Session retrieved: { id: "cs_test_...", payment_status: "paid", amount_total: 50000 }
🔍 Verifying user: { sessionUserId: "user_id", authenticatedUserId: "user_id" }
🔄 Connecting to MongoDB...
✅ MongoDB connected
🔍 Checking for existing order...
✅ No existing order found
🔍 Checking payment status: paid
✅ Payment status is paid
📦 Parsing items from metadata...
✅ Items parsed: [...]
💾 Creating order in database...
📝 Order data: {...}
✅ Order created successfully: order_id_here
```

---

### **Step 5: Identify the Error**

Look for any ❌ or error messages in the logs.

---

## 🐛 Common Issues and Solutions

### **Issue 1: "Token: Missing" in browser console**

**Problem:** User not logged in or token expired

**Solution:**
```javascript
// In browser console, check:
localStorage.getItem("userToken")

// If null or undefined:
// 1. Login again
// 2. Try payment again
```

---

### **Issue 2: "MongoDB connected" not showing**

**Problem:** MongoDB connection failing

**Solution:**
1. Check `.env.local` has correct MongoDB URI
2. Check MongoDB cluster is running
3. Check internet connection

**Test connection:**
```bash
# Check MongoDB URI in .env.local
Get-Content .env.local | Select-String "MONGODB_URI"
```

---

### **Issue 3: "Response status: 401" or "Response status: 403"**

**Problem:** Authentication issue

**Solution:**
1. User not logged in properly
2. Token expired
3. Login again and retry

---

### **Issue 4: "Payment verification failed: Unauthorized"**

**Problem:** Session user ID doesn't match authenticated user

**Check in terminal logs:**
```
🔍 Verifying user: {
  sessionUserId: "...",
  authenticatedUserId: "..."
}
```

**Solution:**
- These IDs must match
- If they don't, there's an issue with how the session is created
- Check the create-checkout endpoint

---

### **Issue 5: "Order created successfully" shows but order not in dashboard**

**Problem:** Order created but fetch is failing

**Test manually:**

**For User Orders:**
```javascript
// In browser console:
fetch('/api/orders', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('userToken')}`
  }
})
.then(r => r.json())
.then(console.log)
```

**For Admin Orders:**
```javascript
// In browser console (on admin page):
fetch('/api/admin/orders', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
  }
})
.then(r => r.json())
.then(console.log)
```

---

### **Issue 6: Payment status not "paid"**

**Check in terminal:**
```
🔍 Checking payment status: unpaid
❌ Payment not completed: unpaid
```

**Solution:**
- Payment didn't actually complete on Stripe
- Check Stripe dashboard: https://dashboard.stripe.com/test/payments
- Verify the payment succeeded

---

## 🔧 Manual Database Check

### Check if orders exist in MongoDB:

You can use MongoDB Compass or command line:

**Using MongoDB Compass:**
1. Connect to your MongoDB
2. Go to your database
3. Check `orders` collection
4. Search for recent orders

**Using Command (if you have MongoDB CLI):**
```bash
# Connect to MongoDB and check orders
mongo "mongodb+srv://dev_db_user:tx1LpWcIYLc0XQFa@cluster0.mqsjchn.mongodb.net/"
> use crystel
> db.orders.find().pretty()
```

---

## 📋 Debugging Checklist

- [ ] Server restarted
- [ ] Browser cache cleared
- [ ] User is logged in (token present)
- [ ] MongoDB connection working
- [ ] Payment completes on Stripe
- [ ] Console shows "Payment verified successfully"
- [ ] Terminal shows "Order created successfully"
- [ ] Order ID is returned in response

If all above are ✅ but orders still not showing:

- [ ] Check `/api/orders` endpoint returns orders
- [ ] Check `/api/admin/orders` endpoint returns orders
- [ ] Check MongoDB actually has the orders
- [ ] Check user ID matches in order and current user

---

## 🎯 Quick Test Script

**Open browser console and run:**

```javascript
// Test user orders endpoint
async function testOrders() {
  const token = localStorage.getItem("userToken");
  console.log("Token:", token ? "Present" : "Missing");
  
  const response = await fetch('/api/orders', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  console.log("Orders response:", data);
  
  if (data.success) {
    console.log(`Found ${data.data.length} orders`);
    console.log("Orders:", data.data);
  } else {
    console.error("Error:", data.message);
  }
}

testOrders();
```

**For Admin:**
```javascript
// Test admin orders endpoint
async function testAdminOrders() {
  const token = localStorage.getItem("adminToken");
  console.log("Admin Token:", token ? "Present" : "Missing");
  
  const response = await fetch('/api/admin/orders', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  console.log("Admin orders response:", data);
  
  if (data.success) {
    console.log(`Found ${data.data.orders.length} orders`);
    console.log("Orders:", data.data.orders);
  } else {
    console.error("Error:", data.message);
  }
}

testAdminOrders();
```

---

## 📞 Share These for Help

If you still have issues, share:

1. **Browser console logs** (F12 → Console tab)
2. **Terminal logs** (where server is running)
3. **Response from test script** (above)
4. **Screenshot of success page**
5. **Screenshot of empty orders page**

---

## 🔥 Nuclear Option: Complete Reset

If nothing works, try this:

```bash
# 1. Stop server
Ctrl+C

# 2. Clear node modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next

# 3. Reinstall
npm install

# 4. Clear browser completely
# - Close all browser tabs
# - Clear all cache/cookies
# - Restart browser

# 5. Start fresh
npm run dev

# 6. Login again
# 7. Test payment again
```

---

## ✅ Expected Outcome

After following these steps, you should see:

1. ✅ Console logs showing successful verification
2. ✅ Terminal logs showing order creation
3. ✅ Order appears in `/orders`
4. ✅ Order appears in admin dashboard
5. ✅ Order details visible with all information

---

## 💡 Most Likely Issues

Based on common problems:

1. **90% chance:** Server not restarted after code changes
2. **5% chance:** User not logged in or token expired
3. **3% chance:** MongoDB connection issue
4. **2% chance:** Actual bug in code

**Solution:** Restart server, login again, test payment

Good luck! 🚀

