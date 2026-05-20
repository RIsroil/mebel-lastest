package project.mebel.furniture;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FurnitureAssignmentRepository extends JpaRepository<FurnitureAssignmentEntity, UUID> {

    List<FurnitureAssignmentEntity> findAllByFurnitureOrderId(UUID furnitureOrderId);

    List<FurnitureAssignmentEntity> findAllByFurnitureOrderIdAndActiveTrue(UUID furnitureOrderId);

    Optional<FurnitureAssignmentEntity> findByFurnitureOrderIdAndWorkerIdAndActiveTrue(UUID orderId, UUID workerId);

    List<FurnitureAssignmentEntity> findAllByWorkerIdAndActiveTrue(UUID workerId);

    List<FurnitureAssignmentEntity> findByWorkerIdAndActiveTrueOrderByAssignedAtAsc(UUID workerId);

    // Ma'lum kundagi active assignmentlar soni
    // Assignment is active on date if: assignedAt <= date AND (unassignedAt is null OR unassignedAt > date)
    @Query("SELECT COUNT(a) FROM FurnitureAssignmentEntity a WHERE a.workerId = :workerId " +
           "AND a.assignedAt <= :dateTime " +
           "AND (a.unassignedAt IS NULL OR a.unassignedAt > :dateTime)")
    int countActiveAssignmentsOnDate(@Param("workerId") UUID workerId,
                                     @Param("dateTime") LocalDateTime dateTime);
}
