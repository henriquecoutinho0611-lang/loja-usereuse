package api.backend_usereuser.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
public class OrderItemEntity {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private OrderEntity order;

    @Column(nullable = false)
    private UUID productId;

    @Column(nullable = false, length = 140)
    private String productTitle;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;

    @Column(name = "iron_color", length = 80)
    private String ironColor;

    @Column(name = "wood_color", length = 80)
    private String woodColor;

    @Column(name = "wood_type", length = 80)
    private String woodType;

    @Column(name = "upholstery_color", length = 80)
    private String upholsteryColor;

    @PrePersist
    void beforeInsert() {
        if (id == null) id = UUID.randomUUID();
    }
}
