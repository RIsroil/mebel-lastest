package project.mebel.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface UserSessionRepository extends JpaRepository<UserSessionEntity, UUID> {

    Optional<UserSessionEntity> findByTokenHashAndActiveTrue(String tokenHash);

    @Modifying
    @Query("UPDATE UserSessionEntity s SET s.active = false, s.revokedAt = :now, s.revokedReason = :reason WHERE s.userId = :userId AND s.active = true")
    void revokeAllByUserId(UUID userId, LocalDateTime now, String reason);
}
