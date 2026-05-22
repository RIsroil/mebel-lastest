package project.mebel.earning.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class SkipPaymentRequest {
    private List<UUID> earningIds;
    private String reason;
}
