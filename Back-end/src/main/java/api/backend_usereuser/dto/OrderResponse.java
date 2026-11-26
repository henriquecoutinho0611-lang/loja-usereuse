package api.backend_usereuser.dto;

import api.backend_usereuser.entity.OrderEntity;
import api.backend_usereuser.entity.OrderItemEntity;

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
                       ProductSelection selection) {
        public static Item from(OrderItemEntity item) {
            if (item == null) return null;
            ProductSelection selection = new ProductSelection(
                    item.getIronColor(),
                    item.getWoodColor(),
                    item.getWoodType(),
                    item.getUpholsteryColor()
            );
            return new Item(
                    item.getProductId(),
                    item.getProductTitle(),
                    item.getUnitPrice(),
                    item.getQuantity(),
                    item.getLineTotal(),
                    selection
            );
        }
    }

    public static OrderResponse from(OrderEntity order) {
        if (order == null) return null;
        String orderNumber = "PED-" + order.getId().toString().substring(0, 8).toUpperCase();
        List<Item> items = order.getItems() == null ? List.of() : order.getItems().stream().map(Item::from).toList();
        return new OrderResponse(
                order.getId(),
                orderNumber,
                order.getStatus(),
                order.getTotal(),
                order.getCreatedAt(),
                order.getDeliveryDate(),
                order.getShippingCost(),
                order.getShippingCategory(),
                items
        );
    }
}
