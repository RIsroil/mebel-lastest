package project.mebel.attendance;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.attendance.dto.AttendanceResponse;
import project.mebel.attendance.dto.OverrideHoursRequest;
import project.mebel.attendance.dto.SubmitHoursRequest;
import project.mebel.common.enums.UserRole;
import project.mebel.exception.ApiException;
import project.mebel.user.UserEntity;
import project.mebel.user.UserRepository;
import project.mebel.utils.Utils;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final DailyAttendanceRepository attendanceRepo;
    private final UserRepository userRepo;
    private final Utils utils;

    private static final int SUBMIT_DEADLINE_DAYS = 3;

    @Override
    @Transactional
    public AttendanceResponse checkIn(Principal principal) {
        UserEntity worker = requireWorker(principal);
        LocalDate today = LocalDate.now();

        attendanceRepo.findByUserIdAndWorkDate(worker.getId(), today)
                .ifPresent(a -> { throw ApiException.badRequest("already.checked.in.today"); });

        LocalDateTime now = LocalDateTime.now();
        DailyAttendanceEntity attendance = DailyAttendanceEntity.builder()
                .userId(worker.getId())
                .workshopId(worker.getWorkshopId())
                .workDate(today)
                .checkInTime(now)
                .hoursDeadline(now.toLocalDate().atStartOfDay().plusDays(SUBMIT_DEADLINE_DAYS + 1))
                .build();
        attendance.setCreatedBy(worker.getId());
        return toResponse(attendanceRepo.save(attendance), worker.getFullName());
    }

    @Override
    @Transactional
    public AttendanceResponse submitHours(SubmitHoursRequest request, Principal principal) {
        UserEntity worker = requireWorker(principal);
        LocalDate today = LocalDate.now();

        DailyAttendanceEntity attendance = attendanceRepo.findByUserIdAndWorkDate(worker.getId(), today)
                .orElseThrow(() -> ApiException.notFound("attendance.not.found"));

        if (attendance.isHoursLocked()) {
            throw ApiException.badRequest("attendance.hours.locked");
        }
        if (attendance.isHoursSelfReported()) {
            throw ApiException.badRequest("hours.already.submitted");
        }

        attendance.setHoursWorked(request.getHoursWorked());
        attendance.setHoursSelfReported(true);
        attendance.setHoursSubmittedAt(LocalDateTime.now());
        attendance.setCheckOutTime(LocalDateTime.now());
        if (request.getNotes() != null) attendance.setNotes(request.getNotes());
        attendance.setUpdatedBy(worker.getId());

        return toResponse(attendanceRepo.save(attendance), worker.getFullName());
    }

    @Override
    @Transactional
    public AttendanceResponse overrideHours(UUID attendanceId, OverrideHoursRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);

        DailyAttendanceEntity attendance = attendanceRepo.findById(attendanceId)
                .filter(a -> a.getWorkshopId().equals(owner.getWorkshopId()))
                .orElseThrow(() -> ApiException.notFound("attendance.not.found"));

        LocalDateTime now = LocalDateTime.now();
        attendance.setOwnerOverrideHours(request.getHoursWorked());
        attendance.setOwnerOverrideBy(owner.getId());
        attendance.setOwnerOverrideAt(now);
        // Use override value as effective hoursWorked
        attendance.setHoursWorked(request.getHoursWorked());
        attendance.setHoursLocked(true);
        attendance.setHoursLockedAt(now);
        if (request.getNotes() != null) attendance.setNotes(request.getNotes());
        attendance.setUpdatedBy(owner.getId());

        String workerName = userRepo.findById(attendance.getUserId())
                .map(UserEntity::getFullName).orElse(null);
        return toResponse(attendanceRepo.save(attendance), workerName);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getMyAttendance(LocalDate from, LocalDate to, Principal principal) {
        UserEntity worker = requireWorker(principal);
        return attendanceRepo.findAllByUserIdAndWorkDateBetween(worker.getId(), from, to)
                .stream().map(a -> toResponse(a, worker.getFullName())).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getWorkshopAttendance(LocalDate date, Principal principal) {
        UserEntity owner = requireOwner(principal);
        return attendanceRepo.findAllByWorkshopIdAndWorkDate(owner.getWorkshopId(), date)
                .stream().map(a -> {
                    String name = userRepo.findById(a.getUserId()).map(UserEntity::getFullName).orElse(null);
                    return toResponse(a, name);
                }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getWorkerAttendance(UUID workerId, LocalDate from, LocalDate to, Principal principal) {
        UserEntity owner = requireOwner(principal);
        UserEntity worker = userRepo.findById(workerId)
                .filter(u -> owner.getWorkshopId().equals(u.getWorkshopId()))
                .orElseThrow(() -> ApiException.notFound("worker.not.found"));

        return attendanceRepo.findAllByUserIdAndWorkDateBetween(workerId, from, to)
                .stream().map(a -> toResponse(a, worker.getFullName())).toList();
    }

    @Override
    @Transactional
    @Scheduled(cron = "0 0 3 * * *") // Every day at 03:00
    public void lockExpiredAttendance() {
        LocalDateTime now = LocalDateTime.now();
        List<DailyAttendanceEntity> expired =
                attendanceRepo.findAllByHoursLockedFalseAndHoursDeadlineBefore(now);

        for (DailyAttendanceEntity attendance : expired) {
            attendance.setHoursLocked(true);
            attendance.setHoursLockedAt(now);
            // If not submitted, set hours to 0
            if (!attendance.isHoursSelfReported() && attendance.getOwnerOverrideHours() == null) {
                attendance.setHoursWorked(java.math.BigDecimal.ZERO);
            }
        }
        attendanceRepo.saveAll(expired);
    }

    private UserEntity requireWorker(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        if (user.getRole() != UserRole.WORKER) throw ApiException.forbidden("access.denied");
        if (user.getWorkshopId() == null) throw ApiException.badRequest("worker.has.no.workshop");
        return user;
    }

    private UserEntity requireOwner(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        if (user.getRole() != UserRole.OWNER) throw ApiException.forbidden("access.denied");
        if (user.getWorkshopId() == null) throw ApiException.badRequest("owner.has.no.workshop");
        return user;
    }

    private AttendanceResponse toResponse(DailyAttendanceEntity a, String workerName) {
        return AttendanceResponse.builder()
                .id(a.getId())
                .userId(a.getUserId())
                .workerName(workerName)
                .workDate(a.getWorkDate())
                .checkInTime(a.getCheckInTime())
                .checkOutTime(a.getCheckOutTime())
                .hoursWorked(a.getHoursWorked())
                .hoursSelfReported(a.isHoursSelfReported())
                .hoursLocked(a.isHoursLocked())
                .ownerOverrideHours(a.getOwnerOverrideHours())
                .hoursDeadline(a.getHoursDeadline())
                .notes(a.getNotes())
                .build();
    }
}
