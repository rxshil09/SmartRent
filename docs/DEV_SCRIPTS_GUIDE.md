# 🛠️ Development Scripts & Setup Guide

This guide details all command-line scripts, database initialization routines, environment variables, and execution flowcharts for developing, testing, and managing **SmartRent**.

---

## 🧭 1. Workspace Bootstrap Flowchart

The flowchart below demonstrates the recommended step-by-step workflow for setting up a fresh development workspace:

```mermaid
flowchart TD
    Start([Clone Repository]) --> EnvConfig[Configure .env files in server/ and client/]
    EnvConfig --> ServerInstall[cd server && npm install]
    ServerInstall --> PrismaGen[npm run prisma:generate]
    PrismaGen --> DBConnect{PostgreSQL Running?}
    
    DBConnect -- No --> StartDB[Start PostgreSQL Service] --> DBConnect
    DBConnect -- Yes --> Migrate[npm run prisma:migrate]
    
    Migrate --> ResetDB[npm run reset]
    ResetDB --> SeedAdmin[npm run seed:admin]
    SeedAdmin --> SeedProducts[npm run seed:products]
    SeedProducts --> Verify[npm run verify]
    
    Verify --> ClientInstall[cd ../client && npm install]
    ClientInstall --> DevServers[Run npm run dev in server/ and client/]
    DevServers --> Ready([Application Running on localhost:5173])
```

---

## ⚙️ 2. Environment Configuration Reference

### Backend `.env` Specification (`/server/.env`)

```env
# Server Port & Environment Mode
PORT=4000
NODE_ENV=development

# Database Connection String (PostgreSQL)
POSTGRES_URL=postgresql://postgres:password@localhost:5432/smartrent?schema=public

# JWT Token Secrets
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Razorpay Test Credentials
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=xxxxxx

# Gmail SMTP Parameters (Optional: OTPs output to terminal console in development)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# Admin Bootstrap Parameters
ADMIN_EMAIL=admin@smartrent.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=SmartRent Admin
```

### Frontend `.env` Specification (`/client/.env`)

```env
# API Gateway Target URL
VITE_API_URL=http://localhost:4000
```

---

## 📜 3. Backend Scripts Reference (`/server`)

All backend commands are executed from the `/server` directory:

| Command | Script / Action | Purpose & Description |
| :--- | :--- | :--- |
| `npm run dev` | `nodemon src/main.js` | Starts API server in auto-reloading watch mode on port 4000 |
| `npm start` | `node src/main.js` | Starts server in production mode |
| `npm run prisma:generate` | `prisma generate` | Compiles `schema.prisma` definitions into TypeScript/JS Prisma Client |
| `npm run prisma:migrate` | `prisma migrate dev` | Applies SQL migration files to PostgreSQL database |
| `npm run prisma:studio` | `prisma studio` | Launches interactive browser GUI for database browsing (port 5555) |
| `npm run seed:admin` | `node scripts/seed-admin.js` | Seeds or updates default super-admin account (`admin@smartrent.com`) |
| `npm run seed:products` | `node scripts/seed-products.js` | Seeds 100 sample rental products across 9 categories |
| `npm run reset` | `node scripts/reset-db.js` | Drops and rebuilds all PostgreSQL tables (clears old data) |
| `npm run verify` | `node scripts/verify-setup.js` | Diagnostic script verifying DB connection and env parameters |

### 🛠️ Custom Utility Scripts Deep-Dive

#### 1. `scripts/seed-admin.js`
Creates the primary administrator account using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`. Hashes the password using `bcryptjs` and sets `role = "admin"` and `isEmailVerified = true`.

#### 2. `scripts/seed-products.js`
Generates a realistic catalog of products across categories (Cameras, Drones, Audio, Lenses, Lighting, Gaming, Camping, Party Gear, Power Tools) with stock, pricing per day, conditions, and image URLs.

#### 3. `scripts/reset-db.js`
Executes raw SQL truncates with `CASCADE` on `users`, `products`, `orders`, and `rentals` tables to restore a clean database state during testing.

#### 4. `scripts/verify-setup.js`
Validates that required environment variables are set and executes a test ping query (`SELECT 1`) to ensure PostgreSQL accessibility.

---

## 💻 4. Frontend Scripts Reference (`/client`)

All frontend commands are executed from the `/client` directory:

| Command | Script / Action | Purpose & Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts Vite HMR dev server on port 5173 |
| `npm run build` | `vite build` | Compiles optimized production bundle into `/dist` |
| `npm run preview` | `vite preview` | Previews production build bundle locally |
| `npm run lint` | `eslint .` | Runs ESLint analysis across React components |
| `npm run test` | `vitest --environment jsdom` | Executes client unit test suites using Vitest & Testing Library |

---

## 🏃 5. Quick-Start Command Summary

To get the full stack running locally in two terminal windows:

### Terminal 1 (Backend API)
```bash
cd server
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed:admin
npm run seed:products
npm run dev
```

### Terminal 2 (Frontend React SPA)
```bash
cd client
npm install
npm run dev
```

App is accessible at **`http://localhost:5173`**. Log in to Admin panel using `admin@smartrent.com` / `admin123`.
