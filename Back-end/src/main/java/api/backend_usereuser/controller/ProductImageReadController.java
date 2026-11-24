package api.backend_usereuser.controller;

import api.backend_usereuser.service.ProductImageStorage;
import api.backend_usereuser.service.StoredProductImage;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/products/images")
public class ProductImageReadController {
    private final ProductImageStorage storage;

    public ProductImageReadController(ProductImageStorage storage) {
        this.storage = storage;
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> get(@PathVariable UUID id) {
        StoredProductImage image = storage.load(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic())
                .body(image.content());
    }
}
