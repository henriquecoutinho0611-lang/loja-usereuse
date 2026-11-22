package api.backend_usereuser.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MerchantOrderResponse(
        UUID id,
        String orderNumber,
        String status,
        BigDecimal total,
        Instant createdAt,
        String customerName,
        String customerEmail,
        String customerPhone,
        String zipCode,
        String address,
        LocalDate deliveryDate,
        BigDecimal shippingCost,
        String shippingCategory,
        List<OrderResponse.Item> items
) {}
