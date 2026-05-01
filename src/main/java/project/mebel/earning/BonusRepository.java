package project.mebel.earning;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BonusRepository extends JpaRepository<BonusEntity, UUID> {

    List<BonusEntity> findAllByWorkerIdAndBonusDateBetween(UUID workerId, LocalDate from, LocalDate to);

    List<BonusEntity> findAllByWorkshopIdAndBonusDateBetween(UUID workshopId, LocalDate from, LocalDate to);
}
