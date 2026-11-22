package api.backend_usereuser.repository;

import api.backend_usereuser.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {
    List<OrderEntity> findAllByCustomerEmailIgnoreCaseOrderByCreatedAtDesc(String email);
    List<OrderEntity> findAllByCustomer_IdOrderByCreatedAtDesc(UUID customerId);
    List<OrderEntity> findAllByOrderByCreatedAtDesc();

    @Query("select o.id as id, o.total as total, o.customerEmail as customerEmail, c.id as customerId " +
            "from OrderEntity o left join o.customer c where o.id = :id")
    Optional<OrderPaymentDetails> findPaymentDetailsById(@Param("id") UUID id);

    @Modifying
    @Query(value = "UPDATE orders SET customer_name = 'Conta excluída', customer_email = :email, " +
            "customer_phone = 'Removido', customer_user_id = NULL WHERE customer_user_id = :customerId",
            nativeQuery = true)
    void anonymizeCustomerOrders(@Param("customerId") UUID customerId, @Param("email") String email);

    interface OrderPaymentDetails {
        UUID getId();
        BigDecimal getTotal();
        String getCustomerEmail();
        UUID getCustomerId();
    }
}
