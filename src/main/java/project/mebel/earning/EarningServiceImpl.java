package project.mebel.earning;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.common.enums.EarnType;
import project.mebel.common.enums.FinancialLogType;
import project.mebel.common.enums.UserRole;
import project.mebel.audit.AuditLogService;
import project.mebel.earning.dto.BonusRequest;
import project.mebel.earning.dto.EarningResponse;
import project.mebel.earning.dto.EnhancedPaymentRequest;
import project.mebel.earning.dto.SkipPaymentRequest;
import project.mebel.exception.ApiException;
import project.mebel.attendance.DailyAttendanceRepository;
import project.mebel.financiallog.FinancialLogService;
import project.mebel.user.UserEntity;
import project.mebel.user.UserRepository;
import project.mebel.utils.Utils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EarningServiceImpl implements EarningService {

    private final EarningRepository earningRepo;
    private final BonusRepository bonusRepo;
    private final UserRepository userRepo;
    private final DailyAttendanceRepository attendanceRepo;
    private final FinancialLogService financialLogService;
    private final AuditLogService auditLogService;
    private final Utils utils;

    @Override
    @Transactional(readOnly = true)
    public List<EarningResponse> getMyEarnings(LocalDate from, LocalDate to, Principal principal) {
        UserEntity worker = requireWorker(principal);
        return buildEarningsList(worker.getId(), from, to, displayName(worker));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EarningResponse> getWorkerEarnings(UUID workerId, LocalDate from, LocalDate to, Principal principal) {
        UserEntity owner = requireOwner(principal);
        UserEntity worker = userRepo.findById(workerId)
                .filter(u -> owner.getWorkshopId().equals(u.getWorkshopId()))
                .orElseThrow(() -> ApiException.notFound("worker.not.found"));

        return buildEarningsList(workerId, from, to, displayName(worker));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EarningResponse> getWorkshopEarnings(LocalDate from, LocalDate to, Principal principal) {
        UserEntity owner = requireOwner(principal);
        List<EarningEntity> allEarnings = earningRepo.findAllByWorkshopIdAndEarnDateBetween(owner.getWorkshopId(), from, to);
        List<EarningResponse> result = new ArrayList<>();

        // Group by worker and earn type, excluding DAILY_WAGE and MONTHLY_WAGE as they're aggregated
        Map<String, List<EarningEntity>> grouped = allEarnings.stream()
                .filter(e -> e.getEarnType() != EarnType.DAILY_WAGE && e.getEarnType() != EarnType.MONTHLY_WAGE)
                .collect(Collectors.groupingBy(e -> e.getWorkerId().toString() + "-" + e.getEarnType()));

        for (List<EarningEntity> group : grouped.values()) {
            for (EarningEntity earning : group) {
                String name = userRepo.findByIdIncludeDeleted(earning.getWorkerId())
                        .map(this::displayName)
                        .orElse("—");
                result.add(toResponse(earning, name));
            }
        }

        // Add aggregated daily/monthly wages by period
        Map<String, List<EarningEntity>> dailyByWorker = allEarnings.stream()
                .filter(e -> e.getEarnType() == EarnType.DAILY_WAGE || e.getEarnType() == EarnType.MONTHLY_WAGE)
                .collect(Collectors.groupingBy(e -> e.getWorkerId().toString()));

        for (Map.Entry<String, List<EarningEntity>> entry : dailyByWorker.entrySet()) {
            UUID workerId = UUID.fromString(entry.getKey());
            String workerName = userRepo.findByIdIncludeDeleted(workerId)
                    .map(this::displayName)
                    .orElse("—");
            addAggregatedDailyWages(entry.getValue(), workerName, result);
        }

        return result;
    }

    private List<EarningResponse> buildEarningsList(UUID workerId, LocalDate from, LocalDate to, String workerName) {
        List<EarningEntity> allEarnings = earningRepo.findAllByWorkerIdAndEarnDateBetween(workerId, from, to);
        List<EarningResponse> result = new ArrayList<>();

        // Add non-wage earnings (bonus, commission, etc.) - exclude DAILY_WAGE and MONTHLY_WAGE as they're aggregated
        allEarnings.stream()
                .filter(e -> e.getEarnType() != EarnType.DAILY_WAGE && e.getEarnType() != EarnType.MONTHLY_WAGE)
                .forEach(e -> result.add(toResponse(e, workerName)));

        // Aggregate and add daily/monthly wages by period
        addAggregatedDailyWages(
                allEarnings.stream()
                        .filter(e -> e.getEarnType() == EarnType.DAILY_WAGE || e.getEarnType() == EarnType.MONTHLY_WAGE)
                        .collect(Collectors.toList()),
                workerName,
                result
        );

        // Sort by date descending
        result.sort((a, b) -> b.getEarnDate().compareTo(a.getEarnDate()));
        return result;
    }

    private void addAggregatedDailyWages(List<EarningEntity> dailyWages, String workerName, List<EarningResponse> result) {
        if (dailyWages.isEmpty()) return;

        // Group by month (periodStart)
        Map<LocalDate, List<EarningEntity>> byMonth = dailyWages.stream()
                .collect(Collectors.groupingBy(e -> e.getPeriodStart() != null ? e.getPeriodStart() : e.getEarnDate().withDayOfMonth(1)));

        for (Map.Entry<LocalDate, List<EarningEntity>> entry : byMonth.entrySet()) {
            List<EarningEntity> monthWages = entry.getValue();
            if (monthWages.isEmpty()) continue;

            EarningEntity sample = monthWages.get(0);
            BigDecimal monthlySalary = sample.getMonthlySalary();
            Integer daysInMonth = sample.getDaysInMonth();
            BigDecimal dailyRate = sample.getDailyRate();

            // Get worker's actual pay type (including deleted workers)
            String workerPayType = userRepo.findByIdIncludeDeleted(sample.getWorkerId())
                    .map(u -> u.getPayType() != null ? u.getPayType().name() : "DAILY")
                    .orElse("DAILY");

            // Split into paid and unpaid
            List<EarningEntity> paidWages = monthWages.stream().filter(EarningEntity::isPaid).toList();
            List<EarningEntity> unpaidWages = monthWages.stream().filter(e -> !e.isPaid()).toList();

            int totalDays = monthWages.size();
            int paidDays = paidWages.size();
            int unpaidDays = unpaidWages.size();

            // Calculate daily rate for monthly workers
            if ("MONTHLY".equals(workerPayType) && monthlySalary != null && daysInMonth != null && daysInMonth > 0) {
                dailyRate = monthlySalary.divide(BigDecimal.valueOf(daysInMonth), 2, RoundingMode.HALF_UP);
            }

            // Calculate total hours worked across all days
            BigDecimal totalHoursWorked = monthWages.stream()
                    .map(EarningEntity::getHoursWorked)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // If no hours in earnings, try to get from attendance
            if (totalHoursWorked.compareTo(BigDecimal.ZERO) == 0) {
                UUID workerId = sample.getWorkerId();
                LocalDate periodStart = entry.getKey();
                LocalDate periodEnd = periodStart.plusMonths(1).minusDays(1);
                List<project.mebel.attendance.DailyAttendanceEntity> attendances =
                    attendanceRepo.findAllByUserIdAndWorkDateBetween(workerId, periodStart, periodEnd);
                totalHoursWorked = attendances.stream()
                        .map(project.mebel.attendance.DailyAttendanceEntity::getHoursWorked)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }

            // Add PAID aggregate if any paid days exist
            if (!paidWages.isEmpty()) {
                BigDecimal paidAmount;
                if ("MONTHLY".equals(workerPayType) && monthlySalary != null && daysInMonth != null && daysInMonth > 0) {
                    paidAmount = dailyRate.multiply(BigDecimal.valueOf(paidDays)).setScale(2, RoundingMode.HALF_UP);
                } else {
                    paidAmount = paidWages.stream()
                            .map(EarningEntity::getTotalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                }

                // Find latest paid date
                LocalDateTime latestPaidAt = paidWages.stream()
                        .map(EarningEntity::getPaidAt)
                        .filter(Objects::nonNull)
                        .max(LocalDateTime::compareTo)
                        .orElse(null);

                EarningResponse paidAgg = EarningResponse.builder()
                        .id(paidWages.get(0).getId())
                        .workerId(sample.getWorkerId())
                        .workerName(workerName)
                        .earnDate(entry.getKey())
                        .earnType(EarnType.MONTHLY_WAGE)
                        .baseAmount(paidAmount)
                        .totalAmount(paidAmount)
                        .daysWorked(BigDecimal.valueOf(paidDays))
                        .dailyRate(dailyRate)
                        .monthlySalary(monthlySalary)
                        .periodStart(entry.getKey())
                        .daysInMonth(daysInMonth)
                        .paid(true)
                        .paidAt(latestPaidAt)
                        .earningIds(List.of()) // Empty - already paid
                        .totalDays(totalDays)
                        .paidDays(paidDays)
                        .unpaidDays(unpaidDays)
                        .workerPayType(workerPayType)
                        .totalHoursWorked(totalHoursWorked.compareTo(BigDecimal.ZERO) > 0 ? totalHoursWorked : null)
                        .build();
                result.add(paidAgg);
            }

            // Add UNPAID aggregate if any unpaid days exist
            if (!unpaidWages.isEmpty()) {
                BigDecimal unpaidAmount;
                if ("MONTHLY".equals(workerPayType) && monthlySalary != null && daysInMonth != null && daysInMonth > 0) {
                    unpaidAmount = dailyRate.multiply(BigDecimal.valueOf(unpaidDays)).setScale(2, RoundingMode.HALF_UP);
                } else {
                    unpaidAmount = unpaidWages.stream()
                            .map(EarningEntity::getTotalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                }

                List<UUID> unpaidEarningIds = unpaidWages.stream()
                        .map(EarningEntity::getId)
                        .collect(Collectors.toList());

                EarningResponse unpaidAgg = EarningResponse.builder()
                        .id(unpaidEarningIds.get(0))
                        .workerId(sample.getWorkerId())
                        .workerName(workerName)
                        .earnDate(entry.getKey())
                        .earnType(EarnType.MONTHLY_WAGE)
                        .baseAmount(unpaidAmount)
                        .totalAmount(unpaidAmount)
                        .daysWorked(BigDecimal.valueOf(unpaidDays))
                        .dailyRate(dailyRate)
                        .monthlySalary(monthlySalary)
                        .periodStart(entry.getKey())
                        .daysInMonth(daysInMonth)
                        .paid(false)
                        .paidAt(null)
                        .earningIds(unpaidEarningIds)
                        .totalDays(totalDays)
                        .paidDays(paidDays)
                        .unpaidDays(unpaidDays)
                        .workerPayType(workerPayType)
                        .totalHoursWorked(totalHoursWorked.compareTo(BigDecimal.ZERO) > 0 ? totalHoursWorked : null)
                        .build();
                result.add(unpaidAgg);
            }
        }
    }

    @Override
    @Transactional
    public EarningResponse payEarning(UUID earningId, Principal principal) {
        UserEntity owner = requireOwner(principal);

        EarningEntity earning = earningRepo.findById(earningId)
                .filter(e -> e.getWorkshopId().equals(owner.getWorkshopId()))
                .orElseThrow(() -> ApiException.notFound("earning.not.found"));

        if (earning.isPaid()) throw ApiException.badRequest("earning.already.paid");

        earning.setPaid(true);
        earning.setPaidAt(LocalDateTime.now());
        earning.setPaidBy(owner.getId());
        earning.setUpdatedBy(owner.getId());

        String workerName = userRepo.findByIdIncludeDeleted(earning.getWorkerId())
                .map(this::displayName)
                .orElse("—");
        EarningEntity saved = earningRepo.save(earning);

        FinancialLogType logType = switch (saved.getEarnType()) {
            case COMMISSION -> FinancialLogType.COMMISSION_PAID;
            case EXTRA      -> FinancialLogType.EXTRA_PAID;
            default         -> FinancialLogType.WAGE_PAID;
        };
        String desc = switch (saved.getEarnType()) {
            case COMMISSION -> "Komissiya to'landi: " + workerName;
            case EXTRA      -> "Qo'shimcha to'landi: " + workerName;
            default         -> "Maosh to'landi: " + workerName;
        };
        financialLogService.record(owner.getWorkshopId(), logType,
                saved.getTotalAmount().negate(), desc, saved.getWorkerId(),
                workerName, LocalDate.now(), owner.getId());

        String ownerName = owner.getFullName() != null ? owner.getFullName() : owner.getUsername();
        auditLogService.logEarningPaid(
                saved.getId(), saved.getWorkerId(), workerName,
                owner.getId(), ownerName, owner.getWorkshopId(),
                saved.getTotalAmount().toPlainString());

        return toResponse(saved, workerName);
    }

    @Override
    @Transactional
    public List<EarningResponse> payEarnings(List<UUID> earningIds, Principal principal) {
        UserEntity owner = requireOwner(principal);
        List<EarningResponse> results = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (UUID earningId : earningIds) {
            EarningEntity earning = earningRepo.findById(earningId)
                    .filter(e -> e.getWorkshopId().equals(owner.getWorkshopId()))
                    .orElse(null);

            if (earning == null || earning.isPaid()) continue;

            earning.setPaid(true);
            earning.setPaidAt(now);
            earning.setPaidBy(owner.getId());
            earning.setUpdatedBy(owner.getId());

            String workerName = userRepo.findByIdIncludeDeleted(earning.getWorkerId())
                    .map(this::displayName)
                    .orElse("—");
            EarningEntity saved = earningRepo.save(earning);
            results.add(toResponse(saved, workerName));
        }

        // Single financial log for batch payment
        if (!results.isEmpty()) {
            BigDecimal totalPaid = results.stream()
                    .map(EarningResponse::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String desc = "Oylik maosh to'landi: " + results.size() + " kun, jami: " + totalPaid;
            financialLogService.record(owner.getWorkshopId(), FinancialLogType.WAGE_PAID,
                    totalPaid.negate(), desc, results.get(0).getWorkerId(),
                    results.get(0).getWorkerName(), LocalDate.now(), owner.getId());
        }

        return results;
    }

    @Override
    @Transactional
    public List<EarningResponse> payPartial(List<UUID> earningIds, int daysToPay, Principal principal) {
        UserEntity owner = requireOwner(principal);
        List<EarningResponse> results = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // Get all earnings, filter by workshop and unpaid, sort by date (oldest first)
        List<EarningEntity> earnings = earningRepo.findAllById(earningIds).stream()
                .filter(e -> e.getWorkshopId().equals(owner.getWorkshopId()))
                .filter(e -> !e.isPaid())
                .sorted(Comparator.comparing(EarningEntity::getEarnDate))
                .collect(Collectors.toList());

        // Pay only the requested number of days
        int paidCount = 0;
        BigDecimal totalPaid = BigDecimal.ZERO;
        String workerName = null;
        UUID workerId = null;

        for (EarningEntity earning : earnings) {
            if (paidCount >= daysToPay) break;

            earning.setPaid(true);
            earning.setPaidAt(now);
            earning.setPaidBy(owner.getId());
            earning.setUpdatedBy(owner.getId());

            if (workerName == null) {
                workerName = userRepo.findByIdIncludeDeleted(earning.getWorkerId())
                        .map(this::displayName)
                        .orElse("—");
                workerId = earning.getWorkerId();
            }

            EarningEntity saved = earningRepo.save(earning);
            results.add(toResponse(saved, workerName));
            totalPaid = totalPaid.add(saved.getTotalAmount());
            paidCount++;
        }

        // Financial log for partial payment
        if (!results.isEmpty() && workerName != null) {
            String desc = "Qisman maosh to'landi: " + paidCount + " kun, jami: " + totalPaid + " | " + workerName;
            financialLogService.record(owner.getWorkshopId(), FinancialLogType.WAGE_PAID,
                    totalPaid.negate(), desc, workerId,
                    workerName, LocalDate.now(), owner.getId());

            String ownerName = owner.getFullName() != null ? owner.getFullName() : owner.getUsername();
            auditLogService.logEarningPaid(
                    results.get(0).getId(), workerId, workerName,
                    owner.getId(), ownerName, owner.getWorkshopId(),
                    totalPaid.toPlainString() + " (" + paidCount + " kun)");
        }

        return results;
    }

    @Override
    @Transactional
    public List<EarningResponse> payEnhanced(EnhancedPaymentRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        List<EarningResponse> results = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        List<EarningEntity> earnings = earningRepo.findAllById(request.getEarningIds()).stream()
                .filter(e -> e.getWorkshopId().equals(owner.getWorkshopId()))
                .filter(e -> !e.isPaid())
                .sorted(Comparator.comparing(EarningEntity::getEarnDate))
                .collect(Collectors.toList());

        if (earnings.isEmpty()) {
            throw ApiException.badRequest("earning.not.found");
        }

        int daysToPay = request.getDaysToPay() != null ? request.getDaysToPay() : earnings.size();
        BigDecimal customAmount = request.getCustomAmount();
        String notes = request.getNotes();

        // Calculate default amount (sum of selected days)
        BigDecimal defaultAmount = earnings.stream()
                .limit(daysToPay)
                .map(EarningEntity::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Use custom amount if provided, otherwise use calculated
        BigDecimal finalAmount = customAmount != null ? customAmount : defaultAmount;
        boolean hasAdjustment = customAmount != null && customAmount.compareTo(defaultAmount) != 0;

        // If adjustment made, notes are required
        if (hasAdjustment && (notes == null || notes.isBlank())) {
            throw ApiException.badRequest("earning.adjustment.notes.required");
        }

        // Pay the selected days
        int paidCount = 0;
        String workerName = null;
        UUID workerId = null;

        for (EarningEntity earning : earnings) {
            if (paidCount >= daysToPay) break;

            earning.setPaid(true);
            earning.setPaidAt(now);
            earning.setPaidBy(owner.getId());
            earning.setUpdatedBy(owner.getId());

            if (workerName == null) {
                workerName = userRepo.findByIdIncludeDeleted(earning.getWorkerId())
                        .map(this::displayName)
                        .orElse("—");
                workerId = earning.getWorkerId();
            }

            EarningEntity saved = earningRepo.save(earning);
            results.add(toResponse(saved, workerName));
            paidCount++;
        }

        // Financial log
        if (!results.isEmpty() && workerName != null) {
            String desc = "Maosh to'landi: " + workerName + " | " + paidCount + " kun";
            if (hasAdjustment) {
                desc += " | O'zgartirilgan: " + finalAmount + " (asl: " + defaultAmount + ")";
                if (notes != null) desc += " | Izoh: " + notes;
            }

            financialLogService.record(owner.getWorkshopId(), FinancialLogType.WAGE_PAID,
                    finalAmount.negate(), desc, workerId, workerName, LocalDate.now(), owner.getId());

            String ownerName = owner.getFullName() != null ? owner.getFullName() : owner.getUsername();
            auditLogService.logEarningPaid(
                    results.get(0).getId(), workerId, workerName,
                    owner.getId(), ownerName, owner.getWorkshopId(),
                    finalAmount.toPlainString() + " (" + paidCount + " kun)" + (hasAdjustment ? " [o'zgartirilgan]" : ""));
        }

        return results;
    }

    @Override
    @Transactional
    public void skipPayment(SkipPaymentRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        LocalDateTime now = LocalDateTime.now();

        List<EarningEntity> earnings = earningRepo.findAllById(request.getEarningIds()).stream()
                .filter(e -> e.getWorkshopId().equals(owner.getWorkshopId()))
                .filter(e -> !e.isPaid())
                .collect(Collectors.toList());

        if (earnings.isEmpty()) {
            throw ApiException.badRequest("earning.not.found");
        }

        BigDecimal totalSkipped = BigDecimal.ZERO;
        String workerName = null;
        UUID workerId = null;
        int skippedCount = 0;

        for (EarningEntity earning : earnings) {
            // Soft-delete the earning
            earning.setDeletedAt(now);
            earning.setDeletedBy(owner.getId());
            earningRepo.save(earning);

            totalSkipped = totalSkipped.add(earning.getTotalAmount());
            skippedCount++;

            if (workerName == null) {
                workerName = userRepo.findByIdIncludeDeleted(earning.getWorkerId())
                        .map(this::displayName)
                        .orElse("—");
                workerId = earning.getWorkerId();
            }
        }

        // Financial log - record as cancelled/skipped (not as expense)
        String reason = request.getReason() != null ? request.getReason() : "Sabab ko'rsatilmagan";
        String desc = "Maosh bekor qilindi: " + workerName + " | " + skippedCount + " kun, "
                + totalSkipped + " so'm | Sabab: " + reason;

        financialLogService.record(owner.getWorkshopId(), FinancialLogType.WAGE_CANCELLED,
                BigDecimal.ZERO, desc, workerId, workerName, LocalDate.now(), owner.getId());

        // Audit log
        String ownerName = owner.getFullName() != null ? owner.getFullName() : owner.getUsername();
        auditLogService.logAction("EARNING_SKIPPED", owner.getId(), ownerName, owner.getWorkshopId(),
                "Maosh bekor qilindi: " + workerName + ", " + totalSkipped + " so'm, sabab: " + reason);

        // TODO: Send notification to worker
    }

    @Override
    @Transactional
    public EarningResponse addBonus(BonusRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);

        UserEntity worker = userRepo.findById(request.getWorkerId())
                .filter(u -> owner.getWorkshopId().equals(u.getWorkshopId()) && u.getRole() == UserRole.WORKER)
                .orElseThrow(() -> ApiException.notFound("worker.not.found"));

        LocalDate bonusDate = request.getBonusDate() != null ? request.getBonusDate() : LocalDate.now();

        BonusEntity bonus = BonusEntity.builder()
                .workerId(worker.getId())
                .workshopId(owner.getWorkshopId())
                .amount(request.getAmount())
                .reason(request.getReason())
                .bonusDate(bonusDate)
                .build();
        bonus.setCreatedBy(owner.getId());
        bonusRepo.save(bonus);

        EarningEntity earning = EarningEntity.builder()
                .workerId(worker.getId())
                .workshopId(owner.getWorkshopId())
                .earnDate(bonusDate)
                .earnType(EarnType.EXTRA)
                .baseAmount(request.getAmount())
                .totalAmount(request.getAmount())
                .description(request.getReason())
                .build();
        earning.setCreatedBy(owner.getId());
        EarningEntity saved = earningRepo.save(earning);

        // Link bonus to earning
        bonus.setEarningId(saved.getId());
        bonusRepo.save(bonus);

        return toResponse(saved, displayName(worker));
    }

    private String displayName(UserEntity user) {
        return user.getFullName() != null ? user.getFullName() : user.getUsername();
    }

    private UserEntity requireWorker(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        if (user.getRole() != UserRole.WORKER) throw ApiException.forbidden("access.denied");
        return user;
    }

    private UserEntity requireOwner(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        if (user.getRole() != UserRole.OWNER) throw ApiException.forbidden("access.denied");
        if (user.getWorkshopId() == null) throw ApiException.badRequest("owner.has.no.workshop");
        return user;
    }

    private EarningResponse toResponse(EarningEntity e, String workerName) {
        return EarningResponse.builder()
                .id(e.getId())
                .workerId(e.getWorkerId())
                .workerName(workerName)
                .earnDate(e.getEarnDate())
                .earnType(e.getEarnType())
                .hoursWorked(e.getHoursWorked())
                .hoursTarget(e.getHoursTarget())
                .dailyRate(e.getDailyRate())
                .hourlyRate(e.getHourlyRate())
                .daysWorked(e.getDaysWorked())
                .baseAmount(e.getBaseAmount())
                .totalAmount(e.getTotalAmount())
                .paid(e.isPaid())
                .paidAt(e.getPaidAt())
                .attendanceId(e.getAttendanceId())
                .furnitureOrderId(e.getFurnitureOrderId())
                .commissionAmount(e.getCommissionAmount())
                .monthlySalary(e.getMonthlySalary())
                .periodStart(e.getPeriodStart())
                .daysInMonth(e.getDaysInMonth())
                .build();
    }
}
