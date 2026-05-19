package project.mebel.auth;

import io.jsonwebtoken.ExpiredJwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.auth.dto.CreateWorkerRequest;
import project.mebel.auth.dto.LoginRequest;
import project.mebel.auth.dto.UserRegisterRequest;
import project.mebel.auth.dto.UserResponse;
import project.mebel.auth.dto.UserTokenResponse;
import project.mebel.common.enums.UserRole;
import project.mebel.exception.ApiException;
import project.mebel.exception.ApiResponseStructure;
import project.mebel.exception.ResponseHelper;
import project.mebel.user.UserEntity;
import project.mebel.user.UserRepository;
import project.mebel.user.jwt.JwtService;
import project.mebel.utils.Utils;
import project.mebel.workshop.WorkshopEntity;
import project.mebel.workshop.WorkshopRepository;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final Utils utils;
    private final WorkshopRepository workshopRepository;
    private final ResponseHelper responseHelper;

    @Override
    public ResponseEntity<ApiResponseStructure<UserTokenResponse>> register(UserRegisterRequest request) {
        if (userRepository.findByUsernameAndDeletedAtIsNull(request.getUsername()).isPresent()) {
            throw ApiException.conflict("username.already.exists");
        }

        UserEntity user = UserEntity.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.OWNER)
                .build();

        UserTokenResponse userResponse = generateTokens(user);
        userRepository.save(user);

        return responseHelper.success("registration.completed.successfully", userResponse);

    }

    @Override
    public ResponseEntity<ApiResponseStructure<Void>> deleteWorker(UUID id, Principal principal) {
        UserEntity owner = utils.getUserFromPrincipal(principal);
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("worker.not.found"));
        if (owner.getRole() == UserRole.WORKER) {
            throw ApiException.forbidden("access.denied");
        }
        if (!owner.getWorkshopId().equals(user.getWorkshopId())) {
            throw ApiException.forbidden("access.denied");
        }
        userRepository.delete(user);
        return responseHelper.success("worker.deleted.successfully", null);
    }

    @Override
    @Transactional
    public ResponseEntity<ApiResponseStructure<UserTokenResponse>> login(LoginRequest request) {
        UserEntity user = userRepository.findByUsernameAndDeletedAtIsNull(request.getUsername())
                .orElseThrow(() -> ApiException.notFound("user.not.found"));

        // Bloklangan foydalanuvchini tekshirish
        if (user.isBlocked()) {
            if (user.getBlockedUntil() != null && user.getBlockedUntil().isAfter(LocalDateTime.now())) {
                long remainingSec = java.time.Duration.between(LocalDateTime.now(), user.getBlockedUntil()).getSeconds();
                ApiException ex = ApiException.unauthorized("account.blocked");
                ex.setRemainingSeconds((int) remainingSec);
                throw ex;
            }
            // Blok muddati tugagan — avtomatik ochish
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
            throw ApiException.unauthorized("invalid.credentials");
        }

        // Muvaffaqiyatli login — xato hisoblagichni reset qilish
        user.setFailedLoginCount((short) 0);
        user.setLastFailedLoginAt(null);
        userRepository.save(user);

        UserTokenResponse userResponse = generateTokens(user);
        return responseHelper.success("login.successful", userResponse);
    }

    @Override
    @Transactional
    public ResponseEntity<ApiResponseStructure<UserResponse>> createWorker(CreateWorkerRequest request, Principal principal) {
        UserEntity owner = utils.getUserFromPrincipal(principal);

        if (owner.getRole() == UserRole.WORKER) {
            throw ApiException.forbidden("access.denied");
        }
        if (owner.getRole() == UserRole.ADMIN) {
            if (userRepository.findByUsernameAndDeletedAtIsNull(request.getUsername()).isPresent()) {
                throw ApiException.conflict("username.already.exists");
            }
            return responseHelper.success("worker.created.successfully", toResponse(userRepository.save(UserEntity.builder()
                    .username(request.getUsername())
                    .passwordHash(passwordEncoder.encode(request.getPassword()))
                    .role(UserRole.WORKER)
                    .workshopId(request.getWorkshopId())
                    .payType(request.getPayType())
                    .dailyHoursTarget(request.getDailyHoursTarget() != null
                            ? request.getDailyHoursTarget()
                            : new BigDecimal("8.0"))
                    .createdBy(owner.getId())
                            .dailySalary(request.getDailySalary())
                    .build())));
        }
        Optional<WorkshopEntity> currentWorkshop = workshopRepository.findByIdAndOwnerId(owner.getWorkshopId(), owner.getId());
        if (currentWorkshop.isEmpty()) {
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
                .role(UserRole.WORKER)
                .workshopId(request.getWorkshopId())
                .payType(request.getPayType())
                .dailyHoursTarget(dailyHoursTarget)
                .dailySalary(request.getDailySalary())
                .monthlySalary(request.getMonthlySalary())
                .build();

        worker.setCreatedBy(owner.getId());
        UserEntity saved = userRepository.save(worker);
        return responseHelper.success("worker.created.successfully", toResponse(saved));
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponseStructure<UserResponse>> getMe(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        return responseHelper.success("user.profile", toResponse(user));
    }

    @Override
    public ResponseEntity<ApiResponseStructure<UserTokenResponse>> refreshToken(String refreshToken) {
        try {
            String username = jwtService.extractUsername(refreshToken);
            UserEntity user = userRepository.findByUsernameAndDeletedAtIsNull(username)
                    .orElseThrow(() -> ApiException.unauthorized("invalid.or.expired.refresh.token"));
            if (!jwtService.isTokenValid(refreshToken, user)) {
                throw ApiException.unauthorized("invalid.or.expired.refresh.token");
            }
            String newAccessToken = jwtService.generateAccessToken(user);
            UserTokenResponse userResponse = new UserTokenResponse(newAccessToken, refreshToken);
            return responseHelper.success("token.refreshed.successfully", userResponse);
        } catch (ApiException e) {
            throw e;
        } catch (ExpiredJwtException e) {
            throw ApiException.unauthorized("invalid.or.expired.refresh.token");
        } catch (Exception e) {
            throw ApiException.unauthorized("invalid.or.expired.refresh.token");
        }
    }

    private UserResponse toResponse(UserEntity u) {
        WorkshopEntity ws = u.getWorkshopId() != null
                ? workshopRepository.findById(u.getWorkshopId()).orElse(null)
                : null;
        return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .fullName(u.getFullName())
                .role(u.getRole())
                .workshopId(u.getWorkshopId())
                .workshopName(ws != null ? ws.getName() : null)
                .workshopAttendanceMode(ws != null ? ws.getAttendanceMode() : null)
                .payType(u.getPayType())
                .dailyHoursTarget(u.getDailyHoursTarget())
                .dailySalary(u.getDailySalary())
                .monthlySalary(u.getMonthlySalary())
                .build();
    }

    private UserTokenResponse generateTokens(UserEntity user) {
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        return new UserTokenResponse(accessToken, refreshToken);
    }
}
