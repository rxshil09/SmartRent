# 🚀 SmartRent Setup & Installation Guide

This guide details everything required to configure, migrate, seed, test, and run the SmartRent workspace.

---

## 📋 1. Prerequisites
Ensure you have the following installed locally:
*   **Node.js** >= 18.0.0
*   **PostgreSQL** >= 13.0 (with a database created, e.g. `createdb smartrent`)
*   **npm** >= 8.0.0

---

## ⚙️ 2. Environment Configuration

### A. Backend Setup (`/server/.env`)
Create a `.env` file in the `/server` directory:
```env
PORT=4000
NODE_ENV=development

# Database Connection (update with your PostgreSQL credentials)
POSTGRES_URL=postgresql://postgres:password@localhost:5432/smartrent?schema=public

# JWT Security Secrets (Generate secure random bytes in production)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Razorpay Payments (Credentials for test transactions)
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxx

# Gmail SMTP Configuration (Optional: OTPs print to local server terminal in development)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Default Admin Seed Parameters
ADMIN_EMAIL=admin@smartrent.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=SmartRent Admin
```

### B. Frontend Setup (`/client/.env`)
Create a `.env` file in the `/client` directory:
```env
VITE_API_URL=http://localhost:4000
```

---

## 🏗️ 3. Installation & Seeding

Run the following commands to initialize the project:

```bash
# 1. Install Server Dependencies & Generate Prisma types
cd server
npm install
npm run prisma:generate

# 2. Run Migrations, Clear Old Tables, and Seed Default Datasets
npm run prisma:migrate
npm run reset            # Resets all PostgreSQL tables (clears old data)
npm run seed:admin       # Creates default super-admin user (admin@smartrent.com / admin123)
npm run seed:products    # Seeds 100 mock products across 9 categories

# 3. Verify Server Integration (runs env & connection health checks)
npm run verify

# 4. Install Client Dependencies
cd ../client
npm install
```

---

## 🚀 4. Running Development Servers

Start the local server processes:

```bash
# Terminal 1 - Backend (starts Nodemon on http://localhost:4000)
cd server
npm run dev

# Terminal 2 - Frontend (starts Vite on http://localhost:5173)
cd client
npm run dev
```

---

## 🛡️ 5. Admin Console & Access
*   **Admin Login Link**: `http://localhost:5173/auth/login`
*   **Seeded Credentials**:
    *   *Email*: `admin@smartrent.com`
    *   *Password*: `admin123`
*   *Note*: Upon successful authentication, administrators are automatically redirected to the `/admin/dashboard` control panel. Role-based access checks (RBAC) guard all `/admin/*` views.

---

## 🔐 6. Customer Registration & Verification Flow
1. Navigate to the signup screen: `http://localhost:5173/auth/signup`.
2. Fill in details and click register.
3. **Inspect the Backend nodemon server console log** to fetch the 6-digit email verification OTP:
   ```
   ==================================================
   🔐 EMAIL VERIFICATION OTP
   ==================================================
   📧 Email: test-customer@smartrent.com
   🔢 OTP Code: 123456
   ==================================================
   ```
4. Paste the OTP code into the client verification field to activate the profile and proceed to login.

---

## 🛠️ 7. Full Scripts Reference

### Server Scripts (`/server`)
*   `npm run dev`: Boots server in watch-mode via Nodemon.
*   `npm start`: Boots server in static production node.
*   `npm run verify`: Verifies database login configurations.
*   `npm run reset`: Drops and rebuilds all PostgreSQL schema tables.
*   `npm run seed:admin`: Seeds/verifies default admin account.
*   `npm run seed:products`: Seeds mock inventory catalog.
*   `npm run prisma:generate`: Rebuilds Prisma client types.
*   `npm run prisma:migrate`: Syncs schemas with database.

### Client Scripts (`/client`)
*   `npm run dev`: Boots Vite development server.
*   `npm run build`: Bundles the React application into `/dist`.
*   `npm run lint`: Validates React Hook dependencies and ESLint configurations.
*   `npm run test`: Runs client unit tests using Vitest.
