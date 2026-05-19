package project.mebel.earning;

import project.mebel.earning.dto.BonusRequest;
import project.mebel.earning.dto.EarningResponse;

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

    EarningResponse addBonus(BonusRequest request, Principal principal);
}
