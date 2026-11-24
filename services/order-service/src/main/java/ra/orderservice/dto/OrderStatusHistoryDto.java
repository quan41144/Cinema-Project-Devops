package ra.orderservice.dto;

import java.time.LocalDateTime;

public record OrderStatusHistoryDto(
        String status,
        String note,
        LocalDateTime changedAt
) {}
