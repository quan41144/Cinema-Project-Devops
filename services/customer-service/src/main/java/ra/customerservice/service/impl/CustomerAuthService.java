package ra.customerservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ra.customerservice.dto.AuthResponse;
import ra.customerservice.dto.CustomerResponse;
import ra.customerservice.dto.LoginRequest;
import ra.customerservice.dto.RegisterRequest;
import ra.customerservice.entity.Customer;
import ra.customerservice.entity.CustomerWallet;
import ra.customerservice.entity.WalletTransaction;
import ra.customerservice.repository.CustomerRepository;
import ra.customerservice.repository.WalletTransactionRepository;
import ra.customerservice.service.ICustomerAuthService;
import ra.customerservice.service.JwtService;
import ra.customerservice.util.PasswordUtil;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerAuthService implements ICustomerAuthService {
    private static final Logger log = LoggerFactory.getLogger(CustomerAuthService.class);
    private static final BigDecimal DEFAULT_INITIAL_BALANCE = BigDecimal.valueOf(10000);

    private final CustomerRepository customerRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final JwtService jwtService;

    @Transactional
    @Override
    public CustomerResponse register(RegisterRequest req) {
        String normalizedEmail = req.email().trim().toLowerCase();
        if (customerRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã tồn tại");
        }
        BigDecimal startBalance = req.initialBalance() != null ? req.initialBalance() : DEFAULT_INITIAL_BALANCE;
        Customer customer = new Customer();
        customer.setFullName(req.fullName().trim());
        customer.setEmail(normalizedEmail);
        customer.setPasswordHash(PasswordUtil.hash(req.password()));
        customer.setPhone(req.phone());

        CustomerWallet wallet = new CustomerWallet();
        wallet.setBalance(startBalance);
        customer.setWallet(wallet);

        Customer saved = customerRepository.save(customer);

        if (startBalance.compareTo(BigDecimal.ZERO) > 0) {
            WalletTransaction initTx = new WalletTransaction();
            initTx.setWallet(saved.getWallet());
            initTx.setType("TOPUP");
            initTx.setAmount(startBalance);
            initTx.setBalanceAfter(startBalance);
            initTx.setNote("test với 10k");
            walletTransactionRepository.save(initTx);
        }
        log.info("[Customer] Đăng ký thành công customerId={}. email={}, số dư={}",
                saved.getId(), saved.getEmail(), startBalance);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    @Override
    public CustomerResponse login(LoginRequest req) {
        Customer customer = customerRepository.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu"));
        if (!PasswordUtil.matches(req.password(), customer.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu");
        }
        return toResponse(customer);
    }

    @Transactional(readOnly = true)
    @Override
    public List<CustomerResponse> listCustomers() {
        return customerRepository.findAllWithWallet().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findByIdWithWallet(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khách hàng"));
        return toResponse(customer);
    }

    @Override
    public CustomerResponse toResponse(Customer c) {
        BigDecimal balance = c.getWallet() != null ? c.getWallet().getBalance() : BigDecimal.ZERO;
        return new CustomerResponse(c.getId(), c.getFullName(), c.getEmail(), c.getPhone(), balance, c.getCreatedAt());
    }

    @Override
    public AuthResponse registerWithToken(RegisterRequest req) {
        CustomerResponse customer = register(req);
        Customer entity = customerRepository.findById(customer.id()).orElseThrow();
        return new AuthResponse(jwtService.generateToken(entity), "Bearer", customer);
    }

    @Override
    public AuthResponse loginWithToken(LoginRequest req) {
        CustomerResponse customer = login(req);
        Customer entity = customerRepository.findById(customer.id()).orElseThrow();
        return new AuthResponse(jwtService.generateToken(entity), "Bearer", customer);
    }

}
