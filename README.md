<div align="center">

# 🚀 SmartRent

### *Real-Time Rental Management Platform*

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

*Streamlining the entire rental lifecycle — from product listing to payment, delivery, and return*

---

</div>

## 👥 **Team Soul_Society**

<table align="center">
<tr>
<td align="center"><strong>🎯 Teijas Saini</strong><br><em>Team Lead</em></td>
<td align="center"><strong>💻 Rushil Jain</strong><br><em>Developer</em></td>
<td align="center"><strong>⚡ Vikash</strong><br><em>Developer</em></td>
<td align="center"><strong>🔧 Nitish Choubey</strong><br><em>Developer</em></td>
</tr>
</table>

---

## 📌 **Project Overview**

**SmartRent** is a comprehensive full-stack rental management platform that simplifies how businesses and customers interact in the rental ecosystem. It provides real-time inventory management, seamless booking experiences, secure payments, and high-performance administration analytics.

### **Video Link**
🎥 [Watch the project demo video](https://youtu.be/l3mLkUDyNRA)

---

## 🛠️ **Technology Stack**

<div align="center">

### **Frontend Ecosystem**
![React](https://img.shields.io/badge/React%2019.1.1-61DAFB?style=flat&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite%207.1.0-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%203.4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router%207.8-CA4245?style=flat&logo=reactrouter&logoColor=white)

### **Backend Infrastructure**
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express%205.1-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma%206.13-2D3748?style=flat&logo=prisma&logoColor=white)

### **Development & Tools**
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=flat&logo=razorpay&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat&logo=eslint&logoColor=white)

</div>

---

## ⚡ **Core Features**

<div align="center">

| 🔐 **Authentication & Security** | 🏪 **Product Management** | 💳 **Payment Integration** |
|:---:|:---:|:---:|
| JWT-based authentication | Real-time inventory tracking | Secure Razorpay integration |
| Role-based access control | Catalog CRUD & stock management | GST 18% & Fare calculation |
| OTP verification with local fallback logs | Dynamic images & availability checks | Automated invoice PDF downloads |

| 📅 **Booking System** | 📊 **Analytics & Reports** | 🔔 **Notifications** |
|:---:|:---:|:---:|
| One active rental restriction | Real-time charts for categories | Nodemailer status change triggers |
| Inclusive start/end day formula | CSV revenue export tools | OTP console log bypass in dev |
| Store Pickup / Home Delivery selector | Prisma database aggregate counts | Special order instructions |

</div>

---

## 📁 **Project Architecture**

```
SmartRent/
 │
 ├── client/
 │   ├── src/
 │   │   ├── components/            ← CustomerNav, ProtectedRoute
 │   │   ├── lib/api.js             ← Axios client + JWT interceptors
 │   │   ├── App.jsx                ← Routing configuration
 │   │   └── App/
 │   │       ├── auth/              ← Login & Signup
 │   │       ├── customer/          ← Products, Checkout, Rentals, Profile
 │   │       └── admin/             ← Dashboard, Users, Products, Reports
 │
 └── server/
     ├── src/
     │   ├── auth/                  ← Login, signup & OTP logic
     │   ├── users/                 ← User and Profile API
     │   ├── products/              ← Product inventory controls
     │   ├── rentals/               ← PDF invoices & coupon validator
     │   ├── reports/               ← High-performance aggregations (groupBy)
     │   └── notifications/         ← Status change email dispatchers
```

---

## 🚀 **Quick Start Guide**

### **📋 Prerequisites**
```bash
Node.js >= 18.0.0
PostgreSQL >= 13.0
npm >= 8.0.0
```

### **⚙️ Setup Steps**

1. **Clone the repository**
   ```bash
   git clone https://github.com/tojo04/SmartRent.git
   cd SmartRent
   ```

2. **Configure Backend Environment**
   ```bash
   cd server
   cp config.example.env .env
   # Edit .env and supply your POSTGRES_URL
   npm install
   ```

3. **Migrate and Seed Database**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run reset            # Clears old tables
   npm run seed:admin       # Creates default super-admin (admin@smartrent.com / admin123)
   npm run seed:products    # Seeds mock products catalog
   ```

4. **Configure Frontend Environment**
   ```bash
   cd ../client
   npm install
   ```
   Create a `.env` in the `/client` directory:
   ```env
   VITE_API_URL=http://localhost:4000
   ```

### **🚀 Launch Application**

**Start Backend (Port 4000):**
```bash
cd server
npm run dev
```

**Start Frontend (Port 5173):**
```bash
cd client
npm run dev
```

**🎉 Access the application:**
- **Frontend URL:** `http://localhost:5173`
- **Admin Access:** `admin@smartrent.com` / `admin123`

---

## 🎯 **Development Roadmap**

<div align="center">

| Phase | Feature | Status |
|:---:|:---|:---:|
| **Phase 1** | 🔐 Authentication & Relational Users | ✅ Complete |
| **Phase 2** | 📦 Product Catalog & Atomic Stock Locking | ✅ Complete |
| **Phase 3** | 🛒 Shopping Cart & Fulfillment checkout | ✅ Complete |
| **Phase 4** | 💳 Razorpay Payment gateway integration | ✅ Complete |
| **Phase 5** | 📊 Aggregated Reports & CSV Exporting | ✅ Complete |
| **Phase 6** | 🔔 Nodemailer transactional alerts | ✅ Complete |
| **Phase 7** | 📄 Dynamic PDF invoice downloads | ✅ Complete |
| **Phase 8** | 🧪 Test Suites & Bug cleanup | ✅ Complete |

</div>

---

## 📞 **Support & Documentation**

- 📖 **System Architecture Guide:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- ⚙️ **Setup & Installation Guide:** [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md)
- 🔌 **REST API & Postman Testing Guide:** [`docs/API_TESTING_GUIDE.md`](docs/API_TESTING_GUIDE.md)

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### **🌟 Star this repository if you found it helpful!**

**Built with ❤️ by Team Soul_Society**

*Transforming the rental industry, one line of code at a time*

---

[![GitHub stars](https://img.shields.io/github/stars/tojo04/SmartRent?style=social)](https://github.com/tojo04/SmartRent/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/tojo04/SmartRent?style=social)](https://github.com/tojo04/SmartRent/network/members)
[![GitHub issues](https://img.shields.io/github/issues/tojo04/SmartRent)](https://github.com/tojo04/SmartRent/issues)

</div>
