package project.mebel.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepo;

    public static final String ACTION_PASSWORD_RESET = "PASSWORD_RESET";
    public static final String ACTION_WORKER_DELETED = "WORKER_DELETED";
    public static final String ACTION_WORKER_BLOCKED = "WORKER_BLOCKED";
    public static final String ACTION_WORKER_UNBLOCKED = "WORKER_UNBLOCKED";
    public static final String ACTION_HOURS_OVERRIDE = "HOURS_OVERRIDE";
    public static final String ACTION_EARNING_PAID = "EARNING_PAID";
    public static final String ACTION_ORDER_STATUS_CHANGED = "ORDER_STATUS_CHANGED";

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String entityType, UUID entityId,
                    UUID actorId, String actorName, UUID workshopId, String details) {
        AuditLogEntity log = AuditLogEntity.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .actorId(actorId)
                .actorName(actorName)
                .workshopId(workshopId)
                .details(details)
                .build();
        auditLogRepo.save(log);
    }

    public void logPasswordReset(UUID targetUserId, String targetUsername,
                                  UUID actorId, String actorName, UUID workshopId) {
        log(ACTION_PASSWORD_RESET, "USER", targetUserId, actorId, actorName, workshopId,
                "Password reset for user: " + targetUsername);
    }

    public void logWorkerDeleted(UUID workerId, String workerName,
                                  UUID actorId, String actorName, UUID workshopId) {
        log(ACTION_WORKER_DELETED, "USER", workerId, actorId, actorName, workshopId,
                "Worker deleted: " + workerName);
    }

    public void logHoursOverride(UUID attendanceId, UUID workerId, String workerName,
                                  UUID actorId, String actorName, UUID workshopId,
                                  String oldHours, String newHours) {
        log(ACTION_HOURS_OVERRIDE, "ATTENDANCE", attendanceId, actorId, actorName, workshopId,
                "Hours override for " + workerName + ": " + oldHours + " → " + newHours);
    }

    public void logEarningPaid(UUID earningId, UUID workerId, String workerName,
                                UUID actorId, String actorName, UUID workshopId,
                                String amount) {
        log(ACTION_EARNING_PAID, "EARNING", earningId, actorId, actorName, workshopId,
                "Earning paid to " + workerName + ": " + amount);
    }

    public void logOrderStatusChanged(UUID orderId, String orderNumber,
                                       UUID actorId, String actorName, UUID workshopId,
                                       String oldStatus, String newStatus) {
        log(ACTION_ORDER_STATUS_CHANGED, "ORDER", orderId, actorId, actorName, workshopId,
                "Order " + orderNumber + " status: " + oldStatus + " → " + newStatus);
    }
}
