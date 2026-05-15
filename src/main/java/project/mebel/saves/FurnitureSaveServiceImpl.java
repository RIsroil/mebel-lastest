package project.mebel.saves;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.common.enums.UserRole;
import project.mebel.exception.ApiException;
import project.mebel.saves.dto.FurnitureSaveRequest;
import project.mebel.saves.dto.FurnitureSaveResponse;
import project.mebel.saves.dto.SaveCutRequest;
import project.mebel.user.UserEntity;
import project.mebel.utils.Utils;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FurnitureSaveServiceImpl implements FurnitureSaveService {

    private final FurnitureSaveRepository saveRepo;
    private final SaveCutRepository cutRepo;
    private final Utils utils;

    @Override
    @Transactional
    public FurnitureSaveResponse create(FurnitureSaveRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureSaveEntity save = FurnitureSaveEntity.builder()
                .workshopId(owner.getWorkshopId())
                .name(request.getName())
                .description(request.getDescription())
                .build();
        save.setCreatedBy(owner.getId());
        return toResponse(saveRepo.save(save), List.of());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FurnitureSaveResponse> getAll(Principal principal) {
        UserEntity owner = requireOwner(principal);
        return saveRepo.findAllByWorkshopIdOrderByCreatedAtDesc(owner.getWorkshopId())
                .stream()
                .map(s -> toResponse(s, cutRepo.findAllBySaveIdOrderByCreatedAtAsc(s.getId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FurnitureSaveResponse getById(UUID id, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureSaveEntity save = findSave(id, owner.getWorkshopId());
        return toResponse(save, cutRepo.findAllBySaveIdOrderByCreatedAtAsc(id));
    }

    @Override
    @Transactional
    public FurnitureSaveResponse update(UUID id, FurnitureSaveRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureSaveEntity save = findSave(id, owner.getWorkshopId());
        if (request.getName() != null) save.setName(request.getName());
        if (request.getDescription() != null) save.setDescription(request.getDescription());
        save.setUpdatedBy(owner.getId());
        return toResponse(saveRepo.save(save), cutRepo.findAllBySaveIdOrderByCreatedAtAsc(id));
    }

    @Override
    @Transactional
    public void delete(UUID id, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureSaveEntity save = findSave(id, owner.getWorkshopId());
        save.setDeletedAt(LocalDateTime.now());
        save.setDeletedBy(owner.getId());
        saveRepo.save(save);
    }

    @Override
    @Transactional
    public FurnitureSaveResponse addCut(UUID saveId, SaveCutRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureSaveEntity save = findSave(saveId, owner.getWorkshopId());

        SaveCutEntity cut = SaveCutEntity.builder()
                .saveId(saveId)
                .materialName(request.getMaterialName())
                .lengthMm(request.getLengthMm())
                .widthMm(request.getWidthMm())
                .heightMm(request.getHeightMm())
                .quantity(request.getQuantity() != null ? request.getQuantity() : 1)
                .notes(request.getNotes())
                .build();
        cut.setCreatedBy(owner.getId());
        cutRepo.save(cut);

        return toResponse(save, cutRepo.findAllBySaveIdOrderByCreatedAtAsc(saveId));
    }

    @Override
    @Transactional
    public FurnitureSaveResponse updateCut(UUID saveId, UUID cutId, SaveCutRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureSaveEntity save = findSave(saveId, owner.getWorkshopId());

        SaveCutEntity cut = cutRepo.findById(cutId)
                .filter(c -> c.getSaveId().equals(saveId))
                .orElseThrow(() -> ApiException.notFound("save.cut.not.found"));

        if (request.getMaterialName() != null) cut.setMaterialName(request.getMaterialName());
        if (request.getLengthMm() != null) cut.setLengthMm(request.getLengthMm());
        if (request.getWidthMm() != null) cut.setWidthMm(request.getWidthMm());
        if (request.getHeightMm() != null) cut.setHeightMm(request.getHeightMm());
        if (request.getQuantity() != null) cut.setQuantity(request.getQuantity());
        if (request.getNotes() != null) cut.setNotes(request.getNotes());
        cut.setUpdatedBy(owner.getId());
        cutRepo.save(cut);

        return toResponse(save, cutRepo.findAllBySaveIdOrderByCreatedAtAsc(saveId));
    }

    @Override
    @Transactional
    public FurnitureSaveResponse removeCut(UUID saveId, UUID cutId, Principal principal) {
        UserEntity owner = requireOwner(principal);
        FurnitureSaveEntity save = findSave(saveId, owner.getWorkshopId());

        SaveCutEntity cut = cutRepo.findById(cutId)
                .filter(c -> c.getSaveId().equals(saveId))
                .orElseThrow(() -> ApiException.notFound("save.cut.not.found"));
        cutRepo.delete(cut);

        return toResponse(save, cutRepo.findAllBySaveIdOrderByCreatedAtAsc(saveId));
    }

    private FurnitureSaveEntity findSave(UUID id, UUID workshopId) {
        return saveRepo.findByIdAndWorkshopId(id, workshopId)
                .orElseThrow(() -> ApiException.notFound("furniture.save.not.found"));
    }

    private UserEntity requireOwner(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        if (user.getRole() != UserRole.OWNER) throw ApiException.forbidden("access.denied");
        if (user.getWorkshopId() == null) throw ApiException.badRequest("owner.has.no.workshop");
        return user;
    }

    private FurnitureSaveResponse toResponse(FurnitureSaveEntity s, List<SaveCutEntity> cuts) {
        List<FurnitureSaveResponse.SaveCutResponse> cutResponses = cuts.stream()
                .map(c -> FurnitureSaveResponse.SaveCutResponse.builder()
                        .id(c.getId())
                        .materialName(c.getMaterialName())
                        .lengthMm(c.getLengthMm())
                        .widthMm(c.getWidthMm())
                        .heightMm(c.getHeightMm())
                        .quantity(c.getQuantity())
                        .notes(c.getNotes())
                        .build())
                .toList();

        return FurnitureSaveResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .description(s.getDescription())
                .active(s.isActive())
                .createdAt(s.getCreatedAt())
                .cuts(cutResponses)
                .build();
    }
}
