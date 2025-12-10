# Complete Stripe Payment Integration Guide

## 🎯 Overview

This document explains the complete Stripe payment integration for both **Cart Checkout** and **Instant Buy** features, including how orders are created and displayed in the admin dashboard.

---

## 📋 Table of Contents

1. [Environment Setup](#environment-setup)
2. [Features Implemented](#features-implemented)
3. [Payment Flow](#payment-flow)
4. [API Endpoints](#api-endpoints)
5. [Admin Dashboard](#admin-dashboard)
6. [Testing](#testing)
7. [Order Details](#order-details)
8. [Security](#security)

---

## 🔧 Environment Setup

### 1. Install Dependencies

All required packages are already installed:
```bash
@stripe/stripe-js
@stripe/react-stripe-js
stripe
```

### 2. Environment Variables

Your `.env.local` file now includes:

```env
# MongoDB
MONGODB_URI=mongodb+srv://dev_db_user:tx1LpWcIYLc0XQFa@cluster0.mqsjchn.mongodb.net/?appName=Cluster0

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Gmail SMTP
GMAIL_USER=crystalbowl6@gmail.com
GMAIL_APP_PASSWORD=blnxfyoesldllvai

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Note:** Replace with your actual Stripe keys from https://dashboard.stripe.com/apikeys
Your actual keys are in the local `.env.local` file (not committed to Git).

---

## ✨ Features Implemented

### 1. **Cart Checkout with Stripe**
- Users can add multiple products to cart
- Secure checkout via Stripe Checkout
- Automatic order creation after successful payment
- Shipping address collection
- Tax and shipping calculation

### 2. **Instant Buy on Product Page**
- One-click purchase from product detail page
- Direct checkout without adding to cart
- Same secure Stripe payment flow

### 3. **Admin Dashboard**
- Complete orders management interface
- Real-time order statistics
- Filter orders by status
- View payment details (provider, reference, amount)
- View shipping address
- Update order status (pending, paid, shipped, delivered, cancelled, refunded)
- Full customer information display

---

## 🔄 Payment Flow

### Cart Checkout Flow

```
┌─────────────────┐
│  User adds to   │
│     Cart        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User clicks     │
│ "Checkout"      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API creates    │
│  Stripe Session │
│ /api/payment/   │
│ create-checkout │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User redirected│
│  to Stripe      │
│  Checkout       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User enters    │
│  card details & │
│  shipping info  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Payment        │
│  Successful     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Redirect to    │
│  /cart/success  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Success page   │
│  calls verify   │
│  endpoint       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API verifies   │
│  payment &      │
│  creates Order  │
│  in MongoDB     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cart cleared   │
│  Order saved    │
│  Admin can view │
└─────────────────┘
```

### Instant Buy Flow

```
┌─────────────────┐
│  User on        │
│  Product Page   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User clicks     │
│ "Buy Now with   │
│    Stripe"      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API creates    │
│  Stripe Session │
│ /api/payment/   │
│ instant-buy     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Same flow as    │
│ Cart Checkout   │
└─────────────────┘
```

---

## 🔌 API Endpoints

### 1. Create Checkout Session (Cart)
**Endpoint:** `POST /api/payment/create-checkout`

**Request:**
```json
{
  "items": [
    {
      "id": "product_id",
      "name": "Product Name",
      "price": 50000, // in paise (₹500.00)
      "quantity": 2,
      "imageUrl": "https://..."
    }
  ],
  "amount": 100000,
  "currency": "INR"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/..."
  }
}
```

### 2. Instant Buy
**Endpoint:** `POST /api/payment/instant-buy`

**Request:**
```json
{
  "productId": "product_id",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/..."
  }
}
```

### 3. Verify Payment
**Endpoint:** `POST /api/payment/verify-checkout`

**Request:**
```json
{
  "sessionId": "cs_test_..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_id",
    "amount": 100000,
    "status": "paid"
  }
}
```

**This endpoint:**
- Retrieves session from Stripe
- Verifies payment was successful
- Creates Order in MongoDB with:
  - Order items
  - Payment details
  - Shipping address
  - Customer information
- Prevents duplicate orders

### 4. Admin: Get All Orders
**Endpoint:** `GET /api/admin/orders?status=paid&limit=50&page=1`

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 50,
      "pages": 2
    }
  }
}
```

### 5. Admin: Update Order Status
**Endpoint:** `PATCH /api/admin/orders/{orderId}`

**Request:**
```json
{
  "status": "shipped"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated order */ }
}
```

---

## 📊 Admin Dashboard

### Access
Navigate to: `/admin/dashboard/orders`

### Features

#### 1. **Statistics Cards**
- Total Orders
- Paid Orders
- Shipped Orders
- Total Revenue (in ₹)

#### 2. **Order Filters**
Filter by status:
- All
- Pending
- Paid
- Shipped
- Delivered
- Cancelled
- Refunded

#### 3. **Orders Table**
Displays:
- Order ID (last 8 characters)
- Customer Name & Email
- Number of items
- Total Amount
- Payment Provider (Stripe/Razorpay)
- Payment Reference (Stripe Session ID)
- Order Status with colored badges
- Order Date & Time
- View Details button

#### 4. **Order Details Modal**
Click the eye icon to view:

**Customer Information:**
- Full Name
- Email Address

**Shipping Address:**
- Street Address (Line 1 & 2)
- City, State, Postal Code
- Country

**Order Items:**
- Product names
- Quantities
- Individual prices
- Total amount

**Payment Details:**
- Payment Provider
- Payment Reference/Transaction ID
- Payment Status

**Timeline:**
- Order Created Date
- Last Updated Date

**Status Management:**
- Buttons to update order status
- Real-time status updates

---

## 🧪 Testing

### Test Cards

Stripe provides test cards for different scenarios:

| Card Number | Scenario | CVC | Expiry | ZIP |
|-------------|----------|-----|--------|-----|
| 4242 4242 4242 4242 | Success | Any 3 digits | Any future date | Any 5 digits |
| 4000 0000 0000 0002 | Declined | Any 3 digits | Any future date | Any 5 digits |
| 4000 0025 0000 3155 | Requires Authentication | Any 3 digits | Any future date | Any 5 digits |
| 4000 0000 0000 9995 | Insufficient Funds | Any 3 digits | Any future date | Any 5 digits |

### Testing Cart Checkout

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Add Products to Cart:**
   - Navigate to `/shop`
   - Click on a product
   - Click "Add to Cart"

3. **Proceed to Checkout:**
   - Navigate to `/cart`
   - Click "Proceed to Checkout"
   - You'll be redirected to Stripe

4. **Complete Payment:**
   - Enter test card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
   - Fill in shipping address
   - Click "Pay"

5. **Verify Success:**
   - You'll be redirected to `/cart/success`
   - Order details will be displayed
   - Cart will be cleared

6. **Check Admin Dashboard:**
   - Login to admin: `/admin/login`
   - Navigate to Orders
   - Your order will appear with status "paid"

### Testing Instant Buy

1. **Navigate to Product:**
   - Go to `/shop`
   - Click on any product

2. **Click "Buy Now with Stripe":**
   - Button shows loading state
   - Redirected to Stripe Checkout

3. **Complete Payment:**
   - Same as cart checkout

4. **Verify in Admin:**
   - Order appears in admin dashboard

---

## 📦 Order Details Stored

Each order in MongoDB contains:

```javascript
{
  _id: "ObjectId",
  userId: "user_id",
  items: [
    {
      productId: "product_id",
      name: "Product Name",
      price: 50000, // paise
      quantity: 2
    }
  ],
  amount: 100000, // total in paise
  currency: "INR",
  status: "paid", // pending|paid|shipped|delivered|cancelled|refunded
  paymentProvider: "stripe",
  paymentRef: "cs_test_...", // Stripe Session ID
  shippingAddress: {
    line1: "123 Main St",
    line2: "Apt 4B",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India"
  },
  customerEmail: "customer@example.com",
  customerName: "John Doe",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Currency Format

- **Storage:** All amounts are stored in smallest currency unit (paise for INR)
- **Display:** Converted to rupees in UI
  - Example: `50000` paise = `₹500.00`

---

## 🔒 Security

### Authentication
- All payment endpoints require user authentication
- Admin endpoints require admin authentication
- JWT tokens used for authorization

### Payment Security
- No card details stored on server
- Stripe handles all sensitive payment data
- PCI DSS compliance via Stripe

### Order Verification
- Payment status verified with Stripe before order creation
- Session metadata verified to match authenticated user
- Duplicate order prevention via `paymentRef` index

### Best Practices
1. Never expose `STRIPE_SECRET_KEY` in client-side code
2. Always verify payment status server-side
3. Use HTTPS in production
4. Implement webhook validation (recommended for production)

---

## 🚀 Production Checklist

Before going live:

- [ ] Replace test keys with live Stripe keys
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Enable Stripe webhooks for order updates
- [ ] Test with real card (small amount)
- [ ] Set up proper error logging
- [ ] Configure email notifications for orders
- [ ] Set up backup for MongoDB
- [ ] Review and update shipping countries list
- [ ] Configure tax rates properly
- [ ] Set up refund handling process

---

## 🐛 Troubleshooting

### Payment Not Creating Order

**Check:**
1. Browser console for errors
2. Network tab for API calls
3. MongoDB connection
4. Stripe API keys are correct
5. User is authenticated

### Admin Dashboard Not Showing Orders

**Check:**
1. Admin is logged in
2. MongoDB connection active
3. Orders exist in database
4. API endpoint `/api/admin/orders` is working

### Stripe Checkout Not Opening

**Check:**
1. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
2. Network connection
3. User is logged in
4. Cart has items

---

## 📞 Support

### Stripe Documentation
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Test Cards](https://stripe.com/docs/testing)
- [API Reference](https://stripe.com/docs/api)

### Useful Commands

```bash
# Start development server
npm run dev

# Check MongoDB connection
# View .env.local file
cat .env.local

# Clear npm cache if issues
npm cache clean --force
npm install
```

---

## 🎉 Summary

You now have a complete Stripe payment integration with:

✅ **Cart Checkout** - Multi-item purchase flow
✅ **Instant Buy** - Quick single-product purchase  
✅ **Payment Verification** - Secure order creation
✅ **Admin Dashboard** - Complete order management
✅ **Order Details** - Full payment and shipping info
✅ **Status Management** - Track order lifecycle
✅ **Security** - Authentication and authorization

All orders created through Stripe payments are automatically:
1. Saved to MongoDB
2. Visible in admin dashboard
3. Include payment details (provider, reference, amount)
4. Include shipping address
5. Include customer information
6. Have updatable status

**Ready to test!** 🚀

