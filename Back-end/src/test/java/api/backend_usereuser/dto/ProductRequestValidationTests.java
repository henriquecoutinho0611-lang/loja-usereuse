package api.backend_usereuser.dto;

import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductRequestValidationTests {
    @Test
    void acceptsImageUrlsReturnedByDatabaseImageUpload() {
        String imageUrl = "/api/products/images/8ac4ae8d-4c44-4c4a-98a4-4a7c597b0f00";
        ProductRequest request = new ProductRequest("Produto", "Descrição", "Sala",
                new BigDecimal("10.00"), null, new BigDecimal("1.00"), new BigDecimal("1.00"),
                imageUrl, imageUrl, false, List.of(), List.of(), List.of(), List.of());

        try (var validatorFactory = Validation.buildDefaultValidatorFactory()) {
            assertTrue(validatorFactory.getValidator().validate(request).isEmpty());
        }
    }
}
