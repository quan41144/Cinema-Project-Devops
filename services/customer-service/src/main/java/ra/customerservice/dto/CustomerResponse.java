package ra.customerservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        BigDecimal walletBalance,
        LocalDateTime createdAt
) {
}
