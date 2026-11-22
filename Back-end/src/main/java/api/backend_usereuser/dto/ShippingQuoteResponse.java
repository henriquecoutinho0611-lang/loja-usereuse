package api.backend_usereuser.dto;

import java.math.BigDecimal;

public record ShippingQuoteResponse(
        BigDecimal price,
        Integer estimatedDays,
        boolean demo,
        String city,
        String state,
        String category,
        String message
) {}
