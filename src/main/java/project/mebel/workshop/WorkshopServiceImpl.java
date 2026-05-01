package project.mebel.workshop;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.common.enums.UserRole;
import project.mebel.exception.ApiException;
import project.mebel.user.UserEntity;
import project.mebel.user.UserRepository;
import project.mebel.utils.Utils;
import project.mebel.workshop.dto.WorkshopRequest;
import project.mebel.workshop.dto.WorkshopResponse;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WorkshopServiceImpl implements WorkshopService {

    private final WorkshopRepository workshopRepository;
    private final UserRepository userRepository;
    private final Utils utils;

    @Override
    @Transactional
    public WorkshopResponse create(WorkshopRequest request, Principal principal) {
        UserEntity owner = utils.getUserFromPrincipal(principal);
        requireOwner(owner);

        WorkshopEntity workshop = WorkshopEntity.builder()
                .name(request.getName())
                .address(request.getAddress())
                .phone(request.getPhone())
                .description(request.getDescription())
                .ownerId(owner.getId())
                .build();
        workshop.setCreatedBy(owner.getId());

        WorkshopEntity saved = workshopRepository.save(workshop);

        // Workshop yaratilganda Owner ning workshop_id si yangilanadi (agar birinchi workshop bo'lsa)
        if (owner.getWorkshopId() == null) {
            owner.setWorkshopId(saved.getId());
            owner.setUpdatedBy(owner.getId());
            userRepository.save(owner);
        }

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkshopResponse> getAll(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);

        if (user.getRole() == UserRole.ADMIN) {
            return workshopRepository.findAll().stream().map(this::toResponse).toList();
        }
        if (user.getRole() == UserRole.OWNER) {
            return workshopRepository.findAllByOwnerId(user.getId()).stream().map(this::toResponse).toList();
        }
        throw ApiException.forbidden("access.denied");
    }

    @Override
    @Transactional(readOnly = true)
    public WorkshopResponse getById(UUID id, Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        WorkshopEntity workshop = findAndAuthorize(id, user);
        return toResponse(workshop);
    }

    @Override
    @Transactional
    public WorkshopResponse update(UUID id, WorkshopRequest request, Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        WorkshopEntity workshop = findAndAuthorize(id, user);

        if (request.getName() != null) workshop.setName(request.getName());
        if (request.getAddress() != null) workshop.setAddress(request.getAddress());
        if (request.getPhone() != null) workshop.setPhone(request.getPhone());
        if (request.getDescription() != null) workshop.setDescription(request.getDescription());
        workshop.setUpdatedBy(user.getId());

        return toResponse(workshopRepository.save(workshop));
    }

    @Override
    @Transactional
    public void delete(UUID id, Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        WorkshopEntity workshop = findAndAuthorize(id, user);

        workshop.setDeletedAt(LocalDateTime.now());
        workshop.setDeletedBy(user.getId());
        workshopRepository.save(workshop);
    }

    private WorkshopEntity findAndAuthorize(UUID id, UserEntity user) {
        if (user.getRole() == UserRole.ADMIN) {
            return workshopRepository.findById(id)
                    .orElseThrow(() -> ApiException.notFound("workshop.not.found"));
        }
        if (user.getRole() == UserRole.OWNER) {
            return workshopRepository.findByIdAndOwnerId(id, user.getId())
                    .orElseThrow(() -> ApiException.notFound("workshop.not.found"));
        }
        throw ApiException.forbidden("access.denied");
    }

    private void requireOwner(UserEntity user) {
        if (user.getRole() != UserRole.OWNER) {
            throw ApiException.forbidden("access.denied");
        }
    }

    private WorkshopResponse toResponse(WorkshopEntity w) {
        return WorkshopResponse.builder()
                .id(w.getId())
                .name(w.getName())
                .address(w.getAddress())
                .phone(w.getPhone())
                .description(w.getDescription())
                .active(w.isActive())
                .ownerId(w.getOwnerId())
                .createdAt(w.getCreatedAt())
                .build();
    }
}
