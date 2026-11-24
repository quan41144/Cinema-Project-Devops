package ra.cinemaservice.dto;

import java.math.BigDecimal;

public record SeatItemDto(
        Long seatId,
        String seatCode,
        String seatType,
        String status,
        BigDecimal price
) {
}
