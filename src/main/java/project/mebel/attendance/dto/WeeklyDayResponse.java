package project.mebel.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyDayResponse {

    private LocalDate date;
    private String dayLabel;

    // Attendance data (null if no entry for this day)
    private UUID attendanceId;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private BigDecimal hoursWorked;
    private boolean hoursLocked;
    private boolean manualEntry;
    private String notes;

    // Worker pay settings (always present)
    private BigDecimal hoursTarget;
    private BigDecimal dailySalary;

    // Calculated from attendance data
    private BigDecimal dailyPayAmount;
    private BigDecimal bonusHours;

    // Whether this worker can still edit this day (past/today = true; future = false)
    private boolean editable;
}
