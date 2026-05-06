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

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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
        return earningRepo.findAllByWorkerIdAndEarnDateBetween(worker.getId(), from, to)
                .stream().map(e -> toResponse(e, worker.getFullName())).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EarningResponse> getWorkerEarnings(UUID workerId, LocalDate from, LocalDate to, Principal principal) {
        UserEntity owner = requireOwner(principal);
        UserEntity worker = userRepo.findById(workerId)
                .filter(u -> owner.getWorkshopId().equals(u.getWorkshopId()))
                .orElseThrow(() -> ApiException.notFound("worker.not.found"));

        return earningRepo.findAllByWorkerIdAndEarnDateBetween(workerId, from, to)
                .stream().map(e -> toResponse(e, worker.getFullName())).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EarningResponse> getWorkshopEarnings(LocalDate from, LocalDate to, Principal principal) {
        UserEntity owner = requireOwner(principal);
        return earningRepo.findAllByWorkshopIdAndEarnDateBetween(owner.getWorkshopId(), from, to)
                .stream().map(e -> {
                    String name = userRepo.findById(e.getWorkerId()).map(UserEntity::getFullName).orElse(null);
                    return toResponse(e, name);
                }).toList();
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

        String workerName = userRepo.findById(earning.getWorkerId()).map(UserEntity::getFullName).orElse(null);
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
                workerName, saved.getEarnDate(), owner.getId());

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

        return toResponse(saved, worker.getFullName());
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
                .build();
    }
}
