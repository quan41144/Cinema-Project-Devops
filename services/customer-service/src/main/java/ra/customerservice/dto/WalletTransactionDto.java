package ra.customerservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WalletTransactionDto(
        Long id,
        Long orderId,
        String type,
        BigDecimal amount,
        BigDecimal balanceAfter,
        String note,
        LocalDateTime createdAt
) {
}
