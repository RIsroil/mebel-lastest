package project.mebel.furniture;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface MaterialUsageRepository extends JpaRepository<MaterialUsageEntity, UUID> {

    List<MaterialUsageEntity> findAllByFurnitureOrderId(UUID furnitureOrderId);

    @Query("SELECT COALESCE(SUM(m.totalCost), 0) FROM MaterialUsageEntity m WHERE m.furnitureOrderId = :orderId AND m.deletedAt IS NULL")
    BigDecimal sumTotalCostByOrderId(UUID orderId);
}
