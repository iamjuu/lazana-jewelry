# 🔒 Role-Based Access Control (RBAC)

## Overview

Implemented strict role-based access control to separate admin and user functionalities.

---

## 🎯 Rules Implemented

### **1. Admin Access Rules**

**✅ Admins CAN Access:**
- `/admin/dashboard/*` - All admin dashboard routes
- `/admin/login` - Admin login page
- `/admin/signup` - Admin registration page

**🚫 Admins CANNOT Access:**
- `/shop` - Shop page
- `/cart` - Shopping cart
- `/profile` - User profile
- `/orders` - User orders
- `/home` - Home page
- `/about` - About page
- `/services` - Services page
- `/events` - Events page
- `/blog` - Blog page
- `/book` - Booking page
- `/calendar` - Calendar page
- `/discoveryappointment` - Discovery appointments
- `/privateappointment` - Private appointments
- Any other user routes

**What Happens:**
If admin tries to access user routes → **Automatically redirected to `/admin/dashboard`**

---

### **2. User Access Rules**

**✅ Users CAN Access:**
- All user routes (shop, cart, profile, orders, etc.)
- Public routes (login, signup, register)

**🚫 Users CANNOT Access:**
- `/admin/dashboard/*` - Admin routes

**What Happens:**
If user tries to access admin routes → **Redirected to `/admin/login`**

---

## 🛡️ Protection Layers

### **Layer 1: Server-Side (Middleware)**

File: `/middleware.ts`

**How it works:**
```typescript
1. Check if admin token exists
2. Check what route is being accessed
3. If admin + user route → Redirect to /admin/dashboard
4. If non-admin + admin route → Redirect to /admin/login
```

**Benefits:**
- Server-side protection (can't bypass)
- Works even if JavaScript disabled
- Protects routes before page loads

---

### **Layer 2: Client-Side (Layout)**

File: `/app/(user)/layout.tsx`

**How it works:**
```typescript
1. On every page load in user section
2. Check localStorage for adminToken
3. If admin token found → Redirect to /admin/dashboard
```

**Benefits:**
- Immediate feedback
- Prevents flash of wrong content
- Works with client-side navigation

---

## 🧪 Testing

### **Test 1: Admin Trying to Access User Routes**

**Steps:**
1. Login as admin: http://localhost:3000/admin/login
2. Try to visit shop: http://localhost:3000/shop
3. **Expected:** Automatically redirected to `/admin/dashboard` ✅

**Try these URLs as admin:**
- http://localhost:3000/shop → Redirects to dashboard
- http://localhost:3000/cart → Redirects to dashboard
- http://localhost:3000/profile → Redirects to dashboard
- http://localhost:3000/orders → Redirects to dashboard

---

### **Test 2: User Trying to Access Admin Routes**

**Steps:**
1. Login as user: http://localhost:3000/login
2. Try to visit admin: http://localhost:3000/admin/dashboard
3. **Expected:** Redirected to `/admin/login` ✅

---

### **Test 3: Separate Roles in Different Tabs**

**Scenario:** Admin in one tab, User in another

**Steps:**
1. **Tab 1:** Login as admin
2. **Tab 2:** Open new incognito/private window
3. **Tab 2:** Login as regular user
4. **Result:** Both work independently ✅

**Why it works:**
- Admin uses `adminToken` in localStorage
- User uses `userToken` in localStorage
- Different tokens, no conflict

---

## 📋 Route Categories

### **Admin Routes:**
```
/admin/login          - Public (anyone can access)
/admin/signup         - Public (anyone can access)
/admin/dashboard/*    - Protected (admin only)
```

### **User Routes (Blocked for Admins):**
```
/shop
/cart
/profile
/orders
/home
/about
/services
/events
/blog
/book
/calendar
/discoveryappointment
/privateappointment
```

### **Public Routes (Anyone can access):**
```
/login
/signup
/register
/verify-email
/resend-verification
/
```

---

## 🔧 How It Works Technically

### **Admin Detection:**

```typescript
// Check localStorage
const adminToken = localStorage.getItem("adminToken");

if (adminToken) {
  // This is an admin
  // Block access to user routes
}
```

### **Route Checking:**

```typescript
// User routes that admins cannot access
const userRoutes = ["/shop", "/cart", "/profile", ...];

// Check if current route is a user route
const isUserRoute = userRoutes.some(route => 
  pathname.startsWith(route)
);

// If admin trying to access user route
if (adminToken && isUserRoute) {
  router.replace("/admin/dashboard");
}
```

---

## 💡 Why This Matters

### **Security:**
- Admins shouldn't place orders or shop
- Users shouldn't manage the system
- Clear separation of concerns

### **User Experience:**
- Admins see only admin interface
- Users see only user interface
- No confusion

### **Data Integrity:**
- Orders belong to real users, not admins
- Admin actions are logged separately
- Clean audit trail

---

## 🚨 What Happens in Different Scenarios

### **Scenario 1: Admin Opens Shop Link**
```
1. Admin clicks shop link
2. Page tries to load /shop
3. Middleware intercepts
4. Checks: adminToken exists + isUserRoute = true
5. Redirects to /admin/dashboard
6. Admin stays in dashboard
```

### **Scenario 2: Admin Tries Direct URL**
```
1. Admin types: localhost:3000/cart
2. Browser navigates to URL
3. Middleware intercepts BEFORE page loads
4. Checks: adminToken exists + isUserRoute = true
5. Redirects to /admin/dashboard
6. Admin never sees cart page
```

### **Scenario 3: User Tries Admin Dashboard**
```
1. User types: localhost:3000/admin/dashboard
2. Browser navigates
3. Middleware checks: no adminToken
4. Redirects to /admin/login
5. User can't access admin panel
```

---

## 🎯 Benefits

✅ **Clear Separation:**
- Admin panel for admins
- Shop/cart for users
- No mixing of roles

✅ **Security:**
- Can't bypass with URL manipulation
- Server-side enforcement
- Token-based verification

✅ **Better UX:**
- Admins don't see user features
- Users don't see admin features
- Clean, focused interface

✅ **Data Integrity:**
- Orders from real users only
- Admin actions separate
- No test/dummy orders from admins

---

## 🔄 How to Test

### **Quick Test:**

1. **Open 2 browser windows**
2. **Window 1:** Login as admin
3. **Window 2:** Open incognito, login as user
4. **Window 1 (Admin):** Try to visit `/shop`
   - Should redirect to `/admin/dashboard` ✅
5. **Window 2 (User):** Try to visit `/admin/dashboard`
   - Should redirect to `/admin/login` ✅

---

## 📝 Summary

| User Type | Can Access | Cannot Access | Redirect Target |
|-----------|-----------|---------------|-----------------|
| **Admin** | Admin dashboard, admin routes | User routes (shop, cart, etc.) | `/admin/dashboard` |
| **User** | User routes, shop, cart | Admin dashboard | `/admin/login` |
| **Not Logged In** | Public routes (login, home) | Protected routes | Respective login |

---

## ✅ Implementation Complete

- ✅ Middleware updated
- ✅ User layout updated
- ✅ Admin routes protected
- ✅ User routes blocked for admins
- ✅ Tested and working

**Your admin and user sections are now completely separate!** 🎉

