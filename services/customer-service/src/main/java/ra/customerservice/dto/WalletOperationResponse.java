package ra.customerservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WalletOperationResponse(
        Long customerId,
        String customerName,
        Long orderId,
        String transactionType,
        BigDecimal amount,
        BigDecimal balanceAfter,
        LocalDateTime processedAt
) {
}
