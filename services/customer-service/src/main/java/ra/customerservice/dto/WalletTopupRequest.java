package ra.customerservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record WalletTopupRequest(
        @NotNull @DecimalMin("1000.00") BigDecimal amount,
        String note
) {
}
