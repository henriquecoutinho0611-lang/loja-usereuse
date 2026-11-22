package api.backend_usereuser.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        String role,
        String name,
        String email,
        String phone
) {}
