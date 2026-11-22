package api.backend_usereuser.service;

import api.backend_usereuser.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@Service
public class LocalProductImageStorage implements ProductImageStorage {
    private static final long MAX_BYTES = 10L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    private final Path directory;

    public LocalProductImageStorage(@Value("${app.images.local-directory}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    @Override
    public String store(MultipartFile image) {
        if (image == null || image.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "Escolha uma imagem para enviar.");
        if (image.getSize() > MAX_BYTES) throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "A imagem deve ter até 10 MB.");
        String extension = EXTENSIONS.get(image.getContentType());
        if (extension == null) throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Envie uma imagem JPG, PNG, WEBP ou GIF.");

        String filename = UUID.randomUUID() + extension;
        try {
            byte[] content = image.getBytes();
            if (!matchesImageSignature(extension, content))
                throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "O conteúdo do arquivo não corresponde a uma imagem válida.");
            Files.createDirectories(directory);
            Path destination = directory.resolve(filename).normalize();
            if (!destination.startsWith(directory)) throw new ApiException(HttpStatus.BAD_REQUEST, "Nome de arquivo inválido.");
            Files.write(destination, content);
            return "/media/products/" + filename;
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível salvar a imagem no servidor.");
        }
    }

    private boolean matchesImageSignature(String extension, byte[] bytes) {
        return switch (extension) {
            case ".jpg" -> bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff;
            case ".png" -> bytes.length >= 8 && (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47
                    && bytes[4] == 0x0d && bytes[5] == 0x0a && bytes[6] == 0x1a && bytes[7] == 0x0a;
            case ".webp" -> bytes.length >= 12 && ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP");
            case ".gif" -> bytes.length >= 6 && (ascii(bytes, 0, "GIF87a") || ascii(bytes, 0, "GIF89a"));
            default -> false;
        };
    }

    private boolean ascii(byte[] bytes, int offset, String expected) {
        if (bytes.length < offset + expected.length()) return false;
        for (int index = 0; index < expected.length(); index++)
            if (bytes[offset + index] != (byte) expected.charAt(index)) return false;
        return true;
    }
}
