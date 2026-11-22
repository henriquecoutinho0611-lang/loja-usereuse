package api.backend_usereuser.dto;

import java.util.UUID;

public record UserSummary(UUID id, String name, String email, String phone, String role) {}
