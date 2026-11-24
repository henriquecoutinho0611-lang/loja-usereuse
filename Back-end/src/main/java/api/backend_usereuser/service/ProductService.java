package api.backend_usereuser.service;

import api.backend_usereuser.dto.ProductRequest;
import api.backend_usereuser.dto.ProductResponse;
import api.backend_usereuser.entity.ProductEntity;
import api.backend_usereuser.exception.ApiException;
import api.backend_usereuser.mapper.ProductMapper;
import api.backend_usereuser.repository.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;

@Service
public class ProductService {
    private final ProductRepository products;
    private final ProductMapper mapper;
    public ProductService(ProductRepository products, ProductMapper mapper) {
        this.products = products;
        this.mapper = mapper; }

    @Transactional(readOnly = true)
    public List<ProductResponse> listPublic() {

        return products.findAllByActiveTrueOrderByFeaturedDescCreatedAtDesc().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listForMerchant() {

        return products.findAllByOrderByCreatedAtDesc().stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        ProductEntity product = mapper.toEntity(request); normalize(product);
        return mapper.toResponse(products.save(product));

    }

    @Transactional
    public ProductResponse update(UUID id, ProductRequest request) {

        ProductEntity product = products.findById(id).orElseThrow(() -> new EntityNotFoundException("Product not found"+ id));

        product.setTitle(request.title());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setFeatured(request.featured());
        product.setDepartment(request.department());
        product.setOldPrice(request.oldPrice());
        product.setImage(request.image());
        product.setAmbientImage(request.ambientImage());
        product.setIronColors(request.ironColors());
        product.setWoodColors(request.woodColors());
        product.setWoodTypes(request.woodTypes());
        product.setUpholsteryColors(request.upholsteryColors());

        return mapper.toResponse(products.save(product));


    }

    @Transactional
    public void delete(UUID id) {

         if(!products.existsById(id)) {
             throw new ApiException(HttpStatus.NOT_FOUND, "Product not found");

         }
         products.deleteById(id);

    }



    @Transactional(readOnly = true)

    public ProductEntity getActiveEntity(UUID id) {
        return products.findById(id).filter(ProductEntity::isActive)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
    }

    private ProductEntity getProduct(UUID id) {
        return products.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Produto não encontrado."));
    }

    private void normalize(ProductEntity product) {
        product.setTitle(product.getTitle().trim()); product.setDescription(product.getDescription().trim());
        product.setDepartment(product.getDepartment().trim()); product.setImage(product.getImage().trim());
        if (product.getAmbientImage() != null) product.setAmbientImage(product.getAmbientImage().trim());
        product.setIronColors(normalizeOptions(product.getIronColors()));
        product.setWoodColors(normalizeOptions(product.getWoodColors()));
        product.setWoodTypes(normalizeOptions(product.getWoodTypes()));
        product.setUpholsteryColors(normalizeOptions(product.getUpholsteryColors()));
    }

    private List<String> normalizeOptions(List<String> options) {
        if (options == null) return List.of();
        List<String> normalized = new ArrayList<>();
        for (String option : options) {
            String value = option.trim();
            if (!value.isBlank() && normalized.stream().noneMatch(existing -> existing.toLowerCase(Locale.ROOT).equals(value.toLowerCase(Locale.ROOT)))) {
                normalized.add(value);
            }
        }
        return List.copyOf(normalized);
    }
}
