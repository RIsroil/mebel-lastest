package project.mebel.saves;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SaveCutRepository extends JpaRepository<SaveCutEntity, UUID> {

    List<SaveCutEntity> findAllBySaveIdOrderByCreatedAtAsc(UUID saveId);

    void deleteBySaveId(UUID saveId);
}
