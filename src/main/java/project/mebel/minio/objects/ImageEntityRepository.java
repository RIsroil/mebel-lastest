package project.mebel.minio.objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import project.mebel.minio.objects.enums.ImageStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ImageEntityRepository extends JpaRepository<ImageEntity, UUID> {
    List<ImageEntity> findByStatus(ImageStatus status);

    @Query("SELECT i FROM ImageEntity i WHERE " +
            "(:id IS NULL OR i.id = :id) AND " +
            "(:status IS NULL OR i.status = :status) AND " +
            "(:startDate IS NULL OR i.createdAt >= :startDate) AND " +
            "(:endDate IS NULL OR i.createdAt <= :endDate)")
    Page<ImageEntity> findImagesWithFilters(
            @Param("id") UUID id,
            @Param("status") ImageStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}
