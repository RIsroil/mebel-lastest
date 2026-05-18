package project.mebel.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import project.mebel.attendance.DailyAttendanceEntity;
import project.mebel.attendance.DailyAttendanceRepository;
import project.mebel.common.enums.*;
import project.mebel.earning.BonusEntity;
import project.mebel.earning.BonusRepository;
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
	private final FurnitureTemplateRepository templateRepo;
	private final FurnitureAssignmentRepository assignmentRepo;
	private final MaterialUsageRepository usageRepo;
	private final DailyAttendanceRepository attendanceRepo;
	private final EarningRepository earningRepo;
	private final BonusRepository bonusRepo;
	private final FinancialLogRepository financialLogRepo;
	private final PasswordEncoder passwordEncoder;

	@Override
	public void run(String... args) {
		if (userRepo.findByUsernameAndDeletedAtIsNull("admin").isEmpty()) {
			seedAllData();
		}
	}

	private void seedAllData() {
		String pwd = passwordEncoder.encode("test123");

		// ════════════════════════════════════════════════════════════════
		// 1. ADMIN
		// ════════════════════════════════════════════════════════════════
		UserEntity admin = UserEntity.builder()
				.username("admin")
				.passwordHash(pwd)
				.fullName("Admin System")
				.phone("+998900000000")
				.role(UserRole.ADMIN)
				.active(true)
				.build();
		admin.setCreatedAt(LocalDateTime.now().minusDays(90));
		userRepo.save(admin);

		// ════════════════════════════════════════════════════════════════
		// 2. OWNER + WORKSHOP
		// ════════════════════════════════════════════════════════════════
		UserEntity owner = UserEntity.builder()
				.username("owner1")
				.passwordHash(pwd)
				.fullName("Alisher Karimov")
				.phone("+998901234567")
				.role(UserRole.OWNER)
				.active(true)
				.build();
		owner.setCreatedAt(LocalDateTime.now().minusDays(60));
		owner = userRepo.save(owner);  // SAVE FIRST

		WorkshopEntity workshop = WorkshopEntity.builder()
				.name("Premium Mebel Factory")
				.address("Tashkent, Yunus Rajabiy 123, Building A")
				.phone("+998712345678")
				.description("Premium furniture manufacturing with modern equipment")
				.ownerId(owner.getId())  // NOW owner.getId() has value
				.build();
		workshop.setCreatedAt(LocalDateTime.now().minusDays(60));
		workshop = workshopRepo.save(workshop);

		owner.setWorkshopId(workshop.getId());
		owner = userRepo.save(owner);

		// ════════════════════════════════════════════════════════════════
		// 3. THREE WORKERS with different pay types
		// ════════════════════════════════════════════════════════════════
		UserEntity worker1 = UserEntity.builder()
				.username("worker1")
				.passwordHash(pwd)
				.fullName("Rustam Abdullayev")
				.phone("+998901111111")
				.role(UserRole.WORKER)
				.workshopId(workshop.getId())
				.active(true)
				.payType(PayType.DAILY)
				.dailySalary(BigDecimal.valueOf(300_000))
				.dailyHoursTarget(BigDecimal.valueOf(8))
				.commissionPct(BigDecimal.valueOf(5))
				.build();
		worker1.setCreatedAt(LocalDateTime.now().minusDays(45));
		worker1 = userRepo.save(worker1);

		UserEntity worker2 = UserEntity.builder()
				.username("worker2")
				.passwordHash(pwd)
				.fullName("Dilnoza Khamidova")
				.phone("+998902222222")
				.role(UserRole.WORKER)
				.workshopId(workshop.getId())
				.active(true)
				.payType(PayType.DAILY)
				.dailySalary(BigDecimal.valueOf(250_000))
				.dailyHoursTarget(BigDecimal.valueOf(8))
				.commissionPct(BigDecimal.valueOf(4))
				.build();
		worker2.setCreatedAt(LocalDateTime.now().minusDays(45));
		worker2 = userRepo.save(worker2);

		UserEntity worker3 = UserEntity.builder()
				.username("worker3")
				.passwordHash(pwd)
				.fullName("Sherali Mirzayev")
				.phone("+998903333333")
				.role(UserRole.WORKER)
				.workshopId(workshop.getId())
				.active(true)
				.payType(PayType.MONTHLY)
				.monthlySalary(BigDecimal.valueOf(5_000_000))
				.dailyHoursTarget(BigDecimal.valueOf(8))
				.commissionPct(BigDecimal.valueOf(3))
				.build();
		worker3.setCreatedAt(LocalDateTime.now().minusDays(45));
		worker3 = userRepo.save(worker3);

		// ════════════════════════════════════════════════════════════════
		// 4. WAREHOUSE MATERIALS
		// ════════════════════════════════════════════════════════════════
		LocalDateTime warehouseCreated = LocalDateTime.now().minusDays(40);

		WarehouseItemEntity materials[] = {
			// Wood materials
			saveItem(workshop.getId(), "Chinor wood (m³)", UnitType.M3, 25, 650_000, warehouseCreated, owner.getId()),
			saveItem(workshop.getId(), "Oak plywood (m²)", UnitType.M2, 150, 85_000, warehouseCreated, owner.getId()),
			saveItem(workshop.getId(), "Birch veneer (m)", UnitType.METER, 200, 12_000, warehouseCreated, owner.getId()),

			// Hardware
			saveItem(workshop.getId(), "Stainless steel screws (kg)", UnitType.KG, 50, 35_000, warehouseCreated, owner.getId()),
			saveItem(workshop.getId(), "Door hinges (piece)", UnitType.PIECE, 300, 8_500, warehouseCreated, owner.getId()),
			saveItem(workshop.getId(), "Cabinet handles (piece)", UnitType.PIECE, 250, 12_000, warehouseCreated, owner.getId()),

			// Finishing materials
			saveItem(workshop.getId(), "Wood stain (litre)", UnitType.LITRE, 40, 45_000, warehouseCreated, owner.getId()),
			saveItem(workshop.getId(), "Polyurethane varnish (litre)", UnitType.LITRE, 30, 78_000, warehouseCreated, owner.getId()),
			saveItem(workshop.getId(), "Wood filler (kg)", UnitType.KG, 20, 28_000, warehouseCreated, owner.getId()),

			// Upholstery
			saveItem(workshop.getId(), "Fabric roll (m)", UnitType.METER, 180, 65_000, warehouseCreated, owner.getId()),
			saveItem(workshop.getId(), "Foam padding (m²)", UnitType.M2, 100, 42_000, warehouseCreated, owner.getId()),
		};

		// ════════════════════════════════════════════════════════════════
		// 5. FURNITURE TEMPLATES (Optional reference)
		// ════════════════════════════════════════════════════════════════
		FurnitureTemplateEntity template1 = FurnitureTemplateEntity.builder()
				.workshopId(workshop.getId())
				.name("Executive Office Desk")
				.description("Professional office desk with storage")
				.estimatedProdDays((short)5)
				.active(true)
				.build();
		template1.setCreatedAt(warehouseCreated);
		template1.setCreatedBy(owner.getId());
		templateRepo.save(template1);

		FurnitureTemplateEntity template2 = FurnitureTemplateEntity.builder()
				.workshopId(workshop.getId())
				.name("Living Room Sofa")
				.description("Comfortable sectional sofa")
				.estimatedProdDays((short)15)
				.active(true)
				.build();
		template2.setCreatedAt(warehouseCreated);
		template2.setCreatedBy(owner.getId());
		templateRepo.save(template2);

		// ════════════════════════════════════════════════════════════════
		// 6. FURNITURE ORDERS (with materials used)
		// ════════════════════════════════════════════════════════════════

		// Order 1: COMPLETED - Executive Desk
		LocalDateTime order1Start = LocalDateTime.now().minusDays(30);
		FurnitureOrderEntity order1 = FurnitureOrderEntity.builder()
				.workshopId(workshop.getId())
				.orderNumber("ORD-2026-00001")
				.title("Executive Office Desk - Client: Tech Corp")
				.status(FurnitureStatus.COMPLETED)
				.salePrice(BigDecimal.valueOf(4_800_000))
				.estimatedCost(BigDecimal.valueOf(1_920_000))
				.actualMaterialCost(BigDecimal.ZERO)
				.startedAt(order1Start)
				.completedAt(order1Start.plusDays(15))
				.soldAt(null)
				.clientName("Tech Corporation")
				.clientPhone("+998701234567")
				.build();
		order1.setCreatedAt(order1Start.minusDays(2));
		order1.setCreatedBy(owner.getId());
		order1 = orderRepo.save(order1);

		// Add materials to order1
		addMaterialToOrder(order1, owner, materials[0], 2, order1Start.plusDays(1));  // Chinor: 2m³
		addMaterialToOrder(order1, owner, materials[1], 8, order1Start.plusDays(2));  // Plywood: 8m²
		addMaterialToOrder(order1, owner, materials[3], 5, order1Start.plusDays(3));  // Screws: 5kg
		addMaterialToOrder(order1, owner, materials[4], 20, order1Start.plusDays(3)); // Hinges: 20pcs
		addMaterialToOrder(order1, owner, materials[6], 3, order1Start.plusDays(5));  // Stain: 3L
		addMaterialToOrder(order1, owner, materials[7], 2, order1Start.plusDays(6));  // Varnish: 2L
		recalcOrderCost(order1);

		// Assign workers with commission
		addAssignment(order1.getId(), worker1.getId(), owner.getId(), order1Start, BigDecimal.valueOf(5));
		addAssignment(order1.getId(), worker2.getId(), owner.getId(), order1Start.plusDays(1), BigDecimal.valueOf(4));

		// Order 2: SOLD - Living Room Sofa
		LocalDateTime order2Start = LocalDateTime.now().minusDays(28);
		LocalDateTime order2Complete = order2Start.plusDays(20);
		LocalDateTime order2Sold = order2Complete.plusDays(2);

		FurnitureOrderEntity order2 = FurnitureOrderEntity.builder()
				.workshopId(workshop.getId())
				.orderNumber("ORD-2026-00002")
				.title("Living Room Sofa Set - Client: Luxury Home")
				.status(FurnitureStatus.SOLD)
				.salePrice(BigDecimal.valueOf(13_200_000))
				.estimatedCost(BigDecimal.valueOf(5_280_000))
				.actualMaterialCost(BigDecimal.ZERO)
				.startedAt(order2Start)
				.completedAt(order2Complete)
				.soldAt(order2Sold)
				.clientName("Luxury Home Designs")
				.clientPhone("+998702222222")
				.build();
		order2.setCreatedAt(order2Start.minusDays(2));
		order2.setCreatedBy(owner.getId());
		order2 = orderRepo.save(order2);

		// Add materials to order2
		addMaterialToOrder(order2, owner, materials[0], 4, order2Start.plusDays(2));  // Chinor: 4m³
		addMaterialToOrder(order2, owner, materials[1], 15, order2Start.plusDays(2)); // Plywood: 15m²
		addMaterialToOrder(order2, owner, materials[9], 12, order2Start.plusDays(3)); // Fabric: 12m
		addMaterialToOrder(order2, owner, materials[10], 20, order2Start.plusDays(4)); // Foam: 20m²
		addMaterialToOrder(order2, owner, materials[6], 5, order2Start.plusDays(6));  // Stain: 5L
		addMaterialToOrder(order2, owner, materials[7], 4, order2Start.plusDays(8));  // Varnish: 4L
		recalcOrderCost(order2);

		// Assign all workers
		addAssignment(order2.getId(), worker1.getId(), owner.getId(), order2Start, BigDecimal.valueOf(5));
		addAssignment(order2.getId(), worker2.getId(), owner.getId(), order2Start.plusDays(1), BigDecimal.valueOf(4));
		addAssignment(order2.getId(), worker3.getId(), owner.getId(), order2Start.plusDays(3), BigDecimal.valueOf(3));

		// Create commission earnings for order2 (sold)
		BigDecimal commission1 = BigDecimal.valueOf(13_200_000)
				.multiply(BigDecimal.valueOf(5))
				.divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
		EarningEntity commEarn1 = EarningEntity.builder()
				.workerId(worker1.getId())
				.workshopId(workshop.getId())
				.earnDate(order2Sold.toLocalDate())
				.earnType(EarnType.COMMISSION)
				.furnitureOrderId(order2.getId())
				.commissionPct(BigDecimal.valueOf(5))
				.commissionAmount(commission1)
				.baseAmount(commission1)
				.totalAmount(commission1)
				.description("Living Room Sofa — 5% commission")
				.build();
		commEarn1.setCreatedAt(order2Sold);
		earningRepo.save(commEarn1);

		// Order 3: IN_PROGRESS - Custom Bedroom Set
		LocalDateTime order3Start = LocalDateTime.now().minusDays(8);
		FurnitureOrderEntity order3 = FurnitureOrderEntity.builder()
				.workshopId(workshop.getId())
				.orderNumber("ORD-2026-00003")
				.title("Custom Bedroom Set - Client: Royal Residence")
				.status(FurnitureStatus.IN_PROGRESS)
				.salePrice(BigDecimal.valueOf(18_500_000))
				.estimatedCost(BigDecimal.valueOf(7_400_000))
				.actualMaterialCost(BigDecimal.ZERO)
				.startedAt(order3Start)
				.completedAt(null)
				.soldAt(null)
				.clientName("Royal Residence")
				.clientPhone("+998703333333")
				.build();
		order3.setCreatedAt(order3Start.minusDays(2));
		order3.setCreatedBy(owner.getId());
		order3 = orderRepo.save(order3);

		// Add materials to order3
		addMaterialToOrder(order3, owner, materials[0], 5, order3Start.plusDays(1));  // Chinor: 5m³
		addMaterialToOrder(order3, owner, materials[1], 12, order3Start.plusDays(2)); // Plywood: 12m²
		addMaterialToOrder(order3, owner, materials[2], 25, order3Start.plusDays(2)); // Veneer: 25m
		addMaterialToOrder(order3, owner, materials[9], 8, order3Start.plusDays(3));  // Fabric: 8m
		recalcOrderCost(order3);

		// Assign all workers
		addAssignment(order3.getId(), worker1.getId(), owner.getId(), order3Start, BigDecimal.valueOf(5));
		addAssignment(order3.getId(), worker2.getId(), owner.getId(), order3Start.plusDays(1), BigDecimal.valueOf(4));
		addAssignment(order3.getId(), worker3.getId(), owner.getId(), order3Start.plusDays(2), BigDecimal.valueOf(3));

		// Order 4: DRAFT - Kitchen Cabinet System
		LocalDateTime order4Start = LocalDateTime.now().minusDays(2);
		FurnitureOrderEntity order4 = FurnitureOrderEntity.builder()
				.workshopId(workshop.getId())
				.orderNumber("ORD-2026-00004")
				.title("Kitchen Cabinet System - Client: Modern Home")
				.status(FurnitureStatus.DRAFT)
				.salePrice(BigDecimal.valueOf(7_200_000))
				.estimatedCost(BigDecimal.valueOf(2_880_000))
				.actualMaterialCost(BigDecimal.ZERO)
				.startedAt(null)
				.completedAt(null)
				.soldAt(null)
				.clientName("Modern Home Solutions")
				.clientPhone("+998704444444")
				.build();
		order4.setCreatedAt(order4Start);
		order4.setCreatedBy(owner.getId());
		order4 = orderRepo.save(order4);

		// Add one material to order4
		addMaterialToOrder(order4, owner, materials[1], 6, order4Start.plusHours(1)); // Plywood: 6m²
		recalcOrderCost(order4);

		// ════════════════════════════════════════════════════════════════
		// 7. ATTENDANCE & DAILY WAGES
		// ════════════════════════════════════════════════════════════════
		seedAttendanceAndDailyEarnings(workshop.getId(), worker1, 30);
		seedAttendanceAndDailyEarnings(workshop.getId(), worker2, 30);
		seedAttendanceAndDailyEarnings(workshop.getId(), worker3, 30);

		// ════════════════════════════════════════════════════════════════
		// 8. MONTHLY SALARIES (for MONTHLY pay type worker3)
		// ════════════════════════════════════════════════════════════════
		if (worker3.getPayType() == PayType.MONTHLY && worker3.getMonthlySalary() != null) {
			LocalDate currentMonth = LocalDate.now().withDayOfMonth(1);
			EarningEntity monthlySal = EarningEntity.builder()
					.workerId(worker3.getId())
					.workshopId(workshop.getId())
					.earnDate(currentMonth)
					.earnType(EarnType.MONTHLY_WAGE)
					.daysWorked(BigDecimal.valueOf(22))
					.monthlySalary(worker3.getMonthlySalary())
					.baseAmount(worker3.getMonthlySalary())
					.totalAmount(worker3.getMonthlySalary())
					.description("May 2026 — Monthly Salary")
					.build();
			monthlySal.setCreatedAt(currentMonth.atTime(10, 0));
			earningRepo.save(monthlySal);
		}

		// ════════════════════════════════════════════════════════════════
		// 9. BONUSES
		// ════════════════════════════════════════════════════════════════
		LocalDate bonusDate = LocalDate.now().minusDays(5);

		BonusEntity bonus1 = BonusEntity.builder()
				.workerId(worker1.getId())
				.workshopId(workshop.getId())
				.bonusDate(bonusDate)
				.amount(BigDecimal.valueOf(500_000))
				.reason("Excellent craftsmanship on executive desk")
				.build();
		bonus1.setCreatedAt(bonusDate.atTime(15, 0));
		bonus1.setCreatedBy(owner.getId());
		bonusRepo.save(bonus1);

		BonusEntity bonus2 = BonusEntity.builder()
				.workerId(worker2.getId())
				.workshopId(workshop.getId())
				.bonusDate(bonusDate)
				.amount(BigDecimal.valueOf(400_000))
				.reason("Efficient upholstery work on sofa")
				.build();
		bonus2.setCreatedAt(bonusDate.atTime(15, 30));
		bonus2.setCreatedBy(owner.getId());
		bonusRepo.save(bonus2);

		BonusEntity bonus3 = BonusEntity.builder()
				.workerId(worker3.getId())
				.workshopId(workshop.getId())
				.bonusDate(bonusDate.minusDays(3))
				.amount(BigDecimal.valueOf(800_000))
				.reason("Perfect project management and team coordination")
				.build();
		bonus3.setCreatedAt(bonusDate.minusDays(3).atTime(12, 0));
		bonus3.setCreatedBy(owner.getId());
		bonusRepo.save(bonus3);

		// Create earning entries for bonuses
		EarningEntity bonusEarn1 = EarningEntity.builder()
				.workerId(worker1.getId())
				.workshopId(workshop.getId())
				.earnDate(bonusDate)
				.earnType(EarnType.BONUS)
				.baseAmount(BigDecimal.valueOf(500_000))
				.totalAmount(BigDecimal.valueOf(500_000))
				.description("Bonus — Excellent craftsmanship")
				.build();
		bonusEarn1.setCreatedAt(bonusDate.atTime(15, 0));
		earningRepo.save(bonusEarn1);

		EarningEntity bonusEarn2 = EarningEntity.builder()
				.workerId(worker2.getId())
				.workshopId(workshop.getId())
				.earnDate(bonusDate)
				.earnType(EarnType.BONUS)
				.baseAmount(BigDecimal.valueOf(400_000))
				.totalAmount(BigDecimal.valueOf(400_000))
				.description("Bonus — Efficient upholstery work")
				.build();
		bonusEarn2.setCreatedAt(bonusDate.atTime(15, 30));
		earningRepo.save(bonusEarn2);

		EarningEntity bonusEarn3 = EarningEntity.builder()
				.workerId(worker3.getId())
				.workshopId(workshop.getId())
				.earnDate(bonusDate.minusDays(3))
				.earnType(EarnType.BONUS)
				.baseAmount(BigDecimal.valueOf(800_000))
				.totalAmount(BigDecimal.valueOf(800_000))
				.description("Bonus — Project management excellence")
				.build();
		bonusEarn3.setCreatedAt(bonusDate.minusDays(3).atTime(12, 0));
		earningRepo.save(bonusEarn3);

		// ════════════════════════════════════════════════════════════════
		// 10. FINANCIAL LOGS
		// ════════════════════════════════════════════════════════════════
		seedComprehensiveFinancialLogs(workshop.getId(), owner.getId());
	}

	// ════════════════════════════════════════════════════════════════
	// HELPER METHODS
	// ════════════════════════════════════════════════════════════════

	private WarehouseItemEntity saveItem(UUID workshopId, String name, UnitType unit, int qty, long price, LocalDateTime createdAt, UUID createdBy) {
		WarehouseItemEntity item = WarehouseItemEntity.builder()
				.workshopId(workshopId)
				.name(name)
				.unitType(unit)
				.quantity(BigDecimal.valueOf(qty))
				.avgUnitPrice(BigDecimal.valueOf(price))
				.totalValue(BigDecimal.valueOf((long) qty * price))
				.active(true)
				.build();
		item.setCreatedAt(createdAt);
		item.setCreatedBy(createdBy);
		item = itemRepo.save(item);  // SAVE FIRST to get valid ID

		// Create IN transaction for initial stock
		WarehouseTransactionEntity inTx = WarehouseTransactionEntity.builder()
				.itemId(item.getId())  // NOW item.getId() has value
				.workshopId(workshopId)
				.transactionType(TransactionType.IN)
				.quantity(BigDecimal.valueOf(qty))
				.unitPrice(BigDecimal.valueOf(price))
				.totalCost(BigDecimal.valueOf((long) qty * price))
				.qtyBefore(BigDecimal.ZERO)
				.qtyAfter(BigDecimal.valueOf(qty))
				.priceBefore(BigDecimal.valueOf(price))
				.priceAfter(BigDecimal.valueOf(price))
				.build();
		inTx.setCreatedAt(createdAt);
		inTx.setCreatedBy(createdBy);
		txRepo.save(inTx);

		return item;
	}

	private void addMaterialToOrder(FurnitureOrderEntity order, UserEntity owner,
									WarehouseItemEntity item, int qty, LocalDateTime usedAt) {
		BigDecimal quantity = BigDecimal.valueOf(qty);
		BigDecimal unitPrice = item.getAvgUnitPrice();
		BigDecimal totalCost = quantity.multiply(unitPrice);

		// Update warehouse quantity
		item.setQuantity(item.getQuantity().subtract(quantity));
		item.setTotalValue(item.getQuantity().multiply(unitPrice));
		itemRepo.save(item);

		// Create material usage record
		MaterialUsageEntity usage = MaterialUsageEntity.builder()
				.furnitureOrderId(order.getId())
				.warehouseItemId(item.getId())
				.quantityUsed(quantity)
				.unitPriceAtTime(unitPrice)
				.totalCost(totalCost)
				.givenBy(owner.getId())
				.givenAt(usedAt)
				.notes(null)
				.build();
		usage.setCreatedAt(usedAt);
		usageRepo.save(usage);

		// Log warehouse OUT transaction
		WarehouseTransactionEntity tx = WarehouseTransactionEntity.builder()
				.itemId(item.getId())
				.workshopId(item.getWorkshopId())
				.transactionType(TransactionType.OUT)
				.quantity(quantity)
				.unitPrice(unitPrice)
				.totalCost(totalCost)
				.qtyBefore(item.getQuantity().add(quantity))
				.qtyAfter(item.getQuantity())
				.priceBefore(unitPrice)
				.priceAfter(unitPrice)
				.furnitureOrderId(order.getId())
				.createdBy(owner.getId())
				.build();
		tx.setCreatedAt(usedAt);
		txRepo.save(tx);
	}

	private void recalcOrderCost(FurnitureOrderEntity order) {
		BigDecimal total = usageRepo.sumTotalCostByOrderId(order.getId());
		order.setActualMaterialCost(total != null ? total : BigDecimal.ZERO);
		orderRepo.save(order);
	}

	private void addAssignment(UUID orderId, UUID workerId, UUID ownerId, LocalDateTime at, BigDecimal commPct) {
		FurnitureAssignmentEntity assignment = FurnitureAssignmentEntity.builder()
				.furnitureOrderId(orderId)
				.workerId(workerId)
				.assignedAt(at)
				.commissionPct(commPct)
				.active(true)
				.build();
		assignment.setCreatedBy(ownerId);
		assignment.setCreatedAt(at);
		assignmentRepo.save(assignment);
	}

	private void seedAttendanceAndDailyEarnings(UUID workshopId, UserEntity worker, int daysBack) {
		if (worker.getPayType() != PayType.DAILY) return;

		LocalDate today = LocalDate.now();
		for (int i = daysBack; i >= 1; i--) {
			LocalDate workDate = today.minusDays(i);

			// Skip weekends (Saturday = 6, Sunday = 7 in DayOfWeek)
			if (workDate.getDayOfWeek().getValue() >= 6) continue;

			LocalDateTime checkIn = workDate.atTime(8, 30);
			LocalDateTime checkOut = workDate.atTime(17, 30);
			BigDecimal hours = BigDecimal.valueOf(8);

			// Create attendance record
			DailyAttendanceEntity att = DailyAttendanceEntity.builder()
					.userId(worker.getId())
					.workshopId(workshopId)
					.workDate(workDate)
					.checkInTime(checkIn)
					.checkOutTime(checkOut)
					.hoursWorked(hours)
					.hoursLocked(true)
					.hoursLockedAt(checkOut.plusHours(1))
					.hoursSelfReported(false)
					.hoursDeadline(checkOut.plusHours(24))
					.build();
			att.setCreatedAt(checkIn);
			att.setCreatedBy(worker.getId());
			DailyAttendanceEntity savedAtt = attendanceRepo.save(att);

			// Create daily wage earning
			EarningEntity earn = EarningEntity.builder()
					.workerId(worker.getId())
					.workshopId(workshopId)
					.earnDate(workDate)
					.earnType(EarnType.DAILY_WAGE)
					.attendanceId(savedAtt.getId())
					.daysWorked(BigDecimal.ONE)
					.dailyRate(worker.getDailySalary())
					.hoursWorked(hours)
					.baseAmount(worker.getDailySalary())
					.totalAmount(worker.getDailySalary())
					.description(workDate + " — Daily wage")
					.build();
			earn.setCreatedAt(checkOut);
			earningRepo.save(earn);
		}
	}

	private void seedComprehensiveFinancialLogs(UUID workshopId, UUID ownerId) {
		LocalDate today = LocalDate.now();

		// ────────────────────────────────────────────────────────────────
		// WAREHOUSE PURCHASES
		// ────────────────────────────────────────────────────────────────
		financialLogRepo.save(flog(workshopId, FinancialLogType.WAREHOUSE_PURCHASE,
				-16_250_000, "Initial wood stock purchase: Chinor 25m³ × 650k, Plywood 150m² × 85k",
				today.minusDays(40), ownerId));

		financialLogRepo.save(flog(workshopId, FinancialLogType.WAREHOUSE_PURCHASE,
				-4_200_000, "Hardware restocking: Screws 50kg, Hinges 300pcs, Handles 250pcs",
				today.minusDays(35), ownerId));

		financialLogRepo.save(flog(workshopId, FinancialLogType.WAREHOUSE_PURCHASE,
				-5_130_000, "Finishing materials: Stain 40L, Varnish 30L, Filler 20kg",
				today.minusDays(32), ownerId));

		financialLogRepo.save(flog(workshopId, FinancialLogType.WAREHOUSE_PURCHASE,
				-13_470_000, "Upholstery purchase: Fabric 180m × 65k, Foam 100m² × 42k",
				today.minusDays(30), ownerId));

		financialLogRepo.save(flog(workshopId, FinancialLogType.WAREHOUSE_PURCHASE,
				-3_640_000, "Restock: Plywood 50m² × 85k, Stain 10L, Varnish 5L",
				today.minusDays(15), ownerId));

		// ────────────────────────────────────────────────────────────────
		// MATERIAL USAGE (COGS)
		// ────────────────────────────────────────────────────────────────
		financialLogRepo.save(flog(workshopId, FinancialLogType.MATERIAL_USED,
				-1_301_000, "Materials used for Order #1 (Executive Desk): Chinor 2m³, Plywood 8m²",
				today.minusDays(28), ownerId));

		financialLogRepo.save(flog(workshopId, FinancialLogType.MATERIAL_USED,
				-3_952_000, "Materials used for Order #2 (Sofa Set): Chinor 4m³, Plywood 15m², Fabric 12m, Foam 20m²",
				today.minusDays(25), ownerId));

		financialLogRepo.save(flog(workshopId, FinancialLogType.MATERIAL_USED,
				-2_106_000, "Materials used for Order #3 (Bedroom): Chinor 5m³, Plywood 12m², Veneer 25m",
				today.minusDays(10), ownerId));

		// ────────────────────────────────────────────────────────────────
		// FURNITURE SALES
		// ────────────────────────────────────────────────────────────────
		financialLogRepo.save(flog(workshopId, FinancialLogType.FURNITURE_SOLD,
				4_800_000, "Order #1 COMPLETED: Executive Office Desk (Client: Tech Corp)",
				today.minusDays(15), ownerId));

		financialLogRepo.save(flog(workshopId, FinancialLogType.FURNITURE_SOLD,
				13_200_000, "Order #2 SOLD: Living Room Sofa Set (Client: Luxury Home)",
				today.minusDays(6), ownerId));

		// ────────────────────────────────────────────────────────────────
		// COMMISSIONS
		// ────────────────────────────────────────────────────────────────
		financialLogRepo.save(flog(workshopId, FinancialLogType.COMMISSION_PAID,
				-660_000, "Commission paid: Rustam Abdullayev (5% × 13.2M for Sofa)",
				today.minusDays(5), ownerId));

		// ────────────────────────────────────────────────────────────────
		// WAGES & SALARIES
		// ────────────────────────────────────────────────────────────────
		financialLogRepo.save(flog(workshopId, FinancialLogType.WAGE_PAID,
				-6_600_000, "Monthly salary: Sherali Mirzayev (Full month May 2026)",
				today.minusDays(2), ownerId));

		financialLogRepo.save(flog(workshopId, FinancialLogType.WAGE_PAID,
				-5_250_000, "Daily wages + extras: Rustam Abdullayev (22 days × 300k = 6.6M, minus advances 1.35M)",
				today.minusDays(3), ownerId));

		financialLogRepo.save(flog(workshopId, FinancialLogType.WAGE_PAID,
				-4_500_000, "Daily wages: Dilnoza Khamidova (20 days × 250k = 5M, minus advances 500k)",
				today.minusDays(3), ownerId));

		// ────────────────────────────────────────────────────────────────
		// BONUSES
		// ────────────────────────────────────────────────────────────────
		financialLogRepo.save(flog(workshopId, FinancialLogType.BONUS_PAID,
				-500_000, "Bonus: Rustam Abdullayev — Excellent craftsmanship",
				today.minusDays(5), ownerId));

		financialLogRepo.save(flog(workshopId, FinancialLogType.BONUS_PAID,
				-400_000, "Bonus: Dilnoza Khamidova — Efficient upholstery work",
				today.minusDays(5), ownerId));

		financialLogRepo.save(flog(workshopId, FinancialLogType.BONUS_PAID,
				-800_000, "Bonus: Sherali Mirzayev — Perfect project management",
				today.minusDays(8), ownerId));

		// ────────────────────────────────────────────────────────────────
		// CURRENT MONTH RECENT ACTIVITY
		// ────────────────────────────────────────────────────────────────
		financialLogRepo.save(flog(workshopId, FinancialLogType.WAREHOUSE_PURCHASE,
				-1_700_000, "Stock replenishment: Veneer 50m, Stain 5L (local supplier)",
				today.minusDays(3), ownerId));

		financialLogRepo.save(flog(workshopId, FinancialLogType.MATERIAL_USED,
				-450_000, "Materials for Order #3 in progress: Additional stain & varnish",
				today.minusDays(2), ownerId));

		financialLogRepo.save(flog(workshopId, FinancialLogType.WAGE_PAID,
				-600_000, "Weekly advance: Rustam Abdullayev (2 days early payment)",
				today.minusDays(1), ownerId));
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
}
