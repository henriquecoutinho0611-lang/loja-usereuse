package api.backend_usereuser.service;

import api.backend_usereuser.dto.StoreSettingsRequest;
import api.backend_usereuser.dto.StoreSettingsResponse;
import api.backend_usereuser.entity.StoreSettingsEntity;
import api.backend_usereuser.repository.StoreSettingsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class StoreSettingsService {
    private static final int SETTINGS_ID = 1;
    private static final String DEFAULT_DELIVERY_MESSAGE = "Para entregas fora do estado de São Paulo, entre em contato para combinar o frete e o prazo.";
    private static final String DEFAULT_PAYMENT_MESSAGE = "A loja combinará o pagamento após o envio do pedido.";

    private final StoreSettingsRepository settings;
    private final String defaultCapitalPrice;
    private final String defaultStatePrice;

    public StoreSettingsService(StoreSettingsRepository settings,
                                @Value("${app.shipping.sao-paulo-capital-price:}") String defaultCapitalPrice,
                                @Value("${app.shipping.sao-paulo-state-price:}") String defaultStatePrice) {
        this.settings = settings;
        this.defaultCapitalPrice = defaultCapitalPrice;
        this.defaultStatePrice = defaultStatePrice;
    }

    @Transactional(readOnly = true)
    public StoreSettingsResponse get() {
        return settings.findById(SETTINGS_ID).map(this::toResponse).orElseGet(this::defaults);
    }

    @Transactional
    public StoreSettingsResponse update(StoreSettingsRequest request) {
        StoreSettingsEntity entity = settings.findById(SETTINGS_ID).orElseGet(StoreSettingsEntity::new);
        entity.setId(SETTINGS_ID);
        entity.setWhatsappNumber(request.whatsappNumber().trim());
        entity.setSaoPauloCityPrice(request.saoPauloCityPrice());
        entity.setSaoPauloStatePrice(request.saoPauloStatePrice());
        entity.setDeliveryOutsideStateMessage(request.deliveryOutsideStateMessage().trim());
        entity.setPaymentMessage(request.paymentMessage().trim());
        return toResponse(settings.save(entity));
    }

    private StoreSettingsResponse defaults() {
        return new StoreSettingsResponse("", parseDefaultPrice(defaultCapitalPrice),
                parseDefaultPrice(defaultStatePrice), DEFAULT_DELIVERY_MESSAGE, DEFAULT_PAYMENT_MESSAGE);
    }

    private BigDecimal parseDefaultPrice(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            BigDecimal price = new BigDecimal(value.trim());
            return price.signum() >= 0 ? price : null;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private StoreSettingsResponse toResponse(StoreSettingsEntity entity) {
        return new StoreSettingsResponse(entity.getWhatsappNumber(), entity.getSaoPauloCityPrice(), entity.getSaoPauloStatePrice(),
                entity.getDeliveryOutsideStateMessage(), entity.getPaymentMessage());
    }
}
