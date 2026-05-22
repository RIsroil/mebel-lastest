package project.mebel.earning.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class EnhancedPaymentRequest {
    private List<UUID> earningIds;
    private Integer daysToPay;          // Necha kun to'lanadi
    private BigDecimal customAmount;    // O'zgartirilgan summa (null bo'lsa default hisoblanadi)
    private String notes;               // Izoh (customAmount bo'lsa majburiy)
}
