package api.backend_usereuser.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_products_department_active", columnList = "department, active"),
        @Index(name = "idx_products_featured", columnList = "featured, active")
})
@Getter
@Setter
@NoArgsConstructor
public class ProductEntity {
    @Id
    private UUID id;

    @Column(nullable = false, length = 140)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(nullable = false, length = 80)
    private String department;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(precision = 12, scale = 2)
    private BigDecimal oldPrice;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal width;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal height;

    @Column(nullable = false, length = 1000)
    private String image;

    @Column(length = 1000)
    private String ambientImage;

    @Convert(converter = StringListConverter.class)
    @Column(name = "iron_colors", nullable = false, columnDefinition = "text")
    private List<String> ironColors = List.of();

    @Convert(converter = StringListConverter.class)
    @Column(name = "wood_colors", nullable = false, columnDefinition = "text")
    private List<String> woodColors = List.of();

    @Convert(converter = StringListConverter.class)
    @Column(name = "wood_types", nullable = false, columnDefinition = "text")
    private List<String> woodTypes = List.of();

    @Convert(converter = StringListConverter.class)
    @Column(name = "upholstery_colors", nullable = false, columnDefinition = "text")
    private List<String> upholsteryColors = List.of();

    @Column(nullable = false)
    private boolean featured;

    @Column(nullable = false)
    private boolean active = true;

    @Version
    private long version;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void beforeInsert() {
        if (id == null) id = UUID.randomUUID();
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void beforeUpdate() {
        updatedAt = Instant.now();
    }
}
