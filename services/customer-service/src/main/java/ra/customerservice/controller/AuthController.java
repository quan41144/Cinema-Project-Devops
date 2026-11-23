package ra.customerservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ra.customerservice.dto.AuthResponse;
import ra.customerservice.dto.LoginRequest;
import ra.customerservice.dto.RegisterRequest;
import ra.customerservice.service.ICustomerAuthService;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final ICustomerAuthService authService;
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.registerWithToken(req);
    }
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.loginWithToken(req);
    }
}
