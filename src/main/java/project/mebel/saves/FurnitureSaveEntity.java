package project.mebel.saves;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import project.mebel.common.entity.SoftDeleteEntity;

import java.util.UUID;

@Entity
@Table(name = "furniture_saves")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class FurnitureSaveEntity extends SoftDeleteEntity {

    @Column(name = "workshop_id", nullable = false)
    private UUID workshopId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
