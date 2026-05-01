package project.mebel.user;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import project.mebel.auth.dto.UserResponse;
import project.mebel.common.enums.UserRole;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
public class UserProfileResponse {
    private UUID id;
    private String username;
    private String fullName;
    private String phone;
    private UserRole role;
    private UUID workshopId;
    private BigDecimal dailyHoursTarget;
    private BigDecimal dailySalary;
}
