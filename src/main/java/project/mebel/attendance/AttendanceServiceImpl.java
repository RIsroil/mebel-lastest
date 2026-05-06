package project.mebel.attendance;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.attendance.dto.AttendanceResponse;
import project.mebel.attendance.dto.OverrideHoursRequest;
import project.mebel.attendance.dto.SubmitHoursRequest;
import project.mebel.common.enums.EarnType;
import project.mebel.common.enums.PayType;
import project.mebel.common.enums.UserRole;
import project.mebel.earning.EarningEntity;
import project.mebel.earning.EarningRepository;
import project.mebel.exception.ApiException;
import project.mebel.user.UserEntity;
import project.mebel.user.UserRepository;
import project.mebel.utils.Utils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final DailyAttendanceRepository attendanceRepo;
    private final EarningRepository earningRepo;
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
        attendance.setHoursWorked(request.getHoursWorked());
        attendance.setHoursLocked(true);
        attendance.setHoursLockedAt(now);
        if (request.getNotes() != null) attendance.setNotes(request.getNotes());
        attendance.setUpdatedBy(owner.getId());

        DailyAttendanceEntity saved = attendanceRepo.save(attendance);

        UserEntity worker = userRepo.findById(saved.getUserId())
                .orElseThrow(() -> ApiException.notFound("worker.not.found"));

        // Upsert earning: yangi soatlar bilan yaratiladi yoki mavjudi yangilanadi
        if (saved.getHoursWorked() != null && saved.getHoursWorked().compareTo(BigDecimal.ZERO) > 0) {
            upsertEarning(saved, worker, owner.getId());
        }

        return toResponse(saved, worker.getFullName());
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
            if (!attendance.isHoursSelfReported() && attendance.getOwnerOverrideHours() == null) {
                // Worker kiritmasdan muddati o'tdi → 0 soat, maosh yo'q
                attendance.setHoursWorked(BigDecimal.ZERO);
            }
        }
        attendanceRepo.saveAll(expired);

        // Soat > 0 bo'lganlar uchun earning yaratiladi (agar mavjud bo'lmasa)
        for (DailyAttendanceEntity attendance : expired) {
            if (attendance.getHoursWorked() != null && attendance.getHoursWorked().compareTo(BigDecimal.ZERO) > 0) {
                userRepo.findById(attendance.getUserId()).ifPresent(worker ->
                        upsertEarning(attendance, worker, null));
            }
        }
    }

    // Attendance ga tegishli earning ni yaratadi yoki mavjudini yangilaydi.
    // createdBy = null bo'lsa scheduler tomonidan chaqirilgan.
    private void upsertEarning(DailyAttendanceEntity attendance, UserEntity worker, UUID actorId) {
        BigDecimal hours = attendance.getHoursWorked();
        BigDecimal target = worker.getDailyHoursTarget();

        EarnType earnType;
        BigDecimal snapshotDailyRate;
        BigDecimal snapshotHourlyRate;
        BigDecimal baseAmount;

        if (worker.getPayType() == PayType.DAILY) {
            snapshotHourlyRate = null;
            earnType = EarnType.DAILY_WAGE;
            snapshotDailyRate = worker.getDailySalary();
            // Necha soat ishlagan bo'lsa shuncha ulushi (8 soat=to'liq kun)
            baseAmount = hours.divide(target, 4, RoundingMode.HALF_UP)
                    .multiply(worker.getDailySalary())
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            snapshotDailyRate = null;
            // MONTHLY → soatbay hisob
            earnType = EarnType.HOURLY_WAGE;
            snapshotHourlyRate = worker.getHourlyRate() != null ? worker.getHourlyRate() : BigDecimal.ZERO;
            baseAmount = hours.multiply(snapshotHourlyRate).setScale(2, RoundingMode.HALF_UP);
        }

        earningRepo.findByAttendanceId(attendance.getId()).ifPresentOrElse(
                existing -> {
                    // Mavjud bo'lsa → yangilash (owner override holati)
                    existing.setHoursWorked(hours);
                    existing.setDailyRate(snapshotDailyRate);
                    existing.setHourlyRate(snapshotHourlyRate);
                    existing.setBaseAmount(baseAmount);
                    // Komissiya allaqachon to'langan bo'lsa o'zgartirmaymiz
                    if (!existing.isPaid()) {
                        existing.setTotalAmount(baseAmount.add(
                                existing.getCommissionAmount() != null ? existing.getCommissionAmount() : BigDecimal.ZERO));
                    }
                    existing.setUpdatedBy(actorId);
                    earningRepo.save(existing);
                },
                () -> {
                    EarningEntity earning = EarningEntity.builder()
                            .workerId(worker.getId())
                            .workshopId(worker.getWorkshopId())
                            .earnDate(attendance.getWorkDate())
                            .earnType(earnType)
                            .attendanceId(attendance.getId())
                            .hoursWorked(hours)
                            .hourlyRate(snapshotHourlyRate)
                            .daysWorked(BigDecimal.ONE)
                            .dailyRate(snapshotDailyRate)
                            // Hybrid bo'lsa commissionPct snapshot qilinadi, amount mebel tugatilganida qo'shiladi
                            .commissionPct(worker.isHybridPay() ? worker.getCommissionPct() : null)
                            .commissionAmount(null)
                            .baseAmount(baseAmount)
                            .totalAmount(baseAmount)
                            .build();
                    earning.setCreatedBy(actorId);
                    earningRepo.save(earning);
                }
        );
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
