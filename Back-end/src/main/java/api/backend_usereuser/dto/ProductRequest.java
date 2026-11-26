package api.backend_usereuser.dto;

import api.backend_usereuser.entity.ProductEntity;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(
        @NotBlank @Size(max = 140) String title,
        @NotBlank @Size(max = 8000) String description,
        @NotBlank @Size(max = 80) String department,
        @NotNull @DecimalMin("0.01") BigDecimal price,
        @DecimalMin("0.00") BigDecimal oldPrice,
        @NotNull @DecimalMin("0.01") BigDecimal width,
        @NotNull @DecimalMin("0.01") BigDecimal height,
        @NotBlank @Pattern(regexp = "^(https?://|/media/products/|/api/products/images/).+", message = "Envie uma imagem ou informe uma URL válida") @Size(max = 1000) String image,
        @Pattern(regexp = "^(https?://|/media/products/|/api/products/images/).+", message = "Informe uma URL de imagem válida") @Size(max = 1000) String ambientImage,
        boolean featured,
        @Size(max = 30) List<@NotBlank @Size(max = 80) String> ironColors,
        @Size(max = 30) List<@NotBlank @Size(max = 80) String> woodColors,
        @Size(max = 30) List<@NotBlank @Size(max = 80) String> woodTypes,
        @Size(max = 30) List<@NotBlank @Size(max = 80) String> upholsteryColors
) {
    public ProductEntity toEntity() {
        ProductEntity entity = new ProductEntity();
        entity.setTitle(title());
        entity.setDescription(description());
        entity.setDepartment(department());
        entity.setPrice(price());
        entity.setOldPrice(oldPrice());
        entity.setWidth(width());
        entity.setHeight(height());
        entity.setImage(image());
        entity.setAmbientImage(ambientImage());
        entity.setFeatured(featured());
        entity.setActive(true);
        entity.setIronColors(ironColors() != null ? ironColors() : List.of());
        entity.setWoodColors(woodColors() != null ? woodColors() : List.of());
        entity.setWoodTypes(woodTypes() != null ? woodTypes() : List.of());
        entity.setUpholsteryColors(upholsteryColors() != null ? upholsteryColors() : List.of());
        return entity;
    }
}
