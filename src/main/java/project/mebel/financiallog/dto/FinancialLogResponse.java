package project.mebel.financiallog.dto;

import lombok.Builder;
import lombok.Data;
import project.mebel.common.enums.FinancialLogType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class FinancialLogResponse {
    private UUID id;
    private UUID workshopId;
    private FinancialLogType logType;
    private BigDecimal amount;        // musbat=kirim, manfiy=chiqim
    private String description;
    private UUID referenceId;
    private LocalDate logDate;
    private LocalDateTime createdAt;
}
