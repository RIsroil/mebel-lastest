# MEBEL LOYIHASI — IMPLEMENTATION PLAN
Sana: 2026-05-01  |  Holat: 1-5 BOSQICH BAJARILDI

---

## QAYERDA TO'XTADIK

**KEYINGI QADAM → 6-BOSQICH (davom): Warehouse, Furniture, Attendance, Earning modullari**

Auth (login/logout/createWorker) va Workshop CRUD tayyor.
Keyingi: WarehouseService → FurnitureService → AttendanceService → EarningService

---

## LOYIHA HOLATI (Mavjud kod)

```
src/main/java/project/mebel/
├── common/
│   ├── entity/         ✅ BaseEntity, CreatedAuditEntity, MutableAuditEntity, SoftDeleteEntity
│   └── enums/          ✅ UserRole, PayType, UnitType, TransactionType, FurnitureStatus, EarnType
├── config/             → JacksonConfig, SecurityConfig (yangilandi), SwaggerConfig, MessageService
├── exception/          → GlobalExceptionHandler, ApiException, ResponseWrapper...
├── minio/              → MinioConfig, MinioStorageService
│   └── objects/        → ImageEntity (eski — ishlatilmaydi), ImageService va ImageEntityService
├── user/               ✅ UserEntity (qayta yozildi), UserRepository (yangilandi)
│   └── jwt/            ✅ JwtService (yangilandi), JwtAuthenticationFilter (yangilandi)
├── workshop/           ✅ WorkshopEntity
├── auth/               ✅ LoginAttemptEntity, UserSessionEntity
├── warehouse/          ✅ WarehouseItemEntity, WarehouseTransactionEntity
├── furniture/          ✅ FurnitureTemplateEntity, TemplateMaterialEntity, FurnitureOrderEntity,
│                          FurnitureImageEntity, FurnitureAssignmentEntity, MaterialUsageEntity
├── attendance/         ✅ DailyAttendanceEntity
├── earning/            ✅ EarningEntity, BonusEntity
└── utils/              → Utils.java
```

### ⚠️ MUHIM: Database reset kerak
Eski migrationlar (001-create-users-table.xml, 003_create_images_table.xml, 004_add_image_id_to_user-entity.xml)
master.xml dan o'chirildi va yangi to'liq schema yaratildi.
Mavjud local DB ni reset qiling:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

---

## 1-BOSQICH: DD TAHLILI — AUDIT COLUMNLAR ✅

| Tur | Jadvallar |
|-----|-----------|
| **Full audit** (created + updated + deleted) | `users`, `workshops`, `warehouse_items`, `furniture_orders`, `material_usages`, `furniture_templates`, `bonuses` |
| **Created + Updated** (soft delete yo'q) | `daily_attendance`, `furniture_assignments`, `template_materials`, `earnings` |
| **Created + Deleted** (update yo'q) | `furniture_images` |
| **Created only** (insert-only log) | `warehouse_transactions` |
| **Maxsus** | `login_attempts`, `user_sessions` |

---

## 2-BOSQICH: ABSTRACT ENTITY HIERARCHY ✅

### Paket: `project.mebel.common.entity`

```
BaseEntity
    └── CreatedAuditEntity      (created_at, created_by)
            └── MutableAuditEntity   (+ updated_at, updated_by)
                    └── SoftDeleteEntity  (+ deleted_at, deleted_by) [@SQLRestriction]
```

---

## 3-BOSQICH: ENTITY CLASSLARINI QAYTA YOZISH ✅

| # | Entity class | Package | Extends | Holat |
|---|---|---|---|---|
| 1 | `UserEntity` | `user` | `SoftDeleteEntity` | ✅ Qayta yozildi |
| 2 | `WorkshopEntity` | `workshop` | `SoftDeleteEntity` | ✅ Yaratildi |
| 3 | `LoginAttemptEntity` | `auth` | `BaseEntity` | ✅ Yaratildi |
| 4 | `UserSessionEntity` | `auth` | `BaseEntity` | ✅ Yaratildi |
| 5 | `WarehouseItemEntity` | `warehouse` | `SoftDeleteEntity` | ✅ Yaratildi |
| 6 | `FurnitureTemplateEntity` | `furniture` | `SoftDeleteEntity` | ✅ Yaratildi |
| 7 | `TemplateMaterialEntity` | `furniture` | `MutableAuditEntity` | ✅ Yaratildi |
| 8 | `FurnitureOrderEntity` | `furniture` | `SoftDeleteEntity` | ✅ Yaratildi |
| 9 | `FurnitureImageEntity` | `furniture` | `SoftDeleteEntity` | ✅ Yaratildi |
| 10 | `FurnitureAssignmentEntity` | `furniture` | `MutableAuditEntity` | ✅ Yaratildi |
| 11 | `WarehouseTransactionEntity` | `warehouse` | `CreatedAuditEntity` | ✅ Yaratildi |
| 12 | `MaterialUsageEntity` | `furniture` | `SoftDeleteEntity` | ✅ Yaratildi |
| 13 | `DailyAttendanceEntity` | `attendance` | `MutableAuditEntity` | ✅ Yaratildi |
| 14 | `EarningEntity` | `earning` | `MutableAuditEntity` | ✅ Yaratildi |
| 15 | `BonusEntity` | `earning` | `SoftDeleteEntity` | ✅ Yaratildi |

---

## 4-BOSQICH: ENUM CLASSLAR ✅

Package: `project.mebel.common.enums`

| Enum class | Holat |
|---|---|
| `UserRole` (ADMIN, OWNER, WORKER) | ✅ |
| `PayType` (HOURLY, DAILY, COMMISSION, HYBRID) | ✅ |
| `UnitType` (KG, GRAM, LITRE, ML, PIECE, METER, CM, M2, M3) | ✅ |
| `TransactionType` (IN, OUT, ADJUSTMENT) | ✅ |
| `FurnitureStatus` (DRAFT, IN_PROGRESS, COMPLETED, SOLD, CANCELLED) | ✅ |
| `EarnType` (DAILY_WAGE, HOURLY_WAGE, COMMISSION, BONUS) | ✅ |

> Mavjud `Role.java` va `Status.java` → `UserRole` ishlatiladi (eski fayllar o'chirilmadi lekin ishlatilmaydi)

---

## 5-BOSQICH: LIQUIBASE MIGRATIONS ✅

```
000-create-postgis-extension.xml     ← mavjud, o'zgarmagan
001-create-enums.xml                 ✅ yangi — 6 ta PostgreSQL ENUM
002-create-users-table.xml           ✅ yangi — to'liq users jadvali
003-create-workshops-table.xml       ✅ yangi
004-alter-users-add-workshop-fk.xml  ✅ yangi
005-alter-users-add-self-fks.xml     ✅ yangi
006-create-login-attempts-table.xml  ✅ yangi
007-create-user-sessions-table.xml   ✅ yangi
008-create-warehouse-items-table.xml ✅ yangi
009-create-furniture-templates-table.xml ✅ yangi
010-create-template-materials-table.xml  ✅ yangi
011-create-furniture-orders-table.xml    ✅ yangi
012-create-furniture-images-table.xml    ✅ yangi
013-create-furniture-assignments-table.xml ✅ yangi
014-create-warehouse-transactions-table.xml ✅ yangi
015-create-material-usages-table.xml     ✅ yangi
016-create-daily-attendance-table.xml    ✅ yangi
017-create-earnings-table.xml            ✅ yangi
018-create-bonuses-table.xml             ✅ yangi
019-create-indexes.xml                   ✅ yangi — barcha indekslar
```

---

## 6-BOSQICH: REPOSITORY VA SERVICE QATLAMI (KEYINGI)

Har bir modul uchun:

| Modul | Repository | Service Interface | ServiceImpl | Controller |
|---|---|---|---|---|
| user/auth | UserRepository ✅ | AuthService ✅ | AuthServiceImpl ✅ | AuthController ✅ |
| workshop | WorkshopRepository ✅ | WorkshopService ✅ | WorkshopServiceImpl ✅ | WorkshopController ✅ |
| warehouse | WarehouseItemRepository, WarehouseTransactionRepository | WarehouseService | - | WarehouseController |
| furniture | FurnitureOrderRepository, FurnitureImageRepository... | FurnitureService | - | FurnitureController |
| attendance | DailyAttendanceRepository | AttendanceService | - | AttendanceController |
| earning | EarningRepository, BonusRepository | EarningService | - | EarningController |

---

## TEXNIK QARORLAR

| Masala | Qaror | Sababi |
|---|---|---|
| `@MappedSuperclass` vs `@Inheritance` | `@MappedSuperclass` | Har bir jadval alohida, umumiy jadval kerak emas |
| `createdBy/updatedBy/deletedBy` turi | `UUID` (FK siz) | Self-referencing FK sikl muammosini oldini oladi |
| Vaqt turi | `LocalDateTime` (UTC) | PostgreSQL timestamp UTC saqlanadi |
| Soft delete filter | `@SQLRestriction("deleted_at IS NULL")` | Hibernate 6.x compatible |
| JWT subject | `username` (eski: `phone`) | DD da login identifier = username |
| Builder | `@SuperBuilder` | Inheritance chain uchun Lombok SuperBuilder kerak |
