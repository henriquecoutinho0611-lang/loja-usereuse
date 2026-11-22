package api.backend_usereuser.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OrderStatusUpdateRequest(
        @NotBlank
        @Pattern(regexp = "RECEIVED|IN_PRODUCTION|READY_FOR_SHIPPING|SHIPPED|DELIVERED|CANCELLED")
        String status
) {}
