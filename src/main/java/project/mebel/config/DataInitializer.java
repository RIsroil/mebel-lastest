package project.mebel.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import project.mebel.attendance.DailyAttendanceEntity;
import project.mebel.attendance.DailyAttendanceRepository;
import project.mebel.common.enums.*;
import project.mebel.earning.EarningEntity;
import project.mebel.earning.EarningRepository;
import project.mebel.financiallog.FinancialLogEntity;
import project.mebel.financiallog.FinancialLogRepository;
import project.mebel.furniture.*;
import project.mebel.user.UserEntity;
import project.mebel.user.UserRepository;
import project.mebel.warehouse.WarehouseItemEntity;
import project.mebel.warehouse.WarehouseItemRepository;
import project.mebel.warehouse.WarehouseTransactionEntity;
import project.mebel.warehouse.WarehouseTransactionRepository;
import project.mebel.workshop.WorkshopEntity;
import project.mebel.workshop.WorkshopRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepo;
    private final WorkshopRepository workshopRepo;
    private final WarehouseItemRepository itemRepo;
    private final WarehouseTransactionRepository txRepo;
    private final FurnitureOrderRepository orderRepo;
    private final FurnitureAssignmentRepository assignmentRepo;
    private final MaterialUsageRepository usageRepo;
    private final DailyAttendanceRepository attendanceRepo;
    private final EarningRepository earningRepo;
    private final FinancialLogRepository financialLogRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createAdminIfAbsent();
        if (userRepo.findByUsernameAndDeletedAtIsNull("owner1").isEmpty()) {
            seedFakeData();
        }
    }

    private void createAdminIfAbsent() {
        if (userRepo.findByUsernameAndDeletedAtIsNull("admin").isEmpty()) {
            UserEntity admin = new UserEntity();
            admin.setUsername("admin");
            admin.setFullName("Administrator");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole(UserRole.ADMIN);
            admin.setActive(true);
            userRepo.save(admin);
        }
    }

    private void seedFakeData() {
        String pwd = passwordEncoder.encode("owner123");

        // ── Workshop 1: Toshkent Mebel ──────────────────────────────────────
        UserEntity o1 = saveOwner("owner1", pwd, "Bobur Karimov", "+998901001000", null);
        WorkshopEntity ws1 = saveWorkshop("Toshkent Mebel", "Toshkent, Yunusobod", "+998901001001", "Zamonaviy mebel ishlab chiqarish", o1.getId());
        o1.setWorkshopId(ws1.getId());
        userRepo.save(o1);

        UserEntity w1a = saveWorker("worker1a", pwd, "Ali Xasanov",    "+998901002001", ws1.getId(), PayType.DAILY,   8, 250_000, 5);
        UserEntity w1b = saveWorker("worker1b", pwd, "Sarvar Toshev",  "+998901002002", ws1.getId(), PayType.MONTHLY, 8, 150_000, 0);

        List<WarehouseItemEntity> items1 = List.of(
            saveItem(ws1.getId(), "Yog'och taxta",    UnitType.M2,    80,  45_000),
            saveItem(ws1.getId(), "Vintlar (komplekt)", UnitType.PIECE, 500,  2_000),
            saveItem(ws1.getId(), "Bo'yoq",            UnitType.LITRE,  30, 35_000),
            saveItem(ws1.getId(), "Lak",               UnitType.LITRE,  20, 28_000)
        );

        createCompletedOrder(ws1, o1, w1a, items1, "Oshxona stoli",    4_500_000, 65);
        createCompletedOrder(ws1, o1, w1b, items1, "Divon",            6_200_000, 55);
        createSoldOrder     (ws1, o1, w1a, items1, "Yotoq xonasi to'plami", 12_800_000, "Jasur Aliyev", "+998907001111");
        createInProgressOrder(ws1, o1, w1a, w1b, items1, "Kitob javoni", 2_900_000);

        // ── Workshop 2: Samarqand Wood ──────────────────────────────────────
        UserEntity o2 = saveOwner("owner2", pwd, "Dilnoza Yusupova", "+998936002000", null);
        WorkshopEntity ws2 = saveWorkshop("Samarqand Wood", "Samarqand, Registon ko'chasi 12", "+998936002002", "Antik uslubdagi mebel", o2.getId());
        o2.setWorkshopId(ws2.getId());
        userRepo.save(o2);

        UserEntity w2a = saveWorker("worker2a", pwd, "Zafar Mirzayev",   "+998936003001", ws2.getId(), PayType.DAILY,   9, 300_000, 8);
        UserEntity w2b = saveWorker("worker2b", pwd, "Kamola Hamidova",  "+998936003002", ws2.getId(), PayType.DAILY,   8, 220_000, 5);

        List<WarehouseItemEntity> items2 = List.of(
            saveItem(ws2.getId(), "Palma yog'ochi",  UnitType.M3,    10, 680_000),
            saveItem(ws2.getId(), "Mato (metr)",     UnitType.METER, 200,  18_000),
            saveItem(ws2.getId(), "Kauchuk ko'pik",  UnitType.KG,     50,  22_000),
            saveItem(ws2.getId(), "Ruchka-mixlar",   UnitType.PIECE, 300,   3_500)
        );

        createCompletedOrder(ws2, o2, w2a, items2, "Ish stoli",       5_100_000, 70);
        createSoldOrder     (ws2, o2, w2b, items2, "Kreslolar (2 ta)", 3_800_000, "Malika Rahimova", "+998901555222");
        createSoldOrder     (ws2, o2, w2a, items2, "Mehmonxona garniturai", 18_500_000, "Eldor Nishonov", "+998936777888");
        createInProgressOrder(ws2, o2, w2a, w2b, items2, "Bolalar divanchasi", 3_200_000);

        // ── Workshop 3: Farg'ona Craft ──────────────────────────────────────
        UserEntity o3 = saveOwner("owner3", pwd, "Sherzod Nazarov", "+998732003000", null);
        WorkshopEntity ws3 = saveWorkshop("Farg'ona Craft", "Farg'ona, Mustaqillik 5", "+998732003003", "Hunarmandchilik mebellar", o3.getId());
        o3.setWorkshopId(ws3.getId());
        userRepo.save(o3);

        UserEntity w3a = saveWorker("worker3a", pwd, "Murod Qodirov",   "+998732004001", ws3.getId(), PayType.MONTHLY, 8, 180_000, 0);
        UserEntity w3b = saveWorker("worker3b", pwd, "Feruza Saidova",  "+998732004002", ws3.getId(), PayType.DAILY,   8, 200_000, 6);

        List<WarehouseItemEntity> items3 = List.of(
            saveItem(ws3.getId(), "Chinor yog'ochi",   UnitType.M3,    15, 520_000),
            saveItem(ws3.getId(), "Mixlar (kg)",        UnitType.KG,    20,   8_500),
            saveItem(ws3.getId(), "Zangori bo'yoq",    UnitType.LITRE,  25,  32_000),
            saveItem(ws3.getId(), "Polimer qoplag'ich", UnitType.LITRE,  15,  42_000)
        );

        createCompletedOrder(ws3, o3, w3a, items3, "Taom stoli (6 kishilik)", 7_400_000, 60);
        createSoldOrder     (ws3, o3, w3b, items3, "Idish javoni",            4_100_000, "Nodira Xoliqova", "+998732888999");
        createInProgressOrder(ws3, o3, w3a, w3b, items3, "Yotoq xonasi to'plami", 15_000_000);

        // Attendance and earnings (last 30 days)
        seedAttendanceAndEarnings(ws1, o1, List.of(w1a, w1b));
        seedAttendanceAndEarnings(ws2, o2, List.of(w2a, w2b));
        seedAttendanceAndEarnings(ws3, o3, List.of(w3a, w3b));

        // Financial logs
        // ws1: Toshkent Mebel — 2 ta sotilgan buyurtma, 2 ta worker (w1a DAILY, w1b MONTHLY)
        seedFinancialLogs(ws1, o1,
            List.of(
                // Boshlang'ich xomashyo xaridi (~55 kun oldin)
                flog(ws1.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -3_600_000, "Yog'och taxta kiritildi: 80 m² × 45 000 so'm", LocalDate.now().minusDays(55), o1.getId()),
                flog(ws1.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -1_000_000, "Vintlar kiritildi: 500 dona × 2 000 so'm", LocalDate.now().minusDays(55), o1.getId()),
                flog(ws1.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -1_050_000, "Bo'yoq kiritildi: 30 litr × 35 000 so'm", LocalDate.now().minusDays(54), o1.getId()),
                flog(ws1.getId(), FinancialLogType.WAREHOUSE_PURCHASE,   -560_000, "Lak kiritildi: 20 litr × 28 000 so'm", LocalDate.now().minusDays(54), o1.getId()),
                // Restock (~20 kun oldin)
                flog(ws1.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -2_250_000, "Yog'och taxta restok: 50 m² × 45 000 so'm | Toshkent Yog'och MChJ", LocalDate.now().minusDays(20), o1.getId()),
                flog(ws1.getId(), FinancialLogType.WAREHOUSE_PURCHASE,   -400_000, "Vintlar restok: 200 dona × 2 000 so'm", LocalDate.now().minusDays(20), o1.getId()),
                // Mebel sotildi (~32 kun oldin)
                flog(ws1.getId(), FinancialLogType.FURNITURE_SOLD,    12_800_000, "Mebel sotildi: Yotoq xonasi to'plami | Jasur Aliyev", LocalDate.now().minusDays(32), o1.getId()),
                // Komissiya to'landi (sotilgandan 2 kun keyin)
                flog(ws1.getId(), FinancialLogType.COMMISSION_PAID,     -640_000, "Komissiya to'landi: Ali Xasanov (5% × 12 800 000)", LocalDate.now().minusDays(30), o1.getId()),
                // O'tgan oy maoshi — w1a (DAILY: ~22 ish kuni × 250 000)
                flog(ws1.getId(), FinancialLogType.WAGE_PAID,         -5_500_000, "Oylik maosh to'landi: Ali Xasanov (22 kun × 250 000)", LocalDate.now().minusDays(35), o1.getId()),
                // Joriy oy oraliq maosh (~10 kun)
                flog(ws1.getId(), FinancialLogType.WAGE_PAID,         -2_000_000, "Oraliq maosh: Ali Xasanov (8 kun × 250 000)", LocalDate.now().minusDays(7), o1.getId())
            )
        );

        // ws2: Samarqand Wood — 2 ta SOLD buyurtma, 2 ta DAILY worker
        seedFinancialLogs(ws2, o2,
            List.of(
                flog(ws2.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -6_800_000, "Palma yog'ochi kiritildi: 10 m³ × 680 000 so'm | Samarqand Yog'och", LocalDate.now().minusDays(56), o2.getId()),
                flog(ws2.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -3_600_000, "Mato kiritildi: 200 metr × 18 000 so'm", LocalDate.now().minusDays(56), o2.getId()),
                flog(ws2.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -1_100_000, "Kauchuk ko'pik kiritildi: 50 kg × 22 000 so'm", LocalDate.now().minusDays(55), o2.getId()),
                flog(ws2.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -1_050_000, "Ruchka-mixlar kiritildi: 300 dona × 3 500 so'm", LocalDate.now().minusDays(55), o2.getId()),
                // Restock 15 kun oldin
                flog(ws2.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -3_400_000, "Palma yog'ochi restok: 5 m³ × 680 000 so'm", LocalDate.now().minusDays(15), o2.getId()),
                // Birinchi buyurtma sotildi
                flog(ws2.getId(), FinancialLogType.FURNITURE_SOLD,     3_800_000, "Mebel sotildi: Kreslolar (2 ta) | Malika Rahimova", LocalDate.now().minusDays(32), o2.getId()),
                flog(ws2.getId(), FinancialLogType.COMMISSION_PAID,     -190_000, "Komissiya to'landi: Kamola Hamidova (5% × 3 800 000)", LocalDate.now().minusDays(30), o2.getId()),
                // Ikkinchi buyurtma sotildi
                flog(ws2.getId(), FinancialLogType.FURNITURE_SOLD,    18_500_000, "Mebel sotildi: Mehmonxona garniturai | Eldor Nishonov", LocalDate.now().minusDays(32), o2.getId()),
                flog(ws2.getId(), FinancialLogType.COMMISSION_PAID,   -1_480_000, "Komissiya to'landi: Zafar Mirzayev (8% × 18 500 000)", LocalDate.now().minusDays(30), o2.getId()),
                // Maoshlar
                flog(ws2.getId(), FinancialLogType.WAGE_PAID,         -6_600_000, "Oylik maosh: Zafar Mirzayev (22 kun × 300 000)", LocalDate.now().minusDays(35), o2.getId()),
                flog(ws2.getId(), FinancialLogType.WAGE_PAID,         -4_840_000, "Oylik maosh: Kamola Hamidova (22 kun × 220 000)", LocalDate.now().minusDays(35), o2.getId()),
                flog(ws2.getId(), FinancialLogType.WAGE_PAID,         -2_400_000, "Oraliq maosh: Zafar Mirzayev (8 kun × 300 000)", LocalDate.now().minusDays(7), o2.getId()),
                flog(ws2.getId(), FinancialLogType.WAGE_PAID,         -1_760_000, "Oraliq maosh: Kamola Hamidova (8 kun × 220 000)", LocalDate.now().minusDays(7), o2.getId())
            )
        );

        // ws3: Farg'ona Craft — 1 ta SOLD buyurtma
        seedFinancialLogs(ws3, o3,
            List.of(
                flog(ws3.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -7_800_000, "Chinor yog'ochi kiritildi: 15 m³ × 520 000 so'm | Farg'ona Yog'och", LocalDate.now().minusDays(56), o3.getId()),
                flog(ws3.getId(), FinancialLogType.WAREHOUSE_PURCHASE,   -170_000, "Mixlar kiritildi: 20 kg × 8 500 so'm", LocalDate.now().minusDays(55), o3.getId()),
                flog(ws3.getId(), FinancialLogType.WAREHOUSE_PURCHASE,   -800_000, "Zangori bo'yoq kiritildi: 25 litr × 32 000 so'm", LocalDate.now().minusDays(55), o3.getId()),
                flog(ws3.getId(), FinancialLogType.WAREHOUSE_PURCHASE,   -630_000, "Polimer qoplag'ich kiritildi: 15 litr × 42 000 so'm", LocalDate.now().minusDays(54), o3.getId()),
                // Restock
                flog(ws3.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -2_600_000, "Chinor yog'ochi restok: 5 m³ × 520 000 so'm", LocalDate.now().minusDays(18), o3.getId()),
                // Sotildi
                flog(ws3.getId(), FinancialLogType.FURNITURE_SOLD,     4_100_000, "Mebel sotildi: Idish javoni | Nodira Xoliqova", LocalDate.now().minusDays(32), o3.getId()),
                flog(ws3.getId(), FinancialLogType.COMMISSION_PAID,     -246_000, "Komissiya to'landi: Feruza Saidova (6% × 4 100 000)", LocalDate.now().minusDays(30), o3.getId()),
                // Maoshlar (faqat DAILY worker — w3b)
                flog(ws3.getId(), FinancialLogType.WAGE_PAID,         -4_400_000, "Oylik maosh: Feruza Saidova (22 kun × 200 000)", LocalDate.now().minusDays(35), o3.getId()),
                flog(ws3.getId(), FinancialLogType.WAGE_PAID,         -1_600_000, "Oraliq maosh: Feruza Saidova (8 kun × 200 000)", LocalDate.now().minusDays(7), o3.getId()),
                // Bonus
                flog(ws3.getId(), FinancialLogType.BONUS_PAID,          -200_000, "Bonus: Feruza Saidova — yaxshi ishladi", LocalDate.now().minusDays(12), o3.getId())
            )
        );

        // ── Joriy oy (May 1–5) yozuvlari — default filtrda ko'rinishi uchun ──
        seedFinancialLogs(ws1, o1,
            List.of(
                flog(ws1.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -1_800_000, "Yog'och taxta kiritildi: 40 m² × 45 000 so'm | Toshkent Yog'och MChJ", LocalDate.now().minusDays(4), o1.getId()),
                flog(ws1.getId(), FinancialLogType.MATERIAL_USED,        -675_000, "Xomashyo sarflandi: Yog'och taxta — 15 m² | Buyurtma: Kitob javoni", LocalDate.now().minusDays(3), o1.getId()),
                flog(ws1.getId(), FinancialLogType.MATERIAL_USED,        -135_000, "Xomashyo sarflandi: Lak — 3 litr | Buyurtma: Kitob javoni", LocalDate.now().minusDays(2), o1.getId()),
                flog(ws1.getId(), FinancialLogType.FURNITURE_SOLD,     5_800_000, "Mebel sotildi: Oshxona stoli | Hamid Kamolov", LocalDate.now().minusDays(1), o1.getId()),
                flog(ws1.getId(), FinancialLogType.COMMISSION_PAID,      -290_000, "Komissiya to'landi: Ali Xasanov (5% × 5 800 000)", LocalDate.now(), o1.getId())
            )
        );
        seedFinancialLogs(ws2, o2,
            List.of(
                flog(ws2.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -2_040_000, "Mato kiritildi: 120 metr × 17 000 so'm", LocalDate.now().minusDays(4), o2.getId()),
                flog(ws2.getId(), FinancialLogType.MATERIAL_USED,        -360_000, "Xomashyo sarflandi: Mato — 20 metr | Buyurtma: Bolalar divanchasi", LocalDate.now().minusDays(3), o2.getId()),
                flog(ws2.getId(), FinancialLogType.MATERIAL_USED,        -440_000, "Xomashyo sarflandi: Kauchuk ko'pik — 20 kg | Buyurtma: Bolalar divanchasi", LocalDate.now().minusDays(2), o2.getId())
            )
        );
        seedFinancialLogs(ws3, o3,
            List.of(
                flog(ws3.getId(), FinancialLogType.WAREHOUSE_PURCHASE, -1_040_000, "Bo'yoq kiritildi: 20 litr × 52 000 so'm | Farg'ona Kimyo", LocalDate.now().minusDays(3), o3.getId()),
                flog(ws3.getId(), FinancialLogType.MATERIAL_USED,        -780_000, "Xomashyo sarflandi: Chinor yog'ochi — 1.5 m³ | Buyurtma: Yotoq xonasi to'plami", LocalDate.now().minusDays(2), o3.getId()),
                flog(ws3.getId(), FinancialLogType.WAGE_PAID,            -600_000, "Haftalik maosh: Feruza Saidova (3 kun × 200 000)", LocalDate.now().minusDays(1), o3.getId())
            )
        );
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private WorkshopEntity saveWorkshop(String name, String address, String phone, String description, UUID ownerId) {
        WorkshopEntity ws = WorkshopEntity.builder()
                .name(name).address(address).phone(phone).description(description)
                .ownerId(ownerId)
                .build();
        ws.setCreatedAt(LocalDateTime.now().minusDays(60));
        return workshopRepo.save(ws);
    }

    private UserEntity saveOwner(String username, String pwd, String fullName, String phone, UUID workshopId) {
        UserEntity u = UserEntity.builder()
                .username(username).passwordHash(pwd).fullName(fullName).phone(phone)
                .role(UserRole.OWNER).workshopId(workshopId).active(true).build();
        u.setCreatedAt(LocalDateTime.now().minusDays(60));
        return userRepo.save(u);
    }

    private UserEntity saveWorker(String username, String pwd, String fullName, String phone,
                                  UUID workshopId, PayType payType, int hoursTarget, int salary, int commissionPct) {
        UserEntity u = UserEntity.builder()
                .username(username).passwordHash(pwd).fullName(fullName).phone(phone)
                .role(UserRole.WORKER).workshopId(workshopId).active(true)
                .payType(payType)
                .dailyHoursTarget(BigDecimal.valueOf(hoursTarget))
                .dailySalary(BigDecimal.valueOf(salary))
                .commissionPct(commissionPct > 0 ? BigDecimal.valueOf(commissionPct) : null)
                .build();
        u.setCreatedAt(LocalDateTime.now().minusDays(55));
        return userRepo.save(u);
    }

    private WarehouseItemEntity saveItem(UUID workshopId, String name, UnitType unit, int qty, int price) {
        WarehouseItemEntity item = WarehouseItemEntity.builder()
                .workshopId(workshopId).name(name).unitType(unit)
                .quantity(BigDecimal.valueOf(qty))
                .avgUnitPrice(BigDecimal.valueOf(price))
                .totalValue(BigDecimal.valueOf((long) qty * price))
                .active(true).build();
        item.setCreatedAt(LocalDateTime.now().minusDays(50));
        return itemRepo.save(item);
    }

    private void createCompletedOrder(WorkshopEntity ws, UserEntity owner, UserEntity worker,
                                      List<WarehouseItemEntity> items, String title,
                                      int salePrice, int commissionPct) {
        LocalDateTime started   = LocalDateTime.now().minusDays(40);
        LocalDateTime completed = started.plusDays(12);

        FurnitureOrderEntity order = buildOrder(ws.getId(), title, salePrice, FurnitureStatus.COMPLETED, started, completed, null, null, null);
        order.setCreatedBy(owner.getId());
        order = orderRepo.save(order);

        addMaterialUsage(order, owner, items.get(0), 3, started.plusDays(1));
        addMaterialUsage(order, owner, items.get(1), 10, started.plusDays(2));
        recalcOrderCost(order);

        addAssignment(order.getId(), worker.getId(), owner.getId(), started, BigDecimal.valueOf(commissionPct));
    }

    private void createSoldOrder(WorkshopEntity ws, UserEntity owner, UserEntity worker,
                                 List<WarehouseItemEntity> items, String title,
                                 int salePrice, String clientName, String clientPhone) {
        LocalDateTime started   = LocalDateTime.now().minusDays(50);
        LocalDateTime completed = started.plusDays(15);
        LocalDateTime sold      = completed.plusDays(3);

        FurnitureOrderEntity order = buildOrder(ws.getId(), title, salePrice, FurnitureStatus.SOLD, started, completed, sold, clientName, clientPhone);
        order.setCreatedBy(owner.getId());
        order = orderRepo.save(order);

        addMaterialUsage(order, owner, items.get(0), 5, started.plusDays(2));
        addMaterialUsage(order, owner, items.get(1), 20, started.plusDays(3));
        if (items.size() > 2) addMaterialUsage(order, owner, items.get(2), 4, started.plusDays(5));
        recalcOrderCost(order);

        int pct = worker.getCommissionPct() != null ? worker.getCommissionPct().intValue() : 5;
        addAssignment(order.getId(), worker.getId(), owner.getId(), started, BigDecimal.valueOf(pct));

        // Commission earning
        BigDecimal commAmt = BigDecimal.valueOf(salePrice)
                .multiply(BigDecimal.valueOf(pct))
                .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        EarningEntity earning = EarningEntity.builder()
                .workerId(worker.getId()).workshopId(ws.getId())
                .earnDate(sold.toLocalDate())
                .earnType(EarnType.COMMISSION)
                .furnitureOrderId(order.getId())
                .commissionPct(BigDecimal.valueOf(pct))
                .commissionAmount(commAmt)
                .baseAmount(commAmt).totalAmount(commAmt)
                .description(title + " — komissiya")
                .build();
        earning.setCreatedAt(sold);
        earningRepo.save(earning);
    }

    private void createInProgressOrder(WorkshopEntity ws, UserEntity owner,
                                       UserEntity w1, UserEntity w2,
                                       List<WarehouseItemEntity> items, String title, int salePrice) {
        LocalDateTime started = LocalDateTime.now().minusDays(5);
        FurnitureOrderEntity order = buildOrder(ws.getId(), title, salePrice, FurnitureStatus.IN_PROGRESS, started, null, null, null, null);
        order.setCreatedBy(owner.getId());
        order = orderRepo.save(order);

        addMaterialUsage(order, owner, items.get(0), 2, started.plusDays(1));
        recalcOrderCost(order);

        addAssignment(order.getId(), w1.getId(), owner.getId(), started, w1.getCommissionPct() != null ? w1.getCommissionPct() : BigDecimal.valueOf(5));
        addAssignment(order.getId(), w2.getId(), owner.getId(), started.plusDays(1), w2.getCommissionPct() != null ? w2.getCommissionPct() : BigDecimal.valueOf(5));
    }

    private FurnitureOrderEntity buildOrder(UUID workshopId, String title, int salePrice,
                                            FurnitureStatus status,
                                            LocalDateTime started, LocalDateTime completed, LocalDateTime sold,
                                            String clientName, String clientPhone) {
        String orderNum = "ORD-" + LocalDate.now().getYear() + "-" + String.format("%05d", orderRepo.count() + 1);
        FurnitureOrderEntity o = FurnitureOrderEntity.builder()
                .workshopId(workshopId).orderNumber(orderNum).title(title)
                .status(status)
                .salePrice(BigDecimal.valueOf(salePrice))
                .estimatedCost(BigDecimal.valueOf((long)(salePrice * 0.4)))
                .actualMaterialCost(BigDecimal.ZERO)
                .startedAt(started).completedAt(completed).soldAt(sold)
                .clientName(clientName).clientPhone(clientPhone)
                .build();
        o.setCreatedAt(started != null ? started.minusDays(2) : LocalDateTime.now().minusDays(7));
        return o;
    }

    private void addMaterialUsage(FurnitureOrderEntity order, UserEntity owner,
                                  WarehouseItemEntity item, int qty, LocalDateTime at) {
        BigDecimal quantity  = BigDecimal.valueOf(qty);
        BigDecimal unitPrice = item.getAvgUnitPrice();
        BigDecimal total     = quantity.multiply(unitPrice);

        MaterialUsageEntity usage = MaterialUsageEntity.builder()
                .furnitureOrderId(order.getId())
                .warehouseItemId(item.getId())
                .quantityUsed(quantity)
                .unitPriceAtTime(unitPrice)
                .totalCost(total)
                .givenBy(owner.getId())
                .givenAt(at)
                .notes(null)
                .build();
        usage.setCreatedAt(at);
        usageRepo.save(usage);

        // Log warehouse OUT transaction
        WarehouseTransactionEntity tx = WarehouseTransactionEntity.builder()
                .itemId(item.getId()).workshopId(item.getWorkshopId())
                .transactionType(TransactionType.OUT)
                .quantity(quantity).unitPrice(unitPrice).totalCost(total)
                .qtyBefore(item.getQuantity().add(quantity))
                .qtyAfter(item.getQuantity())
                .priceBefore(unitPrice).priceAfter(unitPrice)
                .furnitureOrderId(order.getId())
                .createdBy(owner.getId())
                .build();
        tx.setCreatedAt(at);
        txRepo.save(tx);
    }

    private void recalcOrderCost(FurnitureOrderEntity order) {
        BigDecimal total = usageRepo.sumTotalCostByOrderId(order.getId());
        order.setActualMaterialCost(total != null ? total : BigDecimal.ZERO);
        orderRepo.save(order);
    }

    private void addAssignment(UUID orderId, UUID workerId, UUID ownerId, LocalDateTime at, BigDecimal commPct) {
        FurnitureAssignmentEntity a = FurnitureAssignmentEntity.builder()
                .furnitureOrderId(orderId).workerId(workerId)
                .assignedAt(at).commissionPct(commPct).active(true).build();
        a.setCreatedBy(ownerId);
        a.setCreatedAt(at);
        assignmentRepo.save(a);
    }

    private void seedFinancialLogs(WorkshopEntity ws, UserEntity owner, List<FinancialLogEntity> logs) {
        financialLogRepo.saveAll(logs);
    }

    private FinancialLogEntity flog(UUID workshopId, FinancialLogType type, long amount,
                                    String description, LocalDate logDate, UUID actorId) {
        FinancialLogEntity log = FinancialLogEntity.builder()
                .workshopId(workshopId)
                .logType(type)
                .amount(BigDecimal.valueOf(amount))
                .description(description)
                .logDate(logDate)
                .build();
        log.setCreatedBy(actorId);
        log.setCreatedAt(logDate.atTime(10, 0));
        return log;
    }

    private void seedAttendanceAndEarnings(WorkshopEntity ws, UserEntity owner, List<UserEntity> workers) {
        LocalDate today = LocalDate.now();
        for (UserEntity worker : workers) {
            for (int i = 30; i >= 1; i--) {
                if (i % 7 == 0 || i % 7 == 6) continue; // skip weekends
                LocalDate workDate = today.minusDays(i);
                LocalDateTime checkIn  = workDate.atTime(8, 0);
                LocalDateTime checkOut = workDate.atTime(17, 0);
                BigDecimal hours = BigDecimal.valueOf(8);

                DailyAttendanceEntity att = DailyAttendanceEntity.builder()
                        .userId(worker.getId()).workshopId(ws.getId())
                        .workDate(workDate).checkInTime(checkIn).checkOutTime(checkOut)
                        .hoursWorked(hours).hoursLocked(true).hoursLockedAt(checkOut.plusHours(1))
                        .hoursSelfReported(false).hoursDeadline(checkOut.plusHours(24))
                        .build();
                att.setCreatedAt(checkIn);
                att.setCreatedBy(worker.getId());
                DailyAttendanceEntity savedAtt = attendanceRepo.save(att);

                if (worker.getPayType() == PayType.DAILY && worker.getDailySalary() != null) {
                    BigDecimal dailySal = worker.getDailySalary();
                    EarningEntity earn = EarningEntity.builder()
                            .workerId(worker.getId()).workshopId(ws.getId())
                            .earnDate(workDate).earnType(EarnType.DAILY_WAGE)
                            .attendanceId(savedAtt.getId())
                            .daysWorked(BigDecimal.ONE).dailyRate(dailySal)
                            .baseAmount(dailySal).totalAmount(dailySal)
                            .hoursWorked(hours)
                            .description(workDate + " — kunlik ish haqi")
                            .build();
                    earn.setCreatedAt(checkOut);
                    earningRepo.save(earn);
                }
            }
        }
    }
}
