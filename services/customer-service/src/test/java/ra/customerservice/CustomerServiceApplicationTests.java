package ra.customerservice;

import lombok.RequiredArgsConstructor;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.server.ResponseStatusException;
import ra.customerservice.dto.*;
import ra.customerservice.service.ICustomerAuthService;
import ra.customerservice.service.IWalletService;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@RequiredArgsConstructor
@TestPropertySource(properties = {
		"spring.datasource.url=jdbc:h2:mem:customer_test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop"
})
class CustomerServiceApplicationTests {

	private final ICustomerAuthService customerAuthService;
	private final IWalletService walletService;

	@Test
	void contextLoads() {
		CustomerResponse customer = customerAuthService.register(new RegisterRequest(
				"Nguyen Van A", "a@cinemabox.test", "123456", "0909123456", BigDecimal.valueOf(500000)));
		assertThat(customer.walletBalance()).isEqualByComparingTo("500000");

		WalletOperationResponse debitRes = walletService.debit(
				customer.id(), new WalletDebitRequest(100L, BigDecimal.valueOf(160000), "Dat 2 ve"));
		assertThat(debitRes.balanceAfter()).isEqualByComparingTo("340000");

		assertThatThrownBy(() -> walletService.debit(
				customer.id(), new WalletDebitRequest(101L, BigDecimal.valueOf(999000), "Qua so du")))
				.isInstanceOf(ResponseStatusException.class);

		WalletOperationResponse refundRes = walletService.refund(
				customer.id(), new WalletRefundRequest(100L, BigDecimal.valueOf(160000), "Suat chieu da khoa"));
		assertThat(refundRes.balanceAfter()).isEqualByComparingTo("500000");

		WalletOperationResponse duplicateRefund = walletService.refund(
				customer.id(), new WalletRefundRequest(100L, BigDecimal.valueOf(160000), "Retry"));
		assertThat(duplicateRefund.balanceAfter()).isEqualByComparingTo("500000");
	}

}
