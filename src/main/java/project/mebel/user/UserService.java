package project.mebel.user;

import org.springframework.http.ResponseEntity;
import project.mebel.exception.ApiResponseStructure;

import java.security.Principal;

public interface UserService {
    ResponseEntity<ApiResponseStructure<UserProfileResponse>> getMe(Principal principal);

    ResponseEntity<ApiResponseStructure<UserProfileResponse>> updateMe(UserProfileUpdateRequest request, Principal principal);
}
