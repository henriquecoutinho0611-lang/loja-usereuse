package api.backend_usereuser.controller;

import api.backend_usereuser.dto.OrderResponse;
import api.backend_usereuser.dto.UserSummary;
import api.backend_usereuser.entity.Role;
import api.backend_usereuser.entity.UserEntity;
import api.backend_usereuser.exception.ApiException;
import api.backend_usereuser.repository.OrderRepository;
import api.backend_usereuser.repository.UserRepository;
import api.backend_usereuser.service.OrderService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/account")
@AllArgsConstructor
public class AccountController {
    private final UserRepository users;
    private final OrderService orders;
    private final OrderRepository ordersRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/profile")
    @Transactional(readOnly = true)
    public UserSummary profile(@AuthenticationPrincipal Jwt jwt) {
        return UserSummary.from(customer(jwt));
    }

    @GetMapping("/orders")
    @Transactional(readOnly = true)
    public List<OrderResponse> orders(@AuthenticationPrincipal Jwt jwt) {
        return orders.listForCustomer(jwt.getSubject());
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt) {
        UserEntity customer = customer(jwt);
        String anonymizedEmail = "deleted-" + customer.getId() + "@invalid.local";
        ordersRepository.anonymizeCustomerOrders(customer.getId(), anonymizedEmail);
        customer.setName("Conta excluída");
        customer.setEmail(anonymizedEmail);
        customer.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        customer.setPhone(null);
        customer.setCpf(null);
        customer.setActive(false);
        return ResponseEntity.noContent().build();
    }

    private UserEntity customer(Jwt jwt) {
        return users.findByEmailIgnoreCase(jwt.getSubject())
                .filter(UserEntity::isActive)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Conta não encontrada ou inativa."));
    }
}
