# MEBEL LOYIHASI — IMPLEMENTATION PLAN
Sana: 2026-05-01  |  Holat: BOSHLANDI

---

## QAYERDA TO'XTADIK (Ertaga shu yerdan davom ettiring)

**KEYINGI QADAM → 2-BOSQICH: Abstract entity classlarini yaratish**

Hozircha faqat tahlil va reja tugallandi. Birorta Java fayl hali yozilmagan.
Ertaga `2-BOSQICH` dan boshing.

---

## LOYIHA HOLATI (Mavjud kod)

```
src/main/java/project/mebel/
├── config/          → JacksonConfig, SecurityConfig, SwaggerConfig, MessageService
├── exception/       → GlobalExceptionHandler, ApiException, ResponseWrapper...
├── minio/           → MinioConfig, MinioStorageService
│   └── objects/     → ImageEntity (mavjud — lekin DD ga to'g'ri kelmaydi)
├── user/            → UserEntity (mavjud — lekin yangi DD ga to'g'ri kelmaydi)
│   ├── enums/       → Role.java, Status.java
│   └── jwt/         → JwtAuthenticationFilter, JwtService
└── utils/           → Utils.java
```

**Mavjud UserEntity muammolari (DD bilan farqi):**
- `email` bor, lekin DD da yo'q (o'rniga `username VARCHAR(50)`)
- `createdBy` yo'q (faqat `createdAt`, `updatedAt`, `updatedBy` bor)
- `deletedAt`, `deletedBy` yo'q
- `is_blocked`, `failed_login_count`, `workshop_id`, `pay_type` va boshqa ko'p ustunlar yo'q
- `Status` enum o'rniga `is_active + is_blocked` bo'lishi kerak

---

## 1-BOSQICH: DD TAHLILI — AUDIT COLUMNLAR

### Jadvallarni audit turiga ko'ra guruhlash:

| Tur | Jadvallar |
|-----|-----------|
| **Full audit** (created + updated + deleted) | `users`, `workshops`, `warehouse_items`, `furniture_orders`, `material_usages`, `furniture_templates`, `bonuses` |
| **Created + Updated** (soft delete yo'q) | `daily_attendance`, `furniture_assignments`, `template_materials`, `earnings` |
| **Created + Deleted** (update yo'q) | `furniture_images` |
| **Created only** (insert-only log) | `warehouse_transactions` |
| **Maxsus** (mos kelmaydi) | `login_attempts`, `user_sessions` |

---

## 2-BOSQICH: ABSTRACT ENTITY HIERARCHY

### Paket: `project.mebel.common.entity`

```
BaseEntity
    └── CreatedAuditEntity      (created_at, created_by)
            └── MutableAuditEntity   (+ updated_at, updated_by)
                    └── SoftDeleteEntity  (+ deleted_at, deleted_by)
```

### Har bir class nimani qamrab oladi:

**`BaseEntity`** (`@MappedSuperclass`)
```java
@Id @UuidGenerator
UUID id;
```

**`CreatedAuditEntity`** extends BaseEntity
```java
@CreationTimestamp
LocalDateTime createdAt;

@Column(name = "created_by")
UUID createdBy;  // → users.id (nullable)
```
Ishlatiladi: `warehouse_transactions`

**`MutableAuditEntity`** extends CreatedAuditEntity
```java
@UpdateTimestamp
LocalDateTime updatedAt;

@Column(name = "updated_by")
UUID updatedBy;  // → users.id (nullable)
```
Ishlatiladi: `daily_attendance`, `furniture_assignments`, `template_materials`, `earnings`

**`SoftDeleteEntity`** extends MutableAuditEntity
```java
LocalDateTime deletedAt;   // Soft delete vaqti (null = faol)

@Column(name = "deleted_by")
UUID deletedBy;  // → users.id (nullable)
```
Ishlatiladi: `users`, `workshops`, `warehouse_items`, `furniture_orders`,
             `material_usages`, `furniture_templates`, `bonuses`, `furniture_images`

> **Eslatma:** `furniture_images` da `updated_at/by` ishlatilmaydi (upload va delete only),
> lekin `SoftDeleteEntity` dan extend qilish mumkin — faqat null qoladi.

**Maxsus holat:** `login_attempts`, `user_sessions` → faqat `BaseEntity` dan extend qiladi
(ularda audit columns yo'q yoki boshqacha struktura)

---

## 3-BOSQICH: ENTITY CLASSLARINI QAYTA YOZISH

DD ga mos keladigan yangi entitylar (migration ketma-ketligiga ko'ra):

| # | Entity class | Package | Extends | Eslatma |
|---|---|---|---|---|
| 1 | `UserEntity` | `user` | `SoftDeleteEntity` | To'liq qayta yozish kerak |
| 2 | `WorkshopEntity` | `workshop` | `SoftDeleteEntity` | Yangi |
| 3 | `LoginAttemptEntity` | `auth` | `BaseEntity` | Yangi (insert-only) |
| 4 | `UserSessionEntity` | `auth` | `BaseEntity` | Yangi |
| 5 | `WarehouseItemEntity` | `warehouse` | `SoftDeleteEntity` | Yangi |
| 6 | `FurnitureTemplateEntity` | `furniture` | `SoftDeleteEntity` | Yangi |
| 7 | `TemplateMaterialEntity` | `furniture` | `MutableAuditEntity` | Yangi |
| 8 | `FurnitureOrderEntity` | `furniture` | `SoftDeleteEntity` | Yangi |
| 9 | `FurnitureImageEntity` | `furniture` | `SoftDeleteEntity` | Mavjud ImageEntity ni qayta yozish |
| 10 | `FurnitureAssignmentEntity` | `furniture` | `MutableAuditEntity` | Yangi |
| 11 | `WarehouseTransactionEntity` | `warehouse` | `CreatedAuditEntity` | Yangi (insert-only) |
| 12 | `MaterialUsageEntity` | `furniture` | `SoftDeleteEntity` | Yangi |
| 13 | `DailyAttendanceEntity` | `attendance` | `MutableAuditEntity` | Yangi |
| 14 | `EarningEntity` | `earning` | `MutableAuditEntity` | Yangi |
| 15 | `BonusEntity` | `earning` | `SoftDeleteEntity` | Yangi |

---

## 4-BOSQICH: ENUM CLASSLAR

Package: `project.mebel.common.enums`

| Enum class | Qiymatlar |
|---|---|
| `UserRole` | `ADMIN`, `OWNER`, `WORKER` |
| `PayType` | `HOURLY`, `DAILY`, `COMMISSION`, `HYBRID` |
| `UnitType` | `KG`, `GRAM`, `LITRE`, `ML`, `PIECE`, `METER`, `CM`, `M2`, `M3` |
| `TransactionType` | `IN`, `OUT`, `ADJUSTMENT` |
| `FurnitureStatus` | `DRAFT`, `IN_PROGRESS`, `COMPLETED`, `SOLD`, `CANCELLED` |
| `EarnType` | `DAILY_WAGE`, `HOURLY_WAGE`, `COMMISSION`, `BONUS` |

> Mavjud `Role.java` va `Status.java` → `UserRole` ga almashtiriladi, `Status` o'chiriladi

---

## 5-BOSQICH: LIQUIBASE MIGRATIONS (DD §06 tartibida)

```
001-create-users-table.xml           ← mavjud, lekin qayta yozish kerak
002-create-workshops-table.xml       ← yangi
003-alter-users-add-workshop-fk.xml  ← yangi
004-alter-users-add-self-fks.xml     ← yangi
005-create-login-attempts-table.xml  ← yangi
006-create-user-sessions-table.xml   ← yangi
007-create-warehouse-items-table.xml ← yangi
... (davom etadi)
```

---

## TEXNIK QARORLAR

| Masala | Qaror | Sababi |
|---|---|---|
| `@MappedSuperclass` vs `@Inheritance` | `@MappedSuperclass` | Har bir jadval alohida, umumiy jadval kerak emas |
| `createdBy/updatedBy/deletedBy` turi | `UUID` (FK siz) | Self-referencing FK sikl muammosini oldini oladi; application layer tekshiradi |
| Vaqt turi | `LocalDateTime` (UTC) | `Instant` emas, chunki PostgreSQL timestamp UTC saqlanadi |
| Soft delete filter | `@Where(clause = "deleted_at IS NULL")` | Har bir so'rovda qo'lda filter yozmaslik uchun |

---

## KEYINGI SESSIYA UCHUN ESLATMA

**Boshlash tartibi:**
1. `project.mebel.common.entity` packageini yarating
2. `BaseEntity.java` → `CreatedAuditEntity.java` → `MutableAuditEntity.java` → `SoftDeleteEntity.java` ketma-ket
3. `project.mebel.common.enums` da 6 ta enum class
4. `UserEntity` ni qayta yozish (eng murakkab — `UserDetails` implements qiladi)
5. Qolgan entitylar

**Hozir mavjud kod bilan muammo:** Mavjud `UserEntity` va `ImageEntity` yangi DD ga mos kelmaydi.
Ularni to'liq qayta yozish kerak bo'ladi.
