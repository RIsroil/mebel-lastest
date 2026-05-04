package project.mebel.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import liquibase.license.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.mebel.auth.dto.CreateWorkerRequest;
import project.mebel.auth.dto.LoginRequest;
import project.mebel.auth.dto.LoginResponse;
import project.mebel.auth.dto.UserRegisterRequest;
import project.mebel.auth.dto.UserResponse;
import project.mebel.auth.dto.UserTokenResponse;
import project.mebel.exception.ApiException;
import project.mebel.exception.ApiResponseStructure;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Autentifikatsiya va foydalanuvchi boshqaruvi")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Yangi foydalanuvchi ro'yxatdan o'tkazish")
    public ResponseEntity<ApiResponseStructure<UserTokenResponse>> register(@RequestBody UserRegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Tizimga kirish")
    public ResponseEntity<ApiResponseStructure<UserTokenResponse>> login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/workers")
    @Operation(summary = "Yangi worker yaratish (faqat OWNER)")
    public ResponseEntity<ApiResponseStructure<UserResponse>> createWorker(@RequestBody CreateWorkerRequest request,
                                                     Principal principal) {
        return authService.createWorker(request, principal);
    }

    @DeleteMapping("/id")
    @Operation(summary = "Foydalanuvchini o'chirish (faqat OWNER)")
    public ResponseEntity<ApiResponseStructure<Void>> deleteWorker(@RequestParam UUID id, Principal principal) {
        return authService.deleteWorker(id, principal);
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponseStructure<UserResponse>> refresh(String refreshToken) {
        return authService.refreshToken(refreshToken);
    }
}
