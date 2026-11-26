package api.backend_usereuser.dto;

import api.backend_usereuser.entity.ProductEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String title,
        String description,
        String department,
        BigDecimal price,
        BigDecimal oldPrice,
        BigDecimal width,
        BigDecimal height,
        String image,
        String ambientImage,
        boolean featured,
        boolean active,
        List<String> ironColors,
        List<String> woodColors,
        List<String> woodTypes,
        List<String> upholsteryColors
) {
    public static ProductResponse from(ProductEntity product) {
        if (product == null) return null;
        return new ProductResponse(
                product.getId(),
                product.getTitle(),
                product.getDescription(),
                product.getDepartment(),
                product.getPrice(),
                product.getOldPrice(),
                product.getWidth(),
                product.getHeight(),
                product.getImage(),
                product.getAmbientImage(),
                product.isFeatured(),
                product.isActive(),
                product.getIronColors() != null ? product.getIronColors() : List.of(),
                product.getWoodColors() != null ? product.getWoodColors() : List.of(),
                product.getWoodTypes() != null ? product.getWoodTypes() : List.of(),
                product.getUpholsteryColors() != null ? product.getUpholsteryColors() : List.of()
        );
    }
}
