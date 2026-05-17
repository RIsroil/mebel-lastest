package project.mebel.attendance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DailyAttendanceRepository extends JpaRepository<DailyAttendanceEntity, UUID> {

    Optional<DailyAttendanceEntity> findByUserIdAndWorkDate(UUID userId, LocalDate workDate);

    List<DailyAttendanceEntity> findAllByWorkshopIdAndWorkDate(UUID workshopId, LocalDate workDate);

    List<DailyAttendanceEntity> findAllByWorkshopIdAndWorkDateBetween(UUID workshopId, LocalDate from, LocalDate to);

    List<DailyAttendanceEntity> findAllByUserIdAndWorkDateBetween(UUID userId, LocalDate from, LocalDate to);

    // Cron job uchun: muddat o'tgan, lock bo'lmagan yozuvlar
    List<DailyAttendanceEntity> findAllByHoursLockedFalseAndHoursDeadlineBefore(LocalDateTime deadline);

    // Oylik ishchi uchun: period ichida necha kuni hoursWorked > 0 bo'lgan (idempotent hisoblash)
    @Query("SELECT COUNT(a) FROM DailyAttendanceEntity a WHERE a.userId = :userId " +
           "AND a.workDate >= :from AND a.workDate <= :to AND a.hoursWorked > :zero")
    long countWorkedDays(@Param("userId") UUID userId,
                         @Param("from") LocalDate from,
                         @Param("to") LocalDate to,
                         @Param("zero") BigDecimal zero);
}
