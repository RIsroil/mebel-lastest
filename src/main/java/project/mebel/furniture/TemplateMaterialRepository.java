package project.mebel.furniture;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TemplateMaterialRepository extends JpaRepository<TemplateMaterialEntity, UUID> {

    List<TemplateMaterialEntity> findAllByTemplateId(UUID templateId);
}
