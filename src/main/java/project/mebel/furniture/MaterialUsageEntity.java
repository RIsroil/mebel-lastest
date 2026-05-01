package project.mebel.furniture;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import project.mebel.common.entity.SoftDeleteEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "material_usages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class MaterialUsageEntity extends SoftDeleteEntity {

    @Column(name = "furniture_order_id", nullable = false)
    private UUID furnitureOrderId;

    @Column(name = "warehouse_item_id", nullable = false)
    private UUID warehouseItemId;

    @Column(name = "quantity_used", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantityUsed;

    @Column(name = "unit_price_at_time", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPriceAtTime;

    @Column(name = "total_cost", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "given_by")
    private UUID givenBy;

    @Column(name = "given_at")
    private LocalDateTime givenAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
