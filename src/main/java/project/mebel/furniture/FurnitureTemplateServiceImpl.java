package project.mebel.furniture;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.common.enums.UserRole;
import project.mebel.exception.ApiException;
import project.mebel.furniture.dto.*;
import project.mebel.user.UserEntity;
import project.mebel.utils.Utils;
import project.mebel.warehouse.WarehouseItemRepository;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FurnitureTemplateServiceImpl implements FurnitureTemplateService {

    private final FurnitureTemplateRepository templateRepo;
    private final TemplateMaterialRepository materialRepo;
    private final WarehouseItemRepository warehouseItemRepo;
    private final Utils utils;

    @Override
    @Transactional
    public FurnitureTemplateResponse createTemplate(FurnitureTemplateRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);

        FurnitureTemplateEntity template = FurnitureTemplateEntity.builder()
                .workshopId(owner.getWorkshopId())
                .name(request.getName())
                .description(request.getDescription())
                .estimatedProdDays(request.getEstimatedProdDays())
                .build();
        template.setCreatedBy(owner.getId());
        return toResponse(templateRepo.save(template), List.of());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FurnitureTemplateResponse> getAllTemplates(Principal principal) {
        UserEntity owner = requireOwner(principal);
        return templateRepo.findAllByWorkshopId(owner.getWorkshopId())
                .stream()
                .map(t -> toResponse(t, materialRepo.findAllByTemplateId(t.getId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FurnitureTemplateResponse getTemplateById(UUID id, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureTemplateEntity template = findTemplate(id, owner.getWorkshopId());
        return toResponse(template, materialRepo.findAllByTemplateId(id));
    }

    @Override
    @Transactional
    public FurnitureTemplateResponse updateTemplate(UUID id, FurnitureTemplateRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureTemplateEntity template = findTemplate(id, owner.getWorkshopId());

        if (request.getName() != null) template.setName(request.getName());
        if (request.getDescription() != null) template.setDescription(request.getDescription());
        if (request.getEstimatedProdDays() != null) template.setEstimatedProdDays(request.getEstimatedProdDays());
        template.setUpdatedBy(owner.getId());

        return toResponse(templateRepo.save(template), materialRepo.findAllByTemplateId(id));
    }

    @Override
    @Transactional
    public void deleteTemplate(UUID id, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureTemplateEntity template = findTemplate(id, owner.getWorkshopId());
        template.setDeletedAt(LocalDateTime.now());
        template.setDeletedBy(owner.getId());
        templateRepo.save(template);
    }

    @Override
    @Transactional
    public FurnitureTemplateResponse addMaterial(UUID templateId, TemplateMaterialRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureTemplateEntity template = findTemplate(templateId, owner.getWorkshopId());

        warehouseItemRepo.findByIdAndWorkshopId(request.getWarehouseItemId(), owner.getWorkshopId())
                .orElseThrow(() -> ApiException.notFound("warehouse.item.not.found"));

        TemplateMaterialEntity material = TemplateMaterialEntity.builder()
                .templateId(templateId)
                .warehouseItemId(request.getWarehouseItemId())
                .quantityNeeded(request.getQuantityNeeded())
                .notes(request.getNotes())
                .build();
        material.setCreatedBy(owner.getId());
        materialRepo.save(material);

        return toResponse(template, materialRepo.findAllByTemplateId(templateId));
    }

    @Override
    @Transactional
    public void removeMaterial(UUID templateId, UUID materialId, Principal principal) {
        UserEntity owner = requireOwner(principal);
        findTemplate(templateId, owner.getWorkshopId());

        TemplateMaterialEntity material = materialRepo.findById(materialId)
                .filter(m -> m.getTemplateId().equals(templateId))
                .orElseThrow(() -> ApiException.notFound("template.material.not.found"));
        materialRepo.delete(material);
    }

    private FurnitureTemplateEntity findTemplate(UUID id, UUID workshopId) {
        return templateRepo.findByIdAndWorkshopId(id, workshopId)
                .orElseThrow(() -> ApiException.notFound("furniture.template.not.found"));
    }

    private UserEntity requireOwner(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        if (user.getRole() != UserRole.OWNER) throw ApiException.forbidden("access.denied");
        if (user.getWorkshopId() == null) throw ApiException.badRequest("owner.has.no.workshop");
        return user;
    }

    private FurnitureTemplateResponse toResponse(FurnitureTemplateEntity t, List<TemplateMaterialEntity> materials) {
        List<FurnitureTemplateResponse.TemplateMaterialResponse> materialResponses = materials.stream()
                .map(m -> FurnitureTemplateResponse.TemplateMaterialResponse.builder()
                        .id(m.getId())
                        .warehouseItemId(m.getWarehouseItemId())
                        .quantityNeeded(m.getQuantityNeeded())
                        .notes(m.getNotes())
                        .build())
                .toList();

        return FurnitureTemplateResponse.builder()
                .id(t.getId())
                .name(t.getName())
                .description(t.getDescription())
                .estimatedProdDays(t.getEstimatedProdDays())
                .active(t.isActive())
                .materials(materialResponses)
                .build();
    }
}
