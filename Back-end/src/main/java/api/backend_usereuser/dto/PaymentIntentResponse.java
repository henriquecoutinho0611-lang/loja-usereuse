package api.backend_usereuser.dto;

public record PaymentIntentResponse(
        String provider,
        String providerReference,
        String checkoutUrl
) {}
