package project.mebel.furniture.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mebel.common.enums.FurnitureStatus;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StatusChangeRequest {
    private FurnitureStatus status;
}
