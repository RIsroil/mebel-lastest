package project.mebel.furniture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class FurnitureTemplateResponse {
    private UUID id;
    private String name;
    private String description;
    private Short estimatedProdDays;
    private boolean active;
    private List<TemplateMaterialResponse> materials;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TemplateMaterialResponse {
        private UUID id;
        private UUID warehouseItemId;
        private String itemName;
        private BigDecimal quantityNeeded;
        private String notes;
    }
}
