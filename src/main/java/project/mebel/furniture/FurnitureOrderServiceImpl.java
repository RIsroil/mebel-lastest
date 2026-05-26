package project.mebel.furniture;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import project.mebel.attendance.DailyAttendanceRepository;
import project.mebel.audit.AuditLogService;
import project.mebel.common.enums.EarnType;
import project.mebel.common.enums.FinancialLogType;
import project.mebel.common.enums.FurnitureStatus;
import project.mebel.common.enums.PayType;
import project.mebel.common.enums.TransactionType;
import project.mebel.common.enums.UserRole;
import project.mebel.earning.EarningEntity;
import project.mebel.earning.EarningRepository;
import project.mebel.earning.WageCalculationService;
import project.mebel.exception.ApiException;
import project.mebel.financiallog.FinancialLogService;
import project.mebel.furniture.dto.*;
import project.mebel.user.UserEntity;
import project.mebel.user.UserRepository;
import project.mebel.utils.Utils;
import project.mebel.saves.FurnitureSaveEntity;
import project.mebel.saves.FurnitureSaveRepository;
import project.mebel.saves.SaveCutEntity;
import project.mebel.saves.SaveCutRepository;
import project.mebel.warehouse.WarehouseItemEntity;
import project.mebel.warehouse.WarehouseItemRepository;
import project.mebel.warehouse.WarehouseTransactionEntity;
import project.mebel.warehouse.WarehouseTransactionRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FurnitureOrderServiceImpl implements FurnitureOrderService {

    @Value("${app.base-url}")
    private String appBaseUrl;

    private final FurnitureOrderRepository orderRepo;
    private final FurnitureAssignmentRepository assignmentRepo;
    private final MaterialUsageRepository usageRepo;
    private final FurnitureImageRepository imageRepo;
    private final WarehouseItemRepository warehouseItemRepo;
    private final FurnitureSaveRepository saveRepo;
    private final SaveCutRepository saveCutRepo;
    private final WarehouseTransactionRepository warehouseTxRepo;
    private final EarningRepository earningRepo;
    private final UserRepository userRepo;
    private final DailyAttendanceRepository attendanceRepo;
    private final FinancialLogService financialLogService;
    private final WageCalculationService wageCalculationService;
    private final AuditLogService auditLogService;
    private final project.mebel.minio.MinioStorageService minioStorageService;
    private final Utils utils;

    private static final int MAX_IMAGES_PER_ORDER = 3;
    private static final String IMAGE_API_PATH = "/api/furniture/orders/%s/images/%s/raw";

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
    @Transactional
    public FurnitureOrderResponse createOrderFromSave(UUID saveId, CreateOrderFromSaveRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);

        // Find the save
        FurnitureSaveEntity save = saveRepo.findByIdAndWorkshopId(saveId, owner.getWorkshopId())
                .orElseThrow(() -> ApiException.notFound("furniture.save.not.found"));

        // Get cuts from save
        List<SaveCutEntity> cuts = saveCutRepo.findAllBySaveIdOrderByCreatedAtAsc(saveId);

        // Check which materials exist in warehouse
        List<String> missingMaterials = new ArrayList<>();
        for (SaveCutEntity cut : cuts) {
            Optional<WarehouseItemEntity> item = warehouseItemRepo.findByWorkshopIdAndNameIgnoreCase(
                    owner.getWorkshopId(), cut.getMaterialName());
            if (item.isEmpty()) {
                missingMaterials.add(cut.getMaterialName());
            }
        }

        // If missing materials and not confirmed, throw error with list
        if (!missingMaterials.isEmpty() && !request.isConfirmMissingMaterials()) {
            throw ApiException.badRequest("materials.missing.confirm.required");
        }

        // Create draft order
        String orderNumber = generateOrderNumber(owner.getWorkshopId());
        FurnitureOrderEntity order = FurnitureOrderEntity.builder()
                .workshopId(owner.getWorkshopId())
                .orderNumber(orderNumber)
                .title(save.getName())
                .description(save.getDescription())
                .salePrice(request.getSalePrice())
                .clientName(request.getClientName())
                .clientPhone(request.getClientPhone())
                .notes(request.getNotes())
                .build();
        order.setCreatedBy(owner.getId());
        FurnitureOrderEntity savedOrder = orderRepo.save(order);

        // Create material usages from cuts
        for (SaveCutEntity cut : cuts) {
            Optional<WarehouseItemEntity> itemOpt = warehouseItemRepo.findByWorkshopIdAndNameIgnoreCase(
                    owner.getWorkshopId(), cut.getMaterialName());

            MaterialUsageEntity usage = MaterialUsageEntity.builder()
                    .furnitureOrderId(savedOrder.getId())
                    .materialName(cut.getMaterialName())
                    .lengthMm(cut.getLengthMm())
                    .widthMm(cut.getWidthMm())
                    .heightMm(cut.getHeightMm())
                    .quantityUsed(BigDecimal.valueOf(cut.getQuantity()))
                    .fromSaveId(saveId)
                    .notes(cut.getNotes())
                    .build();

            if (itemOpt.isPresent()) {
                // Material exists in warehouse — deduct it
                WarehouseItemEntity item = itemOpt.get();
                BigDecimal qty = usage.getQuantityUsed();
                BigDecimal unitPrice = item.getAvgUnitPrice() != null ? item.getAvgUnitPrice() : BigDecimal.ZERO;
                BigDecimal totalCost = qty.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);

                usage.setWarehouseItemId(item.getId());
                usage.setUnitPriceAtTime(unitPrice);
                usage.setTotalCost(totalCost);
                usage.setGivenAt(LocalDateTime.now());
                usage.setGivenBy(owner.getId());

                // Deduct from warehouse
                BigDecimal qtyBefore = item.getQuantity();
                BigDecimal qtyAfter = qtyBefore.subtract(qty);
                item.setQuantity(qtyAfter);
                item.setTotalValue(qtyAfter.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP));
                item.setUpdatedBy(owner.getId());
                warehouseItemRepo.save(item);

                // Create warehouse transaction
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
                        .furnitureOrderId(savedOrder.getId())
                        .notes(cut.getNotes())
                        .build();
                tx.setCreatedBy(owner.getId());
                warehouseTxRepo.save(tx);

                // Record financial log
                String materialDesc = "Xomashyo sarflandi: " + item.getName()
                        + " — " + qty.stripTrailingZeros().toPlainString() + " " + item.getUnitType()
                        + " | Buyurtma: " + savedOrder.getTitle() + " (#" + savedOrder.getOrderNumber() + ")";
                String orderRef = savedOrder.getTitle() + " (#" + savedOrder.getOrderNumber() + ")";
                financialLogService.record(owner.getWorkshopId(), FinancialLogType.MATERIAL_USED,
                        totalCost.negate(), materialDesc, savedOrder.getId(), orderRef, LocalDate.now(), owner.getId());
            } else {
                // Pending material
                usage.setUnitPriceAtTime(BigDecimal.ZERO);
                usage.setTotalCost(BigDecimal.ZERO);
            }

            usage.setCreatedBy(owner.getId());
            usageRepo.save(usage);
        }

        // Recalculate material cost (only for existing materials)
        recalculateMaterialCost(savedOrder);

        return toResponse(savedOrder);
    }

    private void recalculateMaterialCost(FurnitureOrderEntity order) {
        List<MaterialUsageEntity> usages = usageRepo.findAllByFurnitureOrderId(order.getId());
        BigDecimal total = usages.stream()
                .filter(u -> u.getWarehouseItemId() != null) // Only resolved materials
                .map(MaterialUsageEntity::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setActualMaterialCost(total);
        orderRepo.save(order);
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
    public List<FurnitureOrderResponse> getWorkerOrders(Principal principal) {
        UserEntity worker = utils.getUserFromPrincipal(principal);
        List<FurnitureAssignmentEntity> assignments = assignmentRepo.findByWorkerIdAndActiveTrueOrderByAssignedAtAsc(worker.getId());
        List<UUID> orderIds = assignments.stream()
                .map(FurnitureAssignmentEntity::getFurnitureOrderId)
                .collect(Collectors.toList());
        if (orderIds.isEmpty()) return List.of();
        return orderRepo.findAllById(orderIds)
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
            case IN_PROGRESS -> {
                order.setStartedAt(now);
                // Ish boshlanganda biriktirilgan ishchilar uchun maosh hisoblaymiz
                List<FurnitureAssignmentEntity> activeAssignments =
                        assignmentRepo.findAllByFurnitureOrderIdAndActiveTrue(id);
                LocalDate today = LocalDate.now();
                for (FurnitureAssignmentEntity assignment : activeAssignments) {
                    wageCalculationService.createWageLogOnAssignment(
                            id,
                            assignment.getWorkerId(),
                            owner.getWorkshopId(),
                            owner.getId()
                    );
                    wageCalculationService.updateDailyWagesForWorker(
                            assignment.getWorkerId(),
                            owner.getWorkshopId(),
                            today,
                            owner.getId()
                    );
                }
            }
            case COMPLETED -> order.setCompletedAt(now);
            case SOLD -> {
                order.setSoldAt(now);
                generateCommissionEarnings(order, owner);
                if (order.getSalePrice() != null && order.getSalePrice().compareTo(java.math.BigDecimal.ZERO) > 0) {
                    String desc = "Mebel sotildi: " + order.getTitle() + " (#" + order.getOrderNumber() + ")"
                            + (order.getClientName() != null ? " | " + order.getClientName() : "");
                    String relatedName = order.getTitle() + " (#" + order.getOrderNumber() + ")";
                    financialLogService.record(owner.getWorkshopId(), FinancialLogType.FURNITURE_SOLD,
                            order.getSalePrice(), desc, order.getId(), relatedName, LocalDate.now(), owner.getId());
                }
            }
            default -> { /* DRAFT or CANCELLED — no extra fields */ }
        }

        FurnitureStatus oldStatus = order.getStatus();
        order.setStatus(request.getStatus());
        order.setUpdatedBy(owner.getId());
        FurnitureOrderEntity saved = orderRepo.save(order);

        String ownerName = owner.getFullName() != null ? owner.getFullName() : owner.getUsername();
        auditLogService.logOrderStatusChanged(
                saved.getId(), saved.getOrderNumber(),
                owner.getId(), ownerName, owner.getWorkshopId(),
                oldStatus.name(), request.getStatus().name());

        return toResponse(saved);
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

        // Worker uchun wage log FAQAT ish boshlanganda (IN_PROGRESS) yaratiladi
        // DRAFT holatida ishchi biriktirilsa, hech qanday maosh hisoblanmaydi
        if (order.getStatus() == FurnitureStatus.IN_PROGRESS) {
            wageCalculationService.createWageLogOnAssignment(
                    orderId,
                    worker.getId(),
                    owner.getWorkshopId(),
                    owner.getId()
            );

            LocalDate today = LocalDate.now();
            wageCalculationService.updateDailyWagesForWorker(worker.getId(), owner.getWorkshopId(), today, owner.getId());
        }

        return toResponse(order);
    }

    @Override
    @Transactional
    public FurnitureOrderResponse reactivateWorker(UUID orderId, UUID workerId, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureOrderEntity order = findOrder(orderId, owner.getWorkshopId());

        if (order.getStatus() != FurnitureStatus.IN_PROGRESS) {
            throw ApiException.badRequest("order.must.be.in.progress");
        }

        FurnitureAssignmentEntity assignment = assignmentRepo
                .findByFurnitureOrderIdAndWorkerId(orderId, workerId)
                .orElseThrow(() -> ApiException.notFound("assignment.not.found"));

        if (assignment.isActive()) {
            throw ApiException.badRequest("assignment.already.active");
        }

        assignment.setActive(true);
        assignment.setAssignedAt(LocalDateTime.now());
        assignment.setUnassignedAt(null);
        assignment.setUpdatedBy(owner.getId());
        assignmentRepo.save(assignment);

        // Ishchi qayta qo'shilsa, barcha active assignmentlari uchun maosh qayta hisoblanadi
        // Hisob yangi assignedAt sanasidan boshlanadi
        LocalDate today = LocalDate.now();
        wageCalculationService.updateDailyWagesForWorker(workerId, owner.getWorkshopId(), today, owner.getId());

        return toResponse(findOrder(orderId, owner.getWorkshopId()));
    }

    @Override
    @Transactional
    public FurnitureOrderResponse unassignWorker(UUID orderId, UUID workerId, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureOrderEntity order = findOrder(orderId, owner.getWorkshopId());

        if (order.getStatus() == FurnitureStatus.COMPLETED || order.getStatus() == FurnitureStatus.SOLD
                || order.getStatus() == FurnitureStatus.CANCELLED) {
            throw ApiException.badRequest("order.already.closed");
        }

        FurnitureAssignmentEntity assignment = assignmentRepo
                .findByFurnitureOrderIdAndWorkerIdAndActiveTrue(orderId, workerId)
                .orElseThrow(() -> ApiException.notFound("assignment.not.found"));

        assignment.setActive(false);
        assignment.setUnassignedAt(LocalDateTime.now());
        assignment.setUpdatedBy(owner.getId());
        assignmentRepo.save(assignment);

        // Ishchi biriktirilsa, uning maosh hisob-kitoblarini yangilash kerak
        // Qolgan active assignmentlarning miqdoriga qarab proportional maosh qayta hisoblanadi
        LocalDate today = LocalDate.now();
        wageCalculationService.updateDailyWagesForWorker(workerId, owner.getWorkshopId(), today, owner.getId());

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
        String orderRef = order.getTitle() + " (#" + order.getOrderNumber() + ")";
        financialLogService.record(owner.getWorkshopId(), FinancialLogType.MATERIAL_USED,
                totalCost.negate(), materialDesc, order.getId(), orderRef, LocalDate.now(), owner.getId());

        // Recalculate actual material cost
        BigDecimal newActualCost = usageRepo.sumTotalCostByOrderId(orderId);
        order.setActualMaterialCost(newActualCost);
        order.setUpdatedBy(owner.getId());
        orderRepo.save(order);

        return toResponse(order);
    }

    @Override
    @Transactional
    public FurnitureOrderResponse removeMaterialUsage(UUID orderId, UUID usageId, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureOrderEntity order = findOrder(orderId, owner.getWorkshopId());

        if (order.getStatus() == FurnitureStatus.COMPLETED || order.getStatus() == FurnitureStatus.SOLD
                || order.getStatus() == FurnitureStatus.CANCELLED) {
            throw ApiException.badRequest("order.already.closed");
        }

        MaterialUsageEntity usage = usageRepo.findById(usageId)
                .orElseThrow(() -> ApiException.notFound("material.usage.not.found"));

        if (!usage.getFurnitureOrderId().equals(orderId)) {
            throw ApiException.forbidden("access.denied");
        }

        BigDecimal qty       = usage.getQuantityUsed();
        BigDecimal unitPrice = usage.getUnitPriceAtTime();
        BigDecimal totalCost = usage.getTotalCost();

        // Find warehouse item — including soft-deleted ones via native query
        Optional<WarehouseItemEntity> itemOpt = warehouseItemRepo
                .findByIdAndWorkshopIdIncludeDeleted(usage.getWarehouseItemId(), owner.getWorkshopId());

        if (itemOpt.isPresent()) {
            WarehouseItemEntity item = itemOpt.get();
            BigDecimal qtyBefore   = item.getQuantity();
            BigDecimal priceBefore = item.getAvgUnitPrice();

            if (item.getDeletedAt() != null) {
                // Item was deleted — restore it with the returned quantity
                item.setDeletedAt(null);
                item.setDeletedBy(null);
                item.setQuantity(qty);
                item.setAvgUnitPrice(unitPrice);
                item.setTotalValue(qty.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP));
                item.setUpdatedBy(owner.getId());
                qtyBefore  = BigDecimal.ZERO;
                priceBefore = unitPrice;
            } else {
                // Return quantity using weighted average
                BigDecimal newTotal  = qtyBefore.multiply(priceBefore).add(qty.multiply(unitPrice));
                BigDecimal qtyAfter  = qtyBefore.add(qty);
                BigDecimal priceAfter = qtyAfter.compareTo(BigDecimal.ZERO) > 0
                        ? newTotal.divide(qtyAfter, 2, RoundingMode.HALF_UP)
                        : unitPrice;
                item.setQuantity(qtyAfter);
                item.setAvgUnitPrice(priceAfter);
                item.setTotalValue(qtyAfter.multiply(priceAfter).setScale(2, RoundingMode.HALF_UP));
                item.setUpdatedBy(owner.getId());

                WarehouseTransactionEntity tx = WarehouseTransactionEntity.builder()
                        .itemId(item.getId())
                        .workshopId(owner.getWorkshopId())
                        .transactionType(TransactionType.IN)
                        .quantity(qty)
                        .unitPrice(unitPrice)
                        .totalCost(totalCost)
                        .qtyBefore(qtyBefore)
                        .qtyAfter(qtyAfter)
                        .priceBefore(priceBefore)
                        .priceAfter(priceAfter)
                        .furnitureOrderId(orderId)
                        .notes("Material qaytarildi: " + order.getTitle() + " (#" + order.getOrderNumber() + ")")
                        .build();
                tx.setCreatedBy(owner.getId());
                warehouseTxRepo.save(tx);
            }
            warehouseItemRepo.save(item);

            // Reverse financial log
            String desc = "Material qaytarildi: " + item.getName()
                    + " — " + qty.stripTrailingZeros().toPlainString() + " " + item.getUnitType()
                    + " | Buyurtma: " + order.getTitle() + " (#" + order.getOrderNumber() + ")";
            financialLogService.record(owner.getWorkshopId(), FinancialLogType.MATERIAL_USED,
                    totalCost, desc, order.getId(),
                    order.getTitle() + " (#" + order.getOrderNumber() + ")",
                    LocalDate.now(), owner.getId());
        }

        // Soft-delete the usage record
        usage.setDeletedAt(LocalDateTime.now());
        usage.setDeletedBy(owner.getId());
        usageRepo.save(usage);

        // Recalculate order material cost
        BigDecimal newActualCost = usageRepo.sumTotalCostByOrderId(orderId);
        order.setActualMaterialCost(newActualCost);
        order.setUpdatedBy(owner.getId());
        orderRepo.save(order);

        return toResponse(order);
    }

    @Override
    @Transactional
    public FurnitureOrderResponse adjustMaterialUsage(UUID orderId, UUID usageId, AdjustMaterialRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureOrderEntity order = findOrder(orderId, owner.getWorkshopId());

        if (order.getStatus() == FurnitureStatus.COMPLETED || order.getStatus() == FurnitureStatus.SOLD
                || order.getStatus() == FurnitureStatus.CANCELLED) {
            throw ApiException.badRequest("order.already.closed");
        }

        MaterialUsageEntity usage = usageRepo.findById(usageId)
                .orElseThrow(() -> ApiException.notFound("material.usage.not.found"));

        if (!usage.getFurnitureOrderId().equals(orderId)) {
            throw ApiException.forbidden("access.denied");
        }

        BigDecimal delta = request.getDelta();
        if (delta == null || delta.compareTo(BigDecimal.ZERO) == 0) {
            throw ApiException.badRequest("material.usage.qty.invalid");
        }

        BigDecimal newQty = usage.getQuantityUsed().add(delta);
        if (newQty.compareTo(BigDecimal.ZERO) <= 0) {
            throw ApiException.badRequest("material.usage.qty.invalid");
        }

        WarehouseItemEntity item = warehouseItemRepo.findByIdAndWorkshopId(usage.getWarehouseItemId(), owner.getWorkshopId())
                .orElseThrow(() -> ApiException.notFound("warehouse.item.not.found"));

        BigDecimal unitPrice = usage.getUnitPriceAtTime();
        BigDecimal absDelta = delta.abs();
        BigDecimal totalCostDelta = absDelta.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);

        BigDecimal qtyBefore  = item.getQuantity();
        BigDecimal priceBefore = item.getAvgUnitPrice();
        BigDecimal qtyAfter;
        BigDecimal priceAfter;
        TransactionType txType;

        if (delta.compareTo(BigDecimal.ZERO) > 0) {
            // Qo'shimcha sarflanmoqda — ombordan chiqaramiz
            qtyAfter  = qtyBefore.subtract(absDelta);
            priceAfter = priceBefore;
            txType     = TransactionType.OUT;
        } else {
            // Qisman qaytarilmoqda — omborga qaytaramiz (weighted avg)
            BigDecimal newTotal = qtyBefore.multiply(priceBefore).add(absDelta.multiply(unitPrice));
            qtyAfter  = qtyBefore.add(absDelta);
            priceAfter = qtyAfter.compareTo(BigDecimal.ZERO) > 0
                    ? newTotal.divide(qtyAfter, 2, RoundingMode.HALF_UP)
                    : unitPrice;
            txType = TransactionType.IN;
        }

        item.setQuantity(qtyAfter);
        item.setAvgUnitPrice(priceAfter);
        item.setTotalValue(qtyAfter.multiply(priceAfter).setScale(2, RoundingMode.HALF_UP));
        item.setUpdatedBy(owner.getId());
        warehouseItemRepo.save(item);

        WarehouseTransactionEntity tx = WarehouseTransactionEntity.builder()
                .itemId(item.getId())
                .workshopId(owner.getWorkshopId())
                .transactionType(txType)
                .quantity(absDelta)
                .unitPrice(unitPrice)
                .totalCost(totalCostDelta)
                .qtyBefore(qtyBefore)
                .qtyAfter(qtyAfter)
                .priceBefore(priceBefore)
                .priceAfter(priceAfter)
                .furnitureOrderId(orderId)
                .notes(delta.compareTo(BigDecimal.ZERO) > 0
                        ? "Qo'shimcha sarflandi: " + order.getTitle() + " (#" + order.getOrderNumber() + ")"
                        : "Qisman qaytarildi: " + order.getTitle() + " (#" + order.getOrderNumber() + ")")
                .build();
        tx.setCreatedBy(owner.getId());
        warehouseTxRepo.save(tx);

        BigDecimal newTotalCost = newQty.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
        usage.setQuantityUsed(newQty);
        usage.setTotalCost(newTotalCost);
        usage.setUpdatedBy(owner.getId());
        usageRepo.save(usage);

        String logDesc = delta.compareTo(BigDecimal.ZERO) > 0
                ? "Xomashyo sarflandi (+): " + item.getName()
                  + " — +" + absDelta.stripTrailingZeros().toPlainString() + " " + item.getUnitType()
                  + " | Buyurtma: " + order.getTitle() + " (#" + order.getOrderNumber() + ")"
                : "Xomashyo qaytarildi (-): " + item.getName()
                  + " — -" + absDelta.stripTrailingZeros().toPlainString() + " " + item.getUnitType()
                  + " | Buyurtma: " + order.getTitle() + " (#" + order.getOrderNumber() + ")";

        financialLogService.record(
                owner.getWorkshopId(),
                FinancialLogType.MATERIAL_USED,
                delta.compareTo(BigDecimal.ZERO) > 0 ? totalCostDelta.negate() : totalCostDelta,
                logDesc, order.getId(), order.getTitle() + " (#" + order.getOrderNumber() + ")",
                LocalDate.now(), owner.getId()
        );

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

        // Each worker gets their own commission percentage (not split) — avoid duplicates
        Set<UUID> processedWorkers = new HashSet<>();
        for (FurnitureAssignmentEntity assignment : activeAssignments) {
            UUID workerId = assignment.getWorkerId();
            if (processedWorkers.contains(workerId)) continue;
            processedWorkers.add(workerId);

            userRepo.findById(workerId).ifPresent(worker -> {
                // Skip if commission already exists for this worker/order/date
                if (earningRepo.findByWorkerIdAndFurnitureOrderIdAndEarnDate(workerId, order.getId(), earnDate).isPresent()) {
                    return;
                }

                BigDecimal commissionPct = assignment.getCommissionPct() != null
                        ? assignment.getCommissionPct()
                        : (worker.getCommissionPct() != null ? worker.getCommissionPct() : BigDecimal.ZERO);
                if (commissionPct.compareTo(BigDecimal.ZERO) == 0) return;

                // Each worker gets their full commission percentage
                BigDecimal commissionAmount = order.getSalePrice()
                        .multiply(commissionPct)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

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
                        .description("Buyurtma komissiyasi: " + order.getOrderNumber())
                        .build();
                earning.setCreatedBy(owner.getId());
                earningRepo.save(earning);
            });
        }
    }

    @Override
    @Transactional
    public FurnitureOrderResponse togglePin(UUID orderId, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureOrderEntity order = findOrder(orderId, owner.getWorkshopId());
        order.setPinned(!order.isPinned());
        order.setUpdatedBy(owner.getId());
        return toResponse(orderRepo.save(order));
    }

    @Override
    @Transactional
    public FurnitureOrderResponse uploadImage(UUID orderId, MultipartFile file, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureOrderEntity order = findOrder(orderId, owner.getWorkshopId());

        if (order.getStatus() == FurnitureStatus.COMPLETED || order.getStatus() == FurnitureStatus.SOLD
                || order.getStatus() == FurnitureStatus.CANCELLED) {
            throw ApiException.badRequest("order.already.closed");
        }

        long existingCount = imageRepo.countByFurnitureOrderId(orderId);
        if (existingCount >= MAX_IMAGES_PER_ORDER) {
            throw ApiException.badRequest("order.image.limit.reached");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw ApiException.badRequest("invalid.image.type");
        }

        project.mebel.minio.MinioStorageService.StoredFurnitureImage stored =
                minioStorageService.saveFurnitureImage(orderId, file);

        boolean isPrimary = existingCount == 0;
        FurnitureImageEntity image = FurnitureImageEntity.builder()
                .furnitureOrderId(orderId)
                .minioBucket(stored.minioBucket())
                .minioObjectKey(stored.minioObjectKey())
                .originalFilename(file.getOriginalFilename() != null ? file.getOriginalFilename() : "image")
                .mimeType(contentType)
                .fileSizeBytes(file.getSize())
                .sortOrder((short) existingCount)
                .primary(isPrimary)
                .storedPath(stored.storedPath())
                .build();
        image.setCreatedBy(owner.getId());
        imageRepo.save(image);

        return toResponse(order);
    }

    @Override
    @Transactional
    public FurnitureOrderResponse deleteImage(UUID orderId, UUID imageId, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureOrderEntity order = findOrder(orderId, owner.getWorkshopId());

        if (order.getStatus() == FurnitureStatus.COMPLETED || order.getStatus() == FurnitureStatus.SOLD
                || order.getStatus() == FurnitureStatus.CANCELLED) {
            throw ApiException.badRequest("order.already.closed");
        }

        FurnitureImageEntity image = imageRepo.findById(imageId)
                .filter(img -> img.getFurnitureOrderId().equals(orderId))
                .orElseThrow(() -> ApiException.notFound("image.not.found"));

        // MUHIM: MinIO'dan o'chirmaydi, faqat DB'da soft-delete qiladi
        // Rasmlar permanent saqlanadi, recovery mumkin bo'ladi
        boolean wasPrimary = image.isPrimary();
        image.setDeletedAt(LocalDateTime.now());
        image.setDeletedBy(owner.getId());
        imageRepo.save(image);

        if (wasPrimary) {
            imageRepo.findAllByFurnitureOrderId(orderId).stream()
                    .findFirst()
                    .ifPresent(first -> {
                        first.setPrimary(true);
                        imageRepo.save(first);
                    });
        }

        return toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public FurnitureOrderService.ImageData serveImage(UUID orderId, UUID imageId) {
        FurnitureImageEntity image = imageRepo.findById(imageId)
                .filter(img -> img.getFurnitureOrderId().equals(orderId))
                .orElseThrow(() -> ApiException.notFound("image.not.found"));

        byte[] bytes = minioStorageService.getFurnitureImageBytes(
                image.getStoredPath(), image.getMinioBucket(), image.getMinioObjectKey());
        String mimeType = image.getMimeType() != null ? image.getMimeType() : "image/jpeg";
        return new FurnitureOrderService.ImageData(bytes, mimeType);
    }

    private void validateStatusTransition(FurnitureStatus current, FurnitureStatus next) {
        boolean valid = switch (current) {
            case DRAFT -> next == FurnitureStatus.IN_PROGRESS || next == FurnitureStatus.CANCELLED;
            case IN_PROGRESS -> next == FurnitureStatus.COMPLETED || next == FurnitureStatus.CANCELLED || next == FurnitureStatus.SOLD;
            case COMPLETED -> next == FurnitureStatus.SOLD;
            case SOLD, CANCELLED -> false;
        };
        if (!valid) throw ApiException.badRequest("invalid.status.transition");
    }

    private String generateOrderNumber(UUID workshopId) {
        // Use timestamp + random suffix to avoid race conditions
        String prefix = "ORD-" + LocalDate.now().getYear() + "-";
        String timestamp = String.valueOf(System.currentTimeMillis() % 100000);
        String random = String.format("%03d", (int) (Math.random() * 1000));
        return prefix + timestamp + random;
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
        List<FurnitureImageEntity> imageEntities = imageRepo.findAllByFurnitureOrderId(o.getId());

        // Batch load workers to avoid N+1
        List<UUID> workerIds = assignments.stream().map(FurnitureAssignmentEntity::getWorkerId).distinct().toList();
        Map<UUID, UserEntity> workersMap = userRepo.findAllById(workerIds).stream()
                .collect(Collectors.toMap(UserEntity::getId, w -> w));

        // Batch load warehouse items to avoid N+1
        List<UUID> itemIds = usages.stream().map(MaterialUsageEntity::getWarehouseItemId).distinct().toList();
        Map<UUID, WarehouseItemEntity> itemsMap = warehouseItemRepo.findAllById(itemIds).stream()
                .collect(Collectors.toMap(WarehouseItemEntity::getId, i -> i));

        LocalDate maxDate = o.getCompletedAt() != null ? o.getCompletedAt().toLocalDate() : LocalDate.now();

        BigDecimal totalWageCost = BigDecimal.ZERO;
        BigDecimal totalCommissionCost = BigDecimal.ZERO;

        List<FurnitureOrderResponse.AssignedWorkerResponse> assignedWorkers = new ArrayList<>();
        for (FurnitureAssignmentEntity a : assignments) {
            UserEntity worker = workersMap.get(a.getWorkerId());
            String workerName = worker != null ? worker.getFullName() : null;

            int daysWorked = 0;
            BigDecimal wageCost = BigDecimal.ZERO;
            BigDecimal commissionCost = BigDecimal.ZERO;
            List<FurnitureOrderResponse.WageBreakdownItem> wageBreakdown = new ArrayList<>();

            if (worker != null) {
                // Get actual earnings records for this worker and order
                List<EarningEntity> earnings = earningRepo.findByWorkerIdAndFurnitureOrderIdOrderByEarnDateAsc(
                        a.getWorkerId(), o.getId());

                // Build wage breakdown from actual earnings
                for (EarningEntity earning : earnings) {
                    daysWorked++;
                    wageCost = wageCost.add(earning.getTotalAmount());

                    // Build breakdown item from earnings record
                    wageBreakdown.add(FurnitureOrderResponse.WageBreakdownItem.builder()
                            .date(earning.getEarnDate().toString())
                            .fullDailyRate(earning.getDailyRate())
                            .activeAssignments(earning.getEarnDate() != null ?
                                assignmentRepo.countActiveAssignmentsOnDate(a.getWorkerId(),
                                    earning.getEarnDate().atTime(12, 0)) : 1)
                            .earnedAmount(earning.getTotalAmount())
                            .hoursWorked(earning.getHoursWorked())
                            .hoursTarget(earning.getHoursTarget())
                            .build());
                }

                if (o.getSalePrice() != null && a.getCommissionPct() != null
                        && a.getCommissionPct().compareTo(BigDecimal.ZERO) > 0) {
                    commissionCost = o.getSalePrice()
                            .multiply(a.getCommissionPct())
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                }
            }

            // Current active IN_PROGRESS assignments (for display only)
            int currentActiveAssignments = worker != null
                    ? assignmentRepo.countActiveInProgressAssignments(worker.getId())
                    : 0;
            int otherAssignmentsCount = Math.max(0, currentActiveAssignments - 1);

            assignedWorkers.add(FurnitureOrderResponse.AssignedWorkerResponse.builder()
                    .assignmentId(a.getId())
                    .workerId(a.getWorkerId())
                    .workerName(workerName)
                    .assignedAt(a.getAssignedAt())
                    .unassignedAt(a.getUnassignedAt())
                    .commissionPct(a.getCommissionPct())
                    .active(a.isActive())
                    .daysWorked(daysWorked)
                    .wageCost(wageCost)
                    .commissionCost(commissionCost)
                    .workerDailySalary(worker != null ? worker.getDailySalary() : null)
                    .workerMonthlySalary(worker != null ? worker.getMonthlySalary() : null)
                    .otherAssignmentsCount(otherAssignmentsCount)
                    .workerPayType(worker != null ? worker.getPayType().name() : null)
                    .wageBreakdown(wageBreakdown)
                    .build());

            totalWageCost = totalWageCost.add(wageCost);
            totalCommissionCost = totalCommissionCost.add(commissionCost);
        }

        BigDecimal salePrice = o.getSalePrice() != null ? o.getSalePrice() : BigDecimal.ZERO;
        BigDecimal materialCost = o.getActualMaterialCost() != null ? o.getActualMaterialCost() : BigDecimal.ZERO;
        BigDecimal netProfit = salePrice.subtract(materialCost).subtract(totalWageCost).subtract(totalCommissionCost);

        List<FurnitureOrderResponse.MaterialUsageResponse> materialUsages = usages.stream()
                .map(m -> {
                    boolean isPending = m.getWarehouseItemId() == null;
                    WarehouseItemEntity item = isPending ? null : itemsMap.get(m.getWarehouseItemId());
                    return FurnitureOrderResponse.MaterialUsageResponse.builder()
                            .id(m.getId())
                            .warehouseItemId(m.getWarehouseItemId())
                            .itemName(isPending ? m.getMaterialName() : (item != null ? item.getName() : null))
                            .unitType(item != null ? item.getUnitType().name() : null)
                            .quantityUsed(m.getQuantityUsed())
                            .unitPriceAtTime(m.getUnitPriceAtTime())
                            .totalCost(m.getTotalCost())
                            .notes(m.getNotes())
                            .givenAt(m.getGivenAt())
                            .pending(isPending)
                            .materialName(m.getMaterialName())
                            .lengthMm(m.getLengthMm())
                            .widthMm(m.getWidthMm())
                            .heightMm(m.getHeightMm())
                            .build();
                }).toList();

        List<FurnitureOrderResponse.ImageInfo> images = imageEntities.stream()
                .map(img -> FurnitureOrderResponse.ImageInfo.builder()
                        .id(img.getId())
                        .url(appBaseUrl + String.format(IMAGE_API_PATH, o.getId(), img.getId()))
                        .originalFilename(img.getOriginalFilename())
                        .primary(img.isPrimary())
                        .sortOrder(img.getSortOrder())
                        .build())
                .toList();

        return FurnitureOrderResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .title(o.getTitle())
                .description(o.getDescription())
                .status(o.getStatus())
                .pinned(o.isPinned())
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
                .images(images)
                .build();
    }
}
