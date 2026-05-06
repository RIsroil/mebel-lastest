package project.mebel.financiallog;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.mebel.common.enums.FinancialLogType;
import project.mebel.financiallog.dto.FinancialLogResponse;
import project.mebel.financiallog.dto.FinancialLogSummaryResponse;

import java.security.Principal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/owner/logs")
@RequiredArgsConstructor
@Tag(name = "Financial Logs", description = "Owner moliyaviy jurnal")
public class FinancialLogController {

    private final FinancialLogService logService;

    @GetMapping
    @Operation(summary = "Moliyaviy jurnal ro'yxati. Filter: from, to, type")
    public ResponseEntity<Page<FinancialLogResponse>> getLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) FinancialLogType type,
            @PageableDefault(size = 30, sort = "logDate", direction = Sort.Direction.DESC) Pageable pageable,
            Principal principal) {
        return ResponseEntity.ok(logService.getLogs(from, to, type, pageable, principal));
    }

    @GetMapping("/summary/last-month")
    @Operation(summary = "O'tgan oy moliyaviy xulosasi")
    public ResponseEntity<FinancialLogSummaryResponse> getLastMonthSummary(Principal principal) {
        return ResponseEntity.ok(logService.getLastMonthSummary(principal));
    }

    @GetMapping("/summary")
    @Operation(summary = "Berilgan davr moliyaviy xulosasi")
    public ResponseEntity<FinancialLogSummaryResponse> getPeriodSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Principal principal) {
        return ResponseEntity.ok(logService.getPeriodSummary(from, to, principal));
    }
}
