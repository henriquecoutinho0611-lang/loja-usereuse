package api.backend_usereuser.service;

import api.backend_usereuser.dto.PaymentIntentResponse;
import api.backend_usereuser.exception.ApiException;
import api.backend_usereuser.repository.OrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.UUID;

@Service
public class PaymentService {
    private final OrderRepository orders;
    private final PaymentProvider provider;

    public PaymentService(OrderRepository orders, PaymentProvider provider) {
        this.orders = orders;
        this.provider = provider;
    }

    public PaymentIntentResponse createIntent(UUID orderId, String authenticatedEmail, String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank() || idempotencyKey.length() > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A chave de idempotência é obrigatória.");
        }
        var order = orders.findPaymentDetailsById(orderId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pedido não encontrado."));
        if (order.getCustomerId() == null || authenticatedEmail == null ||
                !order.getCustomerEmail().trim().toLowerCase(Locale.ROOT)
                        .equals(authenticatedEmail.trim().toLowerCase(Locale.ROOT))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Você não pode iniciar o pagamento deste pedido.");
        }
        return provider.createIntent(order.getId(), order.getTotal(), idempotencyKey);
    }
}
