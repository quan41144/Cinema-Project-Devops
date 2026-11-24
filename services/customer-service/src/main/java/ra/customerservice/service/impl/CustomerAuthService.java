package ra.customerservice.service.impl;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import ra.customerservice.dto.*;
import ra.customerservice.entity.Customer;
import ra.customerservice.entity.CustomerWallet;
import ra.customerservice.entity.RefreshToken;
import ra.customerservice.entity.WalletTransaction;
import ra.customerservice.repository.CustomerRepository;
import ra.customerservice.repository.RefreshTokenRepository;
import ra.customerservice.repository.WalletTransactionRepository;
import ra.customerservice.service.ICustomerAuthService;
import ra.customerservice.service.JwtService;
import ra.customerservice.util.PasswordUtil;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerAuthService implements ICustomerAuthService {
    private static final Logger log = LoggerFactory.getLogger(CustomerAuthService.class);
    private static final BigDecimal DEFAULT_INITIAL_BALANCE = BigDecimal.valueOf(500000);

    private final CustomerRepository customerRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
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
        wallet.setCustomer(customer);
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

    @Transactional
    @Override
    public AuthResponse registerWithToken(RegisterRequest req) {
        CustomerResponse customer = register(req);
        Customer entity = customerRepository.findById(customer.id()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khách hàng"));
        return issueTokenPair(entity, customer);
    }

    @Transactional
    @Override
    public AuthResponse loginWithToken(LoginRequest req) {
        CustomerResponse customer = login(req);
        Customer entity = customerRepository.findById(customer.id()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khách hàng"));
        return issueTokenPair(entity, customer);
    }

    @Transactional
    @Override
    public AuthResponse refreshToken(RefreshTokenRequest req) {
        String tokenHash = jwtService.hashToken(req.refreshToken().trim());
        RefreshToken stored = refreshTokenRepository.findByTokenHashWithCustomer(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token không hợp lệ"));
        if (stored.isRevoked()) {
            refreshTokenRepository.revokeAllActiveByCustomerId(stored.getCustomer().getId());
            log.warn("[Auth] Phát hiện dùng lại refresh token đã thu hồi! customerId={}", stored.getCustomer().getId());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token đã hết hạn");
        }
        if (stored.isExpired()) {
            stored.setRevoked(true);
            refreshTokenRepository.save(stored);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token đã hết hạn");
        }
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        Customer customer = stored.getCustomer();
        log.info("[Auth] Cấp mới token thành công cho customerId={}", customer.getId());
        return issueTokenPair(customer, toResponse(customer));
    }

    @Transactional
    @Override
    public MessageResponse logout(LogoutRequest req) {
        if (req != null && req.refreshToken() != null && !req.refreshToken().isBlank()) {
            String tokenHash = jwtService.hashToken(req.refreshToken().trim());
            refreshTokenRepository.findByTokenHashWithCustomer(tokenHash).ifPresent(stored -> {
                if (!stored.isRevoked()) {
                    stored.setRevoked(true);
                    refreshTokenRepository.save(stored);
                    log.info("[Auth] Đăng xuất thành công customerId={}", stored.getCustomer().getId());
                }
            });
        }
        return new MessageResponse("Đăng xuất thành công");
    }

    @Transactional
    @Override
    public MessageResponse logoutAll(Long customerId) {
        int count = refreshTokenRepository.revokeAllActiveByCustomerId(customerId);
        log.info("[Auth] Đăng xuất tất cả thiết bị customerId={}, revokedTokens={}", customerId, count);
        return new MessageResponse("Đã đăng xuất khỏi toàn bộ thiết bị");
    }

    private AuthResponse issueTokenPair(Customer customer, CustomerResponse customerRes) {
        String accessToken = jwtService.generateToken(customer);
        String rawRefreshToken = jwtService.generateRefreshTokenValue();

        RefreshToken refreshEntity = RefreshToken.builder()
                .tokenHash(jwtService.hashToken(rawRefreshToken))
                .customer(customer)
                .expiresAt(LocalDateTime.now().plusNanos(jwtService.getRefreshExpiration() * 1_000_000L))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshEntity);

        return new AuthResponse(
                accessToken,
                rawRefreshToken,
                "Bearer",
                jwtService.getAccessExpirationSeconds(),
                customerRes
        );
    }
}
