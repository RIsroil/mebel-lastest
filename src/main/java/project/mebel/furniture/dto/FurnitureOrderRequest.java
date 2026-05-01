package project.mebel.furniture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FurnitureOrderRequest {
    private String title;
    private String description;
    private BigDecimal salePrice;
    private BigDecimal estimatedCost;
    private UUID templateId;
    private String clientName;
    private String clientPhone;
    private String notes;
}
