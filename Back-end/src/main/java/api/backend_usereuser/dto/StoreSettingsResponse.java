package api.backend_usereuser.dto;

import java.math.BigDecimal;

public record StoreSettingsResponse(
        String whatsappNumber,
        BigDecimal saoPauloCityPrice,
        BigDecimal saoPauloStatePrice,
        String deliveryOutsideStateMessage,
        String paymentMessage
) {}
