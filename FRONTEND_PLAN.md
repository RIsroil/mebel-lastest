# Mebel MS — React Frontend Reja
> Yangi chat ochilganda shu faylni o'qi va davom et.
> Bajarilgan bosqichlar ✅, jarayondagilari 🔄, kutayotganlari ⬜

---

## Dizayn sistema (Figma prototipidan)

```
Ranglar:
  --bg:       #F5F3EE   (sahifa fon)
  --surface:  #FFFFFF   (kard/panel fon)
  --surface2: #F9F8F5   (table header fon)
  --border:   #E8E4DC
  --text:     #1A1814   (asosiy matn, sidebar fon)
  --text2:    #6B6559   (ikkilamchi matn)
  --text3:    #A09890   (hint/label)
  --accent:   #C17F3E   (asosiy rang — amber/jigarrang)
  --accent2:  #9E6425   (hover holat)
  --green:    #2D7D5A   | --green-bg: #E8F5EF
  --red:      #C0392B   | --red-bg:   #FDECEA
  --blue:     #2D5FA0   | --blue-bg:  #EBF0FA
  --purple:   #6B46A8   | --purple-bg:#F0EBFA

Shriftlar:
  Body:    'DM Sans' (300/400/500/600/700)
  Display: 'Playfair Display' (700/800) — logo, katta raqamlar

Border radius: 12px (asosiy), 8px (kichik)
Sidebar kenglik: 220px
Topbar balandlik: 56px
```

---

## 16 ta sahifa ro'yxati

| # | Sahifa | Rol | Status |
|---|--------|-----|--------|
| 01 | Login | Hammaga | ⬜ |
| 02 | Register (Owner) | Public | ⬜ |
| 03 | Blocked Error | Auth | ⬜ |
| 04 | Owner Dashboard | OWNER | ⬜ |
| 05 | Buyurtma Tafsiloti | OWNER | ⬜ |
| 06 | Ombor (Warehouse) | OWNER | ⬜ |
| 07 | Workerlar ro'yxati | OWNER | ⬜ |
| 08 | Maosh boshqaruvi | OWNER | ⬜ |
| 09 | Worker Check-in | WORKER | ⬜ |
| 10 | Soat kiritish | WORKER | ⬜ |
| 11 | Worker Daromadlarim | WORKER | ⬜ |
| 12 | Admin Foydalanuvchilar | ADMIN | ⬜ |
| 13 | Modal: Yangi Worker | OWNER | ⬜ |
| 14 | Modal: Ombor Tranzaksiya | OWNER | ⬜ |
| 15 | Modal: Bonus berish | OWNER | ⬜ |
| 16 | Modal: User Bloklash | ADMIN | ⬜ |

---

## Texnologiyalar

```
React 18 + TypeScript
Vite (build)
React Router v6 (routing + role guards)
Axios (HTTP, interceptor: auto token refresh)
TanStack Query v5 (server state, cache)
Zustand (auth store: user, tokens)
React Hook Form + Zod (form validation)
```

---

## Loyiha strukturasi

```
mebel-lastest/
  frontend/
    index.html
    vite.config.ts
    tsconfig.json
    package.json
    src/
      main.tsx
      App.tsx
      
      api/              ← Barcha API chaqiruvlar
        axiosInstance.ts    (base URL, interceptors)
        auth.api.ts
        user.api.ts
        workshop.api.ts
        furniture.api.ts
        warehouse.api.ts
        attendance.api.ts
        earning.api.ts
        admin.api.ts
        image.api.ts
      
      types/            ← TypeScript interfeyslari
        auth.types.ts
        user.types.ts
        workshop.types.ts
        furniture.types.ts
        warehouse.types.ts
        attendance.types.ts
        earning.types.ts
        admin.types.ts
        common.types.ts   (PageResponse, ApiResponse)
      
      store/
        auth.store.ts     (Zustand: user, accessToken, refreshToken)
      
      router/
        index.tsx         (React Router config)
        PrivateRoute.tsx  (auth guard)
        RoleRoute.tsx     (rol guard: OWNER/WORKER/ADMIN)
      
      layouts/
        AppLayout.tsx     (Sidebar + Topbar + <Outlet />)
        AuthLayout.tsx    (markaz login/register uchun)
      
      components/
        ui/
          Button.tsx
          Badge.tsx         (status badge-lari)
          Modal.tsx         (generic modal wrapper)
          Table.tsx         (generic table)
          Pagination.tsx
          FormInput.tsx
          FormSelect.tsx
          StatCard.tsx      (dashboard stat kard)
          Avatar.tsx
          Spinner.tsx
          EmptyState.tsx
          ConfirmDialog.tsx
        layout/
          Sidebar.tsx
          Topbar.tsx
      
      pages/
        auth/
          LoginPage.tsx
          RegisterPage.tsx
          BlockedPage.tsx
        owner/
          DashboardPage.tsx
          OrderDetailPage.tsx
          WarehousePage.tsx
          WorkersPage.tsx
          EarningsPage.tsx
        worker/
          CheckInPage.tsx
          SubmitHoursPage.tsx
          MyEarningsPage.tsx
        admin/
          UsersPage.tsx
      
      hooks/
        useAuth.ts          (login/logout/refresh)
        useCurrentUser.ts   (GET /users/me)
        usePagination.ts
      
      utils/
        formatDate.ts
        formatMoney.ts      (so'm formati: 1 500 000 so'm)
        cn.ts               (classnames helper)
```

---

## BOSQICH 1 — Loyiha yaratish va asosiy setup ✅

**Qilish kerak:**
```bash
cd mebel-lastest
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router-dom axios @tanstack/react-query zustand
npm install react-hook-form @hookform/resolvers zod
npm install -D @types/node
```

**Fayllar:**
1. `vite.config.ts` — proxy: `http://localhost:8080` → `/api`
2. `src/api/axiosInstance.ts` — baseURL, Bearer token interceptor, refresh token logic
3. `src/store/auth.store.ts` — Zustand store (user, tokens, setAuth, logout)
4. `src/types/common.types.ts` — `ApiResponse<T>`, `PageResponse<T>`
5. `src/types/auth.types.ts` — `TokenResponse`, `LoginRequest`
6. `src/api/auth.api.ts` — login, register, refresh, createWorker, deleteWorker
7. `src/router/index.tsx` — asosiy route config
8. `src/router/PrivateRoute.tsx` + `RoleRoute.tsx`

---

## BOSQICH 2 — Auth sahifalari (01, 02, 03) ✅

**Fayllar:**
1. `src/layouts/AuthLayout.tsx` — markaz karta, accent bg
2. `src/pages/auth/LoginPage.tsx`
   - Form: username, password
   - POST /api/auth/login → token saqlash → rol bo'yicha redirect
   - 5 marta xato → blocked error
3. `src/pages/auth/RegisterPage.tsx`
   - Form: username, password
   - POST /api/auth/register → OWNER uchun
4. `src/pages/auth/BlockedPage.tsx`
   - Bloklash xabari + qancha vaqt qolganligi

---

## BOSQICH 3 — App layout va sidebar ⬜

**Fayllar:**
1. `src/layouts/AppLayout.tsx` — flex layout: sidebar + main
2. `src/components/layout/Sidebar.tsx`
   - Logo (Playfair Display, accent rang)
   - Nav items rol bo'yicha:
     * OWNER: Dashboard, Buyurtmalar, Ombor, Workerlar, Maosh
     * WORKER: Check-in, Mening daromadlarim
     * ADMIN: Foydalanuvchilar, Sehlar
   - Bottom: avatar + ism + rol + logout
3. `src/components/layout/Topbar.tsx` — sahifa nomi, qo'shimcha tugmalar
4. `src/components/ui/` — Button, Badge, Modal, Table, StatCard, FormInput, FormSelect, Spinner, Avatar

---

## BOSQICH 4 — Owner Dashboard (04) ⬜

**API:** GET /api/furniture/orders, GET /api/attendance/workshop, GET /api/warehouse/items  
**Fayllar:**
1. `src/pages/owner/DashboardPage.tsx`
   - 4 ta StatCard: Faol buyurtmalar, Tugatilgan, Ombor qiymati, Bugungi davomat
   - Oxirgi buyurtmalar jadvali (orderNumber, title, status, salePrice, worker)
   - O'ng panel: Bugungi davomat (kimlar kelgan), Kam stok ogohlantirishlari

---

## BOSQICH 5 — Furniture Order Detail (05) ⬜

**API:** GET /api/furniture/orders, GET /api/furniture/orders/{id}, PATCH status, POST/DELETE workers, POST materials  
**Fayllar:**
1. `src/pages/owner/OrdersPage.tsx` — buyurtmalar ro'yxati (asosiy sahifa)
2. `src/pages/owner/OrderDetailPage.tsx`
   - Chap: buyurtma ma'lumotlari, rasm galereyasi, materiallar jadvali
   - O'ng panel: holat o'zgartirish (DRAFT→IN_PROGRESS→COMPLETED→SOLD), biriktirilgan workerlar, narx hisobi
   - Holat badge-lari: DRAFT (kulrang), IN_PROGRESS (ko'k), COMPLETED (yashil), SOLD (amber), CANCELLED (qizil)

---

## BOSQICH 6 — Warehouse (06) + Transaksiya Modal (14) ✅

**API:** GET/POST/PUT/DELETE /api/warehouse/items, POST /api/warehouse/items/{id}/transactions  
**Fayllar:**
1. `src/pages/owner/WarehousePage.tsx`
   - Ombor elementlari jadvali: ism, SKU, miqdor, birlik, o'rtacha narx, umumiy qiymat, holat
   - Qizil badge: lowStock=true bo'lganda
   - Har qator: "Kirim" tugmasi → Modal 14
2. `src/pages/owner/WarehouseDetailPage.tsx` — tranzaksiyalar tarixi
3. Modal: `WarehouseTransactionModal.tsx`
   - transactionType: IN/OUT/ADJUSTMENT
   - quantity, unitPrice, supplierName, invoiceNumber, notes

---

## BOSQICH 7 — Workers List (07) + Create Modal (13) ✅

**API:** GET /api/auth/workers, POST /api/auth/workers, DELETE /api/auth/id  
**Fayllar:**
1. `src/pages/owner/WorkersPage.tsx`
   - Workerlar jadvali: ism, username, seh, to'lov turi, maosh, holat
   - "Yangi Worker" tugmasi → Modal 13
2. Modal: `CreateWorkerModal.tsx`
   - workshopId (select), username, password, payType (DAILY/MONTHLY), dailyHoursTarget, dailySalary

---

## BOSQICH 8 — Earnings Management (08) + Bonus Modal (15) ⬜

**API:** GET /api/earnings/workshop, GET /api/earnings/workers/{id}, PATCH /api/earnings/{id}/pay, POST /api/earnings/bonus  
**Fayllar:**
1. `src/pages/owner/EarningsPage.tsx`
   - Filter: sana oralig'i, worker tanlash
   - Daromadlar jadvali: worker, sana, tur (DAILY_WAGE/COMMISSION/BONUS), summa, holat (to'langan/yo'q)
   - "To'landi" tugmasi → PATCH pay
   - "Bonus" tugmasi → Modal 15
2. Modal: `BonusModal.tsx`
   - workerId (select), amount, reason, bonusDate

---

## BOSQICH 9 — Worker sahifalari (09, 10, 11) ⬜

**API:** POST check-in, POST submit-hours, GET /api/attendance/my, GET /api/earnings/my  
**Fayllar:**
1. `src/pages/worker/CheckInPage.tsx`
   - Katta soat (Playfair Display, accent rang)
   - "Ishga kirish" tugmasi → POST check-in
   - Bugungi holat: kirdi/chiqdi
   - So'nggi 7 kun davomat jadvali
   - Mening buyurtmalarim (assigned orders)
2. `src/pages/worker/SubmitHoursPage.tsx`
   - Bugungi check-in holati
   - Ogohlantirish: 3 kun muhlat
   - Soat kiritish formi + izoh
   - Deadline countdown
3. `src/pages/worker/MyEarningsPage.tsx`
   - Xulosa kartalar: jami, to'langan, kutilayotgan
   - Bar chart (7 kunlik)
   - Daromadlar ro'yxati: sana, tur, summa, holat

---

## BOSQICH 10 — Admin sahifasi (12) + Block Modal (16) ⬜

**API:** GET /api/admin/users, POST /api/admin/users, PUT /api/admin/users/{id}, DELETE /api/admin/users/{id}, PATCH block/unblock  
**Fayllar:**
1. `src/pages/admin/UsersPage.tsx`
   - Filter: rol, seh, active/blocked
   - Foydalanuvchilar jadvali: ism, username, rol, seh, to'lov, holat, bloklash
   - "Yangi user", "Tahrirlash", "O'chirish", "Blok" tugmalari
2. Modal: `BlockUserModal.tsx`
   - reason, blockDays

---

## BOSQICH 11 — Yakuniy ishlalar ⬜

1. **Token refresh interceptor** — 401 response → auto refresh → retry
2. **Error boundary** + global toast xabarlar (API xatolar)
3. **Loading states** — skeleton loaders (TanStack Query isSuspense)
4. **Responsive** — sidebar mobile'da drawer bo'ladi
5. **Environment** — `.env`: `VITE_API_URL=http://localhost:8080`
6. **Build** — `npm run build` test

---

## API ↔ Sahifa xaritalama (tezkor nazorat)

| Endpoint | Sahifa |
|----------|--------|
| POST /api/auth/login | LoginPage |
| POST /api/auth/register | RegisterPage |
| POST /api/auth/refresh-token | axiosInstance interceptor |
| POST /api/auth/workers | CreateWorkerModal |
| DELETE /api/auth/id | WorkersPage |
| GET /users/me | auth.store init |
| PATCH /users/update | Profile (ixtiyoriy) |
| GET/POST/PUT/DELETE /api/workshops | DashboardPage (qisman) |
| GET/POST/PUT/DELETE /api/furniture/orders | OrdersPage, OrderDetailPage |
| PATCH /api/furniture/orders/{id}/status | OrderDetailPage |
| POST/DELETE /api/furniture/orders/{id}/workers | OrderDetailPage |
| POST /api/furniture/orders/{id}/materials | OrderDetailPage |
| GET/POST/PUT/DELETE /api/furniture/templates | (kelajakda alohida sahifa) |
| POST /api/furniture/templates/{id}/materials | (kelajakda) |
| GET/POST/PUT/DELETE /api/warehouse/items | WarehousePage |
| POST /api/warehouse/items/{id}/transactions | WarehouseTransactionModal |
| GET /api/warehouse/items/{id}/transactions | WarehouseDetailPage |
| POST /api/attendance/check-in | CheckInPage |
| POST /api/attendance/submit-hours | SubmitHoursPage |
| GET /api/attendance/my | CheckInPage |
| GET /api/attendance/workshop | DashboardPage |
| PATCH /api/attendance/{id}/override | EarningsPage (owner) |
| GET /api/earnings/my | MyEarningsPage |
| GET /api/earnings/workers/{id} | EarningsPage |
| GET /api/earnings/workshop | EarningsPage |
| PATCH /api/earnings/{id}/pay | EarningsPage |
| POST /api/earnings/bonus | BonusModal |
| GET /api/admin/users | Admin UsersPage |
| POST /api/admin/users | Admin UsersPage modal |
| PUT /api/admin/users/{id} | Admin UsersPage modal |
| DELETE /api/admin/users/{id} | Admin UsersPage |
| PATCH /api/admin/users/{id}/block | BlockUserModal |
| PATCH /api/admin/users/{id}/unblock | Admin UsersPage |
| POST /api/admin/workshops | Admin (kelajakda) |
| POST /api/images/upload | OrderDetailPage (rasm) |

---

## Joriy holat

**Bajarilgan:** Bosqich 1 ✅ + Bosqich 2 ✅ + Bosqich 3 ✅ + Bosqich 4 ✅ + Bosqich 5 ✅ + Bosqich 6 ✅ + Bosqich 7 ✅  
**Keyingi qadam:** BOSQICH 8 — Earnings Management (EarningsPage + BonusModal)

---

## Eslatmalar

- Backend: `http://localhost:8080`
- JWT: `Authorization: Bearer <accessToken>` header barcha protected endpointlarda
- Refresh token: `/api/auth/refresh-token` — body: plain string (token)
- Pagination: `?page=0&size=20&sort=createdAt,desc`
- Sana format: `YYYY-MM-DD`
- ID format: UUID
- Rol uchta: `OWNER`, `WORKER`, `ADMIN`
- Login bo'lsa localStorage'da token saqlash (`accessToken`, `refreshToken`, `user`)
