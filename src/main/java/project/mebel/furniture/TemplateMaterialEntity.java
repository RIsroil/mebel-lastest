package project.mebel.furniture;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import project.mebel.common.entity.MutableAuditEntity;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "template_materials")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class TemplateMaterialEntity extends MutableAuditEntity {

    @Column(name = "template_id", nullable = false)
    private UUID templateId;

    @Column(name = "warehouse_item_id", nullable = false)
    private UUID warehouseItemId;

    @Column(name = "quantity_needed", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityNeeded;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
