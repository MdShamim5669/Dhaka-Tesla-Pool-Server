# SSLCommerz Wallet Top-Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate SSLCommerz Payment Gateway into Dhaka Tesla Pool to allow passengers to top up their TeslaPay wallet balance securely in sandbox/production.

**Architecture:** A pure HTTP client `sslcommerz.service.ts` connects with SSLCommerz v4 API for session initialization and validation. The `wallet.service.ts` coordinates database transactions, creating a pending `WalletTransaction`, initiating payment, validating callbacks/IPN from SSLCommerz, and crediting the user's wallet atomically on verified success.

**Tech Stack:** TypeScript, Node.js, Express, Prisma ORM, PostgreSQL, Vitest, Supertest, SSLCommerz API v4.

**Spec:** [Docs/specs/2026-10-02-sslcommerz-wallet-topup-design.md](file:///e:/Project/Dhaka%20Tesla%20Pool/Backend/Docs/specs/2026-10-02-sslcommerz-wallet-topup-design.md)

## Global Constraints
- All monetary amounts in database and internal logic must use integer paisa (`৳1 = 100 paisa`).
- SSLCommerz expects amounts in BDT (floating-point string or number like `500.00`), so convert `amountPaisa / 100` when calling SSLCommerz and verify `Math.round(val_amount * 100) === amountPaisa` upon callback.
- Payment validation must query SSLCommerz validation API (`/validator/api/validationserverAPI.php`) before crediting wallet.
- Idempotency: Duplicate success callbacks/IPNs for the same `tran_id` must never credit the wallet more than once.

---

### Task 1: Environment Variables & Config

**Files:**
- Modify: `src/config/env.ts`
- Modify: `.env.example`
- Modify: `.env`

**Interfaces:**
- Produces: `env.SSLCOMMERZ_STORE_ID`, `env.SSLCOMMERZ_STORE_PASS`, `env.SSLCOMMERZ_IS_LIVE`, `env.SSLCOMMERZ_SUCCESS_URL`, `env.SSLCOMMERZ_FAIL_URL`, `env.SSLCOMMERZ_CANCEL_URL`, `env.SSLCOMMERZ_IPN_URL`

- [ ] **Step 1: Update `.env.example` and `.env` with SSLCommerz keys**
- [ ] **Step 2: Update `src/config/env.ts` to include SSLCommerz variables with Zod validation**
- [ ] **Step 3: Verify environment configuration loads without errors**

---

### Task 2: Prisma Schema for WalletTransaction

**Files:**
- Modify: `prisma/schema/wallet.prisma`
- Modify: `prisma/schema/user.prisma`

**Interfaces:**
- Produces: `prisma.walletTransaction` model and `WalletTransactionStatus` enum (`PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`).

- [ ] **Step 1: Add `WalletTransactionStatus` enum and `WalletTransaction` model to `prisma/schema/wallet.prisma`**
- [ ] **Step 2: Add relation `walletTransactions WalletTransaction[]` to `User` model in `prisma/schema/user.prisma`**
- [ ] **Step 3: Run `npx prisma generate` and verify types**

---

### Task 3: SSLCommerz Pure Service

**Files:**
- Create: `src/modules/sslcommerz/sslcommerz.service.ts`
- Create: `src/modules/sslcommerz/sslcommerz.types.ts`
- Test: `tests/unit/sslcommerz.test.ts`

**Interfaces:**
- Produces: `sslcommerzService.initPayment(payload): Promise<{ paymentUrl: string; tranId: string }>`
- Produces: `sslcommerzService.validatePayment(valId: string): Promise<SSLCommerzValidationResponse>`

- [ ] **Step 1: Write unit tests in `tests/unit/sslcommerz.test.ts`**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `sslcommerz.types.ts` and `sslcommerz.service.ts`**
- [ ] **Step 4: Run unit tests to verify they pass**

---

### Task 4: Wallet Service Top-Up & Callback Handling

**Files:**
- Modify: `src/modules/wallet/wallet.service.ts`
- Modify: `src/modules/wallet/wallet.interface.ts`

**Interfaces:**
- Produces: `walletService.initTopUp(userId: string, amountPaisa: number, userDetails: { name: string; email: string; phone?: string })`
- Produces: `walletService.handlePaymentSuccess(valId: string, tranId: string)`
- Produces: `walletService.handlePaymentFail(tranId: string)`
- Produces: `walletService.handlePaymentCancel(tranId: string)`

- [ ] **Step 1: Implement `initTopUp` in `wallet.service.ts`**
- [ ] **Step 2: Implement `handlePaymentSuccess` with atomic `$transaction`**
- [ ] **Step 3: Implement `handlePaymentFail` and `handlePaymentCancel`**

---

### Task 5: Wallet Controller & Routes

**Files:**
- Modify: `src/modules/wallet/wallet.controller.ts`
- Modify: `src/modules/wallet/wallet.routes.ts`

**Interfaces:**
- Produces: `POST /api/v1/wallet/topup/init` (Protected)
- Produces: `POST /api/v1/wallet/topup/success` (Public Callback)
- Produces: `POST /api/v1/wallet/topup/fail` (Public Callback)
- Produces: `POST /api/v1/wallet/topup/cancel` (Public Callback)
- Produces: `POST /api/v1/wallet/topup/ipn` (Public Callback)

- [ ] **Step 1: Add controller methods in `wallet.controller.ts`**
- [ ] **Step 2: Connect routes in `wallet.routes.ts`**

---

### Task 6: Integration Testing & Verification

**Files:**
- Create: `tests/integration/wallet.topup.test.ts`

- [ ] **Step 1: Write integration tests for `POST /api/v1/wallet/topup/init` (auth check, validation)**
- [ ] **Step 2: Write tests for callback error handling and redirect behavior**
- [ ] **Step 3: Run full test suite (`npm test`) and lint check (`npm run lint`)**
