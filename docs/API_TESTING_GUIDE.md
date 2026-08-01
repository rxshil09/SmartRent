# 🔌 REST API & Postman Testing Guide

This guide details all server API routes, request bodies, responses, and instructions to construct Postman test suites.

---

## 🔒 1. Authorization Headers

Protected endpoints require a Bearer token:
```http
Authorization: Bearer <your_access_token>
```
*Note: Secure refresh tokens are stored in HttpOnly cookies (`refreshToken`) on login.*

---

## 👥 2. User & Authentication Routes

### A. Register User (`POST /api/auth/register`)
*   **Request Body**:
    ```json
    {
      "email": "customer@smartrent.com",
      "password": "customer123",
      "name": "Customer User",
      "addressLine1": "123 Main St",
      "city": "Indore",
      "state": "MP",
      "pincode": "452001",
      "phoneNumber": "9876543210"
    }
    ```
*   **Response (201)**: Returns user record and displays OTP verification code in server terminal.

### B. Verify OTP (`POST /api/auth/verify-email`)
*   **Request Body**:
    ```json
    {
      "email": "customer@smartrent.com",
      "otp": "123456"
    }
    ```

### C. Login (`POST /api/auth/login`)
*   **Request Body**:
    ```json
    {
      "email": "customer@smartrent.com",
      "password": "customer123"
    }
    ```
*   **Response (200)**: Returns `accessToken`.

---

## 🏪 3. Catalog & Rental Routes

### A. List Catalog Products (`GET /api/products`)
*   **Query Parameters**: `page`, `limit`, `category`, `brand`, `search`

### B. Create Order Reservation (`POST /api/rentals/reserve`)
*   **Body (JSON)**:
    ```json
    {
      "items": [
        {
          "productId": "product-cuid",
          "startDate": "2026-08-05",
          "endDate": "2026-08-10",
          "quantity": 1
        }
      ],
      "fulfillmentMethod": "DELIVERY",
      "addressLine1": "123 Street",
      "city": "Indore",
      "state": "MP",
      "pincode": "452001"
    }
    ```
*   **Response (201)**: Returns database `orderId` and computed `totalAmount` (subtotal + 18% GST + shipping).

### C. Verify Payment (`POST /api/payments/razorpay/verify`)
*   **Body (JSON)**:
    ```json
    {
      "orderId": "order-cuid",
      "razorpayPaymentId": "pay_xxxxx",
      "razorpayOrderId": "order_xxxxx",
      "razorpaySignature": "sig_xxxxx"
    }
    ```

### D. Download Invoice PDF (`GET /api/rentals/:id/pdf`)
*   **Response**: Content stream containing the rendered invoice PDF file.

---

## 🛡️ 4. Admin Management Routes

*   **List All User Accounts**: `GET /api/users` (Admin only)
*   **Change User Role**: `PATCH /api/users/:id/role` (Admin only, body: `{ "role": "admin" }`)
*   **Update Order Status**: `PATCH /api/rentals/orders/:id/status` (Admin only, body: `{ "status": "CONFIRMED" }`)
*   **Analytics Reports**: `GET /api/reports/analytics` (Admin only, returns optimized dashboard aggregates)

---

## 📮 5. Postman Testing Workflow

### A. Environment Configuration
Create a new Postman Environment containing these variables:
*   `baseUrl`: `http://localhost:4000/api`
*   `accessToken`: *leave empty*
*   `adminEmail`: `admin@smartrent.com`
*   `adminPassword`: `admin123`

### B. Postman Authorization Rules
For protected calls, set authorization to **Bearer Token** referencing the environmental variable `{{accessToken}}`.

### C. Automatic Token Extraction Script
Paste the following javascript code inside the **Tests** tab of your Login request:
```javascript
const responseData = pm.response.json();
if (responseData.accessToken) {
    pm.environment.set("accessToken", responseData.accessToken);
    console.log("Access Token updated in environment successfully!");
}
```
Postman will automatically extract the Bearer token on successful login and use it to authorize subsequent API requests.
