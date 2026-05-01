package project.mebel.attendance;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import project.mebel.common.entity.MutableAuditEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "daily_attendance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DailyAttendanceEntity extends MutableAuditEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "workshop_id", nullable = false)
    private UUID workshopId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "check_in_time", nullable = false)
    private LocalDateTime checkInTime;

    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;

    @Column(name = "hours_worked", precision = 4, scale = 2)
    private BigDecimal hoursWorked;

    @Column(name = "hours_self_reported", nullable = false)
    @Builder.Default
    private boolean hoursSelfReported = false;

    @Column(name = "hours_submitted_at")
    private LocalDateTime hoursSubmittedAt;

    @Column(name = "hours_deadline", nullable = false)
    private LocalDateTime hoursDeadline;

    @Column(name = "hours_locked", nullable = false)
    @Builder.Default
    private boolean hoursLocked = false;

    @Column(name = "hours_locked_at")
    private LocalDateTime hoursLockedAt;

    @Column(name = "owner_override_hours", precision = 4, scale = 2)
    private BigDecimal ownerOverrideHours;

    @Column(name = "owner_override_by")
    private UUID ownerOverrideBy;

    @Column(name = "owner_override_at")
    private LocalDateTime ownerOverrideAt;

    @Column(name = "warning_shown", nullable = false)
    @Builder.Default
    private boolean warningShown = false;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
