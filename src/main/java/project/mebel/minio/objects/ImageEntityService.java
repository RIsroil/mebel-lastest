package project.mebel.minio.objects;

import java.security.Principal;
import java.util.UUID;

public interface ImageEntityService {
    ImageEntity createImage(String url);
    ImageEntity updateImage(UUID oldImageId, String newUrl);
    void cleanupUnusedImages(Principal principal);
}
