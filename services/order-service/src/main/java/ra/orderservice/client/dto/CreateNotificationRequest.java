package ra.orderservice.client.dto;

public record CreateNotificationRequest(
        Long customerId,
        Long orderId,
        String type,
        String title,
        String message
) {}
