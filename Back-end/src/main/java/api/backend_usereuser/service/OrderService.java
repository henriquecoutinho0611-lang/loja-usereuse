package api.backend_usereuser.service;

import api.backend_usereuser.dto.OrderRequest;
import api.backend_usereuser.dto.OrderResponse;
import api.backend_usereuser.dto.MerchantOrderResponse;
import api.backend_usereuser.dto.ProductSelection;
import api.backend_usereuser.dto.ShippingQuoteResponse;
import api.backend_usereuser.entity.IdempotencyRecordEntity;
import api.backend_usereuser.entity.OrderEntity;
import api.backend_usereuser.entity.OrderItemEntity;
import api.backend_usereuser.entity.ProductEntity;
import api.backend_usereuser.entity.Role;
import api.backend_usereuser.entity.UserEntity;
import api.backend_usereuser.exception.ApiException;
import api.backend_usereuser.mapper.OrderMapper;
import api.backend_usereuser.repository.IdempotencyRecordRepository;
import api.backend_usereuser.repository.OrderRepository;
import api.backend_usereuser.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class OrderService {
    private final OrderRepository orders;
    private final IdempotencyRecordRepository idempotency;
    private final ProductService products;
    private final UserRepository users;
    private final OrderMapper mapper;
    private final ShippingService shipping;
    public OrderService(OrderRepository orders, IdempotencyRecordRepository idempotency, ProductService products,
                        UserRepository users, OrderMapper mapper, ShippingService shipping) {
        this.orders = orders; this.idempotency = idempotency; this.products = products; this.users = users;
        this.mapper = mapper; this.shipping = shipping;
    }

    @Transactional
    public OrderResponse create(OrderRequest request, String key, String authenticatedEmail) {
        CustomerContext customer = resolveCustomer(request, authenticatedEmail);
        String scope = customer.scope();
        String hash = requestHash(request, customer.details());
        var existing = idempotency.findByScopeKeyAndIdempotencyKey(scope, key);
        if (existing.isPresent()) return replay(existing.get(), hash);

        ShippingQuoteResponse shippingQuote = shipping.quoteForOrder(request.zipCode().replaceAll("\\D", ""));
        OrderEntity order = new OrderEntity();
        order.setCustomerName(customer.details().name()); order.setCustomerEmail(customer.details().email());
        order.setCustomerPhone(customer.details().phone()); order.setCustomer(customer.user());
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
            OrderItemEntity item = new OrderItemEntity(); item.setProductId(product.getId()); item.setProductTitle(product.getTitle());
            item.setUnitPrice(product.getPrice()); item.setQuantity(requestedItem.quantity()); item.setLineTotal(lineTotal);
            item.setIronColor(selection.ironColor()); item.setWoodColor(selection.woodColor());
            item.setWoodType(selection.woodType()); item.setUpholsteryColor(selection.upholsteryColor());
            order.addItem(item);
        }
        order.setTotal(total.add(order.getShippingCost()));
        order = orders.save(order);

        IdempotencyRecordEntity record = new IdempotencyRecordEntity();
        record.setScopeKey(scope); record.setIdempotencyKey(key); record.setRequestHash(hash); record.setOrder(order);
        idempotency.saveAndFlush(record);
        return mapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse replayIfPresent(OrderRequest request, String key, String authenticatedEmail) {
        CustomerContext customer = resolveCustomer(request, authenticatedEmail);
        return idempotency.findByScopeKeyAndIdempotencyKey(customer.scope(), key)
                .map(record -> replay(record, requestHash(request, customer.details()))).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listForCustomer(UserEntity customer) {
        return orders.findAllByCustomer_IdOrderByCreatedAtDesc(customer.getId()).stream().map(mapper::toResponse).toList();
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
        return toMerchantResponse(orders.save(order));
    }

    private MerchantOrderResponse toMerchantResponse(OrderEntity order) {
        return new MerchantOrderResponse(order.getId(), "PED-" + order.getId().toString().substring(0, 8).toUpperCase(),
                order.getStatus(), order.getTotal(), order.getCreatedAt(), order.getCustomerName(), order.getCustomerEmail(),
                order.getCustomerPhone(), order.getZipCode(), order.getAddress(), order.getDeliveryDate(), order.getShippingCost(),
                order.getShippingCategory(), order.getItems().stream()
                .map(item -> mapper.toResponse(item)).toList());
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

    private OrderResponse replay(IdempotencyRecordEntity record, String requestHash) {
        if (!record.getRequestHash().equals(requestHash)) throw new ApiException(HttpStatus.CONFLICT, "A chave de idempotência já foi usada com dados diferentes.");
        return mapper.toResponse(record.getOrder());
    }
    private String requestHash(OrderRequest request, OrderRequest.Customer customer) {
        String items = request.items().stream().sorted(Comparator.comparing(this::canonicalItem))
                .map(this::canonicalItem).reduce((left, right) -> left + "," + right).orElse("");
        String canonical = String.join("\n", customer.name(), normalizeEmail(customer.email()),
                customer.phone().replaceAll("\\D", ""), request.zipCode().replaceAll("\\D", ""), request.address().trim(), items);
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception ex) { throw new IllegalStateException("Não foi possível criar a chave de integridade do pedido.", ex); }
    }
    private String normalizeEmail(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    private String canonicalItem(OrderRequest.Item item) {
        ProductSelection selection = item.selection();
        String choices = selection == null ? "" : String.join("|",
                valueOrEmpty(selection.ironColor()), valueOrEmpty(selection.woodColor()),
                valueOrEmpty(selection.woodType()), valueOrEmpty(selection.upholsteryColor()));
        return item.productId() + ":" + item.quantity() + ":" + choices;
    }
    private String valueOrEmpty(String value) { return value == null ? "" : value; }

    private CustomerContext resolveCustomer(OrderRequest request, String authenticatedEmail) {
        if (authenticatedEmail != null && !authenticatedEmail.isBlank()) {
            UserEntity user = users.findByEmailIgnoreCase(normalizeEmail(authenticatedEmail))
                    .filter(UserEntity::isActive)
                    .filter(found -> found.getRole() == Role.CUSTOMER)
                    .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Entre em uma conta de cliente para vincular este pedido."));
            OrderRequest.Customer details = new OrderRequest.Customer(user.getName(), user.getEmail(), user.getPhone());
            return new CustomerContext(user.getId().toString(), user, details);
        }
        throw new ApiException(HttpStatus.UNAUTHORIZED, "Entre em uma conta de cliente antes de comprar.");
    }

    private record CustomerContext(String scope, UserEntity user, OrderRequest.Customer details) {}
}
