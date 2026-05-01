package project.mebel.furniture;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FurnitureTemplateRepository extends JpaRepository<FurnitureTemplateEntity, UUID> {

    List<FurnitureTemplateEntity> findAllByWorkshopId(UUID workshopId);

    Optional<FurnitureTemplateEntity> findByIdAndWorkshopId(UUID id, UUID workshopId);
}
