package com.se193262.cakeaiservice.infrastructure.client;

import com.se193262.cakeaiservice.infrastructure.storage.ImageValidator.Image;
import java.util.List;

public interface ImageProvider {
    enum Moderation { APPROVED, REJECTED, PENDING }
    void checkAvailable();
    Image generate(String model, String prompt, String aspectRatio, List<Image> references);
    Moderation moderate(String prompt, List<Image> images);
}
