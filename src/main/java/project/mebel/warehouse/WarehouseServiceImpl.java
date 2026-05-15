package project.mebel.warehouse;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.common.enums.FinancialLogType;
import project.mebel.common.enums.TransactionType;
import project.mebel.common.enums.UserRole;
import project.mebel.exception.ApiException;
import project.mebel.financiallog.FinancialLogService;
import project.mebel.user.UserEntity;
import project.mebel.utils.Utils;
import project.mebel.warehouse.dto.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseItemRepository itemRepo;
    private final WarehouseTransactionRepository txRepo;
    private final FinancialLogService financialLogService;
    private final Utils utils;

    @Override
    @Transactional
    public WarehouseItemResponse createItem(WarehouseItemRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);

        WarehouseItemEntity item = WarehouseItemEntity.builder()
                .workshopId(owner.getWorkshopId())
                .name(request.getName())
                .description(request.getDescription())
                .unitType(request.getUnitType())
                .minQuantityAlert(request.getMinQuantityAlert())
                .sku(request.getSku())
                .build();
        item.setCreatedBy(owner.getId());
        return toItemResponse(itemRepo.save(item));
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseItemResponse> getAllItems(Principal principal) {
        UserEntity owner = requireOwner(principal);
        return itemRepo.findAllByWorkshopId(owner.getWorkshopId())
                .stream().map(this::toItemResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseItemResponse getItemById(UUID id, Principal principal) {
        UserEntity owner = requireOwner(principal);
        return toItemResponse(findItem(id, owner.getWorkshopId()));
    }

    @Override
    @Transactional
    public WarehouseItemResponse updateItem(UUID id, WarehouseItemRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        WarehouseItemEntity item = findItem(id, owner.getWorkshopId());

        if (request.getName() != null) item.setName(request.getName());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getMinQuantityAlert() != null) item.setMinQuantityAlert(request.getMinQuantityAlert());
        if (request.getSku() != null) item.setSku(request.getSku());
        item.setUpdatedBy(owner.getId());
        return toItemResponse(itemRepo.save(item));
    }

    @Override
    @Transactional
    public void deleteItem(UUID id, Principal principal) {
        UserEntity owner = requireOwner(principal);
        WarehouseItemEntity item = findItem(id, owner.getWorkshopId());

        BigDecimal totalValue = item.getTotalValue() != null ? item.getTotalValue() : BigDecimal.ZERO;
        String desc = "Material o'chirildi: " + item.getName()
                + " | Miqdor: " + item.getQuantity().stripTrailingZeros().toPlainString()
                + " " + item.getUnitType()
                + " | Umumiy qiymat: " + totalValue.stripTrailingZeros().toPlainString() + " so'm";

        item.setDeletedAt(LocalDateTime.now());
        item.setDeletedBy(owner.getId());
        itemRepo.save(item);

        financialLogService.record(
                owner.getWorkshopId(),
                FinancialLogType.WAREHOUSE_PURCHASE,
                totalValue.negate(),
                desc,
                item.getId(),
                item.getName(),
                LocalDate.now(),
                owner.getId()
        );
    }

    @Override
    @Transactional
    public WarehouseItemResponse addTransaction(UUID itemId, WarehouseTransactionRequest req, Principal principal) {
        UserEntity owner = requireOwner(principal);
        WarehouseItemEntity item = findItem(itemId, owner.getWorkshopId());

        BigDecimal qty = req.getQuantity();
        BigDecimal price = req.getUnitPrice() != null ? req.getUnitPrice() : BigDecimal.ZERO;
        BigDecimal totalCost = qty.multiply(price);

        BigDecimal qtyBefore = item.getQuantity();
        BigDecimal priceBefore = item.getAvgUnitPrice();
        BigDecimal qtyAfter;
        BigDecimal priceAfter;

        if (req.getTransactionType() == TransactionType.IN) {
            BigDecimal newTotal = qtyBefore.multiply(priceBefore).add(qty.multiply(price));
            qtyAfter = qtyBefore.add(qty);
            priceAfter = qtyAfter.compareTo(BigDecimal.ZERO) > 0
                    ? newTotal.divide(qtyAfter, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
        } else if (req.getTransactionType() == TransactionType.OUT) {
            if (qtyBefore.compareTo(qty) < 0) {
                throw ApiException.badRequest("insufficient.stock");
            }
            qtyAfter = qtyBefore.subtract(qty);
            priceAfter = priceBefore;
            totalCost = qty.multiply(priceBefore);
        } else { // ADJUSTMENT
            qtyAfter = qty;
            priceAfter = price.compareTo(BigDecimal.ZERO) > 0 ? price : priceBefore;
        }

        item.setQuantity(qtyAfter);
        item.setAvgUnitPrice(priceAfter);
        item.setTotalValue(qtyAfter.multiply(priceAfter).setScale(2, RoundingMode.HALF_UP));
        item.setUpdatedBy(owner.getId());
        itemRepo.save(item);

        WarehouseTransactionEntity tx = WarehouseTransactionEntity.builder()
                .itemId(item.getId())
                .workshopId(owner.getWorkshopId())
                .transactionType(req.getTransactionType())
                .quantity(qty)
                .unitPrice(price)
                .totalCost(totalCost)
                .qtyBefore(qtyBefore)
                .qtyAfter(qtyAfter)
                .priceBefore(priceBefore)
                .priceAfter(priceAfter)
                .supplierName(req.getSupplierName())
                .invoiceNumber(req.getInvoiceNumber())
                .furnitureOrderId(req.getFurnitureOrderId())
                .notes(req.getNotes())
                .build();
        tx.setCreatedBy(owner.getId());
        txRepo.save(tx);

        if (req.getTransactionType() == TransactionType.IN) {
            String desc = "Xomashyo kiritildi: " + item.getName()
                    + " | " + qty.stripTrailingZeros().toPlainString() + " " + item.getUnitType()
                    + " × " + price.stripTrailingZeros().toPlainString() + " so'm";
            if (req.getSupplierName() != null) desc += " | " + req.getSupplierName();
            financialLogService.record(owner.getWorkshopId(), FinancialLogType.WAREHOUSE_PURCHASE,
                    totalCost.negate(), desc, item.getId(), item.getName(), LocalDate.now(), owner.getId());
        }

        return toItemResponse(item);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseTransactionResponse> getTransactions(UUID itemId, Principal principal) {
        UserEntity owner = requireOwner(principal);
        findItem(itemId, owner.getWorkshopId());
        return txRepo.findAllByItemIdOrderByCreatedAtDesc(itemId)
                .stream().map(tx -> toTxResponse(tx, null)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseTransactionResponse> getTodayOutTransactions(Principal principal) {
        UserEntity owner = requireOwner(principal);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        List<WarehouseTransactionEntity> txs = txRepo
                .findAllByWorkshopIdAndTransactionTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
                        owner.getWorkshopId(), TransactionType.OUT, startOfDay, endOfDay);
        // item nomini olish uchun lazy load
        return txs.stream().map(tx -> {
            String itemName = itemRepo.findById(tx.getItemId())
                    .map(WarehouseItemEntity::getName).orElse("—");
            return toTxResponse(tx, itemName);
        }).toList();
    }

    private WarehouseItemEntity findItem(UUID id, UUID workshopId) {
        return itemRepo.findByIdAndWorkshopId(id, workshopId)
                .orElseThrow(() -> ApiException.notFound("warehouse.item.not.found"));
    }

    private UserEntity requireOwner(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        if (user.getRole() != UserRole.OWNER) throw ApiException.forbidden("access.denied");
        if (user.getWorkshopId() == null) throw ApiException.badRequest("owner.has.no.workshop");
        return user;
    }

    private WarehouseItemResponse toItemResponse(WarehouseItemEntity i) {
        boolean lowStock = i.getMinQuantityAlert() != null
                && i.getQuantity().compareTo(i.getMinQuantityAlert()) < 0;
        return WarehouseItemResponse.builder()
                .id(i.getId()).name(i.getName()).description(i.getDescription())
                .unitType(i.getUnitType()).quantity(i.getQuantity())
                .avgUnitPrice(i.getAvgUnitPrice()).totalValue(i.getTotalValue())
                .minQuantityAlert(i.getMinQuantityAlert()).sku(i.getSku())
                .active(i.isActive()).lowStock(lowStock).build();
    }

    private WarehouseTransactionResponse toTxResponse(WarehouseTransactionEntity tx, String itemName) {
        return WarehouseTransactionResponse.builder()
                .id(tx.getId()).itemId(tx.getItemId()).itemName(itemName)
                .transactionType(tx.getTransactionType()).quantity(tx.getQuantity())
                .unitPrice(tx.getUnitPrice()).totalCost(tx.getTotalCost())
                .qtyBefore(tx.getQtyBefore()).qtyAfter(tx.getQtyAfter())
                .supplierName(tx.getSupplierName()).invoiceNumber(tx.getInvoiceNumber())
                .notes(tx.getNotes()).createdAt(tx.getCreatedAt())
                .furnitureOrderId(tx.getFurnitureOrderId()).build();
    }
}
