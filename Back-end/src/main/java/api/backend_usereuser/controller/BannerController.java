package api.backend_usereuser.controller;

import api.backend_usereuser.dto.BannerResponse;
import api.backend_usereuser.service.ProductService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/banners")
public class BannerController {
    private final ProductService products;
    public BannerController(ProductService products) { this.products = products; }

    @GetMapping
    public List<BannerResponse> banners() {
        List<BannerResponse> result = products.listPublic().stream().filter(p -> p.featured() && p.active()).limit(3)
                .map(p -> new BannerResponse(p.id(), p.ambientImage() != null ? p.ambientImage() : p.image(),
                        p.department().toUpperCase(), "Móveis feitos para durar", "Conheça " + p.title() + " e explore o design industrial da coleção.",
                        "Descobrir a coleção", "DESTAQUE DA COLEÇÃO"))
                .toList();
        if (!result.isEmpty()) return result;
        return List.of(new BannerResponse(UUID.fromString("a4e8e191-45ad-4b13-a8be-981e4bc6379b"),
                "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=85",
                "CASA LEVE, VIDA LEVE", "Um novo jeito\nde morar bem.",
                "Móveis industriais com presença, conforto e acabamento cuidadoso.", "Descobrir a coleção", "NOVIDADES"));
    }
}
