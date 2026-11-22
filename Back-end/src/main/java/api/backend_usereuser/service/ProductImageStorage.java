package api.backend_usereuser.service;

import org.springframework.web.multipart.MultipartFile;

public interface ProductImageStorage {
    String store(MultipartFile image);
}
