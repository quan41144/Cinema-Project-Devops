package ra.customerservice.service;

import ra.customerservice.dto.AuthResponse;
import ra.customerservice.dto.CustomerResponse;
import ra.customerservice.dto.LoginRequest;
import ra.customerservice.dto.RegisterRequest;
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
}
