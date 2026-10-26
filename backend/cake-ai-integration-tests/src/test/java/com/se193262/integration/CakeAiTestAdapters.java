package com.se193262.integration;

import com.se193262.cakeaiservice.infrastructure.client.ImageProvider;
import com.se193262.cakeaiservice.infrastructure.storage.*;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.io.ByteArrayOutputStream;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

@TestConfiguration
public class CakeAiTestAdapters {
    @Bean @Primary FakeProvider fakeImageProvider() { return new FakeProvider(); }
    @Bean @Primary ImageStorage fakeAiStorage() {
        return new ImageStorage() {
            final Map<String, byte[]> objects = new ConcurrentHashMap<>();
            public void checkAvailable() {}
            public void upload(String key, byte[] bytes, String type) { objects.put(key, bytes); }
            public byte[] read(String key) { return objects.get(key); }
            public void delete(String key) { objects.remove(key); }
            public String signedUrl(String key) { return "https://storage.invalid/signed"; }
            public List<StoredObject> scan(int limit) { return List.of(); }
        };
    }

    public static class FakeProvider implements ImageProvider {
        Moderation outputDecision = Moderation.APPROVED;
        public void checkAvailable() {}
        public Moderation moderate(String prompt, List<ImageValidator.Image> images) {
            return prompt.startsWith("Assess this generated") ? outputDecision : Moderation.APPROVED;
        }
        public ImageValidator.Image generate(String model, String prompt, String ratio, List<ImageValidator.Image> references) {
            try {
                var output = new ByteArrayOutputStream();
                ImageIO.write(new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB), "png", output);
                return new ImageValidator().validate(output.toByteArray());
            } catch (java.io.IOException error) { throw new IllegalStateException(error); }
        }
    }
}
