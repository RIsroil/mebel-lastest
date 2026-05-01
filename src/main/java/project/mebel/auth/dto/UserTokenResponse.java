package project.mebel.auth.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class UserTokenResponse {
    private String accessToken;
    private String refreshToken;
}

