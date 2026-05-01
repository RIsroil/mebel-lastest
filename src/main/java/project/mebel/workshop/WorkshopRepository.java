package project.mebel.workshop;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkshopRepository extends JpaRepository<WorkshopEntity, UUID> {

    List<WorkshopEntity> findAllByOwnerId(UUID ownerId);

    Optional<WorkshopEntity> findByIdAndOwnerId(UUID id, UUID ownerId);
}
