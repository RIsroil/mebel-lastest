package project.mebel.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import project.mebel.admin.dto.AdminBlockRequest;
import project.mebel.admin.dto.AdminCreateUserRequest;
import project.mebel.admin.dto.AdminUserResponse;
import project.mebel.admin.dto.AdminUserUpdateRequest;
import project.mebel.common.enums.UserRole;
import project.mebel.workshop.dto.WorkshopRequest;
import project.mebel.workshop.dto.WorkshopResponse;

import java.security.Principal;
import java.util.UUID;

public interface AdminService {

    Page<AdminUserResponse> getAllUsers(UserRole role, UUID workshopId, Boolean active, Pageable pageable);

    AdminUserResponse getUserById(UUID id);

    AdminUserResponse createUser(AdminCreateUserRequest request, Principal principal);

    AdminUserResponse updateUser(UUID id, AdminUserUpdateRequest request, Principal principal);

    void deleteUser(UUID id, Principal principal);

    void blockUser(UUID id, AdminBlockRequest request, Principal principal);

    void unblockUser(UUID id, Principal principal);

    WorkshopResponse createWorkshop(WorkshopRequest request, Principal principal);
}
