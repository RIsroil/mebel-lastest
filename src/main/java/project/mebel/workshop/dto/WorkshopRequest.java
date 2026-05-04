package project.mebel.workshop.dto;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkshopRequest {
    private String name;
    private String address;
    @Pattern(
            regexp = "^\\+998\\d{9}$",
            message = "phone.number.must.be.in.format.+998XXXXXXXXX"
    )
    private String phone;
    private String description;
}
