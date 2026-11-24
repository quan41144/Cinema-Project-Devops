package ra.customerservice.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresAt,
        CustomerResponse customer
) {
}
