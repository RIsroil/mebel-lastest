package project.mebel.warehouse;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WarehouseItemRepository extends JpaRepository<WarehouseItemEntity, UUID> {

    List<WarehouseItemEntity> findAllByWorkshopId(UUID workshopId);

    Optional<WarehouseItemEntity> findByIdAndWorkshopId(UUID id, UUID workshopId);
}
