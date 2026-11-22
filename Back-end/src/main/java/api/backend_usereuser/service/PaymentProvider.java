package api.backend_usereuser.service;

import api.backend_usereuser.dto.PaymentIntentResponse;

import java.math.BigDecimal;
import java.util.UUID;

public interface PaymentProvider {
    PaymentIntentResponse createIntent(UUID orderId, BigDecimal amount, String idempotencyKey);
}
