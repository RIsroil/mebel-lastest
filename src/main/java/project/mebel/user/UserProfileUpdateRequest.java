package project.mebel.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserProfileUpdateRequest {
    private String fullName;
    @Pattern(
            regexp = "^\\+998\\d{9}$",
            message = "phone.number.must.be.in.format.+998XXXXXXXXX"
    )
    private String phone;
}
