package project.mebel.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mebel.common.enums.PayType;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWorkerRequest {
    private String username;
    private String password;
    private String fullName;
    private String phone;
    private PayType payType;
    private BigDecimal hourlyRate;
    private BigDecimal dailyRate;
    private BigDecimal dailyHoursTarget;
    private BigDecimal commissionPct;
    private boolean hybridPay;
}
