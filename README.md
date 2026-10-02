# Dhaka-Tesla-Pool-Server

Backend REST API for **Dhaka Tesla Pool** ride-pooling MVP service.

---

## 🚀 Tech Stack
- **Runtime & Language:** Node.js, TypeScript (ESM)
- **Framework:** Express.js
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Cache & Memory:** Redis, Redis Iris Agent Memory
- **Payment Gateway:** SSLCommerz API v4
- **Testing:** Vitest, Supertest

---

## ⚡ Features
- **Strict Role-Based Access Control:** Separate Passenger and Driver capabilities.
- **Fair Pooling State Machine:** Request -> Matched -> Driver Arrived -> Started -> Completed.
- **Integer Paisa Fare Engine:** Exact integer currency calculations with zero floating-point drift.
- **SSLCommerz Wallet Top-Up:** Instant TeslaPay wallet balance recharge via bKash, Nagad, Cards, and Internet Banking.
- **Driver GPS & Live Map:** Real-time driver location updates (`/api/v1/drivers/me/location`) and active fleet map (`/api/v1/drivers/live-map`).
- **Comprehensive SQA Coverage:** 79 automated unit and integration tests.

---

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your database and payment gateway credentials:
```bash
cp .env.example .env
```

### 3. Database Migration & Seed
```bash
npm run db:generate
npx prisma db push
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

### 5. Run Test Suite
```bash
npm test
```
