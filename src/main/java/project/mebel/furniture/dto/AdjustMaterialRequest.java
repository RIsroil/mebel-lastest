package project.mebel.furniture.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class AdjustMaterialRequest {
    private BigDecimal delta; // musbat = qo'shish, manfiy = qaytarish
}
