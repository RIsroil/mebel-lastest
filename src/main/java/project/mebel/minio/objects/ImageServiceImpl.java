package project.mebel.minio.objects;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import project.mebel.utils.Utils;
import project.mebel.user.enums.Role;
import project.mebel.exception.ApiException;
import project.mebel.minio.MinioStorageService;
import project.mebel.minio.objects.enums.ImageStatus;
import project.mebel.user.UserEntity;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Log4j2
public class ImageServiceImpl implements ImageService {

    private final ImageEntityRepository imageRepository;
    private final MinioStorageService minioStorageService;
    private final Utils utils;

    @Override
    @Transactional
    public ImageResponse uploadImage(MultipartFile file, Principal principal) {
        utils.getUserFromPrincipal(principal);
        String url = minioStorageService.saveGenericImage(file);
        ImageEntity newImage = new ImageEntity();
        newImage.setUrl(url);
        newImage.setStatus(ImageStatus.UNUSING);
        return mapToResponse(imageRepository.save(newImage));
    }

    @Override
    @Transactional
    public ImageEntity changeImageStatus(UUID imageId, boolean isUsing) {
        if (imageId == null) {
            return null;
        }
        ImageEntity image = imageRepository.findById(imageId)
                .orElseThrow(() -> ApiException.notFound("image.not.found"));
        image.setStatus(isUsing ? ImageStatus.USING : ImageStatus.UNUSING);
        return imageRepository.save(image);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ImageResponse> getImages(UUID id, ImageStatus status, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable, Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        if (user.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("Only ADMIN can view images");
        }
        Page<ImageEntity> images = imageRepository.findImagesWithFilters(id, status, startDate, endDate, pageable);
        return images.map(this::mapToResponse);
    }

    @Override
    @Transactional
    public int hardDeleteImages(UUID id, Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        if (user.getRole() != Role.ADMIN) {
            throw ApiException.forbidden("Only ADMIN can delete images");
        }
        if (id != null) {
            ImageEntity image = imageRepository.findById(id)
                    .orElseThrow(() -> ApiException.notFound("image.not.found"));

            if (image.getStatus() != ImageStatus.DELETED) {
                throw ApiException.badRequest("image.status.not.deleted");
            }

            try {
                minioStorageService.deleteStoredFile(image.getUrl());
            } catch (Exception e) {
                log.warn("Failed to delete image from storage: {}", image.getUrl(), e);
            }

            imageRepository.delete(image);
            return 1;
        } else {
            List<ImageEntity> deletedImages = imageRepository.findByStatus(ImageStatus.DELETED);
            int count = deletedImages.size();

            for (ImageEntity image : deletedImages) {
                try {
                    minioStorageService.deleteStoredFile(image.getUrl());
                } catch (Exception e) {
                    log.warn("Failed to delete image from storage: {}", image.getUrl(), e);
                }
            }

            imageRepository.deleteAll(deletedImages);
            log.info("Hard deleted {} images with DELETED status", count);
            return count;
        }
    }

    private ImageResponse mapToResponse(ImageEntity entity) {
        return ImageResponse.builder()
                .id(entity.getId())
                .url(entity.getUrl())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
