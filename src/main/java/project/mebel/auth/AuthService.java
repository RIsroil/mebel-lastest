package project.mebel.auth;

import org.springframework.http.ResponseEntity;
import project.mebel.auth.dto.CreateWorkerRequest;
import project.mebel.auth.dto.LoginRequest;
import project.mebel.auth.dto.LoginResponse;
import project.mebel.auth.dto.UserRegisterRequest;
import project.mebel.auth.dto.UserResponse;
import project.mebel.auth.dto.UserTokenResponse;
import project.mebel.exception.ApiResponseStructure;

import java.security.Principal;
import java.util.UUID;

public interface AuthService {

    ResponseEntity<ApiResponseStructure<UserTokenResponse>>  login(LoginRequest request);

    ResponseEntity<ApiResponseStructure<UserResponse>> createWorker(CreateWorkerRequest request, Principal principal);

    ResponseEntity<ApiResponseStructure<UserTokenResponse>> register(UserRegisterRequest request);

    ResponseEntity<ApiResponseStructure<Void>> deleteWorker(UUID id, Principal principal);

    ResponseEntity<ApiResponseStructure<UserTokenResponse>> refreshToken(String refreshToken);

}
