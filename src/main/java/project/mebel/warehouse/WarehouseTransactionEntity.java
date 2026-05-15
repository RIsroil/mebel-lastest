package project.mebel.warehouse;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import project.mebel.common.entity.CreatedAuditEntity;
import project.mebel.common.enums.TransactionType;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "warehouse_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class WarehouseTransactionEntity extends CreatedAuditEntity {

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Column(name = "workshop_id", nullable = false)
    private UUID workshopId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 16, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_cost", nullable = false, precision = 20, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "qty_before", nullable = false, precision = 12, scale = 3)
    private BigDecimal qtyBefore;

    @Column(name = "qty_after", nullable = false, precision = 12, scale = 3)
    private BigDecimal qtyAfter;

    @Column(name = "price_before", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceBefore;

    @Column(name = "price_after", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAfter;

    @Column(name = "supplier_name", length = 150)
    private String supplierName;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "furniture_order_id")
    private UUID furnitureOrderId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
