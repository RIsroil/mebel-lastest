package project.mebel.warehouse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mebel.common.enums.UnitType;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WarehouseItemRequest {
    private String name;
    private String description;
    private UnitType unitType;
    private BigDecimal minQuantityAlert;
    private String sku;
}
