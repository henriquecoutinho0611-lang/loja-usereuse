package api.backend_usereuser.controller;

import api.backend_usereuser.dto.OrderRequest;
import api.backend_usereuser.dto.OrderResponse;
import api.backend_usereuser.exception.ApiException;
import api.backend_usereuser.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {
    private final OrderService orders;
    public OrderController(OrderService orders) { this.orders = orders; }

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody OrderRequest request,
            @RequestHeader(name = "Idempotency-Key") String key,
            @AuthenticationPrincipal Jwt jwt) {
        if (key.isBlank() || key.length() > 100) throw new ApiException(HttpStatus.BAD_REQUEST, "A chave de idempotência é obrigatória.");
        try {
            return ResponseEntity.status(HttpStatus.CREATED).header("Idempotency-Replayed", "false")
                    .body(orders.create(request, key, jwt == null ? null : jwt.getSubject()));
        } catch (DataIntegrityViolationException concurrentRequest) {
            OrderResponse previous = orders.replayIfPresent(request, key, jwt == null ? null : jwt.getSubject());
            if (previous == null) throw concurrentRequest;
            return ResponseEntity.ok().header("Idempotency-Replayed", "true").body(previous);
        }
    }

}
