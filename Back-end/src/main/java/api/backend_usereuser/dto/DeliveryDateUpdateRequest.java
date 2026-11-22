package api.backend_usereuser.dto;

import jakarta.validation.constraints.FutureOrPresent;

import java.time.LocalDate;

public record DeliveryDateUpdateRequest(@FutureOrPresent LocalDate deliveryDate) {}
