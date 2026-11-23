package ra.customerservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ra.customerservice.dto.*;
import ra.customerservice.entity.CustomerWallet;
import ra.customerservice.entity.WalletTransaction;
import ra.customerservice.repository.CustomerWalletRepository;
import ra.customerservice.repository.WalletTransactionRepository;
import ra.customerservice.service.IWalletService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WalletService implements IWalletService {
    private static final Logger log = LoggerFactory.getLogger(WalletService.class);

    private final CustomerWalletRepository customerWalletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    @Transactional
    @Override
    public WalletOperationResponse debit(Long customerId, WalletDebitRequest req) {
        CustomerWallet wallet = customerWalletRepository.findByCustomerIdForUpdate(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khách hàng"));

        Optional<WalletTransaction> existing = walletTransactionRepository.findByOrderIdAndType(req.orderId(), "DEBIT");
        if (existing.isPresent()) {
            WalletTransaction tx = existing.get();
            log.info("[Customer] Thanh toán cho orderId={} đã được xử lý trước đó", req.orderId());
            return toOpResponse(wallet, tx);
        }

        if (wallet.getBalance().compareTo(req.amount()) < 0) {
            log.warn("[Customer] Số dư không đủ: customerId={}, orderId={}, can={}, hienCo={}",
                    customerId, req.orderId(), req.amount(), wallet.getBalance());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Số dư không đủ để thực hiện thanh toán");
        }

        BigDecimal newBalance = wallet.getBalance().subtract(req.amount());
        wallet.setBalance(newBalance);
        customerWalletRepository.save(wallet);

        WalletTransaction tx = new WalletTransaction();
        tx.setWallet(wallet);
        tx.setOrderId(req.orderId());
        tx.setType("DEBIT");
        tx.setAmount(req.amount());
        tx.setBalanceAfter(newBalance);
        tx.setNote(req.note() != null ? req.note() : "Thanh toán đơn đặt vé #" + req.orderId());
        WalletTransaction savedTx = walletTransactionRepository.save(tx);

        log.info("[Customer] Thanh toán thành công cho customerId={}, orderId={}, amount={}, balanceAfter={}",
                customerId, req.orderId(), req.amount(), newBalance);
        return toOpResponse(wallet, savedTx);
    }

    @Transactional
    @Override
    public WalletOperationResponse refund(Long customerId, WalletRefundRequest req) {
        CustomerWallet wallet = customerWalletRepository.findByCustomerIdForUpdate(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khách hàng"));

        Optional<WalletTransaction> existing = walletTransactionRepository.findByOrderIdAndType(req.orderId(), "REFUND");
        if (existing.isPresent()) {
            WalletTransaction tx = existing.get();
            log.info("[Customer] Hoàn tiền cho orderId={} đã được xử lý", req.orderId());
            return toOpResponse(wallet, tx);
        }

        BigDecimal newBalance = wallet.getBalance().add(req.amount());
        wallet.setBalance(newBalance);
        customerWalletRepository.save(wallet);

        WalletTransaction tx = new WalletTransaction();
        tx.setWallet(wallet);
        tx.setOrderId(req.orderId());
        tx.setType("REFUND");
        tx.setAmount(req.amount());
        tx.setBalanceAfter(newBalance);
        tx.setNote(req.reason() != null ? req.reason() : "Hoàn tiền cho giao dịch đơn #" + req.orderId());
        WalletTransaction savedTx = walletTransactionRepository.save(tx);

        log.info("[Customer] Hoàn tiền thành công customerId={}, orderId={}, amount={}, balanceAfter={}",
                customerId, req.orderId(), req.amount(), newBalance);
        return toOpResponse(wallet, savedTx);
    }

    @Transactional
    @Override
    public WalletOperationResponse topup(Long customerId, WalletTopupRequest req) {
        CustomerWallet wallet = customerWalletRepository.findByCustomerIdForUpdate(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khách hàng"));

        BigDecimal newBalance = wallet.getBalance().add(req.amount());
        wallet.setBalance(newBalance);
        customerWalletRepository.save(wallet);

        WalletTransaction tx = new WalletTransaction();
        tx.setWallet(wallet);
        tx.setType("TOPUP");
        tx.setAmount(req.amount());
        tx.setBalanceAfter(newBalance);
        tx.setNote(req.note() != null ? req.note() : "Nạp tiền");
        WalletTransaction savedTx = walletTransactionRepository.save(tx);

        log.info("[Customer] Nạp tiền customerId={}, amount={}, balanceAfter={}", customerId, req.amount(), newBalance);
        return toOpResponse(wallet, savedTx);
    }

    @Transactional(readOnly = true)
    @Override
    public List<WalletTransactionDto> getTransactions(Long customerId) {
        if (customerWalletRepository.findByCustomerId(customerId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khách hàng");
        }
        return walletTransactionRepository.findByWalletCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(tx -> new WalletTransactionDto(
                        tx.getId(),
                        tx.getOrderId(),
                        tx.getType(),
                        tx.getAmount(),
                        tx.getBalanceAfter(),
                        tx.getNote(),
                        tx.getCreatedAt()
                ))
                .toList();
    }

    @Override
    public WalletOperationResponse toOpResponse(CustomerWallet wallet, WalletTransaction tx) {
        return new WalletOperationResponse(
                wallet.getCustomer().getId(),
                wallet.getCustomer().getFullName(),
                tx.getOrderId(),
                tx.getType(),
                tx.getAmount(),
                tx.getBalanceAfter(),
                tx.getCreatedAt()
        );
    }
}
