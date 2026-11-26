package api.backend_usereuser.service;

import api.backend_usereuser.dto.OrderRequest;
import api.backend_usereuser.dto.OrderResponse;
import api.backend_usereuser.dto.MerchantOrderResponse;
import api.backend_usereuser.dto.ProductSelection;
import api.backend_usereuser.dto.ShippingQuoteResponse;
import api.backend_usereuser.entity.OrderEntity;
import api.backend_usereuser.entity.OrderItemEntity;
import api.backend_usereuser.entity.ProductEntity;
import api.backend_usereuser.entity.UserEntity;
import api.backend_usereuser.exception.ApiException;
import api.backend_usereuser.repository.OrderRepository;
import api.backend_usereuser.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class OrderService {
    private final OrderRepository orders;
    private final ProductService products;
    private final UserRepository users;
    private final ShippingService shipping;

    public OrderService(OrderRepository orders, ProductService products,
                        UserRepository users, ShippingService shipping) {
        this.orders = orders;
        this.products = products;
        this.users = users;
        this.shipping = shipping;
    }

    @Transactional
    public OrderResponse create(OrderRequest request, String authenticatedEmail, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            var existing = orders.findByIdempotencyKey(idempotencyKey.trim());
            if (existing.isPresent()) {
                return OrderResponse.from(existing.get());
            }
        }

        UserEntity user = resolveCustomer(authenticatedEmail);
        ShippingQuoteResponse shippingQuote = shipping.quoteForOrder(request.zipCode().replaceAll("\\D", ""));

        OrderEntity order = new OrderEntity();
        order.setCustomerName(user.getName());
        order.setCustomerEmail(user.getEmail());
        order.setCustomerPhone(user.getPhone() != null ? user.getPhone() : "");
        order.setCustomer(user);
        order.setZipCode(request.zipCode().replaceAll("\\D", ""));
        order.setAddress(request.address().trim());
        order.setShippingCost(shippingQuote.price() == null ? BigDecimal.ZERO : shippingQuote.price());
        order.setShippingCategory(shippingQuote.category());
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            order.setIdempotencyKey(idempotencyKey.trim());
        }

        BigDecimal total = BigDecimal.ZERO;
        for (OrderRequest.Item requestedItem : request.items()) {
            ProductEntity product = products.getActiveEntity(requestedItem.productId());
            ProductSelection selection = requestedItem.selection() == null
                    ? new ProductSelection(null, null, null, null) : requestedItem.selection();
            validateSelection(selection.ironColor(), product.getIronColors(), "cor do ferro");
            validateSelection(selection.woodColor(), product.getWoodColors(), "cor da madeira");
            validateSelection(selection.woodType(), product.getWoodTypes(), "tipo da madeira");
            validateSelection(selection.upholsteryColor(), product.getUpholsteryColors(), "cor do estofado");

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(requestedItem.quantity()));
            total = total.add(lineTotal);

            OrderItemEntity item = new OrderItemEntity();
            item.setProductId(product.getId());
            item.setProductTitle(product.getTitle());
            item.setUnitPrice(product.getPrice());
            item.setQuantity(requestedItem.quantity());
            item.setLineTotal(lineTotal);
            item.setIronColor(selection.ironColor());
            item.setWoodColor(selection.woodColor());
            item.setWoodType(selection.woodType());
            item.setUpholsteryColor(selection.upholsteryColor());
            order.addItem(item);
        }
        order.setTotal(total.add(order.getShippingCost()));
        order = orders.save(order);
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listForCustomer(String authenticatedEmail) {
        UserEntity user = users.findByEmailIgnoreCase(normalizeEmail(authenticatedEmail))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Conta não encontrada."));
        return orders.findAllByCustomer_IdOrCustomerEmailIgnoreCaseOrderByCreatedAtDesc(user.getId(), user.getEmail())
                .stream().map(OrderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<MerchantOrderResponse> listForMerchant() {
        return orders.findAllByOrderByCreatedAtDesc().stream().map(this::toMerchantResponse).toList();
    }

    @Transactional
    public MerchantOrderResponse updateStatus(UUID id, String status) {
        OrderEntity order = orders.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pedido não encontrado."));
        order.setStatus(status.toUpperCase(Locale.ROOT));
        return toMerchantResponse(orders.save(order));
    }

    @Transactional
    public MerchantOrderResponse updateDeliveryDate(UUID id, LocalDate deliveryDate) {
        OrderEntity order = orders.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pedido não encontrado."));
        order.setDeliveryDate(deliveryDate);
        return toMerchantResponse(orders.save(order));
    }

    private UserEntity resolveCustomer(String authenticatedEmail) {
        if (authenticatedEmail == null || authenticatedEmail.isBlank())
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Faça login para concluir o pedido.");
        return users.findByEmailIgnoreCase(normalizeEmail(authenticatedEmail))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Faça login para concluir o pedido."));
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private void validateSelection(String value, List<String> available, String field) {
        if (available == null || available.isEmpty()) {
            if (value != null && !value.isBlank())
                throw new ApiException(HttpStatus.BAD_REQUEST, "O produto não aceita seleção de " + field + ".");
            return;
        }
        if (value == null || value.isBlank())
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selecione a " + field + ".");
        if (available.stream().noneMatch(value::equalsIgnoreCase))
            throw new ApiException(HttpStatus.BAD_REQUEST, "A opção de " + field + " é inválida.");
    }

    private MerchantOrderResponse toMerchantResponse(OrderEntity order) {
        String orderNumber = "PED-" + order.getId().toString().substring(0, 8).toUpperCase();
        List<OrderResponse.Item> items = order.getItems() == null ? List.of() : order.getItems().stream()
                .map(OrderResponse.Item::from).toList();
        return new MerchantOrderResponse(
                order.getId(),
                orderNumber,
                order.getStatus(),
                order.getTotal(),
                order.getCreatedAt(),
                order.getCustomerName(),
                order.getCustomerEmail(),
                order.getCustomerPhone(),
                order.getZipCode(),
                order.getAddress(),
                order.getDeliveryDate(),
                order.getShippingCost(),
                order.getShippingCategory(),
                items
        );
    }
}
