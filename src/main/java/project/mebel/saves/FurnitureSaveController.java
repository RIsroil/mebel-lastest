package project.mebel.saves;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.mebel.saves.dto.FurnitureSaveRequest;
import project.mebel.saves.dto.FurnitureSaveResponse;
import project.mebel.saves.dto.SaveCutRequest;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/saves")
@RequiredArgsConstructor
@Tag(name = "Saves", description = "Kesim ro'yxatlari (faqat OWNER)")
public class FurnitureSaveController {

    private final FurnitureSaveService saveService;

    @PostMapping
    @Operation(summary = "Yangi save yaratish")
    public ResponseEntity<FurnitureSaveResponse> create(@RequestBody FurnitureSaveRequest request,
                                                        Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(saveService.create(request, principal));
    }

    @GetMapping
    @Operation(summary = "Barcha savelar ro'yxati")
    public ResponseEntity<List<FurnitureSaveResponse>> getAll(Principal principal) {
        return ResponseEntity.ok(saveService.getAll(principal));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Save ma'lumotlari")
    public ResponseEntity<FurnitureSaveResponse> getById(@PathVariable UUID id, Principal principal) {
        return ResponseEntity.ok(saveService.getById(id, principal));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Saveni yangilash")
    public ResponseEntity<FurnitureSaveResponse> update(@PathVariable UUID id,
                                                        @RequestBody FurnitureSaveRequest request,
                                                        Principal principal) {
        return ResponseEntity.ok(saveService.update(id, request, principal));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Saveni o'chirish")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Principal principal) {
        saveService.delete(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cuts")
    @Operation(summary = "Savega kesim qo'shish")
    public ResponseEntity<FurnitureSaveResponse> addCut(@PathVariable UUID id,
                                                        @RequestBody SaveCutRequest request,
                                                        Principal principal) {
        return ResponseEntity.ok(saveService.addCut(id, request, principal));
    }

    @PatchMapping("/{id}/cuts/{cutId}")
    @Operation(summary = "Kesimni yangilash")
    public ResponseEntity<FurnitureSaveResponse> updateCut(@PathVariable UUID id,
                                                           @PathVariable UUID cutId,
                                                           @RequestBody SaveCutRequest request,
                                                           Principal principal) {
        return ResponseEntity.ok(saveService.updateCut(id, cutId, request, principal));
    }

    @DeleteMapping("/{id}/cuts/{cutId}")
    @Operation(summary = "Kesimni o'chirish")
    public ResponseEntity<FurnitureSaveResponse> removeCut(@PathVariable UUID id,
                                                           @PathVariable UUID cutId,
                                                           Principal principal) {
        return ResponseEntity.ok(saveService.removeCut(id, cutId, principal));
    }
}
