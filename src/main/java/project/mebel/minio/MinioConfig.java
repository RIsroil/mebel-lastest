package project.mebel.minio;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Log4j2
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String minioEndpoint;

    @Value("${minio.access-key}")
    private String minioAccessKey;

    @Value("${minio.secret-key}")
    private String minioSecretKey;

    @Value("${minio.bucket.userprofile}")
    private String userProfileBucket;

    @Value("${storage.mode}")
    private String storageMode;

    @Bean
    public MinioClient minioClient() {
        log.info("Creating MinIO client for endpoint: {}", minioEndpoint);
        return MinioClient.builder()
                .endpoint(minioEndpoint)
                .credentials(minioAccessKey, minioSecretKey)
                .build();
    }

    @Bean
    public CommandLineRunner initializeMinioBuckets(MinioClient minioClient) {
        return args -> {
            if (!"minio".equalsIgnoreCase(storageMode)) {
                log.info("Storage mode is '{}', skipping MinIO initialization", storageMode);
                return;
            }

            log.info("Starting MinIO bucket initialization...");

            String[] buckets = {
                    userProfileBucket
            };

            for (String bucket : buckets) {
                try {
                    boolean exists = minioClient.bucketExists(
                            BucketExistsArgs.builder().bucket(bucket).build()
                    );

                    if (!exists) {
                        // Bucket yaratish
                        minioClient.makeBucket(
                                MakeBucketArgs.builder().bucket(bucket).build()
                        );
                        log.info("✓ Bucket created: {}", bucket);

                        // Public read policy qo'shish (ixtiyoriy)
                        String policy = getPolicyJson(bucket);
                        minioClient.setBucketPolicy(
                                SetBucketPolicyArgs.builder()
                                        .bucket(bucket)
                                        .config(policy)
                                        .build()
                        );
                        log.info("✓ Policy set for bucket: {}", bucket);
                    } else {
                        log.info("✓ Bucket already exists: {}", bucket);
                    }
                } catch (Exception e) {
                    log.error("Failed to process bucket '{}': {}", bucket, e.getMessage());
                    // Davom ettiramiz, boshqa bucketlarni ham yaratishga harakat qilamiz
                }
            }

            log.info("MinIO bucket initialization completed");
        };
    }

    // Public read policy (barcha filеlarni public qilish uchun)
    private String getPolicyJson(String bucketName) {
        return """
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": "*"},
                            "Action": ["s3:GetObject"],
                            "Resource": ["arn:aws:s3:::%s/*"]
                        }
                    ]
                }
                """.formatted(bucketName);
    }
}