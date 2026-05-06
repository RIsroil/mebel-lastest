package project.mebel.financiallog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import project.mebel.common.enums.FinancialLogType;
import project.mebel.financiallog.dto.FinancialLogResponse;
import project.mebel.financiallog.dto.FinancialLogSummaryResponse;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.util.UUID;

public interface FinancialLogService {

    void record(UUID workshopId, FinancialLogType type, BigDecimal amount,
                String description, UUID referenceId, LocalDate logDate, UUID actorId);

    Page<FinancialLogResponse> getLogs(LocalDate from, LocalDate to, FinancialLogType type,
                                       Pageable pageable, Principal principal);

    FinancialLogSummaryResponse getLastMonthSummary(Principal principal);

    FinancialLogSummaryResponse getPeriodSummary(LocalDate from, LocalDate to, Principal principal);
}
