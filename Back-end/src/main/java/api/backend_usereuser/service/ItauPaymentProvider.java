package api.backend_usereuser.service;

import api.backend_usereuser.config.ItauPaymentConfiguration;
import api.backend_usereuser.dto.PaymentIntentResponse;
import api.backend_usereuser.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class ItauPaymentProvider implements PaymentProvider {
    private final ItauPaymentConfiguration configuration;

    public ItauPaymentProvider(ItauPaymentConfiguration configuration) {
        this.configuration = configuration;
    }

    @Override
    public PaymentIntentResponse createIntent(UUID orderId, BigDecimal amount, String idempotencyKey) {
        if (!configuration.isEnabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "O pagamento on-line pelo Itaú ainda não está disponível.");
        }
        if (isBlank(configuration.getBaseUrl()) || isBlank(configuration.getClientId()) || isBlank(configuration.getClientSecret())) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "A configuração do pagamento Itaú está incompleta.");
        }

        // TODO: Implementar autenticação e criação do checkout conforme o contrato Itaú fornecido pela loja.
        // As credenciais ficam somente aqui no servidor; não envie esses valores ao front-end.
        throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                "A conexão com o Itaú está preparada, mas a criação do checkout ainda aguarda o contrato técnico do provedor.");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
