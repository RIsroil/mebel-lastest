package project.mebel.furniture;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.mebel.furniture.dto.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/furniture/templates")
@RequiredArgsConstructor
@Tag(name = "Furniture Templates", description = "Mebel shablonlari (faqat OWNER)")
public class FurnitureTemplateController {

    private final FurnitureTemplateService templateService;

    @PostMapping
    @Operation(summary = "Yangi shablon yaratish")
    public ResponseEntity<FurnitureTemplateResponse> create(@RequestBody FurnitureTemplateRequest request,
                                                            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(templateService.createTemplate(request, principal));
    }

    @GetMapping
    @Operation(summary = "Barcha shablonlar ro'yxati")
    public ResponseEntity<List<FurnitureTemplateResponse>> getAll(Principal principal) {
        return ResponseEntity.ok(templateService.getAllTemplates(principal));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Shablon ma'lumotlari")
    public ResponseEntity<FurnitureTemplateResponse> getById(@PathVariable UUID id, Principal principal) {
        return ResponseEntity.ok(templateService.getTemplateById(id, principal));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Shablonni yangilash")
    public ResponseEntity<FurnitureTemplateResponse> update(@PathVariable UUID id,
                                                            @RequestBody FurnitureTemplateRequest request,
                                                            Principal principal) {
        return ResponseEntity.ok(templateService.updateTemplate(id, request, principal));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Shablonni o'chirish")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Principal principal) {
        templateService.deleteTemplate(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/materials")
    @Operation(summary = "Shablonga material qo'shish")
    public ResponseEntity<FurnitureTemplateResponse> addMaterial(@PathVariable UUID id,
                                                                  @RequestBody TemplateMaterialRequest request,
                                                                  Principal principal) {
        return ResponseEntity.ok(templateService.addMaterial(id, request, principal));
    }

    @DeleteMapping("/{id}/materials/{materialId}")
    @Operation(summary = "Shablondan materialni o'chirish")
    public ResponseEntity<Void> removeMaterial(@PathVariable UUID id,
                                               @PathVariable UUID materialId,
                                               Principal principal) {
        templateService.removeMaterial(id, materialId, principal);
        return ResponseEntity.noContent().build();
    }
}
