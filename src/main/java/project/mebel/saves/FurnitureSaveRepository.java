package project.mebel.saves;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FurnitureSaveRepository extends JpaRepository<FurnitureSaveEntity, UUID> {

    List<FurnitureSaveEntity> findAllByWorkshopIdOrderByCreatedAtDesc(UUID workshopId);

    Optional<FurnitureSaveEntity> findByIdAndWorkshopId(UUID id, UUID workshopId);
}
