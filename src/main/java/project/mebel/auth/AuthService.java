package project.mebel.auth;

import project.mebel.auth.dto.CreateWorkerRequest;
import project.mebel.auth.dto.LoginRequest;
import project.mebel.auth.dto.LoginResponse;
import project.mebel.auth.dto.UserResponse;

import java.security.Principal;

public interface AuthService {

    LoginResponse login(LoginRequest request, String ipAddress, String userAgent);

    void logout(Principal principal);

    UserResponse createWorker(CreateWorkerRequest request, Principal principal);
}
