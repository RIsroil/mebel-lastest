package project.mebel.furniture;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FurnitureImageRepository extends JpaRepository<FurnitureImageEntity, UUID> {

    List<FurnitureImageEntity> findAllByFurnitureOrderId(UUID furnitureOrderId);

    long countByFurnitureOrderId(UUID furnitureOrderId);
}
