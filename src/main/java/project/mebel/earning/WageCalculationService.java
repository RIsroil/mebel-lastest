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
     * Agar bu birinchi assignment bo'lsa — full daily wage
     * Agar 2+ assignment bo'lsa — split wage (50% daily rate)
     */
    @Transactional
    public void createWageLogOnAssignment(UUID orderId, UUID workerId, UUID workshopId, UUID createdBy) {
        UserEntity worker = userRepo.findById(workerId)
                .orElseThrow(() -> new IllegalArgumentException("Worker not found"));

        // Worker uchun barcha active assignments'ni tekshirish
        List<FurnitureAssignmentEntity> activeAssignments = assignmentRepo
                .findByWorkerIdAndActiveTrueOrderByAssignedAtAsc(workerId);

        int assignmentIndex = 0;
        for (int i = 0; i < activeAssignments.size(); i++) {
            if (activeAssignments.get(i).getFurnitureOrderId().equals(orderId)) {
                assignmentIndex = i;
                break;
            }
        }

        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(today);
        int daysInMonth = currentMonth.lengthOfMonth();

        BigDecimal monthlySalary = worker.getMonthlySalary();
        if (monthlySalary == null || monthlySalary.compareTo(BigDecimal.ZERO) <= 0) {
            // Agar oylik salary bo'lmasa, kunlik'ni ishlatish
            monthlySalary = worker.getDailySalary() != null
                    ? worker.getDailySalary().multiply(BigDecimal.valueOf(daysInMonth))
                    : BigDecimal.ZERO;
        }

        BigDecimal dailyRate = monthlySalary.divide(
                BigDecimal.valueOf(daysInMonth),
                2,
                RoundingMode.HALF_UP
        );

        BigDecimal wageForLog;
        if (assignmentIndex == 0) {
            // Birinchi assignment — full daily rate
            wageForLog = dailyRate;
        } else {
            // 2+ assignment — split (50%)
            wageForLog = dailyRate.divide(BigDecimal.TWO, 2, RoundingMode.HALF_UP);
        }

        // Earning log yaratish
        EarningEntity earning = EarningEntity.builder()
                .workerId(workerId)
                .workshopId(workshopId)
                .earnDate(today)
                .earnType(assignmentIndex == 0 ? EarnType.DAILY_WAGE : EarnType.DAILY_WAGE)
                .baseAmount(wageForLog)
                .totalAmount(wageForLog)
                .monthlySalary(monthlySalary)
                .daysInMonth(daysInMonth)
                .periodStart(currentMonth.atDay(1))
                .furnitureOrderId(orderId)
                .build();
        earning.setCreatedBy(createdBy);
        EarningEntity saved = earningRepo.save(earning);

        // Financial log'ga yozish
        String logDesc = assignmentIndex == 0
                ? "Oylik maosh (1-buyurtma): " + monthlySalary + " / " + daysInMonth + " = " + wageForLog
                : "Oylik maosh (2+-buyurtma, 50% split): " + wageForLog;

        String workerName = worker.getFullName() != null ? worker.getFullName() : worker.getUsername();
        financialLogService.record(
                workshopId,
                FinancialLogType.WAGE_PAID,
                wageForLog.negate(),
                logDesc,
                workerId,
                workerName,
                today,
                createdBy
        );
    }

    /**
     * Har kun: assignment'larni tekshirish va wage'larni update qilish
     * Oldingi kunning log'ini reverse qilish, yangi kunning log'ini qo'shish
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

        BigDecimal monthlySalary = worker.getMonthlySalary();
        if (monthlySalary == null || monthlySalary.compareTo(BigDecimal.ZERO) <= 0) {
            monthlySalary = worker.getDailySalary() != null
                    ? worker.getDailySalary().multiply(BigDecimal.valueOf(daysInMonth))
                    : BigDecimal.ZERO;
        }

        BigDecimal dailyRate = monthlySalary.divide(
                BigDecimal.valueOf(daysInMonth),
                2,
                RoundingMode.HALF_UP
        );

        // Har assignment uchun log'ni update qilish
        for (int assignmentIndex = 0; assignmentIndex < activeAssignments.size(); assignmentIndex++) {
            FurnitureAssignmentEntity assignment = activeAssignments.get(assignmentIndex);
            UUID orderId = assignment.getFurnitureOrderId();

            // Oldingi kunning log'ini topish va reverse qilish
            earningRepo
                    .findByWorkerIdAndFurnitureOrderIdAndEarnDate(
                            workerId,
                            orderId,
                            today.minusDays(1)
                    )
                    .ifPresent(previousLog -> {
                        if (!previousLog.isPaid()) {
                            // Oldingi log'ini soft-delete qilish
                            previousLog.setDeletedAt(LocalDateTime.now());
                            previousLog.setDeletedBy(updatedBy);
                            earningRepo.save(previousLog);

                            // Reverse entry
                            String workerName = worker.getFullName() != null ? worker.getFullName() : worker.getUsername();
                            financialLogService.record(
                                    workshopId,
                                    FinancialLogType.WAGE_PAID,
                                    previousLog.getTotalAmount(), // Positive (reverse)
                                    "Oldingi kunning log'i qaytarildi",
                                    workerId,
                                    workerName,
                                    today.minusDays(1),
                                    updatedBy
                            );
                        }
                    });

            // Bugungi log'ni yaratish
            BigDecimal wageForLog = assignmentIndex == 0
                    ? dailyRate
                    : dailyRate.divide(BigDecimal.TWO, 2, RoundingMode.HALF_UP);

            EarningEntity earning = EarningEntity.builder()
                    .workerId(workerId)
                    .workshopId(workshopId)
                    .earnDate(today)
                    .earnType(EarnType.DAILY_WAGE)
                    .baseAmount(wageForLog)
                    .totalAmount(wageForLog)
                    .monthlySalary(monthlySalary)
                    .daysInMonth(daysInMonth)
                    .periodStart(currentMonth.atDay(1))
                    .furnitureOrderId(orderId)
                    .build();
            earning.setCreatedBy(updatedBy);
            earningRepo.save(earning);

            // Financial log
            String logDesc = assignmentIndex == 0
                    ? "Bugun: Oylik maosh (1-buyurtma): " + wageForLog
                    : "Bugun: Oylik maosh (2+-buyurtma, 50%): " + wageForLog;

            String workerName = worker.getFullName() != null ? worker.getFullName() : worker.getUsername();
            financialLogService.record(
                    workshopId,
                    FinancialLogType.WAGE_PAID,
                    wageForLog.negate(),
                    logDesc,
                    workerId,
                    workerName,
                    today,
                    updatedBy
            );
        }
    }
}
