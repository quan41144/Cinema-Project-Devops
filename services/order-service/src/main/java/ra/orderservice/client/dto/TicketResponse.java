package ra.orderservice.client.dto;

import java.time.LocalDateTime;
import java.util.List;

public record TicketResponse(
        Long id,
        String ticketCode,
        Long orderId,
        Long showtimeId,
        Long customerId,
        String movieTitle,
        String roomName,
        LocalDateTime showDateTime,
        List<String> seatCodes,
        String status,
        LocalDateTime issuedAt
) {}
