package project.mebel.attendance;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.attendance.dto.AttendanceResponse;
import project.mebel.attendance.dto.ManualEntryRequest;
import project.mebel.attendance.dto.OverrideHoursRequest;
import project.mebel.attendance.dto.SubmitHoursRequest;
import project.mebel.attendance.dto.WeeklyDayResponse;
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
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final DailyAttendanceRepository attendanceRepo;
    private final EarningRepository earningRepo;
    private final UserRepository userRepo;
    private final Utils utils;

    private static final int SUBMIT_DEADLINE_DAYS = 3;

    private static final String[] DAY_LABELS_UZ = {
        "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"
    };

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
    public AttendanceResponse checkOut(Principal principal) {
        UserEntity worker = requireWorker(principal);
        LocalDate today = LocalDate.now();

        DailyAttendanceEntity attendance = attendanceRepo.findByUserIdAndWorkDate(worker.getId(), today)
                .orElseThrow(() -> ApiException.notFound("attendance.not.found"));

        if (attendance.getCheckOutTime() != null) {
            throw ApiException.badRequest("already.checked.out.today");
        }

        attendance.setCheckOutTime(LocalDateTime.now());
        attendance.setUpdatedBy(worker.getId());
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

        DailyAttendanceEntity saved = attendanceRepo.save(attendance);

        if (saved.getHoursWorked() != null && saved.getHoursWorked().compareTo(BigDecimal.ZERO) > 0) {
            upsertEarning(saved, worker, worker.getId());
        }

        return toResponse(saved, worker.getFullName());
    }

    @Override
    @Transactional
    public AttendanceResponse overrideHours(UUID attendanceId, OverrideHoursRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);

        DailyAttendanceEntity attendance = attendanceRepo.findById(attendanceId)
                .filter(a -> a.getWorkshopId().equals(owner.getWorkshopId()))
                .orElseThrow(() -> ApiException.notFound("attendance.not.found"));

        EarningEntity existingEarning = earningRepo.findByAttendanceId(attendanceId).orElse(null);
        if (existingEarning != null && existingEarning.isPaid()) {
            throw ApiException.badRequest("earning.already.paid");
        }

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
    public WeeklyDayResponse upsertManualEntry(ManualEntryRequest request, Principal principal) {
        UserEntity worker = requireWorker(principal);
        LocalDate date = request.getDate();
        LocalDate today = LocalDate.now();

        if (date.isAfter(today)) {
            throw ApiException.badRequest("cannot.enter.future.date");
        }
        if (request.getCheckOutTime().isBefore(request.getCheckInTime())) {
            throw ApiException.badRequest("checkout.before.checkin");
        }

        LocalDateTime checkInDt  = date.atTime(request.getCheckInTime());
        LocalDateTime checkOutDt = date.atTime(request.getCheckOutTime());

        long minutes = Duration.between(request.getCheckInTime(), request.getCheckOutTime()).toMinutes();
        BigDecimal hoursWorked = BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        DailyAttendanceEntity attendance = attendanceRepo.findByUserIdAndWorkDate(worker.getId(), date)
                .orElse(null);

        if (attendance == null) {
            attendance = DailyAttendanceEntity.builder()
                    .userId(worker.getId())
                    .workshopId(worker.getWorkshopId())
                    .workDate(date)
                    .checkInTime(checkInDt)
                    .checkOutTime(checkOutDt)
                    .hoursWorked(hoursWorked)
                    .hoursSelfReported(true)
                    .hoursSubmittedAt(LocalDateTime.now())
                    .hoursDeadline(date.plusDays(1).atStartOfDay())
                    .hoursLocked(true)
                    .hoursLockedAt(LocalDateTime.now())
                    .manualEntry(true)
                    .notes(request.getNotes())
                    .build();
            attendance.setCreatedBy(worker.getId());
        } else {
            if (!attendance.isManualEntry()) {
                throw ApiException.badRequest("attendance.not.manual.entry");
            }
            attendance.setCheckInTime(checkInDt);
            attendance.setCheckOutTime(checkOutDt);
            attendance.setHoursWorked(hoursWorked);
            attendance.setHoursSubmittedAt(LocalDateTime.now());
            if (request.getNotes() != null) attendance.setNotes(request.getNotes());
            attendance.setUpdatedBy(worker.getId());
        }

        DailyAttendanceEntity saved = attendanceRepo.save(attendance);

        if (hoursWorked.compareTo(BigDecimal.ZERO) > 0) {
            upsertEarning(saved, worker, worker.getId());
        }

        EarningEntity earning = earningRepo.findByAttendanceId(saved.getId()).orElse(null);
        return toWeeklyDay(saved, worker, today, earning);
    }

    @Override
    @Transactional
    public WeeklyDayResponse ownerUpsertWorkerEntry(UUID workerId, ManualEntryRequest request, Principal principal) {
        UserEntity owner = requireOwner(principal);
        UserEntity worker = userRepo.findById(workerId)
                .filter(u -> owner.getWorkshopId().equals(u.getWorkshopId()))
                .orElseThrow(() -> ApiException.notFound("worker.not.found"));

        LocalDate date  = request.getDate();
        LocalDate today = LocalDate.now();
        if (date.isAfter(today)) {
            throw ApiException.badRequest("cannot.enter.future.date");
        }
        if (request.getCheckOutTime().isBefore(request.getCheckInTime())) {
            throw ApiException.badRequest("checkout.before.checkin");
        }

        LocalDateTime checkInDt  = date.atTime(request.getCheckInTime());
        LocalDateTime checkOutDt = date.atTime(request.getCheckOutTime());
        long minutes = Duration.between(request.getCheckInTime(), request.getCheckOutTime()).toMinutes();
        BigDecimal hoursWorked = BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        DailyAttendanceEntity attendance = attendanceRepo.findByUserIdAndWorkDate(worker.getId(), date)
                .orElse(null);

        // To'langan kun davomati o'zgartirilmasin
        if (attendance != null) {
            EarningEntity existingEarning = earningRepo.findByAttendanceId(attendance.getId()).orElse(null);
            if (existingEarning != null && existingEarning.isPaid()) {
                throw ApiException.badRequest("earning.already.paid");
            }
        }

        LocalDateTime now = LocalDateTime.now();
        if (attendance == null) {
            attendance = DailyAttendanceEntity.builder()
                    .userId(worker.getId())
                    .workshopId(worker.getWorkshopId())
                    .workDate(date)
                    .checkInTime(checkInDt)
                    .checkOutTime(checkOutDt)
                    .hoursWorked(hoursWorked)
                    .hoursSelfReported(false)
                    .hoursSubmittedAt(now)
                    .hoursDeadline(date.plusDays(1).atStartOfDay())
                    .hoursLocked(true)
                    .hoursLockedAt(now)
                    .manualEntry(true)
                    .ownerOverrideHours(hoursWorked)
                    .ownerOverrideBy(owner.getId())
                    .ownerOverrideAt(now)
                    .notes(request.getNotes())
                    .build();
            attendance.setCreatedBy(owner.getId());
        } else {
            attendance.setCheckInTime(checkInDt);
            attendance.setCheckOutTime(checkOutDt);
            attendance.setHoursWorked(hoursWorked);
            attendance.setHoursSubmittedAt(now);
            attendance.setHoursLocked(true);
            attendance.setHoursLockedAt(now);
            attendance.setOwnerOverrideHours(hoursWorked);
            attendance.setOwnerOverrideBy(owner.getId());
            attendance.setOwnerOverrideAt(now);
            if (request.getNotes() != null) attendance.setNotes(request.getNotes());
            attendance.setUpdatedBy(owner.getId());
        }

        DailyAttendanceEntity saved = attendanceRepo.save(attendance);
        if (hoursWorked.compareTo(BigDecimal.ZERO) > 0) {
            upsertEarning(saved, worker, owner.getId());
        }

        EarningEntity earning = earningRepo.findByAttendanceId(saved.getId()).orElse(null);
        return toWeeklyDay(saved, worker, today, earning);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WeeklyDayResponse> getMyWeeklyAttendance(LocalDate weekStart, Principal principal) {
        UserEntity worker = requireWorker(principal);
        return buildWeeklyResponse(weekStart, worker.getId(), worker);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WeeklyDayResponse> getWorkerWeeklyAttendance(UUID workerId, LocalDate weekStart, Principal principal) {
        UserEntity owner = requireOwner(principal);
        UserEntity worker = userRepo.findById(workerId)
                .filter(u -> owner.getWorkshopId().equals(u.getWorkshopId()))
                .orElseThrow(() -> ApiException.notFound("worker.not.found"));
        return buildWeeklyResponse(weekStart, workerId, worker);
    }

    private List<WeeklyDayResponse> buildWeeklyResponse(LocalDate weekStart, UUID userId, UserEntity worker) {
        LocalDate monday = weekStart.with(DayOfWeek.MONDAY);
        LocalDate today  = LocalDate.now();

        LocalDate sunday = monday.plusDays(6);
        List<DailyAttendanceEntity> records = attendanceRepo
                .findAllByUserIdAndWorkDateBetween(userId, monday, sunday);

        Map<LocalDate, DailyAttendanceEntity> recordMap = records.stream()
                .collect(Collectors.toMap(DailyAttendanceEntity::getWorkDate, Function.identity()));

        // Bir marta batch load — N+1 so'rovdan qochish va earning ma'lumotlarini sinxronlashtirish
        List<UUID> attendanceIds = records.stream()
                .map(DailyAttendanceEntity::getId).toList();
        Map<UUID, EarningEntity> earningMap = earningRepo
                .findAllByAttendanceIdIn(attendanceIds).stream()
                .collect(Collectors.toMap(EarningEntity::getAttendanceId, Function.identity()));

        List<WeeklyDayResponse> result = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate day = monday.plusDays(i);
            DailyAttendanceEntity rec = recordMap.get(day);
            if (rec != null) {
                EarningEntity earning = earningMap.get(rec.getId());
                result.add(toWeeklyDay(rec, worker, today, earning));
            } else {
                result.add(emptyWeeklyDay(day, worker, today));
            }
        }
        return result;
    }

    // earning mavjud bo'lsa u "haqiqiy manba": owner override va scheduler snapshot ini aks ettiradi.
    // earning yo'q bo'lsa attendance entitydan hisoblaydi.
    private WeeklyDayResponse toWeeklyDay(DailyAttendanceEntity a, UserEntity worker, LocalDate today, EarningEntity earning) {
        BigDecimal target = worker.getDailyHoursTarget();
        BigDecimal hours;
        BigDecimal pay;

        if (earning != null) {
            hours = earning.getHoursWorked();
            pay   = earning.getBaseAmount();
        } else {
            hours = a.getHoursWorked();
            pay   = hours != null ? calcPayAmount(hours, worker) : null;
        }

        BigDecimal bonus = (hours != null && target != null && hours.compareTo(target) > 0)
                ? hours.subtract(target).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return WeeklyDayResponse.builder()
                .date(a.getWorkDate())
                .dayLabel(dayLabel(a.getWorkDate()))
                .attendanceId(a.getId())
                .checkInTime(a.getCheckInTime() != null ? a.getCheckInTime().toLocalTime() : null)
                .checkOutTime(a.getCheckOutTime() != null ? a.getCheckOutTime().toLocalTime() : null)
                .hoursWorked(hours)
                .hoursLocked(a.isHoursLocked())
                .manualEntry(a.isManualEntry())
                .notes(a.getNotes())
                .hoursTarget(target)
                .dailySalary(worker.getDailySalary())
                .dailyPayAmount(pay)
                .bonusHours(bonus)
                .editable(!a.getWorkDate().isAfter(today))
                .paid(earning != null && earning.isPaid())
                .build();
    }

    private WeeklyDayResponse emptyWeeklyDay(LocalDate day, UserEntity worker, LocalDate today) {
        return WeeklyDayResponse.builder()
                .date(day)
                .dayLabel(dayLabel(day))
                .hoursTarget(worker.getDailyHoursTarget())
                .dailySalary(worker.getDailySalary())
                .editable(!day.isAfter(today))
                .build();
    }

    private BigDecimal calcPayAmount(BigDecimal hours, UserEntity worker) {
        BigDecimal target = worker.getDailyHoursTarget();
        if (worker.getPayType() == PayType.DAILY) {
            BigDecimal billable = hours.min(target);
            return billable.divide(target, 4, RoundingMode.HALF_UP)
                    .multiply(worker.getDailySalary() != null ? worker.getDailySalary() : BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            BigDecimal rate = worker.getHourlyRate() != null ? worker.getHourlyRate() : BigDecimal.ZERO;
            return hours.multiply(rate).setScale(2, RoundingMode.HALF_UP);
        }
    }

    private String dayLabel(LocalDate date) {
        return DAY_LABELS_UZ[date.getDayOfWeek().getValue() - 1];
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
        // Oylik ishchi uchun alohida kumulyativ logika
        if (worker.getPayType() == PayType.MONTHLY) {
            upsertMonthlyEarning(attendance, worker, actorId);
            return;
        }

        // Kunlik ishchi uchun: har attendance uchun alohida qator
        BigDecimal hours = attendance.getHoursWorked();
        BigDecimal target = worker.getDailyHoursTarget();
        BigDecimal snapshotDailyRate = worker.getDailySalary();
        // Necha soat ishlagan bo'lsa shuncha ulushi (target soat=to'liq kun).
        // Ortiqcha soat (hours > target) ko'rsatiladi lekin to'lovga qo'shilmaydi.
        BigDecimal billableHours = hours.min(target);
        BigDecimal baseAmount = billableHours.divide(target, 4, RoundingMode.HALF_UP)
                .multiply(worker.getDailySalary())
                .setScale(2, RoundingMode.HALF_UP);

        earningRepo.findByAttendanceId(attendance.getId()).ifPresentOrElse(
                existing -> {
                    existing.setHoursWorked(hours);
                    existing.setHoursTarget(target);
                    existing.setDailyRate(snapshotDailyRate);
                    existing.setBaseAmount(baseAmount);
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
                            .earnType(EarnType.DAILY_WAGE)
                            .attendanceId(attendance.getId())
                            .hoursWorked(hours)
                            .hoursTarget(target)
                            .daysWorked(BigDecimal.ONE)
                            .dailyRate(snapshotDailyRate)
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

    // Oylik ishchi: bitta to'lanmagan MONTHLY_WAGE qatori bo'ladi, har kuni yangilanadi.
    private void upsertMonthlyEarning(DailyAttendanceEntity attendance, UserEntity worker, UUID actorId) {
        BigDecimal monthlySalary = worker.getMonthlySalary() != null ? worker.getMonthlySalary() : BigDecimal.ZERO;
        LocalDate today = attendance.getWorkDate();

        earningRepo.findByWorkerIdAndEarnTypeAndPaidFalse(worker.getId(), EarnType.MONTHLY_WAGE)
                .ifPresentOrElse(
                        existing -> {
                            // Kelgan kunlarni qayta sanash (idempotent — double count yo'q)
                            long daysWorked = attendanceRepo.countWorkedDays(
                                    worker.getId(), existing.getPeriodStart(), today, BigDecimal.ZERO);
                            int daysInMonth = existing.getDaysInMonth();
                            BigDecimal amount = daysInMonth > 0
                                    ? monthlySalary.multiply(BigDecimal.valueOf(daysWorked))
                                                   .divide(BigDecimal.valueOf(daysInMonth), 2, RoundingMode.HALF_UP)
                                    : BigDecimal.ZERO;
                            existing.setDaysWorked(BigDecimal.valueOf(daysWorked));
                            existing.setMonthlySalary(monthlySalary);
                            existing.setBaseAmount(amount);
                            existing.setTotalAmount(amount);
                            existing.setEarnDate(today);
                            existing.setUpdatedBy(actorId);
                            earningRepo.save(existing);
                        },
                        () -> {
                            // Yangi to'lov sikli boshlandi
                            int daysInMonth = today.lengthOfMonth();
                            BigDecimal perDay = daysInMonth > 0
                                    ? monthlySalary.divide(BigDecimal.valueOf(daysInMonth), 4, RoundingMode.HALF_UP)
                                    : BigDecimal.ZERO;
                            EarningEntity earning = EarningEntity.builder()
                                    .workerId(worker.getId())
                                    .workshopId(worker.getWorkshopId())
                                    .earnDate(today)
                                    .earnType(EarnType.MONTHLY_WAGE)
                                    .monthlySalary(monthlySalary)
                                    .periodStart(today)
                                    .daysInMonth(daysInMonth)
                                    .daysWorked(BigDecimal.ONE)
                                    .baseAmount(perDay)
                                    .totalAmount(perDay)
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
