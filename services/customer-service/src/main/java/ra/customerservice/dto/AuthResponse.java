package ra.customerservice.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        CustomerResponse customer
) {
}
