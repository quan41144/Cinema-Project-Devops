package ra.customerservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ra.customerservice.dto.*;
import ra.customerservice.service.ICustomerAuthService;
import ra.customerservice.service.IWalletService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {
    private final ICustomerAuthService customerAuthService;
    private final IWalletService walletService;
    @GetMapping
    public List<CustomerResponse> listCustomers() {
        return customerAuthService.listCustomers();
    }
    @GetMapping("/{id}")
    public CustomerResponse getCustomerById(@PathVariable Long id) {
        return customerAuthService.getCustomerById(id);
    }
    @GetMapping("/{id}/transactions")
    public List<WalletTransactionDto> getTransactions(@PathVariable Long id) {
        return walletService.getTransactions(id);
    }

    @PostMapping("/{id}/wallet/topup")
    public WalletOperationResponse topup(@PathVariable Long id, @Valid @RequestBody WalletTopupRequest req) {
        return walletService.topup(id, req);
    }

    @PostMapping("/{id}/wallet/debit")
    public WalletOperationResponse debit(@PathVariable Long id, @Valid @RequestBody WalletDebitRequest req) {
        return walletService.debit(id, req);
    }

    @PostMapping("/{id}/wallet/refund")
    public WalletOperationResponse refund(@PathVariable Long id, @Valid @RequestBody WalletRefundRequest req) {
        return walletService.refund(id, req);
    }
}
