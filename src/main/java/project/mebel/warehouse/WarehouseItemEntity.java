package project.mebel.warehouse;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import project.mebel.common.entity.SoftDeleteEntity;
import project.mebel.common.enums.UnitType;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "warehouse_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class WarehouseItemEntity extends SoftDeleteEntity {

    @Column(name = "workshop_id", nullable = false)
    private UUID workshopId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_type", nullable = false)
    private UnitType unitType;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 3)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "avg_unit_price", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal avgUnitPrice = BigDecimal.ZERO;

    @Column(name = "total_value", nullable = false, precision = 20, scale = 2)
    @Builder.Default
    private BigDecimal totalValue = BigDecimal.ZERO;

    @Column(name = "min_quantity_alert", precision = 12, scale = 3)
    private BigDecimal minQuantityAlert;

    @Column(name = "sku", length = 50)
    private String sku;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
