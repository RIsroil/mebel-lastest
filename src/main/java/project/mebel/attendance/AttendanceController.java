package project.mebel.attendance;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.mebel.attendance.dto.AttendanceResponse;
import project.mebel.attendance.dto.OverrideHoursRequest;
import project.mebel.attendance.dto.SubmitHoursRequest;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "Davomat boshqaruvi")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/check-in")
    @Operation(summary = "Ishga kirish (WORKER)")
    public ResponseEntity<AttendanceResponse> checkIn(Principal principal) {
        return ResponseEntity.ok(attendanceService.checkIn(principal));
    }

    @PostMapping("/check-out")
    @Operation(summary = "Ishdan chiqish (WORKER)")
    public ResponseEntity<AttendanceResponse> checkOut(Principal principal) {
        return ResponseEntity.ok(attendanceService.checkOut(principal));
    }

    @PostMapping("/submit-hours")
    @Operation(summary = "Soatlarni yuborish (WORKER)")
    public ResponseEntity<AttendanceResponse> submitHours(@RequestBody SubmitHoursRequest request,
                                                          Principal principal) {
        return ResponseEntity.ok(attendanceService.submitHours(request, principal));
    }

    @PatchMapping("/{id}/override")
    @Operation(summary = "Soatlarni tuzatish (OWNER)")
    public ResponseEntity<AttendanceResponse> overrideHours(@PathVariable UUID id,
                                                            @RequestBody OverrideHoursRequest request,
                                                            Principal principal) {
        return ResponseEntity.ok(attendanceService.overrideHours(id, request, principal));
    }

    @GetMapping("/my")
    @Operation(summary = "O'z davomat tarixi (WORKER)")
    public ResponseEntity<List<AttendanceResponse>> getMyAttendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Principal principal) {
        return ResponseEntity.ok(attendanceService.getMyAttendance(from, to, principal));
    }

    @GetMapping("/workshop")
    @Operation(summary = "Workshop davomat ro'yxati bugun (OWNER)")
    public ResponseEntity<List<AttendanceResponse>> getWorkshopAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Principal principal) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(attendanceService.getWorkshopAttendance(targetDate, principal));
    }

    @GetMapping("/workers/{workerId}")
    @Operation(summary = "Ishchi davomat tarixi (OWNER)")
    public ResponseEntity<List<AttendanceResponse>> getWorkerAttendance(
            @PathVariable UUID workerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Principal principal) {
        return ResponseEntity.ok(attendanceService.getWorkerAttendance(workerId, from, to, principal));
    }
}
