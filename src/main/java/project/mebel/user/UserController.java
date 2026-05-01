package project.mebel.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import project.mebel.exception.ApiResponseStructure;

import java.security.Principal;

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
}
