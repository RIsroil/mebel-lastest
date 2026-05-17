package project.mebel.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mebel.common.enums.PayType;
import project.mebel.common.enums.UserRole;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserUpdateRequest {
    private String fullName;
    private String phone;
    private UserRole role;
    private UUID workshopId;
    private Boolean active;
    private PayType payType;
    private BigDecimal hourlyRate;
    private BigDecimal dailyRate;
    private BigDecimal dailyHoursTarget;
    private BigDecimal dailySalary;
    private BigDecimal monthlySalary;
    private BigDecimal commissionPct;
    private Boolean hybridPay;
    private String newPassword;
}
