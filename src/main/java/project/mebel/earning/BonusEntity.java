package project.mebel.earning;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import project.mebel.common.entity.SoftDeleteEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "bonuses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BonusEntity extends SoftDeleteEntity {

    @Column(name = "worker_id", nullable = false)
    private UUID workerId;

    @Column(name = "workshop_id", nullable = false)
    private UUID workshopId;

    @Column(name = "earning_id")
    private UUID earningId;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "reason", nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "bonus_date", nullable = false)
    private LocalDate bonusDate;
}
