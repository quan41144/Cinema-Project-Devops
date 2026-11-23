package ra.ticketservice.dto;

import java.time.LocalDateTime;

public record TicketNotificationDto(
        Long id,
        Long customerId,
        Long orderId,
        String type,
        String title,
        String message,
        LocalDateTime sentAt
) {
}
