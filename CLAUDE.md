# Mebel MS — Claude tushuncha fayli

## Loyiha nima?
Mebel ishlab chiqarish kompaniyasi uchun boshqaruv tizimi (Management System).
- **URL:** https://m-house.uz
- **Stack:** Spring Boot (Java 21) + React 19 (Vite, TypeScript) + PostgreSQL + MinIO + Liquibase + Docker

---

## Struktura

```
mebel-lastest/
├── src/main/java/project/mebel/   ← Backend (Spring Boot)
├── frontend/src/                  ← Frontend (React + Vite)
├── src/main/resources/
│   ├── application.properties     ← config (JWT, DB, MinIO, port 9060)
│   ├── db/changelog/              ← Liquibase migrations (001–029)
│   └── i18n/messages_uz.properties ← Barcha xabarlar (uzbekcha)
└── docker-compose.yml             ← postgres + minio + backend
```

---

## Backend arxitektura

### Asosiy qoidalar
- **Barcha response** `GlobalResponseAdvice` orqali `ApiResponseStructure<T>` ga o'raladi:
  ```json
  { "success": true, "message": "...", "data": ... }
  ```
- **Xatolar** `GlobalExceptionHandler` → `ApiException` orqali boshqariladi
- **JWT filter** (`JwtAuthenticationFilter`) — har so'rovda Authorization header tekshiriladi
- **Security:** `/api/auth/**` ochiq, qolgan barcha endpoint `/**` ruxsatli lekin JWT bilan tekshiriladi
- **Soft delete:** `SoftDeleteEntity` (@SQLRestriction "deleted_at IS NULL") — o'chirishda real o'chirmaydi

### Entity ierarxiyasi
```
BaseEntity (id: UUID @UuidGenerator)
  └── CreatedAuditEntity (created_at, created_by)
        └── MutableAuditEntity (updated_at, updated_by)
              └── SoftDeleteEntity (deleted_at, deleted_by)
```
Hammasi `@SuperBuilder + @NoArgsConstructor` bilan.

### Asosiy packagelar
| Package | Endpoint | Rol |
|---|---|---|
| `auth` | `/api/auth` | login, register, refresh-token, /me, workers CRUD |
| `workshop` | `/api/workshops` | Seh CRUD (OWNER) |
| `warehouse` | `/api/warehouse` | Ombor + tranzaksiyalar (OWNER) |
| `furniture` | `/api/furniture/templates`, `/api/furniture/orders` | Mebel shablonlari va buyurtmalar |
| `attendance` | `/api/attendance` | Davomat (WORKER check-in, OWNER override) |
| `earning` | `/api/earnings` | Maosh hisoblash va to'lash |
| `saves` | `/api/saves` | Kesim ro'yxatlari — cutting lists (OWNER) |
| `user` | `/api/users` | Profil yangilash |
| `admin` | `/api/admin` | Admin panel |

### Rollar
- `OWNER` — korxona egasi (barcha boshqaruv)
- `WORKER` — ishchi (faqat o'z davomat/maoshi)
- `ADMIN` — system admin

### JWT
- Access token: `ACCESS_TOKEN_EXP` ms (production: 3600000 = 1 soat)
- Refresh token: `REFRESH_TOKEN_EXP` ms (production: 604800000 = 7 kun)
- **MUHIM:** qiymatlar **millisekunda** da bo'lishi shart!
- Refresh endpoint: `POST /api/auth/refresh-token` — body: JSON string (raw token)

### Muhim texnik nuqtalar
- `ResponseHelper.success()` → i18n message key oladi
- `Utils.getUserFromPrincipal(principal)` → Principal'dan UserEntity olish
- `GlobalResponseAdvice` String body uchun JSON serialize qiladi (String body edge case)
- Attendance cron: har kuni 03:00 da o'tgan kunlar locklari

---

## Frontend arxitektura

### Stack
- React 19 + TypeScript + Vite
- React Query (TanStack v5) — server state
- Zustand v5 + persist — auth state (localStorage)
- React Hook Form + Zod — formlar
- React Router v7 — routing
- CSS Modules — styling

### Asosiy fayllar
| Fayl | Maqsad |
|---|---|
| `src/api/axiosInstance.ts` | Axios + 401 interceptor (refresh token logic) |
| `src/store/auth.store.ts` | Auth state (accessToken, refreshToken, user, isAuthenticated) |
| `src/router/index.tsx` | Barcha route'lar |
| `src/components/layout/Sidebar.tsx` | Nav menyu (rol bo'yicha) |
| `src/layouts/AppLayout.tsx` | `useProfileSync` — har window focus da `/api/auth/me` chaqiradi |

### API response pattern
Backend `ApiResponseStructure<T>` qaytaradi, frontend:
```typescript
const { data: resp } = useQuery({ queryFn: someApi.getAll })
const items = resp?.data?.data ?? []   // resp.data = ApiResponse, .data = actual data
```

### Rol-based navigation (Sidebar)
- `OWNER`: Dashboard, Buyurtmalar, Saves (⭐), Ombor, Korxonalar, Workerlar, Maosh, Moliyaviy jurnal
- `WORKER` (MANUAL_MODE): Haftalik davomat (calendar), Mening maoshim
- `WORKER` (BUTTON_MODE): Kirish/Chiqish, Soatlarni topshirish, Mening maoshim
- `ADMIN`: Foydalanuvchilar

### Sahifalar
| Route | Component | Rol |
|---|---|---|
| `/dashboard` | DashboardPage | OWNER |
| `/orders`, `/orders/:id` | OrdersPage, OrderDetailPage | OWNER |
| `/saves` | SavesPage | OWNER |
| `/warehouse`, `/warehouse/:id` | WarehousePage, WarehouseDetailPage | OWNER |
| `/workshops` | WorkshopsPage | OWNER |
| `/workers` | WorkersPage | OWNER |
| `/earnings` | EarningsPage | OWNER |
| `/logs` | LogsPage | OWNER |
| `/weekly-attendance` | WeeklyAttendancePage (calendar) | WORKER |
| `/check-in` | CheckInPage | WORKER (BUTTON_MODE) |
| `/submit-hours` | SubmitHoursPage | WORKER |
| `/my-earnings` | MyEarningsPage | WORKER |
| `/admin/users` | UsersPage | ADMIN |

### CSS o'zgaruvchilar (tema)
`var(--accent)` — asosiy rang (oltin-jigarrang), `var(--surface)`, `var(--border)`, `var(--text)`, `var(--text2)`, `var(--text3)`, `var(--green)`, `var(--radius)`, `var(--shadow)`

---

## Saves (Kesim ro'yxatlari) — yangi modul

**Maqsad:** Mebel uchun tayyor kesmali material ro'yxatlarini saqlash (cutting list).

- `furniture_saves` — shablon (nom, tavsif, workshopId)
- `save_cuts` — har bir kesim: `material_name` (freetext), `length_mm`, `width_mm`, `height_mm` (optional), `quantity`
- Material nomi enum emas — user o'zi yozadi (LDSP, MDF, DSP, Yog'och...)
- Backend: `project.mebel.saves` package
- Frontend: `SavesPage.tsx` — chap: shablon list, o'ng: kesimlar jadvali

---

## DB Migrations

Barcha migration `src/main/resources/db/changelog/changes/` da:
- 001: enums, 002: users, 003: workshops, 004-005: FK'lar
- 006-007: login_attempts, user_sessions
- 008: warehouse_items, 009: furniture_templates, 010: template_materials
- 011: furniture_orders, 012-013: furniture_images, assignments
- 014: warehouse_transactions, 015: material_usages
- 016: daily_attendance, 017: earnings, 018: bonuses, 019: indexes
- 020-027: ALTER migrations
- 028: furniture_saves, 029: save_cuts

---

## Local ishga tushirish

```bash
# Backend (port 9060)
./mvnw spring-boot:run

# Frontend (port 5173)
cd frontend && npm run dev
```

**Nginx proxy:** frontend → backend `/api/*` ga forward qiladi.

---

## Tez-tez ishlatiluvchi naqshlar

### Backend — yangi endpoint qo'shish
1. Entity → Repository → DTO → Service interface → ServiceImpl → Controller
2. `requireOwner(principal)` — OWNER tekshirish
3. `ApiException.notFound("i18n.key")` — xato qaytarish
4. i18n key → `messages_uz.properties` ga qo'shish

### Frontend — yangi sahifa
1. `src/types/x.types.ts` — TS interfacelari
2. `src/api/x.api.ts` — `api.get<ApiResponse<T>>(...)`
3. `src/pages/owner/XPage.tsx` + `XPage.module.css`
4. `router/index.tsx` — route qo'shish
5. `Sidebar.tsx` — nav item qo'shish
