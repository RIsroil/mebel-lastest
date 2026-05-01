package project.mebel.auth.dto;

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
public class UserResponse {
    private UUID id;
    private String username;
    private String fullName;
    private String phone;
    private UserRole role;
    private boolean active;
    private boolean blocked;
    private UUID workshopId;
    private PayType payType;
    private BigDecimal hourlyRate;
    private BigDecimal dailyRate;
    private BigDecimal dailyHoursTarget;
    private BigDecimal commissionPct;
}
