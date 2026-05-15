package project.mebel.saves;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SaveImageRepository extends JpaRepository<SaveImageEntity, UUID> {
    long countBySaveId(UUID saveId);
    List<SaveImageEntity> findAllBySaveId(UUID saveId);
}
