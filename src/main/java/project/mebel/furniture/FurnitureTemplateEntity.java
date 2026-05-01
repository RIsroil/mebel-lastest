package project.mebel.furniture;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import project.mebel.common.entity.SoftDeleteEntity;

import java.util.UUID;

@Entity
@Table(name = "furniture_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class FurnitureTemplateEntity extends SoftDeleteEntity {

    @Column(name = "workshop_id", nullable = false)
    private UUID workshopId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "estimated_prod_days")
    private Short estimatedProdDays;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
