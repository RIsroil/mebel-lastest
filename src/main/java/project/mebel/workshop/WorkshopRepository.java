package project.mebel.workshop;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkshopRepository extends JpaRepository<WorkshopEntity, UUID> {

    List<WorkshopEntity> findAllByOwnerId(UUID ownerId);

    Page<WorkshopEntity> findAllByOwnerId(UUID ownerId, Pageable pageable);

    Optional<WorkshopEntity> findByIdAndOwnerId(UUID id, UUID ownerId);
}
