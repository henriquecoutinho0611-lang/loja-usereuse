package api.backend_usereuser.controller;

import api.backend_usereuser.dto.AuthResponse;
import api.backend_usereuser.dto.CustomerRegisterRequest;
import api.backend_usereuser.dto.LoginRequest;
import api.backend_usereuser.dto.MerchantLoginRequest;
import api.backend_usereuser.dto.UserSummary;
import api.backend_usereuser.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummary register(@Valid @RequestBody CustomerRegisterRequest request) { return auth.registerCustomer(request); }

    @PostMapping("/auth/login")
    public AuthResponse customerLogin(@Valid @RequestBody LoginRequest request) { return auth.loginCustomer(request); }

    @PostMapping("/admin/auth/login")
    public AuthResponse merchantLogin(@Valid @RequestBody MerchantLoginRequest request) { return auth.loginMerchant(request); }
}
