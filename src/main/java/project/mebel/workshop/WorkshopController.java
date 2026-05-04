package project.mebel.workshop;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.mebel.workshop.dto.WorkshopRequest;
import project.mebel.workshop.dto.WorkshopResponse;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/workshops")
@RequiredArgsConstructor
@Tag(name = "Workshop", description = "Mebel sehlari boshqaruvi")
public class WorkshopController {

    private final WorkshopService workshopService;

    @PostMapping
    @Operation(summary = "Yangi seh yaratish (faqat OWNER)")
    public ResponseEntity<WorkshopResponse> create(@RequestBody WorkshopRequest request,
                                                   Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workshopService.create(request, principal));
    }

    @GetMapping
    @Operation(summary = "Sehlar ro'yxati (ADMIN — hammasi, OWNER — o'ziniki). Pageable: ?page=0&size=10&sort=name,asc")
    public ResponseEntity<Page<WorkshopResponse>> getAll(
            Principal principal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(workshopService.getAll(principal, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Seh ma'lumotlari")
    public ResponseEntity<WorkshopResponse> getById(@PathVariable UUID id, Principal principal) {
        return ResponseEntity.ok(workshopService.getById(id, principal));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Seh ma'lumotlarini yangilash")
    public ResponseEntity<WorkshopResponse> update(@PathVariable UUID id,
                                                   @RequestBody WorkshopRequest request,
                                                   Principal principal) {
        return ResponseEntity.ok(workshopService.update(id, request, principal));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Sehni o'chirish (soft delete)")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Principal principal) {
        workshopService.delete(id, principal);
        return ResponseEntity.noContent().build();
    }
}
