package api.backend_usereuser.controller;

import api.backend_usereuser.dto.ShippingQuoteRequest;
import api.backend_usereuser.dto.ShippingQuoteResponse;
import api.backend_usereuser.service.ProductService;
import api.backend_usereuser.service.ShippingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shipping")
public class ShippingController {
    private final ProductService products;
    private final ShippingService shipping;
    public ShippingController(ProductService products, ShippingService shipping) {
        this.products = products;
        this.shipping = shipping;
    }

    @PostMapping("/quote")
    public ShippingQuoteResponse quote(@Valid @RequestBody ShippingQuoteRequest request) {
        if (request.productId() != null) products.getActiveEntity(request.productId());
        String cep = request.zipCode().replaceAll("\\D", "");
        return shipping.quote(cep);
    }
}
