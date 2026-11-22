package api.backend_usereuser.controller;

import api.backend_usereuser.dto.PaymentIntentResponse;
import api.backend_usereuser.service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class PaymentController {
    private final PaymentService payments;

    public PaymentController(PaymentService payments) {
        this.payments = payments;
    }

    @PostMapping("/{orderId}/payment-intent")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentIntentResponse createIntent(@PathVariable UUID orderId,
            @RequestHeader(name = "Idempotency-Key") String idempotencyKey,
            @AuthenticationPrincipal Jwt jwt) {
        return payments.createIntent(orderId, jwt == null ? null : jwt.getSubject(), idempotencyKey);
    }
}
