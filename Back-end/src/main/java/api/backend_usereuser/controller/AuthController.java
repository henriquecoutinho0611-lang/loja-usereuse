package api.backend_usereuser.controller;

import api.backend_usereuser.dto.AuthResponse;
import api.backend_usereuser.dto.CustomerRegisterRequest;
import api.backend_usereuser.dto.UserSummary;
import api.backend_usereuser.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummary register(@Valid @RequestBody CustomerRegisterRequest request) {
        return auth.registerCustomer(request);
    }

    @PostMapping("/auth/login")
    public AuthResponse customerLogin(@Valid @RequestBody LoginBody request) {
        return auth.loginCustomer(request.email(), request.password());
    }

    @PostMapping("/admin/auth/login")
    public AuthResponse merchantLogin(@Valid @RequestBody MerchantLoginBody request) {
        return auth.loginMerchant(request.email(), request.password(), request.cpf());
    }

    // ── inline request DTOs ──────────────────────────────────────────

    public record LoginBody(
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Size(max = 72) String password) {}

    public record MerchantLoginBody(
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Size(max = 72) String password,
            @NotBlank @Pattern(regexp = "^[0-9.\\-/]{11,14}$", message = "Informe um CPF válido") String cpf) {}
}
