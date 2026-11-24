package ra.ticketservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateNotificationRequest(
        @NotNull Long customerId,
        @NotNull Long orderId,
        @NotBlank String type,
        @NotBlank String title,
        @NotBlank String message
) {
}
