package project.mebel.earning.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class EarningFilterRequest {
    private UUID workerId;
    private LocalDate dateFrom;
    private LocalDate dateTo;
}
