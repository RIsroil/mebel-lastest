package project.mebel.admin;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.mebel.admin.dto.AdminBlockRequest;
import project.mebel.admin.dto.AdminCreateUserRequest;
import project.mebel.admin.dto.AdminUserResponse;
import project.mebel.admin.dto.AdminUserUpdateRequest;
import project.mebel.common.enums.UserRole;
import project.mebel.workshop.dto.WorkshopRequest;
import project.mebel.workshop.dto.WorkshopResponse;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin boshqaruv paneli (ADMIN va OWNER rollari)")
public class AdminController {

    private final AdminService adminService;

    // ─── USERS ────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    @Operation(summary = "Foydalanuvchilar ro'yxati. ADMIN – hammani; OWNER – faqat o'z workshopini. Filter: role, workshopId (faqat ADMIN uchun), active")
    public ResponseEntity<Page<AdminUserResponse>> getAllUsers(
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UUID workshopId,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Principal principal) {
        return ResponseEntity.ok(adminService.getAllUsers(role, workshopId, active, pageable, principal));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Foydalanuvchini ID bo'yicha ko'rish")
    public ResponseEntity<AdminUserResponse> getUserById(@PathVariable UUID id, Principal principal) {
        return ResponseEntity.ok(adminService.getUserById(id, principal));
    }

    @PostMapping("/users")
    @Operation(summary = "Yangi foydalanuvchi yaratish. ADMIN – istalgan rol; OWNER – faqat WORKER, o'z workshopiga")
    public ResponseEntity<AdminUserResponse> createUser(@RequestBody AdminCreateUserRequest request,
                                                        Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createUser(request, principal));
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Foydalanuvchi ma'lumotlarini yangilash")
    public ResponseEntity<AdminUserResponse> updateUser(@PathVariable UUID id,
                                                        @RequestBody AdminUserUpdateRequest request,
                                                        Principal principal) {
        return ResponseEntity.ok(adminService.updateUser(id, request, principal));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Foydalanuvchini o'chirish (soft delete)")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id, Principal principal) {
        adminService.deleteUser(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{id}/block")
    @Operation(summary = "Foydalanuvchini bloklash")
    public ResponseEntity<Void> blockUser(@PathVariable UUID id,
                                          @RequestBody AdminBlockRequest request,
                                          Principal principal) {
        adminService.blockUser(id, request, principal);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/users/{id}/unblock")
    @Operation(summary = "Foydalanuvchi blokini ochish")
    public ResponseEntity<Void> unblockUser(@PathVariable UUID id, Principal principal) {
        adminService.unblockUser(id, principal);
        return ResponseEntity.ok().build();
    }

    // ─── WORKSHOPS ────────────────────────────────────────────────────────────

    @PostMapping("/workshops")
    @Operation(summary = "Admin tomonidan yangi seh yaratish")
    public ResponseEntity<WorkshopResponse> createWorkshop(@RequestBody WorkshopRequest request,
                                                            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createWorkshop(request, principal));
    }
}
