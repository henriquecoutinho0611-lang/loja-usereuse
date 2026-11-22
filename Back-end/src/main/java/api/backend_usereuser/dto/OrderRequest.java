package api.backend_usereuser.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record OrderRequest(
        @Valid Customer customer,
        @NotBlank @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "Informe um CEP válido com 8 números") String zipCode,
        @NotBlank @Size(max = 240) String address,
        @NotEmpty @Size(max = 50) List<@NotNull @Valid Item> items
) {
    public record Customer(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Email @Size(max = 180) String email,
            @NotBlank @Pattern(regexp = "^[0-9()+.\\-\\s]{10,20}$", message = "Informe um telefone válido") String phone
    ) {}

    public record Item(
            @NotNull UUID productId,
            @Min(1) @Max(99) int quantity,
            @Valid ProductSelection selection
    ) {}
}
