package project.mebel.minio.objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import project.mebel.minio.objects.enums.ImageStatus;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.UUID;

public interface ImageService {
    ImageResponse uploadImage(MultipartFile file, Principal principal);
    ImageEntity changeImageStatus(UUID imageId, boolean isUsing);
    Page<ImageResponse> getImages(UUID id, ImageStatus status, LocalDateTime startDate,
                                  LocalDateTime endDate, Pageable pageable, Principal principal);
    int hardDeleteImages(UUID id, Principal principal);
}