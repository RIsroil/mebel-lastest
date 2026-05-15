package project.mebel.saves.dto;

import lombok.Data;

@Data
public class SaveCutRequest {
    private String materialName;
    private Integer lengthMm;
    private Integer widthMm;
    private Integer heightMm;
    private Integer quantity;
    private String notes;
}
