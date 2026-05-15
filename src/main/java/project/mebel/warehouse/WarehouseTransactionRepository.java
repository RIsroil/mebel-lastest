package project.mebel.warehouse;

import org.springframework.data.jpa.repository.JpaRepository;
import project.mebel.common.enums.TransactionType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface WarehouseTransactionRepository extends JpaRepository<WarehouseTransactionEntity, UUID> {

    List<WarehouseTransactionEntity> findAllByWorkshopIdOrderByCreatedAtDesc(UUID workshopId);

    List<WarehouseTransactionEntity> findAllByItemIdOrderByCreatedAtDesc(UUID itemId);

    List<WarehouseTransactionEntity> findAllByWorkshopIdAndTransactionTypeAndCreatedAtBetweenOrderByCreatedAtDesc(
            UUID workshopId, TransactionType transactionType, LocalDateTime from, LocalDateTime to);
}
