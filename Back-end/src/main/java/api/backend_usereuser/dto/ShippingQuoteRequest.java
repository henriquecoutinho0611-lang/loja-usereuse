package api.backend_usereuser.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record ShippingQuoteRequest(
        @NotBlank @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "Informe um CEP válido com 8 números") String zipCode,
        UUID productId
) {}
