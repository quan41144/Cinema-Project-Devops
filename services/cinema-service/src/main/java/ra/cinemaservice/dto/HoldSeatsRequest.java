package ra.cinemaservice.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record HoldSeatsRequest(
        @NotNull Long orderId,
        @NotEmpty List<String> seatCodes
) {}
