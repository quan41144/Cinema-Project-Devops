package ra.orderservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import ra.orderservice.client.dto.WalletDebitRequest;
import ra.orderservice.client.dto.WalletOperationResponse;
import ra.orderservice.client.dto.WalletRefundRequest;

@FeignClient(name = "customer-service", url = "${services.customer-url}")
public interface CustomerClient {
    @PostMapping("/api/v1/customers/{id}/wallet/debit")
    WalletOperationResponse debit(@PathVariable("id") Long customerId, @RequestBody WalletDebitRequest request);

    @PostMapping("/api/v1/customers/{id}/wallet/refund")
    WalletOperationResponse refund(@PathVariable("id") Long customerId, @RequestBody WalletRefundRequest request);
}
