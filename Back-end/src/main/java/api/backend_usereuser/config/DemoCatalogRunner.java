package api.backend_usereuser.config;

import api.backend_usereuser.entity.ProductEntity;
import api.backend_usereuser.repository.ProductRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
public class DemoCatalogRunner {
    @Bean
    ApplicationRunner loadDemoCatalog(ProductRepository products) {
        return args -> insertIfEmpty(products);
    }

    void insertIfEmpty(ProductRepository products) {
        if (products.count() > 0) return;
        products.saveAll(List.of(
                product("Estante Demonstração Industrial", "Produto demonstrativo. Troque os dados e fotos pelo catálogo real.",
                        "Estantes", "1290.00", "1490.00", "90", "180",
                        "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=900&q=85", true),
                product("Mesa Demonstração Oficina", "Produto demonstrativo. Troque os dados e fotos pelo catálogo real.",
                        "Mesas", "1790.00", null, "160", "76",
                        "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=85", true),
                product("Aparador Demonstração Trilho", "Produto demonstrativo. Troque os dados e fotos pelo catálogo real.",
                        "Aparadores", "990.00", "1190.00", "120", "82",
                        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85", true)
        ));
    }

    private ProductEntity product(String title, String description, String department, String price,
                                  String oldPrice, String width, String height, String image, boolean featured) {
        ProductEntity product = new ProductEntity();
        product.setTitle(title); product.setDescription(description); product.setDepartment(department);
        product.setPrice(new BigDecimal(price));
        product.setOldPrice(oldPrice == null ? null : new BigDecimal(oldPrice));
        product.setWidth(new BigDecimal(width)); product.setHeight(new BigDecimal(height));
        product.setImage(image); product.setAmbientImage(image); product.setFeatured(featured);
        product.setActive(true);
        return product;
    }
}
