package api.backend_usereuser.controller;

import api.backend_usereuser.dto.OrderRequest;
import api.backend_usereuser.dto.OrderResponse;
import api.backend_usereuser.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
            @AuthenticationPrincipal Jwt jwt) {
        String email = jwt == null ? null : jwt.getSubject();
        OrderResponse created = orders.create(request, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
