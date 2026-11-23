package ra.orderservice.client.dto;

import java.util.List;

public record HoldSeatsRequest(Long orderId, List<String> seatCodes) {}
