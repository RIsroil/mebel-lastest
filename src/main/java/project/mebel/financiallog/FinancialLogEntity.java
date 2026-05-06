package project.mebel.financiallog;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import project.mebel.common.entity.CreatedAuditEntity;
import project.mebel.common.enums.FinancialLogType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "financial_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class FinancialLogEntity extends CreatedAuditEntity {

    @Column(name = "workshop_id", nullable = false)
    private UUID workshopId;

    @Enumerated(EnumType.STRING)
    @Column(name = "log_type", nullable = false, length = 30)
    private FinancialLogType logType;

    // Musbat = kirim, manfiy = chiqim
    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "related_name", columnDefinition = "TEXT")
    private String relatedName;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;
}
