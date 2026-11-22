package api.backend_usereuser.dto;

import jakarta.validation.constraints.Size;

public record ProductSelection(
        @Size(max = 80) String ironColor,
        @Size(max = 80) String woodColor,
        @Size(max = 80) String woodType,
        @Size(max = 80) String upholsteryColor
) {}
