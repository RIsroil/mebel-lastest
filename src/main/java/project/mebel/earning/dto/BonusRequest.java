package project.mebel.earning.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BonusRequest {
    private UUID workerId;
    private BigDecimal amount;
    private String reason;
    private LocalDate bonusDate;
}
