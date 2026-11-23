package ra.ticketservice.dto;

import jakarta.validation.constraints.NotNull;

public record ShowtimeLockRequest(
        @NotNull Boolean locked,
        String reason
) {
}
