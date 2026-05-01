package project.mebel.warehouse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mebel.common.enums.TransactionType;

import java.math.BigDecimal;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WarehouseTransactionRequest {
    private TransactionType transactionType;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private String supplierName;
    private String invoiceNumber;
    private UUID furnitureOrderId;
    private String notes;
}
