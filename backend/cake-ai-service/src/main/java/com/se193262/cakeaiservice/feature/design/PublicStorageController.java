package com.se193262.cakeaiservice.feature.design;

import com.se193262.cakeaiservice.infrastructure.storage.ImageStorage;
import com.se193262.platform.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.time.Duration;

@RestController
public class PublicStorageController {
    private final ImageStorage storage;

    public PublicStorageController(ImageStorage storage) {
        this.storage = storage;
    }

    @GetMapping("/storage/**")
    public ResponseEntity<byte[]> getFile(HttpServletRequest request) {
        String path = request.getRequestURI();
        String prefix = "/storage/";
        int index = path.indexOf(prefix);
        if (index == -1) throw BusinessException.missing();
        String key = path.substring(index + prefix.length());
        byte[] bytes = storage.read(key);
        if (bytes == null) throw BusinessException.missing();
        MediaType type = key.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
        return ResponseEntity.ok()
                .contentType(type)
                .cacheControl(CacheControl.maxAge(Duration.ofHours(24)))
                .body(bytes);
    }
}

