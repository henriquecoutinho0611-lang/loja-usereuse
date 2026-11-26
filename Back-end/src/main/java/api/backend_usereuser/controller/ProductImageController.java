package api.backend_usereuser.controller;

import api.backend_usereuser.service.ProductImageStorage;
import api.backend_usereuser.service.StoredProductImage;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.UUID;

@RestController
public class ProductImageController {
    private final ProductImageStorage storage;

    public ProductImageController(ProductImageStorage storage) {
        this.storage = storage;
    }

    @PostMapping(path = "/api/admin/products/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResult upload(@RequestParam("file") MultipartFile file) {
        return new UploadResult(storage.store(file));
    }

    @GetMapping("/api/products/images/{id}")
    public ResponseEntity<byte[]> get(@PathVariable UUID id) {
        StoredProductImage image = storage.load(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic())
                .body(image.content());
    }

    public record UploadResult(String url) {}
}
