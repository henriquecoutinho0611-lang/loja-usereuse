package api.backend_usereuser.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders", indexes = {
        @Index(name = "idx_orders_customer_email", columnList = "customer_email"),
        @Index(name = "idx_orders_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
public class OrderEntity {
    @Id
    private UUID id;

    @Column(nullable = false, length = 120)
    private String customerName;

    @Column(nullable = false, length = 180)
    private String customerEmail;

    @Column(nullable = false, length = 20)
    private String customerPhone;

    @Column(nullable = false, length = 9)
    private String zipCode;

    @Column(nullable = false, length = 240)
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_user_id")
    private UserEntity customer;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(nullable = false, length = 24)
    private String status = "RECEIVED";

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "shipping_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal shippingCost = BigDecimal.ZERO;

    @Column(name = "shipping_category", nullable = false, length = 24)
    private String shippingCategory = "CONTACT";

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItemEntity> items = new ArrayList<>();

    public void addItem(OrderItemEntity item) {
        items.add(item);
        item.setOrder(this);
    }

    @PrePersist
    void beforeInsert() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }
}
