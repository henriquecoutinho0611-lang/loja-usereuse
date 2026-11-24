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
import api.backend_usereuser.mapper.OrderMapper;
import api.backend_usereuser.repository.OrderRepository;
import api.backend_usereuser.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class OrderService {
    private final OrderRepository orders;
    private final ProductService products;
    private final UserRepository users;
    private final OrderMapper mapper;
    private final ShippingService shipping;

    public OrderService(OrderRepository orders, ProductService products,
                        UserRepository users, OrderMapper mapper, ShippingService shipping) {
        this.orders = orders;
        this.products = products;
        this.users = users;
        this.mapper = mapper;
        this.shipping = shipping;
    }

    @Transactional
    public OrderResponse create(OrderRequest request, String authenticatedEmail) {
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
        return mapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listForCustomer(String authenticatedEmail) {
        UserEntity user = users.findByEmailIgnoreCase(normalizeEmail(authenticatedEmail))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Conta não encontrada."));
        return orders.findAllByCustomer_IdOrCustomerEmailIgnoreCaseOrderByCreatedAtDesc(user.getId(), user.getEmail())
                .stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<MerchantOrderResponse> listForMerchant() {
        return orders.findAllByOrderByCreatedAtDesc().stream().map(this::toMerchantResponse).toList();
    }

    @Transactional
    public MerchantOrderResponse updateDeliveryDate(UUID id, java.time.LocalDate deliveryDate) {
        OrderEntity order = orders.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pedido não encontrado."));
        order.setDeliveryDate(deliveryDate);
        return toMerchantResponse(orders.save(order));
    }

    @Transactional
    public MerchantOrderResponse updateStatus(UUID id, String status) {
        OrderEntity order = orders.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pedido não encontrado."));
        order.setStatus(status);
        return toMerchantResponse(orders.saveAndFlush(order));
    }

    private MerchantOrderResponse toMerchantResponse(OrderEntity order) {
        return new MerchantOrderResponse(
                order.getId(), "PED-" + order.getId().toString().substring(0, 8).toUpperCase(),
                order.getStatus(), order.getTotal(), order.getCreatedAt(),
                order.getCustomerName(), order.getCustomerEmail(), order.getCustomerPhone(),
                order.getZipCode(), order.getAddress(), order.getDeliveryDate(),
                order.getShippingCost(), order.getShippingCategory(),
                order.getItems().stream().map(mapper::toResponse).toList());
    }

    private void validateSelection(String selected, List<String> available, String label) {
        if (available == null || available.isEmpty()) {
            if (selected != null && !selected.isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Este produto não oferece opção para " + label + ".");
            }
            return;
        }
        if (selected == null || !available.contains(selected)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Escolha uma opção válida para " + label + ".");
        }
    }

    private UserEntity resolveCustomer(String authenticatedEmail) {
        if (authenticatedEmail == null || authenticatedEmail.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Entre em uma conta antes de comprar.");
        }
        return users.findByEmailIgnoreCase(normalizeEmail(authenticatedEmail))
                .filter(UserEntity::isActive)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Conta não encontrada para vincular este pedido."));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
