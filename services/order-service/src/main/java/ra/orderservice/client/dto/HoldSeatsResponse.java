package ra.orderservice.client.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record HoldSeatsResponse(
        Long showtimeId,
        Long movieId,
        String movieTitle,
        String roomName,
        String format,
        LocalDateTime showDateTime,
        List<SeatPriceItemDto> seats,
        BigDecimal totalAmount
) {}
