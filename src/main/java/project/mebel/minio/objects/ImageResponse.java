package project.mebel.minio.objects;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import project.mebel.minio.objects.enums.ImageStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class ImageResponse {
    private UUID id;
    private String url;
    private ImageStatus status;
    private LocalDateTime createdAt;
}

