# Mebel MS — Full Project Review

## Project Overview

Furniture manufacturing management system for m-house.uz.
- **Stack:** Spring Boot 3.x (Java 21) + React 19 (Vite, TypeScript) + PostgreSQL + MinIO + Liquibase
- **Port:** Backend 9060, Frontend 5173

---

## Architecture Summary

### Backend Structure
```
src/main/java/project/mebel/
├── auth/          # Login, register, JWT, workers CRUD
├── attendance/    # Daily attendance, check-in/out, hours submission
├── earning/       # Wage calculation, bonuses, payments
├── furniture/     # Templates, orders, assignments, material usage
├── warehouse/     # Inventory, transactions
├── workshop/      # Workshop CRUD
├── financiallog/  # Financial journal
├── saves/         # Cutting lists (kesim)
├── admin/         # Admin operations
├── user/          # User entity, profile
├── config/        # Security, Jackson, Swagger
└── minio/         # Image storage
```

### Key Patterns
- All responses wrapped in `ApiResponseStructure<T>` via `GlobalResponseAdvice`
- Soft delete with `@SQLRestriction("deleted_at IS NULL")`
- JWT authentication with access/refresh tokens
- Entity hierarchy: `BaseEntity → CreatedAuditEntity → MutableAuditEntity → SoftDeleteEntity`

### Roles
- `OWNER` — Business owner (full management)
- `WORKER` — Employee (own attendance/earnings only)
- `ADMIN` — System admin

---

## Frontend Structure
```
frontend/src/
├── api/           # Axios API calls
├── store/         # Zustand state (auth, language)
├── pages/         # Route pages (owner/, worker/, admin/)
├── components/    # Reusable UI components
├── types/         # TypeScript interfaces
├── hooks/         # Custom hooks
└── router/        # React Router config
```

---

# BUGS FOUND

## Critical Bugs

### 1. ✅ FIXED: MONTHLY_WAGE Payment Fails
**Location:** `frontend/src/pages/owner/EarningsPage.tsx` + `EarningServiceImpl.java`

**Fix Applied:**
- Added `earningIds` field to `EarningResponse` to track all underlying earning IDs
- Created batch payment endpoint `PATCH /api/earnings/pay-batch`
- Updated frontend to use batch payment for monthly wages

### 2. ✅ FIXED: Order Number Race Condition
**Location:** `FurnitureOrderServiceImpl.java:648-652`

**Fix Applied:** Changed to timestamp + random suffix pattern to avoid collisions.

### 3. ✅ FIXED: Token Generated Before User Saved
**Location:** `AuthServiceImpl.java:56-58`

**Fix Applied:** Reordered to save user first, then generate tokens.

### 4. ✅ FIXED: Wrong Status Transition in Frontend
**Location:** `OrderDetailPage.tsx:52`

**Fix Applied:** Removed invalid transitions, aligned with backend.

---

## Medium Bugs

### 5. ✅ FIXED: Monthly Earning periodStart Wrong Initial Value
**Location:** `AttendanceServiceImpl.java:563-565`

**Fix Applied:** Changed to use `firstOfMonth` instead of `today`.

### 6. ✅ FIXED: Commission Split Logic Error
**Location:** `FurnitureOrderServiceImpl.java`

**Fix Applied:** Each worker now gets their full commission percentage (no division by worker count).

### 7. ✅ FIXED: WageCalculationService Financial Log Type Wrong
**Location:** `WageCalculationService.java`

**Fix Applied:** Added `WAGE_CALCULATED` enum, use it for calculated wages (not yet paid).

### 8. N+1 Query Problem in Order Response
**Status:** Remaining - would require significant refactoring with projections

---

## Minor Bugs

### 9. setTitle/setActions Dependency in OrderDetailPage
**Status:** Low priority - doesn't cause functional issues

### 10. Material Select Only on First Row
**Status:** By design - additional rows inherit from first row to speed up batch entry

### 11. Warehouse Negative Quantity No Warning
**Status:** Intentional per CLAUDE.md - allows ordering ahead of stock

---

# MISSING LOGIC

## 1. Worker Unassignment Doesn't Reverse Wage Logs
When a worker is unassigned from an order, existing wage logs created by `WageCalculationService` are not reversed or recalculated.

## 2. No Batch Payment for Daily Wages
Owner sees aggregated monthly wage but must pay individual daily records. No bulk payment feature.

## 3. Monthly Wage Payment Partial Updates
When paying monthly wage, only one day's earning is marked as paid. The aggregated display becomes inconsistent.

## 4. No Email/Notification System
No way to notify workers of:
- New assignments
- Attendance reminders
- Payment received

## 5. No Audit Trail for Sensitive Operations
Soft delete tracks who deleted, but no audit log for:
- Password resets
- Worker hourly override
- Financial log modifications

## 6. Missing Attendance Mode Toggle
Worker can use either BUTTON_MODE or MANUAL_MODE per workshop setting, but there's no API to toggle this at workshop level.

## 7. No Order Edit History
When order details change (salePrice, estimatedCost), there's no history/changelog.

---

# WRONG LOGIC

## 1. ✅ FIXED: WageCalculationService Split Logic
**Location:** `WageCalculationService.java`

**Fix Applied:** Removed split logic entirely. Each worker now gets their full daily wage regardless of how many assignments they have.

## 2. ✅ FIXED: Monthly Salary Fallback Inflation
**Location:** `WageCalculationService.java`

**Fix Applied:** Now properly uses `dailySalary` directly if available, or calculates from `monthlySalary`. No inflation.

## 3. Overtime Hours Display But Not Paid
**Status:** By design - overtime hours shown for tracking but business rule is to cap at target

## 4. ✅ FIXED: Security Config Permits All
**Location:** `SecurityConfig.java`

**Fix Applied:** Added proper role-based authorization:
- Public: `/api/auth/**`, swagger docs
- Admin only: `/api/admin/**`
- Authenticated: all other `/api/**` endpoints

---

# RECOMMENDATIONS

## ✅ Completed
1. ~~Fix MONTHLY_WAGE payment logic~~ - Added batch payment
2. ~~Fix order number generation~~ - Using timestamp + random
3. ~~Fix commission split calculation~~ - Each worker gets full %
4. ~~Add proper role-based authorization~~ - SecurityConfig updated

## Still Remaining

### Medium Priority
1. Optimize N+1 queries in order response (requires projection refactoring)
2. Add audit logging for sensitive operations
3. Add email notifications

### Low Priority
1. Add order edit history
2. Improve error messages for edge cases
3. Add pagination to large lists

---

# Quick Reference for Future Claude Sessions

## Common Patterns

### Adding new endpoint:
1. Create/update Entity if needed
2. Create DTO (Request/Response)
3. Add Repository method
4. Implement Service interface → ServiceImpl
5. Add Controller endpoint
6. Add i18n message key

### Adding new frontend page:
1. Define types in `types/x.types.ts`
2. Create API calls in `api/x.api.ts`
3. Create page component in `pages/`
4. Add route in `router/index.tsx`
5. Add nav item in `Sidebar.tsx`

### Key utility methods:
- `Utils.getUserFromPrincipal(principal)` — Get current user
- `ApiException.notFound("key")` — Throw 404
- `ResponseHelper.success("key", data)` — Return success response
- `formatNumber(n)` — Format currency in frontend
- `toApiDate(date)` — Format date for API

### Debug tips:
- JWT issues → Check `JwtAuthenticationFilter`
- Response format issues → Check `GlobalResponseAdvice`
- Soft delete bypassing → Use native query with `@Query(nativeQuery=true)`
