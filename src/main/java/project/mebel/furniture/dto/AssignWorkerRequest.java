package project.mebel.furniture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AssignWorkerRequest {
    private UUID workerId;
    /** null bo'lsa worker entitydagi commissionPct ishlatiladi */
    private BigDecimal commissionPct;
}
