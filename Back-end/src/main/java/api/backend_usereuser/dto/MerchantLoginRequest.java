package api.backend_usereuser.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MerchantLoginRequest(
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(max = 72) String password,
        @NotBlank @Pattern(regexp = "^[0-9.\\-/]{11,14}$", message = "Informe um CPF válido") String cpf
) {}
