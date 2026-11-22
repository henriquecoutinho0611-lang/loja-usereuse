package api.backend_usereuser.dto;

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
) {}
