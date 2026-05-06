package project.mebel.financiallog;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.common.enums.FinancialLogType;
import project.mebel.common.enums.UserRole;
import project.mebel.exception.ApiException;
import project.mebel.financiallog.dto.FinancialLogResponse;
import project.mebel.financiallog.dto.FinancialLogSummaryResponse;
import project.mebel.user.UserEntity;
import project.mebel.utils.Utils;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FinancialLogServiceImpl implements FinancialLogService {

    private final FinancialLogRepository repo;
    private final Utils utils;

    @Override
    @Transactional
    public void record(UUID workshopId, FinancialLogType type, BigDecimal amount,
                       String description, UUID referenceId, LocalDate logDate, UUID actorId) {
        FinancialLogEntity log = FinancialLogEntity.builder()
                .workshopId(workshopId)
                .logType(type)
                .amount(amount)
                .description(description)
                .referenceId(referenceId)
                .logDate(logDate)
                .build();
        log.setCreatedBy(actorId);
        repo.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FinancialLogResponse> getLogs(LocalDate from, LocalDate to, FinancialLogType type,
                                              Pageable pageable, Principal principal) {
        UserEntity owner = requireOwner(principal);
        UUID workshopId = owner.getWorkshopId();

        Specification<FinancialLogEntity> spec =
                (root, query, cb) -> cb.equal(root.get("workshopId"), workshopId);

        if (from != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("logDate"), from));
        }
        if (to != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("logDate"), to));
        }
        if (type != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("logType"), type));
        }

        return repo.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialLogSummaryResponse getLastMonthSummary(Principal principal) {
        UserEntity owner = requireOwner(principal);
        LocalDate now = LocalDate.now();
        LocalDate from = now.minusMonths(1).withDayOfMonth(1);
        LocalDate to = from.withDayOfMonth(from.lengthOfMonth());
        return buildSummary(owner.getWorkshopId(), from, to);
    }

    @Override
    @Transactional(readOnly = true)
    public FinancialLogSummaryResponse getPeriodSummary(LocalDate from, LocalDate to, Principal principal) {
        UserEntity owner = requireOwner(principal);
        return buildSummary(owner.getWorkshopId(), from, to);
    }

    private FinancialLogSummaryResponse buildSummary(UUID workshopId, LocalDate from, LocalDate to) {
        BigDecimal income = repo.sumIncomeByWorkshopAndDateRange(workshopId, from, to);
        BigDecimal expense = repo.sumExpenseByWorkshopAndDateRange(workshopId, from, to).abs();
        int count = repo.findAllByWorkshopIdAndLogDateBetweenOrderByLogDateDescCreatedAtDesc(workshopId, from, to).size();

        return FinancialLogSummaryResponse.builder()
                .period(from.getYear() + "-" + String.format("%02d", from.getMonthValue()))
                .totalIncome(income)
                .totalExpense(expense)
                .netAmount(income.subtract(expense))
                .count(count)
                .build();
    }

    private UserEntity requireOwner(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        if (user.getRole() != UserRole.OWNER) throw ApiException.forbidden("access.denied");
        if (user.getWorkshopId() == null) throw ApiException.badRequest("owner.has.no.workshop");
        return user;
    }

    private FinancialLogResponse toResponse(FinancialLogEntity e) {
        return FinancialLogResponse.builder()
                .id(e.getId())
                .workshopId(e.getWorkshopId())
                .logType(e.getLogType())
                .amount(e.getAmount())
                .description(e.getDescription())
                .referenceId(e.getReferenceId())
                .logDate(e.getLogDate())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
