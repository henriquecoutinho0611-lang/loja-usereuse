package api.backend_usereuser.controller;

import api.backend_usereuser.dto.StoreSettingsRequest;
import api.backend_usereuser.dto.StoreSettingsResponse;
import api.backend_usereuser.service.StoreSettingsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class StoreSettingsController {
    private final StoreSettingsService settings;

    public StoreSettingsController(StoreSettingsService settings) {
        this.settings = settings;
    }

    @GetMapping("/store-settings")
    public StoreSettingsResponse publicSettings() {
        return settings.get();
    }

    @PutMapping("/admin/settings")
    public StoreSettingsResponse update(@Valid @RequestBody StoreSettingsRequest request) {
        return settings.update(request);
    }
}
