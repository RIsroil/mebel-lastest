package project.mebel.minio.objects;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.mebel.utils.Utils;
import project.mebel.common.enums.UserRole;
import project.mebel.exception.ApiException;
import project.mebel.minio.MinioStorageService;
import project.mebel.minio.objects.enums.ImageStatus;
import project.mebel.user.UserEntity;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageEntityServiceImpl implements ImageEntityService {

    private final ImageEntityRepository imageRepository;
    private final MinioStorageService minioStorageService;
    private final Utils utils;

    @Override
    @Transactional
    public ImageEntity createImage(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        ImageEntity newImage = new ImageEntity();
        newImage.setUrl(url);
        newImage.setStatus(ImageStatus.USING);
        return imageRepository.save(newImage);
    }

    @Override
    @Transactional
    public ImageEntity updateImage(UUID oldImageId, String newUrl) {
        if (newUrl == null || newUrl.isBlank()) {
            if (oldImageId != null) {
                ImageEntity oldImage = imageRepository.findById(oldImageId)
                        .orElseThrow(() -> ApiException.notFound("old.image.not.found"));
                oldImage.setStatus(ImageStatus.UNUSING);
                imageRepository.save(oldImage);
            }
            return null;
        }

        if (oldImageId != null) {
            ImageEntity oldImage = imageRepository.findById(oldImageId)
                    .orElseThrow(() -> ApiException.notFound("old.image.not.found"));
            oldImage.setStatus(ImageStatus.UNUSING);
            imageRepository.save(oldImage);
        }

        return createImage(newUrl);
    }

    @Override
    @Transactional
    public void cleanupUnusedImages(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        if (user.getRole() != UserRole.ADMIN) {
            throw ApiException.forbidden("access.denied");
        }
        log.info("Starting cleanup of unused images...");
        List<ImageEntity> unusedImages = imageRepository.findByStatus(ImageStatus.UNUSING);
        log.info("Found {} unused images to process.", unusedImages.size());

        for (ImageEntity image : unusedImages) {
            try {
                minioStorageService.deleteStoredFile(image.getUrl());
                image.setStatus(ImageStatus.DELETED);
                imageRepository.save(image);
                log.info("Successfully deleted image file and marked as DELETED: {}", image.getId());
            } catch (Exception e) {
                log.error("Failed to process image cleanup for ID {}: {}", image.getId(), e.getMessage());
                // Optionally, decide if you want to continue or stop on error
            }
        }
        log.info("Finished cleanup of unused images.");
    }
}
