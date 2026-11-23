package ra.ticketservice.dto;

import java.time.LocalDateTime;

public record ShowtimeLockResponse(
        Long showtimeId,
        boolean locked,
        String reason,
        LocalDateTime updatedAt
) {
}
