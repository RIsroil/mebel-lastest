package project.mebel.earning;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.common.enums.EarnType;
import project.mebel.common.enums.FinancialLogType;
import project.mebel.furniture.FurnitureAssignmentEntity;
import project.mebel.furniture.FurnitureAssignmentRepository;
import project.mebel.financiallog.FinancialLogService;
import project.mebel.user.UserEntity;
import project.mebel.user.UserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WageCalculationService {

    private final EarningRepository earningRepo;
    private final FurnitureAssignmentRepository assignmentRepo;
    private final UserRepository userRepo;
    private final FinancialLogService financialLogService;

    /**
     * Worker biriktirilganda wage log yaratish
     * Har bir worker o'zining to'liq kunlik maoshini oladi (split yo'q)
     */
    @Transactional
    public void createWageLogOnAssignment(UUID orderId, UUID workerId, UUID workshopId, UUID createdBy) {
        UserEntity worker = userRepo.findById(workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found"));

        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(today);
        int daysInMonth = currentMonth.lengthOfMonth();

        // Use daily salary if available, otherwise calculate from monthly
        BigDecimal dailyRate;
        BigDecimal monthlySalary = worker.getMonthlySalary();

        if (worker.getDailySalary() != null && worker.getDailySalary().compareTo(BigDecimal.ZERO) > 0) {
            dailyRate = worker.getDailySalary();
            if (monthlySalary == null || monthlySalary.compareTo(BigDecimal.ZERO) <= 0) {
                monthlySalary = dailyRate.multiply(BigDecimal.valueOf(daysInMonth));
            }
        } else if (monthlySalary != null && monthlySalary.compareTo(BigDecimal.ZERO) > 0) {
            dailyRate = monthlySalary.divide(BigDecimal.valueOf(daysInMonth), 2, RoundingMode.HALF_UP);
        } else {
            dailyRate = BigDecimal.ZERO;
            monthlySalary = BigDecimal.ZERO;
        }

        // Each worker gets full daily rate (no split)
        EarningEntity earning = EarningEntity.builder()
                .workerId(workerId)
                .workshopId(workshopId)
                .earnDate(today)
                .earnType(EarnType.DAILY_WAGE)
                .baseAmount(dailyRate)
                .totalAmount(dailyRate)
                .dailyRate(dailyRate)
                .monthlySalary(monthlySalary)
                .daysInMonth(daysInMonth)
                .periodStart(currentMonth.atDay(1))
                .furnitureOrderId(orderId)
                .build();
        earning.setCreatedBy(createdBy);
        earningRepo.save(earning);

        String workerName = worker.getFullName() != null ? worker.getFullName() : worker.getUsername();
        String logDesc = "Kunlik maosh hisoblandi: " + workerName + " | " + dailyRate + " so'm";

        financialLogService.record(
                workshopId,
                FinancialLogType.WAGE_CALCULATED,
                dailyRate.negate(),
                logDesc,
                workerId,
                workerName,
                today,
                createdBy
        );
    }

    /**
     * Har kun: assignment'larni tekshirish va wage'larni update qilish
     * Har bir assignment uchun to'liq kunlik maosh hisoblaydi (split yo'q)
     */
    @Transactional
    public void updateDailyWagesForWorker(UUID workerId, UUID workshopId, LocalDate today, UUID updatedBy) {
        UserEntity worker = userRepo.findById(workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found"));

        List<FurnitureAssignmentEntity> activeAssignments = assignmentRepo
                .findByWorkerIdAndActiveTrueOrderByAssignedAtAsc(workerId);

        if (activeAssignments.isEmpty()) return;

        YearMonth currentMonth = YearMonth.from(today);
        int daysInMonth = currentMonth.lengthOfMonth();

        BigDecimal dailyRate;
        BigDecimal monthlySalary = worker.getMonthlySalary();

        if (worker.getDailySalary() != null && worker.getDailySalary().compareTo(BigDecimal.ZERO) > 0) {
            dailyRate = worker.getDailySalary();
            if (monthlySalary == null || monthlySalary.compareTo(BigDecimal.ZERO) <= 0) {
                monthlySalary = dailyRate.multiply(BigDecimal.valueOf(daysInMonth));
            }
        } else if (monthlySalary != null && monthlySalary.compareTo(BigDecimal.ZERO) > 0) {
            dailyRate = monthlySalary.divide(BigDecimal.valueOf(daysInMonth), 2, RoundingMode.HALF_UP);
        } else {
            return; // No salary configured
        }

        String workerName = worker.getFullName() != null ? worker.getFullName() : worker.getUsername();

        // Create earning for each active assignment
        for (FurnitureAssignmentEntity assignment : activeAssignments) {
            UUID orderId = assignment.getFurnitureOrderId();

            // Check if earning already exists for today
            if (earningRepo.findByWorkerIdAndFurnitureOrderIdAndEarnDate(workerId, orderId, today).isPresent()) {
                continue;
            }

            EarningEntity earning = EarningEntity.builder()
                    .workerId(workerId)
                    .workshopId(workshopId)
                    .earnDate(today)
                    .earnType(EarnType.DAILY_WAGE)
                    .baseAmount(dailyRate)
                    .totalAmount(dailyRate)
                    .dailyRate(dailyRate)
                    .monthlySalary(monthlySalary)
                    .daysInMonth(daysInMonth)
                    .periodStart(currentMonth.atDay(1))
                    .furnitureOrderId(orderId)
                    .build();
            earning.setCreatedBy(updatedBy);
            earningRepo.save(earning);

            financialLogService.record(
                    workshopId,
                    FinancialLogType.WAGE_CALCULATED,
                    dailyRate.negate(),
                    "Kunlik maosh hisoblandi: " + workerName,
                    workerId,
                    workerName,
                    today,
                    updatedBy
            );
        }
    }
}
