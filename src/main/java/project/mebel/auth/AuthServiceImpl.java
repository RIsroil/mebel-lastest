package project.mebel.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.auth.dto.CreateWorkerRequest;
import project.mebel.auth.dto.LoginRequest;
import project.mebel.auth.dto.LoginResponse;
import project.mebel.auth.dto.UserResponse;
import project.mebel.common.enums.UserRole;
import project.mebel.exception.ApiException;
import project.mebel.user.UserEntity;
import project.mebel.user.UserRepository;
import project.mebel.user.jwt.JwtService;
import project.mebel.utils.Utils;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final UserSessionRepository userSessionRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final Utils utils;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request, String ipAddress, String userAgent) {
        UserEntity user = userRepository.findByUsernameAndDeletedAtIsNull(request.getUsername())
                .orElse(null);

        if (user == null) {
            saveAttempt(null, request.getUsername(), ipAddress, userAgent, false, "USER_NOT_FOUND");
            throw ApiException.unauthorized("user.not.found");
        }

        if (user.isBlocked()) {
            if (user.getBlockedUntil() != null && user.getBlockedUntil().isAfter(LocalDateTime.now())) {
                saveAttempt(user.getId(), request.getUsername(), ipAddress, userAgent, false, "BLOCKED");
                throw ApiException.forbidden("user.blocked");
            }
            user.setBlocked(false);
            user.setBlockedUntil(null);
            user.setBlockReason(null);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.setFailedLoginCount((short) (user.getFailedLoginCount() + 1));
            user.setLastFailedLoginAt(LocalDateTime.now());

            if (user.getFailedLoginCount() >= MAX_FAILED_ATTEMPTS) {
                user.setBlocked(true);
                user.setBlockedUntil(LocalDateTime.now().plusDays(1));
                user.setBlockReason("Too many failed login attempts");
                user.setFailedLoginCount((short) 0);
            }
            userRepository.save(user);
            saveAttempt(user.getId(), request.getUsername(), ipAddress, userAgent, false, "WRONG_PASSWORD");
            throw ApiException.unauthorized("invalid.credentials");
        }

        user.setFailedLoginCount((short) 0);
        user.setLastFailedLoginAt(null);
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        UserSessionEntity session = UserSessionEntity.builder()
                .userId(user.getId())
                .tokenHash(sha256(refreshToken))
                .ipAddress(ipAddress)
                .userAgent(userAgent != null ? userAgent : "unknown")
                .active(true)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build();
        userSessionRepository.save(session);

        saveAttempt(user.getId(), request.getUsername(), ipAddress, userAgent, true, null);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    @Override
    @Transactional
    public void logout(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        userSessionRepository.revokeAllByUserId(user.getId(), LocalDateTime.now(), "LOGOUT");
    }

    @Override
    @Transactional
    public UserResponse createWorker(CreateWorkerRequest request, Principal principal) {
        UserEntity owner = utils.getUserFromPrincipal(principal);

        if (owner.getRole() != UserRole.OWNER) {
            throw ApiException.forbidden("access.denied");
        }
        if (owner.getWorkshopId() == null) {
            throw ApiException.badRequest("owner.has.no.workshop");
        }
        if (userRepository.findByUsernameAndDeletedAtIsNull(request.getUsername()).isPresent()) {
            throw ApiException.conflict("username.already.exists");
        }

        BigDecimal dailyHoursTarget = request.getDailyHoursTarget() != null
                ? request.getDailyHoursTarget()
                : new BigDecimal("8.0");

        UserEntity worker = UserEntity.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(UserRole.WORKER)
                .workshopId(owner.getWorkshopId())
                .payType(request.getPayType())
                .hourlyRate(request.getHourlyRate())
                .dailyRate(request.getDailyRate())
                .dailyHoursTarget(dailyHoursTarget)
                .commissionPct(request.getCommissionPct())
                .hybridPay(request.isHybridPay())
                .build();

        worker.setCreatedBy(owner.getId());
        UserEntity saved = userRepository.save(worker);
        return toResponse(saved);
    }

    private void saveAttempt(java.util.UUID userId, String username, String ip, String ua,
                             boolean success, String reason) {
        loginAttemptRepository.save(LoginAttemptEntity.builder()
                .userId(userId)
                .usernameTried(username)
                .ipAddress(ip != null ? ip : "unknown")
                .userAgent(ua)
                .success(success)
                .failureReason(reason)
                .build());
    }

    private UserResponse toResponse(UserEntity u) {
        return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .role(u.getRole())
                .active(u.isActive())
                .blocked(u.isBlocked())
                .workshopId(u.getWorkshopId())
                .payType(u.getPayType())
                .hourlyRate(u.getHourlyRate())
                .dailyRate(u.getDailyRate())
                .dailyHoursTarget(u.getDailyHoursTarget())
                .commissionPct(u.getCommissionPct())
                .build();
    }

    private String sha256(String input) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
