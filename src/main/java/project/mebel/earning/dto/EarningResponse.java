package project.mebel.earning.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mebel.common.enums.EarnType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EarningResponse {
    private UUID id;
    private UUID workerId;
    private String workerName;
    private LocalDate earnDate;
    private EarnType earnType;
    private BigDecimal hoursWorked;
    private BigDecimal hoursTarget;
    private BigDecimal dailyRate;
    private BigDecimal hourlyRate;
    private BigDecimal daysWorked;
    private BigDecimal baseAmount;
    private BigDecimal totalAmount;
    private boolean paid;
    private LocalDateTime paidAt;
    private UUID attendanceId;
    private UUID furnitureOrderId;
    private BigDecimal commissionAmount;
}
