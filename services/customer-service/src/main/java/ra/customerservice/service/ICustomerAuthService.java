package ra.customerservice.service;

import ra.customerservice.dto.*;
import ra.customerservice.entity.Customer;

import java.util.List;

public interface ICustomerAuthService {
    CustomerResponse register(RegisterRequest req);
    CustomerResponse login(LoginRequest req);
    List<CustomerResponse> listCustomers();
    CustomerResponse getCustomerById(Long id);
    CustomerResponse toResponse(Customer c);
    AuthResponse registerWithToken(RegisterRequest req);
    AuthResponse loginWithToken(LoginRequest req);
    AuthResponse refreshToken(RefreshTokenRequest req);
    MessageResponse logout(LogoutRequest req);
    MessageResponse logoutAll(Long customerId);
}
