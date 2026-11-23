package ra.orderservice.client.dto;

import java.math.BigDecimal;

public record WalletRefundRequest(Long orderId, BigDecimal amount, String reason) {}
