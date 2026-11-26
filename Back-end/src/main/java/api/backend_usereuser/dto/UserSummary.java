package api.backend_usereuser.dto;

import api.backend_usereuser.entity.UserEntity;

import java.util.UUID;

public record UserSummary(UUID id, String name, String email, String phone, String role) {
    public static UserSummary from(UserEntity user) {
        if (user == null) return null;
        return new UserSummary(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole() != null ? user.getRole().name() : null
        );
    }
}
