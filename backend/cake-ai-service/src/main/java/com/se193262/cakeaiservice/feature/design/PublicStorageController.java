package com.se193262.cakeaiservice.feature.design;

import com.se193262.platform.exception.BusinessException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Retires the insecure key-only route without changing other services' media policies. */
@RestController
public class PublicStorageController {
    @GetMapping("/storage/**")
    public ResponseEntity<byte[]> getFile() {
        // Authorized design/source APIs issue expiring private GCS capabilities.
        throw BusinessException.missing();
    }
}
