package project.mebel.saves;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import project.mebel.common.entity.SoftDeleteEntity;

import java.util.UUID;

@Entity
@Table(name = "save_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SaveImageEntity extends SoftDeleteEntity {

    @Column(name = "save_id", nullable = false)
    private UUID saveId;

    @Column(name = "minio_bucket", nullable = false, length = 100)
    private String minioBucket;

    @Column(name = "minio_object_key", nullable = false, length = 500)
    private String minioObjectKey;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "mime_type", nullable = false, length = 50)
    private String mimeType;

    @Column(name = "file_size_bytes", nullable = false)
    private long fileSizeBytes;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private short sortOrder = 0;

    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private boolean primary = false;

    @Column(name = "stored_path", length = 1000)
    private String storedPath;
}
