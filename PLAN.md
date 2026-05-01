# MEBEL LOYIHASI — IMPLEMENTATION PLAN
Sana: 2026-05-01  |  Holat: 1-6 BOSQICH BAJARILDI ✅ | Keyingi: 7-BOSQICH (i18n + test)

---

## QAYERDA TO'XTADIK

**BARCHA MODULLAR BAJARILDI ✅**

Auth, Workshop, Warehouse, FurnitureTemplate, FurnitureOrder, Attendance, Earning — barchasi tayyor.
@EnableScheduling qo'shildi (attendance auto-lock cron).
Keyingi: test va integratsiya tekshiruvi.

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

## 6-BOSQICH: REPOSITORY VA SERVICE QATLAMI ✅

Har bir modul uchun:

| Modul | Repository | Service Interface | ServiceImpl | Controller |
|---|---|---|---|---|
| user/auth | UserRepository ✅ | AuthService ✅ | AuthServiceImpl ✅ | AuthController ✅ |
| workshop | WorkshopRepository ✅ | WorkshopService ✅ | WorkshopServiceImpl ✅ | WorkshopController ✅ |
| warehouse | WarehouseItemRepository ✅, WarehouseTransactionRepository ✅ | WarehouseService ✅ | WarehouseServiceImpl ✅ | WarehouseController ✅ |
| furniture/templates | FurnitureTemplateRepository ✅, TemplateMaterialRepository ✅ | FurnitureTemplateService ✅ | FurnitureTemplateServiceImpl ✅ | FurnitureTemplateController ✅ |
| furniture/orders | FurnitureOrderRepository ✅, FurnitureAssignmentRepository ✅, MaterialUsageRepository ✅ | FurnitureOrderService ✅ | FurnitureOrderServiceImpl ✅ | FurnitureOrderController ✅ |
| attendance | DailyAttendanceRepository ✅ | AttendanceService ✅ | AttendanceServiceImpl ✅ | AttendanceController ✅ |
| earning | EarningRepository ✅, BonusRepository ✅ | EarningService ✅ | EarningServiceImpl ✅ | EarningController ✅ |

---

## TEXNIK QARORLAR ✅

| Masala | Qaror | Sababi |
|---|---|---|
| `@MappedSuperclass` vs `@Inheritance` | `@MappedSuperclass` | Har bir jadval alohida, umumiy jadval kerak emas |
| `createdBy/updatedBy/deletedBy` turi | `UUID` (FK siz) | Self-referencing FK sikl muammosini oldini oladi |
| Vaqt turi | `LocalDateTime` (UTC) | PostgreSQL timestamp UTC saqlanadi |
| Soft delete filter | `@SQLRestriction("deleted_at IS NULL")` | Hibernate 6.x compatible |
| JWT subject | `username` (eski: `phone`) | DD da login identifier = username |
| Builder | `@SuperBuilder` + `@NoArgsConstructor` | `@SuperBuilder` faqat builder constructor hosil qiladi — JPA va subclass uchun no-args kerak |
| `username` field Lombok konflikti | `@Getter(AccessLevel.NONE)` + manual `getUsername()` | Lombok va `UserDetails.getUsername()` bir xil signature — ikkilamchi metod hosil bo'ladi |
| Weighted average narx | `(oldQty × oldPrice + newQty × newPrice) / (oldQty + newQty)` | Ombor kirim (IN) tranzaksiyasida o'rtacha narx hisoblanadi |
| Komissiya formulasi | `salePrice × (commissionPct/100) / activeWorkerCount` | SOLD statusida har aktiv ishchiga teng taqsimlanadi |
| Davomat auto-lock | `@Scheduled(cron="0 0 3 * * *")` — har kecha 03:00 | 3 kun muddat o'tgan, soat yuborilmagan yozuvlar avtomatik lock bo'ladi |
| Scheduling | `@EnableScheduling` MebelApplication da | Cron job ishlashi uchun kerak |
| Boolean field nomlash | `active`, `blocked`, `hybridPay` (is prefix YO'Q) | Lombok `isActive()`, `isBlocked()` Java bean getter to'g'ri hosil qiladi |

---

## 7-BOSQICH: I18N XABARLAR VA TESTING ← KEYINGI

### 7.1 i18n messages.properties ❌

`src/main/resources/messages.properties` (va `messages_uz.properties`) fayllarini yarating.

**Barcha ishlatilayotgan message keylar:**

```properties
# Auth / User
user.not.found=Foydalanuvchi topilmadi
user.is.not.authenticated=Foydalanuvchi tizimga kirmagan
user.blocked=Foydalanuvchi bloklangan
user.already.exists=Bu username allaqachon band
wrong.password=Parol noto'g'ri
invalid.or.expired.token=Noto'g'ri yoki muddati o'tgan token
token.expired=Token muddati tugagan
invalid.user.details=Noto'g'ri foydalanuvchi ma'lumotlari
owner.has.no.workshop=Eganing sehi yo'q
worker.has.no.workshop=Ishchi sehga biriktirilmagan
worker.not.found=Ishchi topilmadi

# Workshop
workshop.not.found=Seh topilmadi

# Warehouse
warehouse.item.not.found=Ombor mahsuloti topilmadi
insufficient.stock=Omborda yetarli mahsulot yo'q
template.material.not.found=Shablon materiali topilmadi

# Furniture
furniture.template.not.found=Mebel shabloni topilmadi
furniture.order.not.found=Mebel buyurtmasi topilmadi
order.already.closed=Buyurtma yopilgan, o'zgartirib bo'lmaydi
order.in.progress.cannot.delete=Ishda bo'lgan buyurtmani o'chirish mumkin emas
invalid.status.transition=Status o'zgartirish tartibsiz
worker.already.assigned=Ishchi allaqachon biriktirilgan
assignment.not.found=Biriktirish topilmadi

# Attendance
already.checked.in.today=Bugun allaqachon ishga kirilgan
attendance.not.found=Davomat yozuvi topilmadi
attendance.hours.locked=Soatlar qulflangan, o'zgartirib bo'lmaydi
hours.already.submitted=Soatlar allaqachon yuborilgan

# Earning
earning.not.found=Daromad yozuvi topilmadi
earning.already.paid=Bu daromad allaqachon to'langan

# General
access.denied=Ruxsat yo'q
system.error.occurred.in=Tizim xatosi yuz berdi: {0}
```

### 7.2 Testing ❌

| Test | Tur | Holat |
|---|---|---|
| AuthController login/logout | Integration | ❌ |
| WarehouseService weighted avg | Unit | ❌ |
| FurnitureOrder status transition | Unit | ❌ |
| Commission calculation | Unit | ❌ |
| Attendance auto-lock cron | Unit | ❌ |
