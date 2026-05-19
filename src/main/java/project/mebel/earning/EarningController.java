package project.mebel.earning;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.mebel.earning.dto.BonusRequest;
import project.mebel.earning.dto.EarningResponse;
import project.mebel.earning.dto.PartialPaymentRequest;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/earnings")
@RequiredArgsConstructor
@Tag(name = "Earnings", description = "Daromadlar boshqaruvi")
public class EarningController {

    private final EarningService earningService;

    @GetMapping("/my")
    @Operation(summary = "O'z daromadlari (WORKER). from/to berilmasa oxirgi 30 kun qaytariladi")
    public ResponseEntity<List<EarningResponse>> getMyEarnings(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Principal principal) {
        LocalDate effectiveTo = to != null ? to : LocalDate.now();
        LocalDate effectiveFrom = from != null ? from : effectiveTo.minusDays(30);
        return ResponseEntity.ok(earningService.getMyEarnings(effectiveFrom, effectiveTo, principal));
    }

    @GetMapping("/workers/{workerId}")
    @Operation(summary = "Ishchi daromadlari (OWNER)")
    public ResponseEntity<List<EarningResponse>> getWorkerEarnings(
            @PathVariable UUID workerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Principal principal) {
        return ResponseEntity.ok(earningService.getWorkerEarnings(workerId, from, to, principal));
    }

    @GetMapping("/workshop")
    @Operation(summary = "Workshop daromadlari (OWNER)")
    public ResponseEntity<List<EarningResponse>> getWorkshopEarnings(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Principal principal) {
        return ResponseEntity.ok(earningService.getWorkshopEarnings(from, to, principal));
    }

    @PatchMapping("/{id}/pay")
    @Operation(summary = "Daromadni to'langan deb belgilash (OWNER)")
    public ResponseEntity<EarningResponse> payEarning(@PathVariable UUID id, Principal principal) {
        return ResponseEntity.ok(earningService.payEarning(id, principal));
    }

    @PatchMapping("/pay-batch")
    @Operation(summary = "Bir nechta daromadni to'langan deb belgilash (OWNER) - oylik maosh uchun")
    public ResponseEntity<List<EarningResponse>> payEarnings(@RequestBody List<UUID> earningIds, Principal principal) {
        return ResponseEntity.ok(earningService.payEarnings(earningIds, principal));
    }

    @PatchMapping("/pay-partial")
    @Operation(summary = "Qisman to'lash - faqat N kunni to'lash (OWNER)")
    public ResponseEntity<List<EarningResponse>> payPartial(@RequestBody PartialPaymentRequest request, Principal principal) {
        return ResponseEntity.ok(earningService.payPartial(request.getEarningIds(), request.getDaysToPay(), principal));
    }

    @PostMapping("/bonus")
    @Operation(summary = "Bonus qo'shish (OWNER)")
    public ResponseEntity<EarningResponse> addBonus(@RequestBody BonusRequest request, Principal principal) {
        return ResponseEntity.ok(earningService.addBonus(request, principal));
    }
}
