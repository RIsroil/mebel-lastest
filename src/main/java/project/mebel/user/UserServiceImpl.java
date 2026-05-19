package project.mebel.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.common.enums.UserRole;
import project.mebel.exception.ApiException;
import project.mebel.exception.ApiResponseStructure;
import project.mebel.exception.ResponseHelper;
import project.mebel.user.dto.ResetPasswordDto;
import project.mebel.utils.Utils;
import project.mebel.workshop.WorkshopEntity;
import project.mebel.workshop.WorkshopRepository;

import java.security.Principal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final Utils utils;
    private final WorkshopRepository workshopRepository;
    private final ResponseHelper responseHelper;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public ResponseEntity<ApiResponseStructure<UserProfileResponse>> getMe(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        UserProfileResponse response = UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .dailyHoursTarget(user.getDailyHoursTarget())
                .dailySalary(user.getDailySalary())
                .workshopId(user.getWorkshopId() != null ? user.getWorkshopId() : null)
                .build();
        return responseHelper.success( "get.me" ,response);
    }

    @Override
    public ResponseEntity<ApiResponseStructure<UserProfileResponse>> updateMe(UserProfileUpdateRequest request, Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        userRepository.save(user);

        UserProfileResponse response = UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .build();

        return responseHelper.success("update.me", response);
    }

    @Override
    @Transactional
    public ResponseEntity<ApiResponseStructure<Void>> resetWorkerPassword(UUID workerId, ResetPasswordDto request, Principal principal) {
        UserEntity admin = utils.getUserFromPrincipal(principal);

        // Faqat OWNER va ADMIN parolni o'zgartira oladi
        if (admin.getRole() != UserRole.OWNER && admin.getRole() != UserRole.ADMIN) {
            throw ApiException.forbidden("access.denied");
        }

        UserEntity worker = userRepository.findById(workerId)
                .orElseThrow(() -> ApiException.notFound("worker.not.found"));

        // OWNER uchun — faqat o'z workshopidagi ishchilar
        if (admin.getRole() == UserRole.OWNER && !admin.getWorkshopId().equals(worker.getWorkshopId())) {
            throw ApiException.forbidden("access.denied");
        }

        worker.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        worker.setFailedLoginCount((short) 0);
        worker.setBlocked(false);
        userRepository.save(worker);

        return responseHelper.success("password.reset.successfully", null);
    }

}
