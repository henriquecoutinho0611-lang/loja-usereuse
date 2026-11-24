package api.backend_usereuser.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface ProductImageStorage {
    String store(MultipartFile image);
    StoredProductImage load(UUID id);
}
