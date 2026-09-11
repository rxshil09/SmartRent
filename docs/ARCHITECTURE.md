# 🏛️ SmartRent Master System Architecture

This document serves as the **Master Architecture Specification** for SmartRent, providing a high-level overview of system design, technology stack, concurrency models, security patterns, and financial calculation engines.

> 📚 **Specialized Technical Documentation Hub**:
> * 📮 **[API & Postman Testing Guide](POSTMAN_TESTING_GUIDE.md)** — Complete API endpoint specifications, Postman collection setup, sequence diagrams, and sample payloads.
> * 📁 **[Monorepo Architecture Guide](MONOREPO_ARCHITECTURE.md)** — Complete directory layout, module mappings, React SPA router, and request/response flowcharts.
> * 🛠️ **[Development & Scripts Guide](DEV_SCRIPTS_GUIDE.md)** — Setup guide, script reference (`seed-admin.js`, `seed-products.js`, `reset-db.js`, `verify-setup.js`), and `.env` specifications.
> * 📊 **[Database Schema & Concurrency Guide](DATABASE_SCHEMA_GUIDE.md)** — PostgreSQL ER diagram, stock state transitions flowchart, SQL pessimistic locking (`FOR UPDATE`), and deadlock elimination.

---

## 📋 1. System Overview & Technology Stack

SmartRent is built as a decoupled, production-grade client-server application engineered for high-concurrency rental transactions, real-time inventory locking, and administrative business insights.

```
+-------------------------------------------------------+
|                 Client Application                    |
|        React 19 SPA + Vite 7 + Tailwind CSS           |
|         Axios (JWT Interceptors) + Recharts           |
+---------------------------+---------------------------+
                            |
                     JSON REST APIs
                 HTTP / Credentials / Cookies
                            |
+---------------------------v---------------------------+
|                 Backend API Service                   |
|       Node.js + Express 5 + Prisma ORM 6              |
|   Cron Service + PDF Engine + Nodemailer Mailer       |
+---------------------------+---------------------------+
                            |
                     PostgreSQL SQL
             Pessimistic Locking (FOR UPDATE)
                            |
+---------------------------v---------------------------+
|                 PostgreSQL Database                   |
|       Users, Products, Orders, Rentals, Schemas       |
+-------------------------------------------------------+
```

### 🛠️ Technology Stack Summary

| Layer | Primary Technologies | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend Framework** | React `19.x`, Vite `7.x` | SPA rendering, responsive UI, client-side routing |
| **Styling & UI** | Tailwind CSS `3.4`, PostCSS | Responsive dark/light UI components |
| **State Management** | React Router `7.x`, React Context API | Global states (`Auth`, `Cart`, `Wishlist`), client routing |
| **HTTP Client** | Axios `1.11.x` | Centralized API client with silent JWT refresh interceptors |
| **Backend Framework** | Node.js `>=18.0.0`, Express `5.1.x` | RESTful API server, rate limiting, route controllers |
| **ORM & Database** | Prisma `6.13.x`, PostgreSQL `>=13.0` | Schema migrations, relational models, SQL locking |
| **Payments** | Razorpay Node SDK `2.9.x` | Payment order creation, webhook verification (HMAC SHA-256) |
| **Document Engine** | PDFKit / Puppeteer | Dynamic invoice PDF generation and downloadable streams |
| **Testing & CI/CD** | Vitest `3.2.x`, ESLint `9.x`, GitHub Actions | Client unit tests, code linting, automated CI workflows |

---

## 🔒 2. Authentication, Security & Session Lifecycle

SmartRent implements a dual-token authentication workflow with Role-Based Access Control (RBAC):

* **Access Token**: Short-lived JWT (15-minute expiration) kept in-memory to mitigate XSS vulnerabilities.
* **Refresh Token**: Long-lived JWT (7-day expiration) stored in a secure, `HttpOnly`, `SameSite=Lax` cookie.
* **Silent JWT Rotation Queue (`client/src/lib/api.js`)**: An Axios response interceptor catches `401 Unauthorized` responses, pauses concurrent requests, triggers `/auth/refresh`, updates Bearer headers, and replays failed requests transparently.
* **Account Security**: Passwords are encrypted using `bcryptjs` (10 salt rounds). Email verification uses a 6-digit OTP code printed directly to server terminal logs in development mode.

*(For sequence flowcharts and API request samples, see [POSTMAN_TESTING_GUIDE.md](POSTMAN_TESTING_GUIDE.md)).*

---

## ⚡ 3. Concurrency, Locking & Stock Safety

SmartRent prevents overbooking during multi-user checkouts using database-level pessimistic locking and lexicographical sorting:

1. **Pessimistic Row Locking (`SELECT ... FOR UPDATE`)**: Acquires exclusive row locks inside a `ReadCommitted` transaction before evaluating product availability.
2. **Deadlock Elimination via Lexicographical Sorting**: Product IDs are sorted alphabetically (`sortedItems.sort((a,b) => a.productId.localeCompare(b.productId))`) prior to lock acquisition. Because all concurrent checkouts lock products in identical global order, cyclic wait states (deadlocks) are mathematically impossible.
3. **Short Lock Boundaries**: Transactions commit and release database row locks in **< 10ms**, before initiating external payment gateway calls (Razorpay, 200–500ms).
4. **Automated Expiry (`CronService`)**: A background service runs every 60 seconds. Orders with `status == PENDING_PAYMENT` exceeding 5 minutes (`reservedUntil < NOW()`) are marked `EXPIRED`, automatically returning reserved inventory to `availableStock`.

*(For complete sequence diagrams, stock state transition flowcharts, and SQL queries, see [DATABASE_SCHEMA_GUIDE.md](DATABASE_SCHEMA_GUIDE.md)).*

---

## 💳 4. Order Lifecycle, Pricing & Billing Subsystem

### 📐 Financial Calculation Formulas

#### 1. Inclusive Rental Days Formula
$$\text{Total Days} = \max\left(1, \left\lceil \frac{\text{EndDate} - \text{StartDate}}{86400000} \right\rceil + 1\right)$$

#### 2. Order Financial Breakdown
$$\text{Subtotal} = \sum (\text{PricePerDay} \times \text{TotalDays} \times \text{Quantity})$$
$$\text{Discounted Subtotal} = \max(0, \text{Subtotal} - \text{CouponDiscount})$$
$$\text{GST Amount (18\%)} = \text{Round}(\text{Discounted Subtotal} \times 0.18)$$
$$\text{Total Amount} = \text{Discounted Subtotal} + \text{GST Amount} + \text{Delivery Fee}$$

#### 3. Razorpay Signature Verification
Payment authenticity is verified using HMAC SHA-256 cryptographic signature comparison:
$$\text{Expected Signature} = \text{HMAC-SHA256}(\text{razorpayOrderId} + "|" + \text{razorpayPaymentId}, \text{RAZORPAY\_KEY\_SECRET})$$

---

## 📈 5. Admin Analytics & Aggregation Engine

To process metrics over large transaction volumes efficiently, SmartRent uses PostgreSQL database-level aggregate queries (`groupBy`, `_sum`, `count`) rather than fetching raw rows into Node.js application memory. This eliminates N+1 query overhead and provides instant dashboard metric calculations.

---

## 🌐 6. Operational Health & CI/CD

* **Database Keep-Alive Health Check (`/health`)**: Executes `SELECT 1` ping queries. External pingers hit this endpoint every 5 minutes to prevent cold-start sleeps on free tier serverless hosting (Render, Neon, Aiven).
* **CI/CD Pipeline (`.github/workflows/lint-test.yml`)**: Automated GitHub Actions workflow running Vitest unit tests, ESLint linting, and Prisma client generation on every push or pull request to `main`.

---

## 🛠️ 7. Chronological Engineering Improvements Log

* **Category Analytics Optimization**: Replaced iterative sequential JS loops with PostgreSQL `groupBy` and `_sum` aggregations, reducing reporting latency to under 10ms.
* **Payment Overlay Dismissal Handling**: Implemented client-side `modal.ondismiss` callbacks to reset loading spinners and alert users on payment modal close.
* **Inclusive Date Calculation**: Corrected day arithmetic formula to include both start and end days inclusive, and enforced 18% GST calculation compliance.
* **Single Database Engine Consolidation**: Consolidated dual DB usage (MongoDB + PostgreSQL) into a unified PostgreSQL schema managed via Prisma ORM.
* **Stock Quantity Return Fix**: Fixed rental return handlers to dynamically increment `availableStock` by `rental.quantity` rather than a hardcoded `1`.
