package api.backend_usereuser.repository;

import api.backend_usereuser.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {
    List<OrderEntity> findAllByCustomer_IdOrderByCreatedAtDesc(UUID customerId);
    List<OrderEntity> findAllByCustomer_IdOrCustomerEmailIgnoreCaseOrderByCreatedAtDesc(UUID customerId, String customerEmail);
    List<OrderEntity> findAllByOrderByCreatedAtDesc();
    java.util.Optional<OrderEntity> findByIdempotencyKey(String idempotencyKey);

    @Modifying
    @Query(value = "UPDATE orders SET customer_name = 'Conta excluída', customer_email = :email, " +
            "customer_phone = 'Removido', customer_user_id = NULL WHERE customer_user_id = :customerId",
            nativeQuery = true)
    void anonymizeCustomerOrders(@Param("customerId") UUID customerId, @Param("email") String email);
}
