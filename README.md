<div align="center">

# 🚀 SmartRent

### *Real-Time Rental Management Platform*

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

*Streamlining the entire rental lifecycle — from product listing to payment, delivery, and return*

---

</div>

## 📌 **Project Overview**

**SmartRent** is a production-ready, full-stack rental management application designed to simplify booking workflows, enforce inventory constraints, and aggregate dashboard insights. Built as a decoupled client-server architecture, it links a highly responsive React frontend with an Express API backend using PostgreSQL via Prisma ORM.

---

## 🌐 **Live Demo**

*   🔗 **Frontend URL**: [https://smart-rent-fawn.vercel.app](https://smart-rent-fawn.vercel.app)
*   🔗 **Backend API Health**: [https://smartrent-backend-0sin.onrender.com/health](https://smartrent-backend-0sin.onrender.com/health)

### 🔐 **Default Admin Credentials**
To check out the administrative features (Metrics, Reports, Catalog CRUD, Order Lifecycle):
*   **Email**: `admin@smartrent.com`
*   **Password**: `admin123`

---

## ⚡ **Core Features**

<div align="center">

| 🔐 **Authentication & Security** | 🏪 **Product Management** | 💳 **Payment Integration** |
|:---:|:---:|:---:|
| JWT-based authentication | Real-time inventory tracking | Secure Razorpay checkout |
| Role-based access control (RBAC) | Catalog CRUD & stock variables | GST 18% & Fare calculator |
| OTP verification with local fallback logs | Dynamic images & availability checks | Automated invoice PDF downloads |

| 📅 **Booking System** | 📊 **Analytics & Reports** | 🔔 **Notifications** |
|:---:|:---:|:---:|
| One active rental restriction | Real-time charts for categories | Nodemailer status change triggers |
| Inclusive start/end day formula | CSV revenue export tools | OTP console log bypass in dev |
| Store Pickup / Home Delivery selector | Prisma database aggregate counts | Special order instructions |

</div>

---

## 🏛️ **Deep-Dive Architecture & Design Patterns**

### 1. Concurrency Control & Pessimistic Locking (`FOR UPDATE`)
To prevent overbooking when multiple customers check out the same product simultaneously, SmartRent uses a pessimistic row locking strategy:
*   Before validating stock levels, the database rows for target products are locked using:
    ```sql
    SELECT * FROM "products" WHERE id IN (...) ORDER BY id FOR UPDATE
    ```
*   **Deadlock Prevention**: Product IDs are sorted alphabetically before executing the transaction to ensure locks are always acquired in the same sequential order, making deadlocks mathematically impossible.
*   **Optimized Lock Boundaries**: Row locks are committed immediately after creating the reservation. They are **not** held during external Razorpay HTTP payment gateway requests, avoiding connection pool exhaustion.

### 2. Transparent JWT Token Rotation
The frontend handles session management silently using an Axios response interceptor in `client/src/lib/api.js`. If a request fails with a `401 Unauthorized` token expiry error:
1.  The request queue is paused.
2.  A POST request is sent to `/auth/refresh` sending the secure HttpOnly cookie.
3.  On success, the client replaces the authorization headers and replays original user requests transparently.

### 3. Database Keep-Alive Health Check
To resolve cold starts on serverless database tiers (Aiven/Neon) and Render's free tier, the backend `/health` endpoint is configured to perform a query:
```javascript
await prisma.$queryRaw`SELECT 1`;
```
By setting up an external pinger (like `cron-job.org`) to hit this endpoint every 5 minutes, both the Render server and the database are kept awake.

### 4. Background Expiry Cron Service
If a customer leaves the checkout window without paying, a background `setInterval` cron job scans for `PENDING_PAYMENT` orders. If the reservation window expires, it atomically increments `availableStock` and decrements `reservedStock` to release the items back to the store.

---

## 🔌 **Key API Endpoints**

| Method | Endpoint | Access | Description |
|:---:|:---|:---:|:---|
| `POST` | `/auth/register` | Public | Register user, triggers terminal OTP |
| `POST` | `/auth/verify-email` | Public | Validate OTP code to activate account |
| `POST` | `/auth/login` | Public | Logs in user, returns `accessToken` |
| `GET` | `/products` | Public | List paginated catalog products |
| `POST` | `/rentals/reserve` | Customer | Creates checkout reservation & locks stock |
| `POST` | `/payments/razorpay/verify` | Customer | Validates transaction signature |
| `GET` | `/rentals/:id/pdf` | User/Admin | Generates and downloads PDF invoices |
| `GET` | `/reports/analytics` | Admin | Fetches category/revenue metrics |

---

## ⚙️ **Quick Start & Setup Guide**

### **📋 Prerequisites**
*   Node.js >= 18.0.0
*   PostgreSQL >= 13.0
*   npm >= 8.0.0

### **🛠️ Setup Steps**
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/rxshil09/SmartRent.git
    cd SmartRent
    ```
2.  **Backend Environment Setup (`/server/.env`)**:
    Create a `.env` file in the `server` folder with your credentials:
    ```env
    POSTGRES_URL=postgresql://postgres:password@localhost:5432/smartrent?schema=public
    JWT_ACCESS_SECRET=your-access-secret
    JWT_REFRESH_SECRET=your-refresh-secret
    ```
3.  **Migrate & Seed**:
    ```bash
    cd server
    npm install
    npm run prisma:generate
    npm run prisma:migrate
    npm run reset            # Resets all tables
    npm run seed:admin       # Creates super admin
    npm run seed:products    # Seeds mock products
    ```
4.  **Frontend Environment Setup (`/client/.env`)**:
    Create a `.env` file in the `client` folder:
    ```env
    VITE_API_URL=http://localhost:4000
    ```
    Install packages:
    ```bash
    cd ../client
    npm install
    ```
5.  **Run Locally**:
    *   Backend (Port 4000): `npm run dev` inside `server/`
    *   Frontend (Port 5173): `npm run dev` inside `client/`

---

## 🧪 **CI/CD Pipeline (GitHub Actions)**

The repository includes a GitHub Actions CI workflow in `.github/workflows/lint-test.yml`. It runs automatically on any push or pull request to the `main` branch:
*   **Frontend**: Installs dependencies, runs ESLint (`npm run lint`), and executes Vitest test suites (`npm run test -- --run`).
*   **Backend**: Installs dependencies and runs `prisma:generate` to guarantee compilation integrity.

---

## 📞 **Support & Documentation**

Detailed guides are located inside the `docs/` folder:
*   📖 **System Architecture Guide:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Monorepo structure, relations, CORS, and locking details.
*   ⚙️ **Setup & Installation Guide:** [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md) — Detailed environment variables and script definitions.
*   🔌 **REST API & Postman Testing Guide:** [`docs/API_TESTING_GUIDE.md`](docs/API_TESTING_GUIDE.md) — Route body samples, Postman variable extractions, and token handling.
