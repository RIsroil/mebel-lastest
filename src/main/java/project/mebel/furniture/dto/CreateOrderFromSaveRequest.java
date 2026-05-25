package project.mebel.furniture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderFromSaveRequest {
    private String clientName;
    private String clientPhone;
    private BigDecimal salePrice;
    private String notes;
    private boolean confirmMissingMaterials;
}
