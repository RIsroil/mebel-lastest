package project.mebel.audit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, UUID> {

    List<AuditLogEntity> findAllByWorkshopIdOrderByCreatedAtDesc(UUID workshopId);

    List<AuditLogEntity> findAllByActorIdOrderByCreatedAtDesc(UUID actorId);

    List<AuditLogEntity> findAllByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, UUID entityId);

    List<AuditLogEntity> findAllByWorkshopIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            UUID workshopId, LocalDateTime from, LocalDateTime to);
}
