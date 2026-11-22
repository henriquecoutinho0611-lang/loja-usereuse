package api.backend_usereuser.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record StoreSettingsRequest(
        @NotNull @Size(max = 24) String whatsappNumber,
        @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal saoPauloCityPrice,
        @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal saoPauloStatePrice,
        @NotBlank @Size(max = 500) String deliveryOutsideStateMessage,
        @NotBlank @Size(max = 500) String paymentMessage
) {}
