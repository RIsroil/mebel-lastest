package project.mebel.earning;

import project.mebel.earning.dto.BonusRequest;
import project.mebel.earning.dto.EarningResponse;
import project.mebel.earning.dto.EnhancedPaymentRequest;
import project.mebel.earning.dto.SkipPaymentRequest;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface EarningService {

    List<EarningResponse> getMyEarnings(LocalDate from, LocalDate to, Principal principal);

    List<EarningResponse> getWorkerEarnings(UUID workerId, LocalDate from, LocalDate to, Principal principal);

    List<EarningResponse> getWorkshopEarnings(LocalDate from, LocalDate to, Principal principal);

    EarningResponse payEarning(UUID earningId, Principal principal);

    /** Batch payment for multiple earnings (e.g., monthly wages) */
    List<EarningResponse> payEarnings(List<UUID> earningIds, Principal principal);

    /** Partial payment - pay only N days from aggregated earnings */
    List<EarningResponse> payPartial(List<UUID> earningIds, int daysToPay, Principal principal);

    /** Enhanced payment with custom amount and notes */
    List<EarningResponse> payEnhanced(EnhancedPaymentRequest request, Principal principal);

    /** Skip payment - mark as not payable, soft-delete */
    void skipPayment(SkipPaymentRequest request, Principal principal);

    EarningResponse addBonus(BonusRequest request, Principal principal);
}
