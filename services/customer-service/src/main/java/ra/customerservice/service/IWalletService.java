package ra.customerservice.service;

import ra.customerservice.dto.*;
import ra.customerservice.entity.CustomerWallet;
import ra.customerservice.entity.WalletTransaction;

import java.util.List;

public interface IWalletService {
    WalletOperationResponse debit(Long customerId, WalletDebitRequest req);
    WalletOperationResponse refund(Long customerId, WalletRefundRequest req);
    WalletOperationResponse topup(Long customerId, WalletTopupRequest req);
    List<WalletTransactionDto> getTransactions(Long customerId);
    WalletOperationResponse toOpResponse(CustomerWallet wallet, WalletTransaction tx);
}
