package project.mebel.saves.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FurnitureSaveResponse {

    private UUID id;
    private String name;
    private String description;
    private boolean active;
    private LocalDateTime createdAt;
    private List<SaveCutResponse> cuts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaveCutResponse {
        private UUID id;
        private String materialName;
        private Integer lengthMm;
        private Integer widthMm;
        private Integer heightMm;
        private Integer quantity;
        private String notes;
    }
}
