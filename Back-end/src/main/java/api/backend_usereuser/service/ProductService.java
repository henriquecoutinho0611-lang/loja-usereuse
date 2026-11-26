package api.backend_usereuser.service;

import api.backend_usereuser.dto.ProductRequest;
import api.backend_usereuser.dto.ProductResponse;
import api.backend_usereuser.entity.ProductEntity;
import api.backend_usereuser.exception.ApiException;
import api.backend_usereuser.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.UUID;

@Service
public class ProductService {
    private final ProductRepository products;

    public ProductService(ProductRepository products) {
        this.products = products;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listPublic() {
        return products.findAllByActiveTrueOrderByFeaturedDescCreatedAtDesc().stream()
                .map(ProductResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listForMerchant() {
        return products.findAllByOrderByCreatedAtDesc().stream()
                .map(ProductResponse::from).toList();
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        ProductEntity product = request.toEntity();
        normalize(product);
        return ProductResponse.from(products.save(product));
    }

    @Transactional
    public ProductResponse update(UUID id, ProductRequest request) {
        ProductEntity product = products.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Product not found: " + id));

        product.setTitle(request.title());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setFeatured(request.featured());
        product.setDepartment(request.department());
        product.setOldPrice(request.oldPrice());
        product.setWidth(request.width());
        product.setHeight(request.height());
        product.setImage(request.image());
        product.setAmbientImage(request.ambientImage());
        product.setIronColors(request.ironColors());
        product.setWoodColors(request.woodColors());
        product.setWoodTypes(request.woodTypes());
        product.setUpholsteryColors(request.upholsteryColors());

        normalize(product);
        return ProductResponse.from(products.save(product));
    }

    @Transactional
    public void delete(UUID id) {
        if (!products.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Product not found");
        }
        products.deleteById(id);
    }

    @Transactional(readOnly = true)
    public ProductEntity getActiveEntity(UUID id) {
        return products.findById(id).filter(ProductEntity::isActive)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
    }

    private void normalize(ProductEntity product) {
        product.setTitle(product.getTitle().trim());
        product.setDescription(product.getDescription().trim());
        product.setDepartment(product.getDepartment().trim());
        product.setImage(product.getImage().trim());
        if (product.getAmbientImage() != null) product.setAmbientImage(product.getAmbientImage().trim());
        product.setIronColors(normalizeOptions(product.getIronColors()));
        product.setWoodColors(normalizeOptions(product.getWoodColors()));
        product.setWoodTypes(normalizeOptions(product.getWoodTypes()));
        product.setUpholsteryColors(normalizeOptions(product.getUpholsteryColors()));
    }

    private List<String> normalizeOptions(List<String> options) {
        if (options == null) return List.of();
        List<String> result = new ArrayList<>();
        for (String option : options) {
            if (option == null) continue;
            String trimmed = option.trim();
            if (trimmed.isEmpty()) continue;
            if (result.stream().noneMatch(existing -> existing.equalsIgnoreCase(trimmed))) {
                result.add(trimmed);
            }
        }
        return result;
    }
}
