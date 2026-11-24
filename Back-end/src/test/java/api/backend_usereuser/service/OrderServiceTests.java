package api.backend_usereuser.service;

import api.backend_usereuser.dto.OrderRequest;
import api.backend_usereuser.dto.OrderResponse;
import api.backend_usereuser.dto.ShippingQuoteResponse;
import api.backend_usereuser.entity.OrderEntity;
import api.backend_usereuser.entity.ProductEntity;
import api.backend_usereuser.entity.Role;
import api.backend_usereuser.entity.UserEntity;
import api.backend_usereuser.mapper.OrderMapper;
import api.backend_usereuser.repository.OrderRepository;
import api.backend_usereuser.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderServiceTests {
    @Test
    void includesConfiguredFixedShippingInTheOrderTotal() {
        OrderRepository orders = mock(OrderRepository.class);
        ProductService products = mock(ProductService.class);
        UserRepository users = mock(UserRepository.class);
        OrderMapper mapper = mock(OrderMapper.class);
        ShippingService shipping = mock(ShippingService.class);
        UUID productId = UUID.randomUUID();

        UserEntity customer = new UserEntity();
        customer.setId(UUID.randomUUID());
        customer.setName("Cliente");
        customer.setEmail("cliente@example.com");
        customer.setPhone("(11) 99999-9999");
        customer.setRole(Role.CUSTOMER);
        customer.setActive(true);
        ProductEntity product = new ProductEntity();
        product.setId(productId);
        product.setTitle("Mesa");
        product.setPrice(new BigDecimal("125.00"));
        product.setIronColors(List.of());
        product.setWoodColors(List.of());
        product.setWoodTypes(List.of());
        product.setUpholsteryColors(List.of());
        when(users.findByEmailIgnoreCase("cliente@example.com")).thenReturn(Optional.of(customer));
        when(products.getActiveEntity(productId)).thenReturn(product);
        when(shipping.quoteForOrder("01001000"))
                .thenReturn(new ShippingQuoteResponse(new BigDecimal("75.50"), null, false,
                        "São Paulo", "SP", "SAO_PAULO_CITY", "Frete fixo"));
        when(orders.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mapper.toResponse(any(OrderEntity.class)))
                .thenReturn(new OrderResponse(UUID.randomUUID(), "PED-12345678", "RECEIVED",
                        new BigDecimal("200.50"), null, null, new BigDecimal("75.50"),
                        "SAO_PAULO_CITY", List.of()));

        OrderService service = new OrderService(orders, products, users, mapper, shipping);
        OrderRequest request = new OrderRequest(null, "01001000", "Rua das Flores, 1",
                List.of(new OrderRequest.Item(productId, 1, null)));

        service.create(request, "cliente@example.com");

        ArgumentCaptor<OrderEntity> savedOrder = ArgumentCaptor.forClass(OrderEntity.class);
        verify(orders).save(savedOrder.capture());
        assertEquals(new BigDecimal("200.50"), savedOrder.getValue().getTotal());
        assertEquals(new BigDecimal("75.50"), savedOrder.getValue().getShippingCost());
    }

    @Test
    void persistsOrderStatusBeforeReturningTheUpdatedStatus() {
        OrderRepository orders = mock(OrderRepository.class);
        UUID orderId = UUID.randomUUID();
        OrderEntity order = new OrderEntity();
        order.setId(orderId);
        order.setStatus("RECEIVED");
        order.setItems(List.of());
        when(orders.findById(orderId)).thenReturn(Optional.of(order));
        when(orders.saveAndFlush(order)).thenReturn(order);

        OrderService service = new OrderService(orders,
                mock(ProductService.class), mock(UserRepository.class), mock(OrderMapper.class),
                mock(ShippingService.class));

        var response = service.updateStatus(orderId, "IN_PRODUCTION");

        verify(orders).saveAndFlush(order);
        assertEquals("IN_PRODUCTION", order.getStatus());
        assertEquals("IN_PRODUCTION", response.status());
    }
}
