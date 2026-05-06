package project.mebel.furniture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mebel.common.enums.FurnitureStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FurnitureOrderResponse {
    private UUID id;
    private String orderNumber;
    private String title;
    private String description;
    private FurnitureStatus status;
    private BigDecimal salePrice;
    private BigDecimal estimatedCost;
    private BigDecimal actualMaterialCost;
    private String clientName;
    private String clientPhone;
    private String notes;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime soldAt;
    private LocalDateTime createdAt;
    private BigDecimal workerWageCost;
    private BigDecimal workerCommissionCost;
    private BigDecimal netProfit;
    private List<AssignedWorkerResponse> assignedWorkers;
    private List<MaterialUsageResponse> materialUsages;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssignedWorkerResponse {
        private UUID assignmentId;
        private UUID workerId;
        private String workerName;
        private LocalDateTime assignedAt;
        private BigDecimal commissionPct;
        private boolean active;
        private Integer daysWorked;
        private BigDecimal wageCost;
        private BigDecimal commissionCost;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MaterialUsageResponse {
        private UUID id;
        private UUID warehouseItemId;
        private String itemName;
        private String unitType;
        private BigDecimal quantityUsed;
        private BigDecimal unitPriceAtTime;
        private BigDecimal totalCost;
        private String notes;
        private LocalDateTime givenAt;
    }
}
