package api.backend_usereuser.controller;

import api.backend_usereuser.dto.MerchantOrderResponse;
import api.backend_usereuser.dto.OrderRequest;
import api.backend_usereuser.dto.OrderResponse;
import api.backend_usereuser.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class OrderController {
    private final OrderService orders;

    public OrderController(OrderService orders) {
        this.orders = orders;
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> create(
            @Valid @RequestBody OrderRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @AuthenticationPrincipal Jwt jwt) {
        String email = jwt == null ? null : jwt.getSubject();
        OrderResponse created = orders.create(request, email, idempotencyKey);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/admin/orders")
    public List<MerchantOrderResponse> list() {
        return orders.listForMerchant();
    }

    @PatchMapping("/admin/orders/{id}/status")
    public MerchantOrderResponse updateStatus(@PathVariable UUID id,
            @Valid @RequestBody StatusUpdate body) {
        return orders.updateStatus(id, body.status());
    }

    @PatchMapping("/admin/orders/{id}/delivery-date")
    public MerchantOrderResponse updateDeliveryDate(@PathVariable UUID id,
            @Valid @RequestBody DeliveryDateUpdate body) {
        return orders.updateDeliveryDate(id, body.deliveryDate());
    }

    // ── inline request DTOs ──────────────────────────────────────────

    public record StatusUpdate(
            @NotBlank
            @Pattern(regexp = "RECEIVED|IN_PRODUCTION|READY_FOR_SHIPPING|SHIPPED|DELIVERED|CANCELLED")
            String status) {}

    public record DeliveryDateUpdate(LocalDate deliveryDate) {}
}
