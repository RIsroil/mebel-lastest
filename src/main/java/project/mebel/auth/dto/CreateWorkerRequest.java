package project.mebel.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mebel.common.enums.PayType;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWorkerRequest {
    private UUID workshopId;
    private String username;
    private String password;
    private PayType payType;
    @Schema(description = "Kunlik necha soat ishlashga kelishganlik, masalan: 8.0 avto soatlarda")
    private BigDecimal dailyHoursTarget;

    private BigDecimal dailySalary;
}
