package api.backend_usereuser.service;

import api.backend_usereuser.dto.ShippingQuoteResponse;
import api.backend_usereuser.dto.StoreSettingsResponse;
import api.backend_usereuser.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ShippingServiceTests {
    private ViaCepClient viaCep;
    private StoreSettingsService settings;
    private ShippingService shipping;

    @BeforeEach
    void setUp() {
        viaCep = mock(ViaCepClient.class);
        settings = mock(StoreSettingsService.class);
        shipping = new ShippingService(viaCep, settings);
    }

    @Test
    void classifiesCapitalAndUsesConfiguredFixedPrice() {
        when(settings.get()).thenReturn(settings(new BigDecimal("75.50"), null));
        when(viaCep.lookup("01001000")).thenReturn(new ViaCepClient.Address("São Paulo", "SP"));

        ShippingQuoteResponse quote = shipping.quote("01001000");

        assertEquals("SAO_PAULO_CITY", quote.category());
        assertEquals("75.50", quote.price().toPlainString());
    }

    @Test
    void leavesStatePriceUnspecifiedUntilMerchantConfiguresIt() {
        when(settings.get()).thenReturn(settings(null, null));
        when(viaCep.lookup("13010000")).thenReturn(new ViaCepClient.Address("Campinas", "SP"));

        ShippingQuoteResponse quote = shipping.quote("13010000");

        assertEquals("SAO_PAULO_STATE", quote.category());
        assertNull(quote.price());
    }

    @Test
    void requestsManualQuoteForAddressesOutsideSaoPaulo() {
        when(settings.get()).thenReturn(settings(null, null));
        when(viaCep.lookup("80010000")).thenReturn(new ViaCepClient.Address("Curitiba", "PR"));

        ShippingQuoteResponse quote = shipping.quote("80010000");

        assertEquals("CONTACT", quote.category());
        assertNull(quote.price());
    }

    @Test
    void reportsUnknownPostalCodes() {
        when(viaCep.lookup("99999999")).thenThrow(new ViaCepClient.ZipCodeNotFoundException());

        ApiException error = assertThrows(ApiException.class, () -> shipping.quote("99999999"));

        assertEquals(404, error.getStatus().value());
    }

    @Test
    void rejectsMalformedPostalCodesBeforeCallingViaCep() {
        ApiException error = assertThrows(ApiException.class, () -> shipping.quote("--------"));

        assertEquals(400, error.getStatus().value());
        verify(viaCep, never()).lookup("--------");
    }

    @Test
    void allowsOrdersWithManualShippingWhenCepLookupIsUnavailable() {
        when(viaCep.lookup("01001000")).thenThrow(new ViaCepClient.ZipCodeLookupException(new IllegalStateException("offline")));

        ShippingQuoteResponse quote = shipping.quoteForOrder("01001000");

        assertEquals("CONTACT", quote.category());
        assertNull(quote.price());
        assertEquals("Não foi possível confirmar a região pelo CEP. O frete e o prazo serão combinados com a loja.", quote.message());
    }

    @Test
    void doesNotAllowAnUnknownCepWhenCreatingAnOrder() {
        when(viaCep.lookup("99999999")).thenThrow(new ViaCepClient.ZipCodeNotFoundException());

        ApiException error = assertThrows(ApiException.class, () -> shipping.quoteForOrder("99999999"));

        assertEquals(404, error.getStatus().value());
    }

    private StoreSettingsResponse settings(BigDecimal cityPrice, BigDecimal statePrice) {
        return new StoreSettingsResponse("", cityPrice, statePrice, "Frete a combinar", "Pagamento a combinar");
    }
}
