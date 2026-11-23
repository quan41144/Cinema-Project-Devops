package ra.orderservice.dto;

import java.math.BigDecimal;

public record OrderItemDto(
        Long seatId,
        String seatCode,
        String seatType,
        BigDecimal unitPrice
) {}
