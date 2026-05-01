package project.mebel.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AttendanceResponse {
    private UUID id;
    private UUID userId;
    private String workerName;
    private LocalDate workDate;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private BigDecimal hoursWorked;
    private boolean hoursSelfReported;
    private boolean hoursLocked;
    private BigDecimal ownerOverrideHours;
    private LocalDateTime hoursDeadline;
    private String notes;
}
