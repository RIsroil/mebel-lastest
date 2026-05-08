package project.mebel.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mebel.common.enums.AttendanceMode;
import project.mebel.common.enums.PayType;
import project.mebel.common.enums.UserRole;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String username;
    private String fullName;
    private UserRole role;
    private UUID workshopId;
    private String workshopName;
    private AttendanceMode workshopAttendanceMode;
    private PayType payType;
    private BigDecimal dailyHoursTarget;
    private BigDecimal dailySalary;
}
