package project.mebel.furniture;

import org.springframework.data.jpa.repository.JpaRepository;
import project.mebel.common.enums.FurnitureStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FurnitureOrderRepository extends JpaRepository<FurnitureOrderEntity, UUID> {

    List<FurnitureOrderEntity> findAllByWorkshopId(UUID workshopId);

    List<FurnitureOrderEntity> findAllByWorkshopIdAndStatus(UUID workshopId, FurnitureStatus status);

    Optional<FurnitureOrderEntity> findByIdAndWorkshopId(UUID id, UUID workshopId);

    boolean existsByOrderNumber(String orderNumber);
}
