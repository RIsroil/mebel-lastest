package project.mebel.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.admin.dto.AdminBlockRequest;
import project.mebel.admin.dto.AdminCreateUserRequest;
import project.mebel.admin.dto.AdminUserResponse;
import project.mebel.admin.dto.AdminUserUpdateRequest;
import project.mebel.common.enums.UserRole;
import project.mebel.exception.ApiException;
import project.mebel.user.UserEntity;
import project.mebel.user.UserRepository;
import project.mebel.utils.Utils;
import project.mebel.workshop.WorkshopEntity;
import project.mebel.workshop.WorkshopRepository;
import project.mebel.workshop.dto.WorkshopRequest;
import project.mebel.workshop.dto.WorkshopResponse;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final WorkshopRepository workshopRepository;
    private final PasswordEncoder passwordEncoder;
    private final Utils utils;

    private void requireAdmin(UserEntity user) {
        if (user.getRole() != UserRole.ADMIN) {
            throw ApiException.forbidden("access.denied");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getAllUsers(UserRole role, UUID workshopId, Boolean active, Pageable pageable) {
        Specification<UserEntity> spec = (root, query, cb) -> cb.conjunction();
        if (role != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("role"), role));
        }
        if (workshopId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("workshopId"), workshopId));
        }
        if (active != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("active"), active));
        }
        return userRepository.findAll(spec, pageable).map(u -> toResponse(u, null));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(UUID id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("user.not.found"));
        String workshopName = null;
        if (user.getWorkshopId() != null) {
            workshopName = workshopRepository.findById(user.getWorkshopId())
                    .map(WorkshopEntity::getName)
                    .orElse(null);
        }
        return toResponse(user, workshopName);
    }

    @Override
    @Transactional
    public AdminUserResponse createUser(AdminCreateUserRequest request, Principal principal) {
        UserEntity admin = utils.getUserFromPrincipal(principal);
        requireAdmin(admin);

        if (userRepository.findByUsernameAndDeletedAtIsNull(request.getUsername()).isPresent()) {
            throw ApiException.conflict("username.already.exists");
        }

        UserEntity user = UserEntity.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(request.getRole() != null ? request.getRole() : UserRole.WORKER)
                .workshopId(request.getWorkshopId())
                .payType(request.getPayType())
                .hourlyRate(request.getHourlyRate())
                .dailyRate(request.getDailyRate())
                .dailyHoursTarget(request.getDailyHoursTarget() != null
                        ? request.getDailyHoursTarget()
                        : new java.math.BigDecimal("8.0"))
                .dailySalary(request.getDailySalary())
                .commissionPct(request.getCommissionPct())
                .hybridPay(request.isHybridPay())
                .build();
        user.setCreatedBy(admin.getId());

        UserEntity saved = userRepository.save(user);

        String workshopName = null;
        if (saved.getWorkshopId() != null) {
            workshopName = workshopRepository.findById(saved.getWorkshopId())
                    .map(WorkshopEntity::getName)
                    .orElse(null);
        }
        return toResponse(saved, workshopName);
    }

    @Override
    @Transactional
    public AdminUserResponse updateUser(UUID id, AdminUserUpdateRequest request, Principal principal) {
        UserEntity admin = utils.getUserFromPrincipal(principal);
        requireAdmin(admin);

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("user.not.found"));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getRole() != null) user.setRole(request.getRole());
        if (request.getWorkshopId() != null) user.setWorkshopId(request.getWorkshopId());
        if (request.getActive() != null) user.setActive(request.getActive());
        if (request.getPayType() != null) user.setPayType(request.getPayType());
        if (request.getHourlyRate() != null) user.setHourlyRate(request.getHourlyRate());
        if (request.getDailyRate() != null) user.setDailyRate(request.getDailyRate());
        if (request.getDailyHoursTarget() != null) user.setDailyHoursTarget(request.getDailyHoursTarget());
        if (request.getDailySalary() != null) user.setDailySalary(request.getDailySalary());
        if (request.getCommissionPct() != null) user.setCommissionPct(request.getCommissionPct());
        if (request.getHybridPay() != null) user.setHybridPay(request.getHybridPay());
        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }
        user.setUpdatedBy(admin.getId());

        UserEntity saved = userRepository.save(user);

        String workshopName = null;
        if (saved.getWorkshopId() != null) {
            workshopName = workshopRepository.findById(saved.getWorkshopId())
                    .map(WorkshopEntity::getName)
                    .orElse(null);
        }
        return toResponse(saved, workshopName);
    }

    @Override
    @Transactional
    public void deleteUser(UUID id, Principal principal) {
        UserEntity admin = utils.getUserFromPrincipal(principal);
        requireAdmin(admin);

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("user.not.found"));

        user.setDeletedAt(LocalDateTime.now());
        user.setDeletedBy(admin.getId());
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void blockUser(UUID id, AdminBlockRequest request, Principal principal) {
        UserEntity admin = utils.getUserFromPrincipal(principal);
        requireAdmin(admin);

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("user.not.found"));

        int days = (request.getBlockDays() != null && request.getBlockDays() > 0) ? request.getBlockDays() : 1;
        user.setBlocked(true);
        user.setBlockedUntil(LocalDateTime.now().plusDays(days));
        user.setBlockReason(request.getReason());
        user.setUpdatedBy(admin.getId());
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void unblockUser(UUID id, Principal principal) {
        UserEntity admin = utils.getUserFromPrincipal(principal);
        requireAdmin(admin);

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("user.not.found"));

        user.setBlocked(false);
        user.setBlockedUntil(null);
        user.setBlockReason(null);
        user.setFailedLoginCount((short) 0);
        user.setUpdatedBy(admin.getId());
        userRepository.save(user);
    }

    @Override
    @Transactional
    public WorkshopResponse createWorkshop(WorkshopRequest request, Principal principal) {
        UserEntity admin = utils.getUserFromPrincipal(principal);
        requireAdmin(admin);

        WorkshopEntity workshop = WorkshopEntity.builder()
                .name(request.getName())
                .address(request.getAddress())
                .phone(request.getPhone())
                .description(request.getDescription())
                .ownerId(admin.getId())
                .build();
        workshop.setCreatedBy(admin.getId());

        WorkshopEntity saved = workshopRepository.save(workshop);
        return toWorkshopResponse(saved);
    }

    private AdminUserResponse toResponse(UserEntity u, String workshopName) {
        return AdminUserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .role(u.getRole())
                .active(u.isActive())
                .blocked(u.isBlocked())
                .blockedUntil(u.getBlockedUntil())
                .blockReason(u.getBlockReason())
                .workshopId(u.getWorkshopId())
                .workshopName(workshopName)
                .payType(u.getPayType())
                .hourlyRate(u.getHourlyRate())
                .dailyRate(u.getDailyRate())
                .dailyHoursTarget(u.getDailyHoursTarget())
                .dailySalary(u.getDailySalary())
                .commissionPct(u.getCommissionPct())
                .hybridPay(u.isHybridPay())
                .createdAt(u.getCreatedAt())
                .build();
    }

    private WorkshopResponse toWorkshopResponse(WorkshopEntity w) {
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
