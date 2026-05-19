package project.mebel.earning;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import project.mebel.common.entity.SoftDeleteEntity;
import project.mebel.common.enums.EarnType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "earnings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class EarningEntity extends SoftDeleteEntity {

    @Column(name = "worker_id", nullable = false)
    private UUID workerId;

    @Column(name = "workshop_id", nullable = false)
    private UUID workshopId;

    @Column(name = "earn_date", nullable = false)
    private LocalDate earnDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "earn_type", nullable = false)
    private EarnType earnType;

    @Column(name = "attendance_id")
    private UUID attendanceId;

    @Column(name = "hours_worked", precision = 4, scale = 2)
    private BigDecimal hoursWorked;

    @Column(name = "hours_target", precision = 4, scale = 2)
    private BigDecimal hoursTarget;

    @Column(name = "hourly_rate", precision = 12, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "days_worked", precision = 4, scale = 2)
    private BigDecimal daysWorked;

    @Column(name = "daily_rate", precision = 12, scale = 2)
    private BigDecimal dailyRate;

    @Column(name = "furniture_order_id")
    private UUID furnitureOrderId;

    @Column(name = "commission_pct", precision = 5, scale = 2)
    private BigDecimal commissionPct;

    @Column(name = "commission_amount", precision = 12, scale = 2)
    private BigDecimal commissionAmount;

    @Column(name = "base_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal baseAmount;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "monthly_salary", precision = 14, scale = 2)
    private BigDecimal monthlySalary;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "days_in_month")
    private Integer daysInMonth;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_paid", nullable = false)
    @Builder.Default
    private boolean paid = false;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "paid_by")
    private UUID paidBy;
}
