package api.backend_usereuser.dto;

import java.util.UUID;

public record BannerResponse(
        UUID id,
        String image,
        String eyebrow,
        String title,
        String text,
        String cta,
        String tag
) {}
