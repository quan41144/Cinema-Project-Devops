package ra.orderservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long orderId,
        String orderCode,
        Long customerId,
        String customerName,
        Long showtimeId,
        Long movieId,
        String movieTitle,
        String roomName,
        String format,
        LocalDateTime showDateTime,
        BigDecimal totalAmount,
        String status,
        String ticketCode,
        String cancelReason,
        String traceId,
        List<String> seatCodes,
        List<OrderItemDto> items,
        List<OrderStatusHistoryDto> history,
        LocalDateTime createdAt
) {}
