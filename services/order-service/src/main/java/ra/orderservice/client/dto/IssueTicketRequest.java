package ra.orderservice.client.dto;

import java.time.LocalDateTime;
import java.util.List;

public record IssueTicketRequest(
        Long orderId,
        Long showtimeId,
        Long customerId,
        String movieTitle,
        String roomName,
        LocalDateTime showDateTime,
        List<String> seatCodes
) {}
