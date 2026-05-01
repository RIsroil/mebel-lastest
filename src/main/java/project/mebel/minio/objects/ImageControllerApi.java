package project.mebel.minio.objects;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import project.mebel.minio.objects.enums.ImageStatus;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.UUID;

@Tag(name = "Image Management", description = "Endpoints for managing images")
@RequestMapping("/api/images")
public interface ImageControllerApi {

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a new image")
    ImageResponse uploadImage(
            @Parameter(description = "Image file to upload", required = true)
            @RequestParam("file") MultipartFile file,
            Principal principal
    );

    @GetMapping
    @Operation(summary = "Get images with filters (Super Admin only)")
    Page<ImageResponse> getImages(
            @RequestParam(required = false) UUID id,
            @RequestParam(required = false) ImageStatus status,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            Pageable pageable,
            Principal principal
    );

    @DeleteMapping("/hard-delete")
    @Operation(summary = "Hard delete images (Super Admin only)")
    String hardDeleteImages(
            @RequestParam(required = false) UUID id,
            Principal principal
    );

    @PostMapping("/cleanup")
    @Operation(summary = "Cleanup Unused Images")
    String cleanupImages(Principal principal);
}