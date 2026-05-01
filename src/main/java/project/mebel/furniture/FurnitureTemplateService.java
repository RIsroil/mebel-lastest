package project.mebel.furniture;

import project.mebel.furniture.dto.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

public interface FurnitureTemplateService {

    FurnitureTemplateResponse createTemplate(FurnitureTemplateRequest request, Principal principal);

    List<FurnitureTemplateResponse> getAllTemplates(Principal principal);

    FurnitureTemplateResponse getTemplateById(UUID id, Principal principal);

    FurnitureTemplateResponse updateTemplate(UUID id, FurnitureTemplateRequest request, Principal principal);

    void deleteTemplate(UUID id, Principal principal);

    FurnitureTemplateResponse addMaterial(UUID templateId, TemplateMaterialRequest request, Principal principal);

    void removeMaterial(UUID templateId, UUID materialId, Principal principal);
}
