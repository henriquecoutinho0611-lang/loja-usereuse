package api.backend_usereuser.controller;

import api.backend_usereuser.dto.BannerResponse;
import api.backend_usereuser.dto.ProductRequest;
import api.backend_usereuser.dto.ProductResponse;
import api.backend_usereuser.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ProductController {
    private final ProductService products;

    public ProductController(ProductService products) {
        this.products = products;
    }

    @GetMapping("/products")
    public List<ProductResponse> publicProducts() {
        return products.listPublic();
    }

    @GetMapping("/admin/products")
    public List<ProductResponse> merchantProducts() {
        return products.listForMerchant();
    }

    @PostMapping("/admin/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return products.create(request);
    }

    @PutMapping("/admin/products/{id}")
    public ProductResponse update(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        return products.update(id, request);
    }

    @DeleteMapping("/admin/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        products.delete(id);
    }

    @GetMapping("/banners")
    public List<BannerResponse> banners() {
        List<BannerResponse> result = products.listPublic().stream()
                .filter(p -> p.featured() && p.active()).limit(3)
                .map(p -> new BannerResponse(p.id(),
                        p.ambientImage() != null ? p.ambientImage() : p.image(),
                        p.department().toUpperCase(),
                        "Móveis feitos para durar",
                        "Conheça " + p.title() + " e explore o design industrial da coleção.",
                        "Descobrir a coleção",
                        "DESTAQUE DA COLEÇÃO"))
                .toList();
        if (!result.isEmpty()) return result;
        return List.of(new BannerResponse(
                UUID.fromString("a4e8e191-45ad-4b13-a8be-981e4bc6379b"),
                "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=85",
                "CASA LEVE, VIDA LEVE",
                "Um novo jeito\nde morar bem.",
                "Móveis industriais com presença, conforto e acabamento cuidadoso.",
                "Descobrir a coleção",
                "NOVIDADES"));
    }
}
