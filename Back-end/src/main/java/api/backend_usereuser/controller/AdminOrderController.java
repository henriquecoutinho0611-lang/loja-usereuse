package api.backend_usereuser.controller;

import api.backend_usereuser.dto.MerchantOrderResponse;
import api.backend_usereuser.dto.DeliveryDateUpdateRequest;
import api.backend_usereuser.dto.OrderStatusUpdateRequest;
import api.backend_usereuser.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {
    private final OrderService orders;

    public AdminOrderController(OrderService orders) { this.orders = orders; }

    @GetMapping
    public List<MerchantOrderResponse> list() { return orders.listForMerchant(); }

    @PatchMapping("/{id}/status")
    public MerchantOrderResponse updateStatus(@PathVariable UUID id, @Valid @RequestBody OrderStatusUpdateRequest request) {
        return orders.updateStatus(id, request.status());
    }

    @PatchMapping("/{id}/delivery-date")
    public MerchantOrderResponse updateDeliveryDate(@PathVariable UUID id, @Valid @RequestBody DeliveryDateUpdateRequest request) {
        return orders.updateDeliveryDate(id, request.deliveryDate());
    }
}
