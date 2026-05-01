package project.mebel.furniture;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FurnitureAssignmentRepository extends JpaRepository<FurnitureAssignmentEntity, UUID> {

    List<FurnitureAssignmentEntity> findAllByFurnitureOrderId(UUID furnitureOrderId);

    List<FurnitureAssignmentEntity> findAllByFurnitureOrderIdAndActiveTrue(UUID furnitureOrderId);

    Optional<FurnitureAssignmentEntity> findByFurnitureOrderIdAndWorkerIdAndActiveTrue(UUID orderId, UUID workerId);

    List<FurnitureAssignmentEntity> findAllByWorkerIdAndActiveTrue(UUID workerId);
}
