package project.mebel.minio;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import project.mebel.exception.ApiException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Log4j2
public class MinioStorageService {

    private final MinioClient minioClient;

    @Value("${storage.mode:local}")
    private String storageMode;

    @Value("${minio.bucket.userprofile}")
    private String userProfileBucket;

    @Value("${app.base-url}")
    private String appBaseUrl;

    @Value("${minio.bucket.generic-images}")
    private String genericImagesBucket;

    private final String desktopBasePath = System.getProperty("user.home") +
            File.separator + "Desktop" + File.separator + "RestaurantStorage";

    // Constructor - MinioClient inject qilinadi
    public MinioStorageService(MinioClient minioClient) {
        this.minioClient = minioClient;
        File baseDir = new File(desktopBasePath);
        if (!baseDir.exists()) {
            baseDir.mkdirs();
        }
    }

    public String saveUserProfileImage(UUID userId, MultipartFile file) {
        return saveFile(userProfileBucket, userId.toString(), file);
    }

    public String saveGenericImage(MultipartFile file) {
        return saveFile(genericImagesBucket, "images", file);
    }

    private String saveFile(String bucket, String subFolder, MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = UUID.randomUUID() + extension;

        if ("minio".equalsIgnoreCase(storageMode)) {
            String objectName = subFolder + "/" + fileName;
            try {
                minioClient.putObject(PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .stream(file.getInputStream(), file.getSize(), -1)
                        .contentType(file.getContentType())
                        .build());
                log.info("File uploaded to MinIO: {}/{}", bucket, objectName);
                return appBaseUrl + "/" + bucket + "/" + objectName;
            } catch (Exception e) {
                log.error("MinIO upload failed: {}", e.getMessage());
                throw ApiException.internalServerError("File saving error: " + e.getMessage());
            }
        } else {
            String folderPath = desktopBasePath + File.separator + bucket + File.separator + subFolder;
            File folder = new File(folderPath);
            if (!folder.exists()) {
                folder.mkdirs();
            }
            Path targetPath = new File(folder, fileName).toPath();
            try {
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
                log.info("File saved locally: {}", targetPath);
                return targetPath.toString();
            } catch (IOException e) {
                log.error("Local save failed: {}", e.getMessage());
                throw ApiException.internalServerError("File saving error: " + e.getMessage());
            }
        }
    }

    // Deletes a stored file (best effort). Accepts either local absolute path or full appBaseUrl URL for MinIO.
    public void deleteStoredFile(String path) {
        if (path == null || path.isBlank()) return;
        try {
            if ("minio".equalsIgnoreCase(storageMode)) {
                // Expecting path like appBaseUrl/bucket/object... Strip base URL
                String normalized = path;
                if (normalized.startsWith(appBaseUrl)) {
                    normalized = normalized.substring(appBaseUrl.length());
                }
                if (normalized.startsWith("/")) normalized = normalized.substring(1);
                int firstSlash = normalized.indexOf('/');
                if (firstSlash < 0) {
                    log.warn("Could not parse bucket from path: {}", path);
                    return;
                }
                String bucket = normalized.substring(0, firstSlash);
                String object = normalized.substring(firstSlash + 1);
                minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(object).build());
                log.info("Removed object from MinIO: {}/{}", bucket, object);
            } else {
                File f = new File(path);
                if (f.exists() && f.isFile()) {
                    if (f.delete()) {
                        log.info("Deleted local file: {}", path);
                    } else {
                        log.warn("Failed to delete local file: {}", path);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to delete stored file {}: {}", path, e.getMessage());
        }
    }
}