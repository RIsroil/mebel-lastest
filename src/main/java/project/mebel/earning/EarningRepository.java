package project.mebel.earning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.mebel.common.enums.EarnType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EarningRepository extends JpaRepository<EarningEntity, UUID> {

    List<EarningEntity> findAllByWorkerIdAndEarnDateBetween(UUID workerId, LocalDate from, LocalDate to);

    List<EarningEntity> findAllByWorkshopIdAndEarnDateBetween(UUID workshopId, LocalDate from, LocalDate to);

    List<EarningEntity> findAllByWorkerIdAndPaidFalse(UUID workerId);

    @Query("SELECT COALESCE(SUM(e.totalAmount), 0) FROM EarningEntity e WHERE e.workerId = :workerId AND e.earnDate BETWEEN :from AND :to")
    BigDecimal sumTotalByWorkerAndDateRange(UUID workerId, LocalDate from, LocalDate to);

    Optional<EarningEntity> findByAttendanceId(UUID attendanceId);

    List<EarningEntity> findAllByAttendanceIdIn(List<UUID> attendanceIds);

    Optional<EarningEntity> findByWorkerIdAndEarnTypeAndPaidFalse(UUID workerId, EarnType earnType);

    // Oylik ishchilar uchun: doim unpaid MONTHLY_WAGE qatorni ko'rsatish + sanaga mos boshqa turdagilarni
    @Query("SELECT e FROM EarningEntity e WHERE e.workshopId = :workshopId AND " +
           "((e.earnType = :monthlyType AND e.paid = false) OR " +
           "(e.earnDate >= :from AND e.earnDate <= :to))")
    List<EarningEntity> findWorkshopEarningsIncludingMonthly(
            @Param("workshopId") UUID workshopId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("monthlyType") EarnType monthlyType);

    @Query("SELECT e FROM EarningEntity e WHERE e.workerId = :workerId AND " +
           "((e.earnType = :monthlyType AND e.paid = false) OR " +
           "(e.earnDate >= :from AND e.earnDate <= :to))")
    List<EarningEntity> findWorkerEarningsIncludingMonthly(
            @Param("workerId") UUID workerId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("monthlyType") EarnType monthlyType);

    @Query("SELECT e FROM EarningEntity e WHERE e.workerId = :workerId AND e.furnitureOrderId = :furnitureOrderId AND e.earnDate = :earnDate AND e.deletedAt IS NULL")
    Optional<EarningEntity> findByWorkerIdAndFurnitureOrderIdAndEarnDate(
            @Param("workerId") UUID workerId,
            @Param("furnitureOrderId") UUID furnitureOrderId,
            @Param("earnDate") LocalDate earnDate);

    List<EarningEntity> findByWorkerIdAndFurnitureOrderIdOrderByEarnDateAsc(
            UUID workerId,
            UUID furnitureOrderId);
}
