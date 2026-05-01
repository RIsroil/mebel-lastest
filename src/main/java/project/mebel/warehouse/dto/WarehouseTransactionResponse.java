package project.mebel.warehouse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mebel.common.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WarehouseTransactionResponse {
    private UUID id;
    private UUID itemId;
    private String itemName;
    private TransactionType transactionType;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalCost;
    private BigDecimal qtyBefore;
    private BigDecimal qtyAfter;
    private String supplierName;
    private String invoiceNumber;
    private String notes;
    private LocalDateTime createdAt;
}
