package ra.ticketservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public record IssueTicketRequest(
        @NotNull Long orderId,
        @NotNull Long showtimeId,
        @NotNull Long customerId,
        @NotBlank String movieTitle,
        @NotBlank String roomName,
        @NotNull LocalDateTime showDateTime,
        @NotEmpty List<String> seatCodes
) {
}
