package ra.customerservice.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
        @NotBlank(message = "refresh token không được để trống")
        String refreshToken
) {
}
