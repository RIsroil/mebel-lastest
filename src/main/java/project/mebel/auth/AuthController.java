package project.mebel.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.mebel.auth.dto.CreateWorkerRequest;
import project.mebel.auth.dto.LoginRequest;
import project.mebel.auth.dto.LoginResponse;
import project.mebel.auth.dto.UserResponse;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Autentifikatsiya va foydalanuvchi boshqaruvi")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Tizimga kirish")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request,
                                               HttpServletRequest httpRequest) {
        String ip = httpRequest.getRemoteAddr();
        String ua = httpRequest.getHeader("User-Agent");
        return ResponseEntity.ok(authService.login(request, ip, ua));
    }

    @PostMapping("/logout")
    @Operation(summary = "Tizimdan chiqish")
    public ResponseEntity<Void> logout(Principal principal) {
        authService.logout(principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/workers")
    @Operation(summary = "Yangi worker yaratish (faqat OWNER)")
    public ResponseEntity<UserResponse> createWorker(@RequestBody CreateWorkerRequest request,
                                                     Principal principal) {
        return ResponseEntity.ok(authService.createWorker(request, principal));
    }
}
