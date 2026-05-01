package project.mebel.attendance;

import org.springframework.data.jpa.repository.JpaRepository;

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
}
