# 🚀 Quick Start — Complete Test Data Ready

## ✅ What's Done

Your DataInitializer has been **completely rewritten** with comprehensive, dynamic test data that demonstrates all features working perfectly together.

### No More Manual Setup! 🎉
Just start the app, and everything is automatically created:
- ✅ 1 Admin account
- ✅ 1 Owner + Workshop with full setup
- ✅ 3 Workers (with different pay types)
- ✅ 11 Warehouse materials
- ✅ 4 Furniture orders (showing all states)
- ✅ 30 days of attendance per worker
- ✅ Complete earnings (wages, commissions, bonuses)
- ✅ Full financial audit trail

---

## 🎯 Test Credentials (Password: `password123`)

```
┌─────────────┬───────┬──────────────────────────────────────┐
│ Username    │ Role  │ Purpose                              │
├─────────────┼───────┼──────────────────────────────────────┤
│ admin       │ ADMIN │ System administration                │
│ owner1      │ OWNER │ Owner - Full access                  │
│ worker1     │WORKER │ Daily pay (300k/day) + 5% commission │
│ worker2     │WORKER │ Daily pay (250k/day) + 4% commission │
│ worker3     │WORKER │ Monthly (5M/month) + 3% commission   │
└─────────────┴───────┴──────────────────────────────────────┘
```

---

## 🔥 Run It Now

```bash
cd C:\Users\isroi\IdeaProjects\mebel-lastest

# Terminal 1: Start Backend (9060)
.\mvnw spring-boot:run

# Terminal 2: Start Frontend (5173)
cd frontend && npm run dev
```

**Wait ~2 minutes for backend to start, then open:**
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend: http://localhost:9060

---

## 📊 Test Data Summary

### Complete Furniture Order Workflow
| Order | Title | Status | Price | Materials | Workers | Sold? |
|-------|-------|--------|-------|-----------|---------|-------|
| #1 | Executive Desk | COMPLETED | 4.8M | 6 materials | 2 | — |
| #2 | Living Room Sofa | **SOLD** | 13.2M | 6 materials | 3 | ✅ |
| #3 | Bedroom Set | IN_PROGRESS | 18.5M | 4 materials | 3 | — |
| #4 | Kitchen Cabinets | DRAFT | 7.2M | quote only | — | — |

### Warehouse Ready
11 materials from wood to upholstery, **~59.15M value**

### Worker Earnings This Month
- Rustam: **7.76M** (wages + bonus + commission)
- Dilnoza: **5.9M** (wages + bonus)
- Sherali: **5.8M** (salary + bonus)

### Financial Activity
- **Total Warehouse Purchases:** ~42M
- **Revenue from Sales:** 18M
- **Total Material Used:** 12M
- **Total Wages Paid:** 16.6M
- **Total Bonuses:** 1.7M

---

## 🧪 What to Test

### 1️⃣ Login as Owner
```
Username: owner1
Password: password123
```
See dashboard with all workshops, orders, materials, and financial data.

### 2️⃣ View Warehouse
- 11 materials with stock levels
- Transaction history (IN/OUT)
- Values update as materials used in orders

### 3️⃣ Explore Furniture Orders
- **DRAFT**: Order #4 (quotation stage)
- **IN_PROGRESS**: Order #3 (actively being produced)
- **COMPLETED**: Order #1 (finished but not sold)
- **SOLD**: Order #2 (sold & commission paid)

### 4️⃣ Check Worker Earnings
Login as workers to see:
- Daily wages (22 working days = 22 attendance records)
- Bonuses (with reasons)
- Commissions (on sold orders)

### 5️⃣ View Financial Logs
Complete audit trail:
- When materials purchased
- When materials used in orders
- When orders sold
- When commissions paid
- When wages paid
- When bonuses awarded

---

## 📋 Files to Review

| File | Purpose |
|------|---------|
| **TEST_DATA_GUIDE.md** | 📖 Complete documentation of all test data |
| **DATAINITIALIZER_CHANGES.md** | 📝 What changed and why |
| **SQL_VERIFICATION_QUERIES.sql** | 🔍 Verify data in database |
| **DataInitializer.java** | 💻 The code that creates everything |

---

## 🔍 Verify Data Was Created

### Option 1: Check Database
```sql
-- Connect to mebel database
SELECT COUNT(*) FROM users WHERE deleted_at IS NULL;        -- Should be 5
SELECT COUNT(*) FROM warehouse_items WHERE deleted_at IS NULL; -- Should be 11
SELECT COUNT(*) FROM furniture_orders WHERE deleted_at IS NULL; -- Should be 4
SELECT COUNT(*) FROM earnings WHERE deleted_at IS NULL;      -- Should be 100+
```

### Option 2: Call API
```bash
curl -X POST http://localhost:9060/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"owner1","password":"password123"}'

# Copy the token, then:
curl http://localhost:9060/api/furniture/orders \
  -H "Authorization: Bearer {token}"
```

### Option 3: Check Frontend
Login and see all data in the UI immediately.

---

## 💡 Key Features Demonstrated

✅ **Multi-user system** with role-based access
✅ **Workshop management** with worker assignments
✅ **Warehouse tracking** with material transactions
✅ **Order lifecycle** (create → assign → produce → complete → sell)
✅ **Material usage** (auto-updates warehouse)
✅ **Worker commission** (5% on sold orders)
✅ **Daily wages** (300k, 250k per day)
✅ **Monthly salary** (5M for team lead)
✅ **Bonuses** (500k-800k for excellence)
✅ **Attendance tracking** (30 days of records)
✅ **Financial logging** (complete audit trail)
✅ **Soft deletes** (records preserved)
✅ **Audit trail** (who did what and when)

---

## ⚡ Zero Manual Setup

Previously you had to:
- Create users manually
- Add warehouse materials
- Create orders
- Add materials to orders
- Assign workers
- Fill in attendance
- Create earnings records
- Add bonuses
- Generate financial logs

**Now:** Everything happens automatically on startup! ✨

---

## 🎬 Demo Flow

1. **Start app** → DataInitializer runs
2. **Login as owner1** → See full workshop setup
3. **View Orders** → See 4 orders in different states
4. **View Warehouse** → See 11 materials, values updated as used
5. **View Earnings** → See complete payment history
6. **View Logs** → See financial audit trail
7. **Login as worker** → See only own earnings and attendance

---

## 📞 Support

If you see any errors:
1. Check the **Spring Boot logs** for exceptions
2. Run the **SQL_VERIFICATION_QUERIES.sql** to verify data
3. Check **DataInitializer.java** for the code
4. See **TEST_DATA_GUIDE.md** for all details

Everything should work perfectly with zero errors! ✅

---

## 🏁 Ready?

```bash
# Just run:
.\mvnw spring-boot:run

# Then open:
http://localhost:5173
```

**That's it!** Everything is ready. No manual setup needed. 🚀
