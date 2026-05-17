package project.mebel.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mebel.common.enums.PayType;
import project.mebel.common.enums.UserRole;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {
    private UUID id;
    private String username;
    private String fullName;
    private String phone;
    private UserRole role;
    private boolean active;
    private boolean blocked;
    private LocalDateTime blockedUntil;
    private String blockReason;
    private UUID workshopId;
    private String workshopName;
    private PayType payType;
    private BigDecimal hourlyRate;
    private BigDecimal dailyRate;
    private BigDecimal dailyHoursTarget;
    private BigDecimal dailySalary;
    private BigDecimal monthlySalary;
    private BigDecimal commissionPct;
    private boolean hybridPay;
    private LocalDateTime createdAt;
}
