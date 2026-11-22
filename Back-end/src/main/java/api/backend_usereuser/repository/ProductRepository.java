package api.backend_usereuser.repository;

import api.backend_usereuser.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<ProductEntity, UUID> {
    List<ProductEntity> findAllByActiveTrueOrderByFeaturedDescCreatedAtDesc();
    List<ProductEntity> findAllByOrderByCreatedAtDesc();
    List<ProductEntity> findAllByFeaturedTrueAndActiveTrueOrderByCreatedAtDesc();
}
