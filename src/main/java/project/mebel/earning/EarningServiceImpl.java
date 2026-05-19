package project.mebel.earning;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.common.enums.EarnType;
import project.mebel.common.enums.FinancialLogType;
import project.mebel.common.enums.UserRole;
import project.mebel.earning.dto.BonusRequest;
import project.mebel.earning.dto.EarningResponse;
import project.mebel.exception.ApiException;
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
    private final FinancialLogService financialLogService;
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

        // Group by worker and earn type, excluding DAILY_WAGE as it's aggregated
        Map<String, List<EarningEntity>> grouped = allEarnings.stream()
                .filter(e -> e.getEarnType() != EarnType.DAILY_WAGE)
                .collect(Collectors.groupingBy(e -> e.getWorkerId().toString() + "-" + e.getEarnType()));

        for (List<EarningEntity> group : grouped.values()) {
            for (EarningEntity earning : group) {
                String name = userRepo.findById(earning.getWorkerId())
                        .map(this::displayName)
                        .orElse("—");
                result.add(toResponse(earning, name));
            }
        }

        // Add aggregated daily wages by period
        Map<String, List<EarningEntity>> dailyByWorker = allEarnings.stream()
                .filter(e -> e.getEarnType() == EarnType.DAILY_WAGE)
                .collect(Collectors.groupingBy(e -> e.getWorkerId().toString()));

        for (Map.Entry<String, List<EarningEntity>> entry : dailyByWorker.entrySet()) {
            UUID workerId = UUID.fromString(entry.getKey());
            String workerName = userRepo.findById(workerId)
                    .map(this::displayName)
                    .orElse("—");
            addAggregatedDailyWages(entry.getValue(), workerName, result);
        }

        return result;
    }

    private List<EarningResponse> buildEarningsList(UUID workerId, LocalDate from, LocalDate to, String workerName) {
        List<EarningEntity> allEarnings = earningRepo.findAllByWorkerIdAndEarnDateBetween(workerId, from, to);
        List<EarningResponse> result = new ArrayList<>();

        // Add non-daily earnings (bonus, commission, etc.)
        allEarnings.stream()
                .filter(e -> e.getEarnType() != EarnType.DAILY_WAGE)
                .forEach(e -> result.add(toResponse(e, workerName)));

        // Aggregate and add daily wages by period
        addAggregatedDailyWages(
                allEarnings.stream()
                        .filter(e -> e.getEarnType() == EarnType.DAILY_WAGE)
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

            // Calculate aggregate
            BigDecimal totalWage = monthWages.stream()
                    .map(EarningEntity::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            int daysWorked = monthWages.size();
            EarningEntity sample = monthWages.get(0);
            BigDecimal monthlySalary = sample.getMonthlySalary();
            Integer daysInMonth = sample.getDaysInMonth();

            // Create aggregated response
            EarningResponse agg = EarningResponse.builder()
                    .id(UUID.randomUUID())
                    .workerId(sample.getWorkerId())
                    .workerName(workerName)
                    .earnDate(entry.getKey())
                    .earnType(EarnType.MONTHLY_WAGE)
                    .baseAmount(totalWage)
                    .totalAmount(totalWage)
                    .daysWorked(BigDecimal.valueOf(daysWorked))
                    .dailyRate(daysInMonth != null && daysInMonth > 0 && monthlySalary != null
                            ? monthlySalary.divide(BigDecimal.valueOf(daysInMonth), 2, RoundingMode.HALF_UP)
                            : null)
                    .monthlySalary(monthlySalary)
                    .periodStart(entry.getKey())
                    .daysInMonth(daysInMonth)
                    .paid(monthWages.stream().allMatch(EarningEntity::isPaid))
                    .paidAt(monthWages.stream().map(EarningEntity::getPaidAt).filter(Objects::nonNull).findFirst().orElse(null))
                    .build();
            result.add(agg);
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

        String workerName = userRepo.findById(earning.getWorkerId())
                .map(this::displayName)
                .orElse("—");
        EarningEntity saved = earningRepo.save(earning);

        FinancialLogType logType = switch (saved.getEarnType()) {
            case COMMISSION -> FinancialLogType.COMMISSION_PAID;
            case BONUS      -> FinancialLogType.BONUS_PAID;
            default         -> FinancialLogType.WAGE_PAID;
        };
        String desc = switch (saved.getEarnType()) {
            case COMMISSION -> "Komissiya to'landi: " + workerName;
            case BONUS      -> "Bonus to'landi: " + workerName;
            default         -> "Maosh to'landi: " + workerName;
        };
        financialLogService.record(owner.getWorkshopId(), logType,
                saved.getTotalAmount().negate(), desc, saved.getWorkerId(),
                workerName, LocalDate.now(), owner.getId());

        return toResponse(saved, workerName);
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
                .earnType(EarnType.BONUS)
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
