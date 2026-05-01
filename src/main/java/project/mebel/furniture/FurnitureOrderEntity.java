package project.mebel.furniture;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import project.mebel.common.entity.SoftDeleteEntity;
import project.mebel.common.enums.FurnitureStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "furniture_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class FurnitureOrderEntity extends SoftDeleteEntity {

    @Column(name = "workshop_id", nullable = false)
    private UUID workshopId;

    @Column(name = "order_number", nullable = false, unique = true, length = 30)
    private String orderNumber;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private FurnitureStatus status = FurnitureStatus.DRAFT;

    @Column(name = "sale_price", precision = 14, scale = 2)
    private BigDecimal salePrice;

    @Column(name = "estimated_cost", precision = 14, scale = 2)
    private BigDecimal estimatedCost;

    @Column(name = "actual_material_cost", precision = 14, scale = 2)
    private BigDecimal actualMaterialCost;

    @Column(name = "template_id")
    private UUID templateId;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "sold_at")
    private LocalDateTime soldAt;

    @Column(name = "client_name", length = 150)
    private String clientName;

    @Column(name = "client_phone", length = 20)
    private String clientPhone;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
