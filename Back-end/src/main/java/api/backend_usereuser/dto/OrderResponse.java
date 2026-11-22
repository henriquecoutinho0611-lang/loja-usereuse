package api.backend_usereuser.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        String orderNumber,
        String status,
        BigDecimal total,
        Instant createdAt,
        LocalDate deliveryDate,
        BigDecimal shippingCost,
        String shippingCategory,
        List<Item> items
) {
    public record Item(UUID productId, String title, BigDecimal unitPrice, int quantity, BigDecimal lineTotal,
                       ProductSelection selection) {}
}
