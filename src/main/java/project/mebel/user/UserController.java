package project.mebel.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.mebel.exception.ApiResponseStructure;
import project.mebel.user.dto.ResetPasswordDto;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    ResponseEntity<ApiResponseStructure<UserProfileResponse>> me(Principal principal) {
        return userService.getMe(principal);
    }

    @PatchMapping("/update")
    ResponseEntity<ApiResponseStructure<UserProfileResponse>> updateProfile(Principal principal, UserProfileUpdateRequest request) {
        return userService.updateMe(request, principal);
    }

    @PutMapping("/{workerId}/reset-password")
    ResponseEntity<ApiResponseStructure<Void>> resetWorkerPassword(
            @PathVariable UUID workerId,
            @RequestBody ResetPasswordDto request,
            Principal principal) {
        return userService.resetWorkerPassword(workerId, request, principal);
    }
}
