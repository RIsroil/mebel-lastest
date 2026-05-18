# 🎯 Complete Test Data Guide — Mebel MS

**DataInitializer** has been completely rewritten with **clean, comprehensive test data** that demonstrates all features working together.

---

## 📋 Test Users (Credentials)

All users have password: **`password123`**

| Username | Role | Full Name | Workshop | Purpose |
|----------|------|-----------|----------|---------|
| **admin** | ADMIN | Admin System | — | System administration |
| **owner1** | OWNER | Alisher Karimov | Premium Mebel Factory | Workshop owner, all permissions |
| **worker1** | WORKER | Rustam Abdullayev | Premium Mebel Factory | Daily pay (300k/day), 5% commission |
| **worker2** | WORKER | Dilnoza Khamidova | Premium Mebel Factory | Daily pay (250k/day), 4% commission |
| **worker3** | WORKER | Sherali Mirzayev | Premium Mebel Factory | Monthly pay (5M/month), 3% commission, Team lead |

---

## 🏭 Workshop

**Premium Mebel Factory**
- Address: Tashkent, Yunus Rajabiy 123, Building A
- Phone: +998712345678
- Description: Premium furniture manufacturing with modern equipment
- Created: 60 days ago
- Owner: Alisher Karimov

---

## 📦 Warehouse — 11 Materials

All materials available in stock with full transaction history:

| # | Material | Unit | Qty | Avg Price | Total Value |
|----|----------|------|-----|-----------|-------------|
| 1 | Chinor wood | m³ | 25 | 650,000 | 16,250,000 |
| 2 | Oak plywood | m² | 150 | 85,000 | 12,750,000 |
| 3 | Birch veneer | m | 200 | 12,000 | 2,400,000 |
| 4 | Stainless steel screws | kg | 50 | 35,000 | 1,750,000 |
| 5 | Door hinges | piece | 300 | 8,500 | 2,550,000 |
| 6 | Cabinet handles | piece | 250 | 12,000 | 3,000,000 |
| 7 | Wood stain | litre | 40 | 45,000 | 1,800,000 |
| 8 | Polyurethane varnish | litre | 30 | 78,000 | 2,340,000 |
| 9 | Wood filler | kg | 20 | 28,000 | 560,000 |
| 10 | Fabric roll | m | 180 | 65,000 | 11,700,000 |
| 11 | Foam padding | m² | 100 | 42,000 | 4,200,000 |

**Total Warehouse Value: ~59,150,000** (updated as materials used in orders)

---

## 🛋️ Furniture Templates (Reference)

1. **Executive Office Desk**
   - Est. Production: 5 days
   - Description: Professional office desk with storage

2. **Living Room Sofa**
   - Est. Production: 15 days
   - Description: Comfortable sectional sofa

---

## 📋 Furniture Orders — Complete Workflow Examples

### Order #1: COMPLETED ✅
- **Title:** Executive Office Desk — Client: Tech Corp
- **Status:** COMPLETED (15 days production)
- **Sale Price:** 4,800,000 so'm
- **Estimated Cost:** 1,920,000 so'm
- **Client:** Tech Corporation (+998701234567)
- **Started:** 30 days ago
- **Completed:** 15 days ago

**Materials Used:**
- Chinor wood: 2 m³ × 650,000 = 1,300,000
- Oak plywood: 8 m² × 85,000 = 680,000
- Stainless steel screws: 5 kg × 35,000 = 175,000
- Door hinges: 20 pieces × 8,500 = 170,000
- Wood stain: 3 litre × 45,000 = 135,000
- Polyurethane varnish: 2 litre × 78,000 = 156,000

**Actual Material Cost: 2,616,000** (129% of estimated)

**Workers Assigned:**
- Rustam Abdullayev (5% commission) — Started day 1
- Dilnoza Khamidova (4% commission) — Started day 2

---

### Order #2: SOLD 💰
- **Title:** Living Room Sofa Set — Client: Luxury Home
- **Status:** SOLD
- **Sale Price:** 13,200,000 so'm
- **Estimated Cost:** 5,280,000 so'm
- **Client:** Luxury Home Designs (+998702222222)
- **Started:** 28 days ago
- **Completed:** 8 days ago
- **Sold:** 6 days ago

**Materials Used:**
- Chinor wood: 4 m³ × 650,000 = 2,600,000
- Oak plywood: 15 m² × 85,000 = 1,275,000
- Fabric roll: 12 m × 65,000 = 780,000
- Foam padding: 20 m² × 42,000 = 840,000
- Wood stain: 5 litre × 45,000 = 225,000
- Polyurethane varnish: 4 litre × 78,000 = 312,000

**Actual Material Cost: 6,032,000** (114% of estimated)

**Commission Paid:** 13,200,000 × 5% = 660,000 (Rustam Abdullayev) — PAID

**Workers Assigned:**
- Rustam Abdullayev (5%)
- Dilnoza Khamidova (4%)
- Sherali Mirzayev (3%)

---

### Order #3: IN_PROGRESS 🔨
- **Title:** Custom Bedroom Set — Client: Royal Residence
- **Status:** IN_PROGRESS (8 days elapsed)
- **Sale Price:** 18,500,000 so'm
- **Estimated Cost:** 7,400,000 so'm
- **Client:** Royal Residence (+998703333333)
- **Started:** 8 days ago
- **Expected Completion:** 7 days from now

**Materials Used (So Far):**
- Chinor wood: 5 m³ × 650,000 = 3,250,000
- Oak plywood: 12 m² × 85,000 = 1,020,000
- Birch veneer: 25 m × 12,000 = 300,000
- Fabric roll: 8 m × 65,000 = 520,000

**Actual Material Cost So Far: 5,090,000** (69% consumed)

**Workers Assigned:**
- Rustam Abdullayev (5%)
- Dilnoza Khamidova (4%)
- Sherali Mirzayev (3%)

---

### Order #4: DRAFT 📝
- **Title:** Kitchen Cabinet System — Client: Modern Home
- **Status:** DRAFT (Initial quote)
- **Sale Price:** 7,200,000 so'm
- **Estimated Cost:** 2,880,000 so'm
- **Client:** Modern Home Solutions (+998704444444)
- **Created:** 2 days ago

**Materials (Tentative):**
- Oak plywood: 6 m² × 85,000 = 510,000

---

## 💼 Worker Earnings Summary

### Rustam Abdullayev (worker1) — DAILY PAY
- **Daily Rate:** 300,000 so'm
- **Daily Target Hours:** 8
- **Commission:** 5%

**Current Month (May 2026):**
- Attendance: 22 working days (with weekends auto-skipped)
- Daily Wages: 22 × 300,000 = **6,600,000**
- Commission (Order #2 sale): **660,000**
- Bonus (Excellent craftsmanship): **500,000**
- **Total This Month: 7,760,000**

**Assignments:**
- Order #1: Day 1 (COMPLETED)
- Order #2: Lead worker (SOLD) ✓ Commission paid
- Order #3: Day 1 (IN_PROGRESS)

---

### Dilnoza Khamidova (worker2) — DAILY PAY
- **Daily Rate:** 250,000 so'm
- **Daily Target Hours:** 8
- **Commission:** 4%

**Current Month (May 2026):**
- Attendance: 22 working days
- Daily Wages: 22 × 250,000 = **5,500,000**
- Bonus (Efficient upholstery): **400,000**
- **Total This Month: 5,900,000**

**Assignments:**
- Order #1: Day 2 (COMPLETED)
- Order #2: Upholstery specialist (SOLD)
- Order #3: Day 2 (IN_PROGRESS)

---

### Sherali Mirzayev (worker3) — MONTHLY PAY
- **Monthly Salary:** 5,000,000 so'm
- **Daily Target Hours:** 8
- **Commission:** 3%
- **Role:** Team lead / Project manager

**Current Month (May 2026):**
- Monthly Salary: **5,000,000** (22 working days)
- Bonus (Project management): **800,000**
- **Total This Month: 5,800,000**

**Assignments:**
- Order #2: Team coordinator (SOLD)
- Order #3: Team lead (IN_PROGRESS)

---

## 📊 Daily Attendance & Wages (30 days)

All three workers have complete attendance records:
- **Check-in:** 08:30 AM
- **Check-out:** 05:30 PM
- **Hours worked:** 8 hours (locked)
- **Weekends:** Automatically skipped (Saturdays & Sundays)
- **Total working days:** 22/month

Each day generates:
- `DailyAttendanceEntity` (check-in/out timestamps, hours locked)
- `EarningEntity` (DAILY_WAGE type, matching daily rate)

---

## 🎁 Bonuses Awarded

| Worker | Amount | Reason | Date |
|--------|--------|--------|------|
| Rustam | 500,000 | Excellent craftsmanship on executive desk | 5 days ago |
| Dilnoza | 400,000 | Efficient upholstery work on sofa | 5 days ago |
| Sherali | 800,000 | Perfect project management & coordination | 8 days ago |

Each bonus creates both a `BonusEntity` and an `EarningEntity` (BONUS type).

---

## 💰 Financial Logs — Complete Activity

### Warehouse Purchases (~42M total)
- Initial wood stock (Chinor, plywood, veneer, etc.) — 40 days ago
- Hardware purchases (screws, hinges, handles) — 35 days ago
- Finishing materials (stain, varnish, filler) — 32 days ago
- Upholstery materials (fabric, foam) — 30 days ago
- Restocking (additional veneer, stain, varnish) — 15 days ago
- Current month replenishment — 3 days ago

### Material Usage (~12M consumed)
- Order #1 production materials — 28 days ago
- Order #2 production materials — 25 days ago
- Order #3 production materials — 10 days ago
- In-progress additional materials — 2 days ago

### Furniture Sales (~18M revenue)
- Order #1 Completed sale: 4,800,000 — 15 days ago
- Order #2 Sold: 13,200,000 — 6 days ago

### Commissions (~660k paid)
- Rustam Abdullayev (5% × 13.2M) — 5 days ago

### Wages & Salaries (~25M total)
- Sherali (Monthly): 5M
- Rustam (22 days × 300k): 6.6M
- Dilnoza (20 days × 250k): 5M
- Plus advances and partial payments

### Bonuses (~1.7M awarded)
- Distributed across all three workers
- Different dates and reasons

### Net Profit Analysis
- **Total Revenue:** 18,000,000
- **Total COGS:** 12,000,000
- **Gross Profit:** 6,000,000
- **Wages:** 16,600,000
- **Bonuses:** 1,700,000
- **Current Status:** Production cycle (orders 3 & 4 still in progress)

---

## 🔐 Data Integrity Features

### Soft Deletes Implemented
- All entities with deletion use `SoftDeleteEntity`
- Deleted records remain in DB but filtered by `deleted_at IS NULL`
- Restore functionality available if needed

### Audit Trail
- All entities tracked with `created_by`, `created_at`
- Mutable entities tracked with `updated_by`, `updated_at`
- Financial logs show actor (owner performing action)

### Transaction Tracking
- Every material usage creates `WarehouseTransactionEntity`
- Tracks qty before/after, price, total cost
- Linked to furniture order for traceability

### Earning Records
- Each day's attendance → daily wage earning
- Each sold order → commission earning
- Each bonus → bonus earning
- Clear types (DAILY_WAGE, COMMISSION, BONUS, MONTHLY_WAGE)

---

## 🧪 Test Workflows

### Workflow 1: View Dashboard (Owner)
1. Login as **owner1** / **password123**
2. See dashboard with:
   - Completed orders: 1
   - In-progress orders: 2
   - Sold orders: 1
   - Draft orders: 1
   - **Warehouse value:** ~59.15M
   - **This month revenue:** 18M (from completed sales)
   - **Total wages this month:** ~17.3M
   - **Total bonuses:** 1.7M

### Workflow 2: View Worker Earnings (Daily Pay)
1. Login as **worker1** / **password123**
2. See my earnings:
   - Daily wages (22 × 300k): 6.6M
   - Commission (Order #2): 660k
   - Bonus: 500k
   - **Total: 7.76M**

### Workflow 3: View Worker Earnings (Monthly Pay)
1. Login as **worker3** / **password123**
2. See my earnings:
   - Monthly salary: 5M
   - Bonus: 800k
   - **Total: 5.8M**

### Workflow 4: Furniture Order Lifecycle
1. **Create** → Status: DRAFT (Order #4 example)
2. **Start Production** → Status: IN_PROGRESS (Order #3 example)
   - Add materials as used (furniture/orders/{id}/materials POST)
   - Assign workers (furniture/orders/{id}/assignments POST)
3. **Complete** → Status: COMPLETED (Order #1 example)
   - Set completion date
4. **Sell** → Status: SOLD (Order #2 example)
   - Set sale date & customer info
   - Commission automatically calculated & paid

### Workflow 5: Warehouse Management
1. View all materials with current stock
2. View transaction history (IN/OUT)
3. Material consumed in orders automatically updates warehouse
4. Stock level warnings based on `lowStock` setting

---

## 📱 API Endpoints to Test

### Authentication
```
POST /api/auth/login
{
  "username": "owner1",
  "password": "password123"
}
```

### Workshop
```
GET /api/workshops
GET /api/workshops/{id}
```

### Warehouse
```
GET /api/warehouse
GET /api/warehouse/items
GET /api/warehouse/transactions
GET /api/warehouse/transactions/today-out
```

### Furniture Orders
```
GET /api/furniture/orders
GET /api/furniture/orders/{id}
GET /api/furniture/orders/{id}/materials
POST /api/furniture/orders/{id}/materials
DELETE /api/furniture/orders/{id}/materials/{usageId}
```

### Earnings
```
GET /api/earnings
GET /api/earnings/me (for workers)
GET /api/earnings/by-type?type=DAILY_WAGE
GET /api/earnings/bonus
```

### Attendance
```
GET /api/attendance/today
GET /api/attendance/history
POST /api/attendance/check-in
POST /api/attendance/check-out
```

### Financial Logs
```
GET /api/financial-logs
GET /api/financial-logs/summary
GET /api/financial-logs?type=FURNITURE_SOLD
```

---

## ✨ Key Features Demonstrated

✅ **Complete multi-user system** (Admin, Owner, Workers)
✅ **Role-based access control** (OWNER vs WORKER permissions)
✅ **Warehouse management** (11 materials with full history)
✅ **Order lifecycle** (DRAFT → IN_PROGRESS → COMPLETED → SOLD)
✅ **Material usage tracking** (with automatic warehouse updates)
✅ **Worker assignments** with per-worker commission percentages
✅ **Daily wage system** (22 working days, auto-skip weekends)
✅ **Monthly salary** (alternative to daily wage)
✅ **Commission earnings** (calculated & paid on sale)
✅ **Bonuses** (manual, with clear reasons)
✅ **Attendance tracking** (30 days of check-in/out records)
✅ **Financial logging** (purchases, usage, sales, commissions, wages, bonuses)
✅ **Soft deletes** (all entities properly marked as deleted)
✅ **Audit trail** (created_by, created_at on all records)
✅ **Transaction history** (warehouse IN/OUT with full traceability)

---

## 🚀 How to Use

1. **Restart the application** — DataInitializer runs on startup
2. **Verify data creation** — All tables populated automatically
3. **Test each workflow** using the credentials above
4. **Check database** directly if needed:

```sql
-- User count
SELECT role, COUNT(*) FROM users WHERE deleted_at IS NULL GROUP BY role;

-- Warehouse materials
SELECT name, quantity, avg_unit_price FROM warehouse_items WHERE deleted_at IS NULL;

-- Furniture orders by status
SELECT status, COUNT(*) FROM furniture_orders WHERE deleted_at IS NULL GROUP BY status;

-- Worker earnings this month
SELECT u.full_name, u.pay_type, SUM(e.total_amount) as earnings
FROM earnings e
JOIN users u ON e.worker_id = u.id
WHERE EXTRACT(MONTH FROM e.earn_date) = 5 
  AND EXTRACT(YEAR FROM e.earn_date) = 2026
GROUP BY u.id, u.full_name, u.pay_type;

-- Financial log summary
SELECT log_type, SUM(amount) as total FROM financial_logs GROUP BY log_type;
```

---

## 🎯 Notes

- **Password:** All users use `password123`
- **Database:** PostgreSQL with Liquibase migrations
- **Frontend:** React with full UI for all features
- **Port:** Backend at `9060`, Frontend at `5173`
- **Data Integrity:** All soft-deleted records remain in DB for audit
- **Audit Trail:** Every transaction has creator & timestamp

Everything is fully functional and ready for demo! 🚀
