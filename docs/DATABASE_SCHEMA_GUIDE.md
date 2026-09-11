# 📊 Database Schema & Concurrency Guide

This document provides a deep dive into **SmartRent’s** PostgreSQL relational database schema, Prisma ORM models, stock state transitions, pessimistic locking mechanics, and deadlock elimination algorithms.

---

## 🧬 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Order : "places"
    User ||--o{ Rental : "rents"
    Order ||--|{ Rental : "contains line items"
    Product ||--o{ Rental : "booked in line items"

    User {
        String id PK "cuid()"
        String email UK
        String name
        String role "customer | admin"
        String passwordHash
        String refreshTokenHash
        Boolean isEmailVerified
        String emailVerificationToken
        String passwordResetToken
        DateTime passwordResetExpires
        String addressLine1
        String addressLine2
        String city
        String state
        String pincode
        DateTime createdAt
        DateTime updatedAt
    }

    Product {
        String id PK "cuid()"
        String name
        String description
        String[] images
        Boolean isRentable
        Int stock
        Int availableStock
        Int reservedStock
        Decimal pricePerDay "10,2"
        String category
        String brand
        String model
        String condition "New | Good | Fair | Poor"
        DateTime createdAt
        DateTime updatedAt
    }

    Order {
        String id PK "cuid()"
        String userId FK
        String userEmail
        String userName
        Decimal subtotal "10,2"
        Decimal gstAmount "10,2"
        Decimal deliveryFee "10,2"
        Decimal totalAmount "10,2"
        String couponCode
        Decimal couponDiscount "10,2"
        OrderStatus status "PENDING_PAYMENT | PAID | CONFIRMED | CANCELLED | EXPIRED"
        DateTime reservedUntil
        String razorpayPaymentId UK
        String razorpayOrderId UK
        String fulfillmentMethod "PICKUP | DELIVERY"
        String addressLine1
        String addressLine2
        String city
        String state
        String pincode
        DateTime createdAt
        DateTime updatedAt
    }

    Rental {
        String id PK "cuid()"
        String userId FK
        String userEmail
        String userName
        String productId FK
        String orderId FK
        DateTime startDate
        DateTime endDate
        Int totalDays
        Int quantity
        Decimal pricePerDay "10,2"
        Decimal totalPrice "10,2"
        RentalStatus status "RESERVED | PENDING | CONFIRMED | PICKED_UP | RETURNED | CANCELLED | OVERDUE"
        DateTime pickupDate
        DateTime returnDate
        String notes
        DateTime createdAt
        DateTime updatedAt
    }
```

---

## 📈 2. Stock State Transition Flowchart

The flowchart below demonstrates how stock variables (`availableStock`, `reservedStock`, `stock`) mutate across order and rental lifecycles:

```mermaid
flowchart TD
    Init([Product Created: stock=N, availableStock=N, reservedStock=0]) --> Checkout[Customer Places Checkout Reservation]
    
    Checkout --> LockCheck{Lock Product Row & Verify availableStock >= Requested Qty}
    
    LockCheck -- Insufficient Stock --> Fail[Reservation Rejected: Out of Stock]
    
    LockCheck -- Stock Available --> ReserveStock[availableStock -= Qty <br/> reservedStock += Qty <br/> Order Status: PENDING_PAYMENT <br/> reservedUntil: NOW + 5 mins]
    
    ReserveStock --> PaymentChoice{Payment Status?}
    
    PaymentChoice -- 5-Min TTL Expired / User Cancelled --> CronRelease[CronService / Cancel Handler <br/> availableStock += Qty <br/> reservedStock -= Qty <br/> Order Status: EXPIRED / CANCELLED]
    CronRelease --> Init
    
    PaymentChoice -- Payment Verified --> Paid[reservedStock -= Qty <br/> Order Status: PAID <br/> Rental Status: PENDING/CONFIRMED]
    
    Paid --> Fulfillment[Customer Picked Up / Delivered <br/> Rental Status: PICKED_UP]
    
    Fulfillment --> ReturnItem[Item Returned to Store <br/> Rental Status: RETURNED <br/> availableStock += Qty]
    ReturnItem --> Completed([Rental Completed])
```

---

## 🔐 3. Concurrency, Locking & Deadlock Elimination

SmartRent handles high-concurrency checkout traffic without race conditions or stock overbooking using PostgreSQL row locking and lexicographical ordering algorithms.

```mermaid
sequenceDiagram
    autonumber
    actor CustomerA as Customer A (Cart: P2, P1)
    actor CustomerB as Customer B (Cart: P1, P2)
    participant DB as PostgreSQL DB (products table)

    Note over CustomerA, CustomerB: Lexicographical ID Sorting Applied: Both sort to [P1, P2]
    
    CustomerA->>DB: Transaction Start: Lock P1 (SELECT ... FOR UPDATE)
    CustomerA-->>DB: P1 Lock Granted
    
    CustomerB->>DB: Transaction Start: Request Lock P1 (SELECT ... FOR UPDATE)
    Note over CustomerB, DB: Customer B Waits for P1 Lock (No Deadlock possible)

    CustomerA->>DB: Lock P2 (SELECT ... FOR UPDATE)
    CustomerA-->>DB: P2 Lock Granted
    
    CustomerA->>DB: Verify Stock & Update counters (availableStock -= Qty, reservedStock += Qty)
    CustomerA->>DB: Create Order & Commit Transaction
    Note over CustomerA, DB: Locks on P1 and P2 Released (< 10ms boundary)

    DB-->>CustomerB: P1 Lock Granted to Customer B
    CustomerB->>DB: Lock P2 (SELECT ... FOR UPDATE)
    CustomerB-->>DB: P2 Lock Granted
    CustomerB->>DB: Verify Remaining Stock & Commit
```

### A. SQL Pessimistic Row Locking (`SELECT FOR UPDATE`)
Inside `RentalsService.createReservation`, products are queried using raw SQL within a transaction (`isolationLevel: ReadCommitted`):
```sql
SELECT * FROM "products" 
WHERE id IN ('cuid_1', 'cuid_2') 
ORDER BY id 
FOR UPDATE
```
This forces PostgreSQL to hold exclusive row locks on the matching product records until the transaction completes, preventing concurrent transactions from modifying `availableStock` simultaneously.

### B. Lexicographical Sorting for Deadlock Elimination
If Customer A attempts to lock `[Product_2, Product_1]` while Customer B attempts to lock `[Product_1, Product_2]`, a circular wait (deadlock) can occur. SmartRent eliminates deadlocks by sorting product IDs alphabetically prior to acquiring locks:
```javascript
const sortedItems = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
```
Because all concurrent checkouts lock products in identical global alphabetical sequence, deadlocks are **mathematically impossible**.

### C. Short Lock Boundaries
Database locks are released **before** invoking external payment APIs (e.g. Razorpay HTTP calls taking 200–500ms). The database transaction commits in **< 10ms**, transitioning the order to `PENDING_PAYMENT` with a 5-minute TTL (`reservedUntil`).

---

## 📋 4. Field-Level Schema Specifications

### `User` Model (`@map("users")`)
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | `@id @default(cuid())` | Unique user identifier |
| `email` | String | `@unique` | Customer/Admin email address |
| `name` | String | | Full user name |
| `role` | String | `@default("customer")` | Access role (`"customer"` or `"admin"`) |
| `passwordHash` | String | | Bcrypt password hash |
| `refreshTokenHash`| String? | | Optional hash of refresh token |
| `isEmailVerified` | Boolean | `@default(false)` | Account verification flag |
| `createdAt` | DateTime | `@default(now())` | Account creation timestamp |

### `Product` Model (`@map("products")`)
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | `@id @default(cuid())` | Unique product identifier |
| `name` | String | | Catalog item title |
| `stock` | Int | `@default(0)` | Total physical inventory capacity |
| `availableStock` | Int | `@default(0)` | Units available for new bookings |
| `reservedStock` | Int | `@default(0)` | Units currently reserved/rented |
| `pricePerDay` | Decimal | `@db.Decimal(10,2)` | Daily rental rate in INR |
| `category` | String | `@default("")` | Product category grouping |
| `condition` | String | `@default("Good")` | Equipment state (`New`, `Good`, `Fair`, `Poor`) |

### `Order` Model (`@map("orders")`)
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | `@id @default(cuid())` | Unique order transaction ID |
| `userId` | String | Foreign Key -> `User.id` | Purchaser user reference |
| `subtotal` | Decimal | `@db.Decimal(10,2)` | Rental subtotal before tax/fees |
| `gstAmount` | Decimal | `@db.Decimal(10,2)` | Computed 18% Goods & Services Tax |
| `deliveryFee` | Decimal | `@db.Decimal(10,2)` | Delivery fee (₹99 for DELIVERY, ₹0 for PICKUP) |
| `totalAmount` | Decimal | `@db.Decimal(10,2)` | Grand total payable |
| `status` | OrderStatus | `@default(PENDING_PAYMENT)` | `PENDING_PAYMENT`, `PAID`, `CONFIRMED`, `CANCELLED`, `EXPIRED` |
| `reservedUntil` | DateTime? | | 5-minute reservation TTL timestamp |
| `razorpayOrderId`| String? | `@unique` | Razorpay gateway order identifier |

### `Rental` Model (`@map("rentals")`)
| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | `@id @default(cuid())` | Unique rental line item ID |
| `orderId` | String | Foreign Key -> `Order.id` | Parent order reference (`onDelete: Cascade`) |
| `productId` | String | Foreign Key -> `Product.id` | Rented product reference (`onDelete: Cascade`) |
| `userId` | String | Foreign Key -> `User.id` | Renter user reference (`onDelete: Cascade`) |
| `startDate` | DateTime | | Rental start date |
| `endDate` | DateTime | | Rental end date |
| `totalDays` | Int | | Computed rental days |
| `quantity` | Int | `@default(1)` | Number of units booked |
| `status` | RentalStatus | `@default(RESERVED)` | `RESERVED`, `PENDING`, `CONFIRMED`, `PICKED_UP`, `RETURNED`, `CANCELLED`, `OVERDUE` |
