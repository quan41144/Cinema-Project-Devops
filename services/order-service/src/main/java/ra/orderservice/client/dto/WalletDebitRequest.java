package ra.orderservice.client.dto;

import java.math.BigDecimal;

public record WalletDebitRequest(Long orderId, BigDecimal amount, String note) {}
