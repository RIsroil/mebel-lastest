package project.mebel.attendance;

import project.mebel.attendance.dto.AttendanceResponse;
import project.mebel.attendance.dto.OverrideHoursRequest;
import project.mebel.attendance.dto.SubmitHoursRequest;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AttendanceService {

    AttendanceResponse checkIn(Principal principal);

    AttendanceResponse submitHours(SubmitHoursRequest request, Principal principal);

    AttendanceResponse overrideHours(UUID attendanceId, OverrideHoursRequest request, Principal principal);

    List<AttendanceResponse> getMyAttendance(LocalDate from, LocalDate to, Principal principal);

    List<AttendanceResponse> getWorkshopAttendance(LocalDate date, Principal principal);

    List<AttendanceResponse> getWorkerAttendance(UUID workerId, LocalDate from, LocalDate to, Principal principal);

    void lockExpiredAttendance();
}
