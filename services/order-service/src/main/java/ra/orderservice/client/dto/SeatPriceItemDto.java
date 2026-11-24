package ra.orderservice.client.dto;

import java.math.BigDecimal;

public record SeatPriceItemDto(
        Long seatId,
        String seatCode,
        String seatType,
        BigDecimal unitPrice
) {}
