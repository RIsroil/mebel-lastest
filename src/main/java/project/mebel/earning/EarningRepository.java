package project.mebel.earning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface EarningRepository extends JpaRepository<EarningEntity, UUID> {

    List<EarningEntity> findAllByWorkerIdAndEarnDateBetween(UUID workerId, LocalDate from, LocalDate to);

    List<EarningEntity> findAllByWorkshopIdAndEarnDateBetween(UUID workshopId, LocalDate from, LocalDate to);

    List<EarningEntity> findAllByWorkerIdAndPaidFalse(UUID workerId);

    @Query("SELECT COALESCE(SUM(e.totalAmount), 0) FROM EarningEntity e WHERE e.workerId = :workerId AND e.earnDate BETWEEN :from AND :to")
    BigDecimal sumTotalByWorkerAndDateRange(UUID workerId, LocalDate from, LocalDate to);
}
