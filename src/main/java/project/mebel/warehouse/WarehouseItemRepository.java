package project.mebel.warehouse;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WarehouseItemRepository extends JpaRepository<WarehouseItemEntity, UUID> {

    List<WarehouseItemEntity> findAllByWorkshopId(UUID workshopId);

    Optional<WarehouseItemEntity> findByIdAndWorkshopId(UUID id, UUID workshopId);

    @Query(value = "SELECT * FROM warehouse_items WHERE id = :id AND workshop_id = :workshopId", nativeQuery = true)
    Optional<WarehouseItemEntity> findByIdAndWorkshopIdIncludeDeleted(@Param("id") UUID id, @Param("workshopId") UUID workshopId);

    Optional<WarehouseItemEntity> findByWorkshopIdAndNameIgnoreCase(UUID workshopId, String name);
}
