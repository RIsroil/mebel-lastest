package project.mebel.user;

import org.springframework.http.ResponseEntity;
import project.mebel.exception.ApiResponseStructure;
import project.mebel.user.dto.ResetPasswordDto;

import java.security.Principal;
import java.util.UUID;

public interface UserService {
    ResponseEntity<ApiResponseStructure<UserProfileResponse>> getMe(Principal principal);

    ResponseEntity<ApiResponseStructure<UserProfileResponse>> updateMe(UserProfileUpdateRequest request, Principal principal);

    ResponseEntity<ApiResponseStructure<Void>> resetWorkerPassword(UUID workerId, ResetPasswordDto request, Principal principal);
}
