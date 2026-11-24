package ra.cinemaservice.dto;

import jakarta.validation.constraints.NotNull;

public record OrderActionRequest(@NotNull Long orderId) {
}
