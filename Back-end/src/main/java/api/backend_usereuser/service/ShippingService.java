package api.backend_usereuser.service;

import api.backend_usereuser.dto.ShippingQuoteResponse;
import api.backend_usereuser.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.Locale;

@Service
public class ShippingService {
    private final ViaCepClient viaCep;
    private final StoreSettingsService settings;

    public ShippingService(ViaCepClient viaCep, StoreSettingsService settings) {
        this.viaCep = viaCep;
        this.settings = settings;
    }

    public ShippingQuoteResponse quote(String zipCode) {
        return quoteAddress(lookupAddress(validateZipCode(zipCode)));
    }

    public ShippingQuoteResponse quoteForOrder(String zipCode) {
        try {
            return quoteAddress(lookupAddress(validateZipCode(zipCode)));
        } catch (ViaCepClient.ZipCodeLookupException ex) {
            return new ShippingQuoteResponse(null, null, false, null, null, "CONTACT",
                    "Não foi possível confirmar a região pelo CEP. O frete e o prazo serão combinados com a loja.");
        }
    }

    private ShippingQuoteResponse quoteAddress(ViaCepClient.Address address) {
        var storeSettings = settings.get();
        if (!"SP".equalsIgnoreCase(address.state())) {
            return new ShippingQuoteResponse(null, null, false, address.city(), address.state(), "CONTACT",
                    storeSettings.deliveryOutsideStateMessage());
        }

        boolean capital = normalize(address.city()).equals("sao paulo");
        BigDecimal price = capital ? storeSettings.saoPauloCityPrice() : storeSettings.saoPauloStatePrice();
        String scope = capital ? "cidade de São Paulo" : "estado de São Paulo";
        String category = capital ? "SAO_PAULO_CITY" : "SAO_PAULO_STATE";
        String message = price == null
                ? "O frete fixo para " + scope + " ainda não foi configurado. Entre em contato com a loja."
                : "Frete fixo para " + scope + ".";
        return new ShippingQuoteResponse(price, null, false, address.city(), address.state(), category, message);
    }

    private String validateZipCode(String zipCode) {
        if (zipCode == null || !zipCode.matches("\\d{8}")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Informe um CEP válido com 8 números.");
        }
        return zipCode;
    }

    private ViaCepClient.Address lookupAddress(String zipCode) {
        try {
            return viaCep.lookup(zipCode);
        } catch (ViaCepClient.ZipCodeNotFoundException ex) {
            throw new ApiException(HttpStatus.NOT_FOUND, "O CEP informado não foi encontrado.");
        }
    }

    private String normalize(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toLowerCase(Locale.ROOT);
    }
}
