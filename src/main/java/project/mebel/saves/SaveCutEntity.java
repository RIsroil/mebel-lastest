package project.mebel.saves;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import project.mebel.common.entity.MutableAuditEntity;

import java.util.UUID;

@Entity
@Table(name = "save_cuts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SaveCutEntity extends MutableAuditEntity {

    @Column(name = "save_id", nullable = false)
    private UUID saveId;

    @Column(name = "material_name", nullable = false, length = 200)
    private String materialName;

    @Column(name = "length_mm", nullable = false)
    private Integer lengthMm;

    @Column(name = "width_mm", nullable = false)
    private Integer widthMm;

    @Column(name = "height_mm")
    private Integer heightMm;

    @Column(name = "quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
