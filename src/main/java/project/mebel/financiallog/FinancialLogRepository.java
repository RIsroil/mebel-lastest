package project.mebel.financiallog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface FinancialLogRepository extends JpaRepository<FinancialLogEntity, UUID>,
        JpaSpecificationExecutor<FinancialLogEntity> {

    List<FinancialLogEntity> findAllByWorkshopIdAndLogDateBetweenOrderByLogDateDescCreatedAtDesc(
            UUID workshopId, LocalDate from, LocalDate to);

    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM FinancialLogEntity l " +
           "WHERE l.workshopId = :workshopId AND l.logDate BETWEEN :from AND :to AND l.amount > 0")
    BigDecimal sumIncomeByWorkshopAndDateRange(UUID workshopId, LocalDate from, LocalDate to);

    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM FinancialLogEntity l " +
           "WHERE l.workshopId = :workshopId AND l.logDate BETWEEN :from AND :to AND l.amount < 0")
    BigDecimal sumExpenseByWorkshopAndDateRange(UUID workshopId, LocalDate from, LocalDate to);
}
