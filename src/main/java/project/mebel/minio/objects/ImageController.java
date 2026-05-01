package project.mebel.minio.objects;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import project.mebel.exception.ResponseWrapper;
import project.mebel.minio.objects.enums.ImageStatus;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController implements ImageControllerApi {

    private final ImageService imageService;
    private final ImageEntityService imageEntityService;

    @Override
    public ImageResponse uploadImage(MultipartFile file, Principal principal) {
        return ResponseWrapper.success(
                imageService.uploadImage(file, principal),
                "image.uploaded.successfully"
        );
    }

    @Override
    public Page<ImageResponse> getImages(UUID id, ImageStatus status,
                                         LocalDateTime startDate, LocalDateTime endDate,
                                         Pageable pageable, Principal principal) {
        return ResponseWrapper.success(
                imageService.getImages(id, status, startDate, endDate, pageable, principal),
                "images.retrieved.successfully"
        );
    }

    @Override
    public String hardDeleteImages(UUID id, Principal principal) {
        int deletedCount = imageService.hardDeleteImages(id, principal);
        String messageKey = id != null
                ? "image.hard.deleted.successfully"
                : "images.hard.deleted.successfully.count";
        return ResponseWrapper.success(deletedCount + " image(s) deleted", messageKey);
    }

    @Override
    public String cleanupImages(Principal principal) {
        imageEntityService.cleanupUnusedImages(principal);
        return ResponseWrapper.success(null, "image.cleanup.started.successfully");
    }
}