package project.mebel.warehouse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mebel.common.enums.UnitType;

import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WarehouseItemResponse {
    private UUID id;
    private String name;
    private String description;
    private UnitType unitType;
    private BigDecimal quantity;
    private BigDecimal avgUnitPrice;
    private BigDecimal totalValue;
    private BigDecimal minQuantityAlert;
    private String sku;
    private boolean active;
    private boolean lowStock;
}
