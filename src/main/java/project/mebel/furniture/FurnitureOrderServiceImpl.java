package project.mebel.furniture;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.attendance.DailyAttendanceRepository;
import project.mebel.common.enums.EarnType;
import project.mebel.common.enums.FinancialLogType;
import project.mebel.common.enums.FurnitureStatus;
import project.mebel.common.enums.PayType;
import project.mebel.common.enums.TransactionType;
import project.mebel.common.enums.UserRole;
import project.mebel.earning.EarningEntity;
import project.mebel.earning.EarningRepository;
import project.mebel.exception.ApiException;
import project.mebel.financiallog.FinancialLogService;
import project.mebel.furniture.dto.*;
import project.mebel.user.UserEntity;
import project.mebel.user.UserRepository;
import project.mebel.utils.Utils;
import project.mebel.warehouse.WarehouseItemEntity;
import project.mebel.warehouse.WarehouseItemRepository;
import project.mebel.warehouse.WarehouseTransactionEntity;
import project.mebel.warehouse.WarehouseTransactionRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FurnitureOrderServiceImpl implements FurnitureOrderService {

    private final FurnitureOrderRepository orderRepo;
    private final FurnitureAssignmentRepository assignmentRepo;
    private final MaterialUsageRepository usageRepo;
    private final WarehouseItemRepository warehouseItemRepo;
    private final WarehouseTransactionRepository warehouseTxRepo;
    private final EarningRepository earningRepo;
    private final UserRepository userRepo;
    private final DailyAttendanceRepository attendanceRepo;
    private final FinancialLogService financialLogService;
    private final Utils utils;

    @Override
    @Transactional
    public FurnitureOrderResponse createOrder(FurnitureOrderRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);

        String orderNumber = generateOrderNumber(owner.getWorkshopId());
        FurnitureOrderEntity order = FurnitureOrderEntity.builder()
                .workshopId(owner.getWorkshopId())
                .orderNumber(orderNumber)
                .title(request.getTitle())
                .description(request.getDescription())
                .salePrice(request.getSalePrice())
                .estimatedCost(request.getEstimatedCost())
                .templateId(request.getTemplateId())
                .clientName(request.getClientName())
                .clientPhone(request.getClientPhone())
                .notes(request.getNotes())
                .build();
        order.setCreatedBy(owner.getId());
        return toResponse(orderRepo.save(order));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FurnitureOrderResponse> getAllOrders(Principal principal) {
        UserEntity owner = requireOwner(principal);
        return orderRepo.findAllByWorkshopId(owner.getWorkshopId())
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FurnitureOrderResponse getOrderById(UUID id, Principal principal) {
        UserEntity owner = requireOwner(principal);
        return toResponse(findOrder(id, owner.getWorkshopId()));
    }

    @Override
    @Transactional
    public FurnitureOrderResponse updateOrder(UUID id, FurnitureOrderRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureOrderEntity order = findOrder(id, owner.getWorkshopId());

        if (order.getStatus() == FurnitureStatus.COMPLETED || order.getStatus() == FurnitureStatus.SOLD) {
            throw ApiException.badRequest("order.already.closed");
        }

        if (request.getTitle() != null) order.setTitle(request.getTitle());
        if (request.getDescription() != null) order.setDescription(request.getDescription());
        if (request.getSalePrice() != null) order.setSalePrice(request.getSalePrice());
        if (request.getEstimatedCost() != null) order.setEstimatedCost(request.getEstimatedCost());
        if (request.getClientName() != null) order.setClientName(request.getClientName());
        if (request.getClientPhone() != null) order.setClientPhone(request.getClientPhone());
        if (request.getNotes() != null) order.setNotes(request.getNotes());
        order.setUpdatedBy(owner.getId());

        return toResponse(orderRepo.save(order));
    }

    @Override
    @Transactional
    public void deleteOrder(UUID id, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureOrderEntity order = findOrder(id, owner.getWorkshopId());
        if (order.getStatus() == FurnitureStatus.IN_PROGRESS) {
            throw ApiException.badRequest("order.in.progress.cannot.delete");
        }
        order.setDeletedAt(LocalDateTime.now());
        order.setDeletedBy(owner.getId());
        orderRepo.save(order);
    }

    @Override
    @Transactional
    public FurnitureOrderResponse changeStatus(UUID id, StatusChangeRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureOrderEntity order = findOrder(id, owner.getWorkshopId());

        validateStatusTransition(order.getStatus(), request.getStatus());

        LocalDateTime now = LocalDateTime.now();
        switch (request.getStatus()) {
            case IN_PROGRESS -> order.setStartedAt(now);
            case COMPLETED -> order.setCompletedAt(now);
            case SOLD -> {
                order.setSoldAt(now);
                generateCommissionEarnings(order, owner);
                if (order.getSalePrice() != null && order.getSalePrice().compareTo(java.math.BigDecimal.ZERO) > 0) {
                    String desc = "Mebel sotildi: " + order.getTitle() + " (#" + order.getOrderNumber() + ")"
                            + (order.getClientName() != null ? " | " + order.getClientName() : "");
                    financialLogService.record(owner.getWorkshopId(), FinancialLogType.FURNITURE_SOLD,
                            order.getSalePrice(), desc, order.getId(), LocalDate.now(), owner.getId());
                }
            }
            default -> { /* DRAFT or CANCELLED — no extra fields */ }
        }

        order.setStatus(request.getStatus());
        order.setUpdatedBy(owner.getId());
        return toResponse(orderRepo.save(order));
    }

    @Override
    @Transactional
    public FurnitureOrderResponse assignWorker(UUID orderId, AssignWorkerRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureOrderEntity order = findOrder(orderId, owner.getWorkshopId());

        if (order.getStatus() == FurnitureStatus.COMPLETED || order.getStatus() == FurnitureStatus.SOLD
                || order.getStatus() == FurnitureStatus.CANCELLED) {
            throw ApiException.badRequest("order.already.closed");
        }

        UserEntity worker = userRepo.findById(request.getWorkerId())
                .filter(u -> u.getRole() == UserRole.WORKER && owner.getWorkshopId().equals(u.getWorkshopId()))
                .orElseThrow(() -> ApiException.notFound("worker.not.found"));

        assignmentRepo.findByFurnitureOrderIdAndWorkerIdAndActiveTrue(orderId, worker.getId())
                .ifPresent(a -> { throw ApiException.badRequest("worker.already.assigned"); });

        BigDecimal commissionPct = request.getCommissionPct() != null
                ? request.getCommissionPct()
                : worker.getCommissionPct();

        FurnitureAssignmentEntity assignment = FurnitureAssignmentEntity.builder()
                .furnitureOrderId(orderId)
                .workerId(worker.getId())
                .assignedAt(LocalDateTime.now())
                .commissionPct(commissionPct)
                .build();
        assignment.setCreatedBy(owner.getId());
        assignmentRepo.save(assignment);

        return toResponse(order);
    }

    @Override
    @Transactional
    public FurnitureOrderResponse unassignWorker(UUID orderId, UUID workerId, Principal principal) {
        UserEntity owner = requireOwner(principal);
        findOrder(orderId, owner.getWorkshopId());

        FurnitureAssignmentEntity assignment = assignmentRepo
                .findByFurnitureOrderIdAndWorkerIdAndActiveTrue(orderId, workerId)
                .orElseThrow(() -> ApiException.notFound("assignment.not.found"));

        assignment.setActive(false);
        assignment.setUnassignedAt(LocalDateTime.now());
        assignment.setUpdatedBy(owner.getId());
        assignmentRepo.save(assignment);

        return toResponse(findOrder(orderId, owner.getWorkshopId()));
    }

    @Override
    @Transactional
    public FurnitureOrderResponse addMaterialUsage(UUID orderId, MaterialUsageRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureOrderEntity order = findOrder(orderId, owner.getWorkshopId());

        if (order.getStatus() == FurnitureStatus.COMPLETED || order.getStatus() == FurnitureStatus.SOLD
                || order.getStatus() == FurnitureStatus.CANCELLED) {
            throw ApiException.badRequest("order.already.closed");
        }

        WarehouseItemEntity item = warehouseItemRepo.findByIdAndWorkshopId(request.getWarehouseItemId(), owner.getWorkshopId())
                .orElseThrow(() -> ApiException.notFound("warehouse.item.not.found"));

        BigDecimal qty = request.getQuantityUsed();
        if (item.getQuantity().compareTo(qty) < 0) {
            throw ApiException.badRequest("insufficient.stock");
        }

        BigDecimal unitPrice = item.getAvgUnitPrice();
        BigDecimal totalCost = qty.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);

        // Deduct from warehouse
        BigDecimal qtyBefore = item.getQuantity();
        BigDecimal qtyAfter = qtyBefore.subtract(qty);
        item.setQuantity(qtyAfter);
        item.setTotalValue(qtyAfter.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP));
        item.setUpdatedBy(owner.getId());
        warehouseItemRepo.save(item);

        WarehouseTransactionEntity tx = WarehouseTransactionEntity.builder()
                .itemId(item.getId())
                .workshopId(owner.getWorkshopId())
                .transactionType(TransactionType.OUT)
                .quantity(qty)
                .unitPrice(unitPrice)
                .totalCost(totalCost)
                .qtyBefore(qtyBefore)
                .qtyAfter(qtyAfter)
                .priceBefore(unitPrice)
                .priceAfter(unitPrice)
                .furnitureOrderId(orderId)
                .notes(request.getNotes())
                .build();
        tx.setCreatedBy(owner.getId());
        warehouseTxRepo.save(tx);

        MaterialUsageEntity usage = MaterialUsageEntity.builder()
                .furnitureOrderId(orderId)
                .warehouseItemId(item.getId())
                .quantityUsed(qty)
                .unitPriceAtTime(unitPrice)
                .totalCost(totalCost)
                .givenBy(owner.getId())
                .givenAt(LocalDateTime.now())
                .notes(request.getNotes())
                .build();
        usage.setCreatedBy(owner.getId());
        usageRepo.save(usage);

        String materialDesc = "Xomashyo sarflandi: " + item.getName()
                + " — " + qty.stripTrailingZeros().toPlainString() + " " + item.getUnitType()
                + " | Buyurtma: " + order.getTitle() + " (#" + order.getOrderNumber() + ")";
        financialLogService.record(owner.getWorkshopId(), FinancialLogType.MATERIAL_USED,
                totalCost.negate(), materialDesc, usage.getId(), LocalDate.now(), owner.getId());

        // Recalculate actual material cost
        BigDecimal newActualCost = usageRepo.sumTotalCostByOrderId(orderId);
        order.setActualMaterialCost(newActualCost);
        order.setUpdatedBy(owner.getId());
        orderRepo.save(order);

        return toResponse(order);
    }

    private void generateCommissionEarnings(FurnitureOrderEntity order, UserEntity owner) {
        if (order.getSalePrice() == null || order.getSalePrice().compareTo(BigDecimal.ZERO) == 0) return;

        List<FurnitureAssignmentEntity> activeAssignments =
                assignmentRepo.findAllByFurnitureOrderIdAndActiveTrue(order.getId());
        if (activeAssignments.isEmpty()) return;

        LocalDate earnDate = LocalDate.now();
        int workerCount = activeAssignments.size();

        for (FurnitureAssignmentEntity assignment : activeAssignments) {
            userRepo.findById(assignment.getWorkerId()).ifPresent(worker -> {
                BigDecimal commissionPct = assignment.getCommissionPct() != null
                        ? assignment.getCommissionPct()
                        : (worker.getCommissionPct() != null ? worker.getCommissionPct() : BigDecimal.ZERO);
                if (commissionPct.compareTo(BigDecimal.ZERO) == 0) return;

                BigDecimal commissionAmount = order.getSalePrice()
                        .multiply(commissionPct)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                        .divide(BigDecimal.valueOf(workerCount), 2, RoundingMode.HALF_UP);

                EarningEntity earning = EarningEntity.builder()
                        .workerId(worker.getId())
                        .workshopId(owner.getWorkshopId())
                        .earnDate(earnDate)
                        .earnType(EarnType.COMMISSION)
                        .furnitureOrderId(order.getId())
                        .commissionPct(commissionPct)
                        .commissionAmount(commissionAmount)
                        .baseAmount(commissionAmount)
                        .totalAmount(commissionAmount)
                        .description("Commission from order: " + order.getOrderNumber())
                        .build();
                earning.setCreatedBy(owner.getId());
                earningRepo.save(earning);
            });
        }
    }

    private void validateStatusTransition(FurnitureStatus current, FurnitureStatus next) {
        boolean valid = switch (current) {
            case DRAFT -> next == FurnitureStatus.IN_PROGRESS || next == FurnitureStatus.CANCELLED;
            case IN_PROGRESS -> next == FurnitureStatus.COMPLETED || next == FurnitureStatus.CANCELLED;
            case COMPLETED -> next == FurnitureStatus.SOLD;
            case SOLD, CANCELLED -> false;
        };
        if (!valid) throw ApiException.badRequest("invalid.status.transition");
    }

    private String generateOrderNumber(UUID workshopId) {
        String prefix = "ORD-" + LocalDate.now().getYear() + "-";
        long count = orderRepo.count() + 1;
        return prefix + String.format("%05d", count);
    }

    private FurnitureOrderEntity findOrder(UUID id, UUID workshopId) {
        return orderRepo.findByIdAndWorkshopId(id, workshopId)
                .orElseThrow(() -> ApiException.notFound("furniture.order.not.found"));
    }

    private UserEntity requireOwner(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        if (user.getRole() != UserRole.OWNER) throw ApiException.forbidden("access.denied");
        if (user.getWorkshopId() == null) throw ApiException.badRequest("owner.has.no.workshop");
        return user;
    }

    private FurnitureOrderResponse toResponse(FurnitureOrderEntity o) {
        List<FurnitureAssignmentEntity> assignments = assignmentRepo.findAllByFurnitureOrderId(o.getId());
        List<MaterialUsageEntity> usages = usageRepo.findAllByFurnitureOrderId(o.getId());

        BigDecimal totalWageCost       = BigDecimal.ZERO;
        BigDecimal totalCommissionCost = BigDecimal.ZERO;

        List<FurnitureOrderResponse.AssignedWorkerResponse> assignedWorkers = assignments.stream()
                .map(a -> {
                    UserEntity worker = userRepo.findById(a.getWorkerId()).orElse(null);
                    String workerName = worker != null ? worker.getFullName() : null;

                    int daysWorked = 0;
                    BigDecimal wageCost = BigDecimal.ZERO;
                    BigDecimal commissionCost = BigDecimal.ZERO;

                    if (worker != null) {
                        LocalDate from = a.getAssignedAt().toLocalDate();
                        LocalDate to = a.getUnassignedAt() != null ? a.getUnassignedAt().toLocalDate()
                                : o.getCompletedAt() != null ? o.getCompletedAt().toLocalDate()
                                : LocalDate.now();

                        daysWorked = attendanceRepo.findAllByUserIdAndWorkDateBetween(worker.getId(), from, to).size();

                        if (worker.getPayType() == PayType.DAILY && worker.getDailySalary() != null) {
                            wageCost = worker.getDailySalary()
                                    .multiply(BigDecimal.valueOf(daysWorked))
                                    .setScale(2, RoundingMode.HALF_UP);
                        } else if (worker.getPayType() == PayType.MONTHLY && worker.getDailySalary() != null) {
                            // dailySalary stores monthly salary; daily rate = monthly / 30
                            wageCost = worker.getDailySalary()
                                    .divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(daysWorked))
                                    .setScale(2, RoundingMode.HALF_UP);
                        }

                        if (o.getSalePrice() != null && a.getCommissionPct() != null
                                && a.getCommissionPct().compareTo(BigDecimal.ZERO) > 0) {
                            commissionCost = o.getSalePrice()
                                    .multiply(a.getCommissionPct())
                                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                        }
                    }

                    return FurnitureOrderResponse.AssignedWorkerResponse.builder()
                            .assignmentId(a.getId())
                            .workerId(a.getWorkerId())
                            .workerName(workerName)
                            .assignedAt(a.getAssignedAt())
                            .commissionPct(a.getCommissionPct())
                            .active(a.isActive())
                            .daysWorked(daysWorked)
                            .wageCost(wageCost)
                            .commissionCost(commissionCost)
                            .build();
                }).toList();

        for (FurnitureOrderResponse.AssignedWorkerResponse w : assignedWorkers) {
            totalWageCost       = totalWageCost.add(w.getWageCost() != null ? w.getWageCost() : BigDecimal.ZERO);
            totalCommissionCost = totalCommissionCost.add(w.getCommissionCost() != null ? w.getCommissionCost() : BigDecimal.ZERO);
        }

        BigDecimal salePrice     = o.getSalePrice() != null ? o.getSalePrice() : BigDecimal.ZERO;
        BigDecimal materialCost  = o.getActualMaterialCost() != null ? o.getActualMaterialCost() : BigDecimal.ZERO;
        BigDecimal netProfit     = salePrice.subtract(materialCost).subtract(totalWageCost).subtract(totalCommissionCost);

        List<FurnitureOrderResponse.MaterialUsageResponse> materialUsages = usages.stream()
                .map(m -> {
                    String itemName = warehouseItemRepo.findById(m.getWarehouseItemId())
                            .map(WarehouseItemEntity::getName).orElse(null);
                    return FurnitureOrderResponse.MaterialUsageResponse.builder()
                            .id(m.getId())
                            .warehouseItemId(m.getWarehouseItemId())
                            .itemName(itemName)
                            .quantityUsed(m.getQuantityUsed())
                            .unitPriceAtTime(m.getUnitPriceAtTime())
                            .totalCost(m.getTotalCost())
                            .notes(m.getNotes())
                            .givenAt(m.getGivenAt())
                            .build();
                }).toList();

        return FurnitureOrderResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .title(o.getTitle())
                .description(o.getDescription())
                .status(o.getStatus())
                .salePrice(o.getSalePrice())
                .estimatedCost(o.getEstimatedCost())
                .actualMaterialCost(o.getActualMaterialCost())
                .workerWageCost(totalWageCost)
                .workerCommissionCost(totalCommissionCost)
                .netProfit(netProfit)
                .clientName(o.getClientName())
                .clientPhone(o.getClientPhone())
                .notes(o.getNotes())
                .startedAt(o.getStartedAt())
                .completedAt(o.getCompletedAt())
                .soldAt(o.getSoldAt())
                .createdAt(o.getCreatedAt())
                .assignedWorkers(assignedWorkers)
                .materialUsages(materialUsages)
                .build();
    }
}
