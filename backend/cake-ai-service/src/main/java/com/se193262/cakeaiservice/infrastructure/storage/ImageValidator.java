package com.se193262.cakeaiservice.infrastructure.storage;

import com.se193262.platform.exception.BusinessException;
import javax.imageio.ImageIO;
import java.io.*;
import java.awt.image.BufferedImage;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ImageValidator {
    public record Image(byte[] bytes, String mediaType, int width, int height) {}

    public Image validate(byte[] bytes) {
        if (bytes == null || bytes.length == 0 || bytes.length > 10 * 1024 * 1024)
            throw BusinessException.invalid("Image must be between 1 byte and 10 MB");
        try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw BusinessException.invalid("Invalid image content");
            var reader = readers.next();
            try {
                String format = reader.getFormatName().toLowerCase(java.util.Locale.ROOT);
                if (!Set.of("png", "jpeg", "jpg", "webp").contains(format))
                    throw BusinessException.invalid("Only JPEG, PNG and WebP are supported");
                reader.setInput(input);
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width < 1 || height < 1 || (long) width * height > 25_000_000)
                    throw BusinessException.invalid("Image dimensions exceed limit");
                if (reader.read(0) == null) throw BusinessException.invalid("Invalid image content");
                return new Image(bytes, "image/" + (format.equals("jpg") ? "jpeg" : format), width, height);
            } finally { reader.dispose(); }
        } catch (IOException error) { throw BusinessException.invalid("Invalid image content"); }
    }

    public byte[] thumbnail(Image image) {
        return resized(image, 320);
    }

    public Image providerReference(Image image) {
        return validate(resized(image, 1536));
    }

    private byte[] resized(Image image, int maximumDimension) {
        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(image.bytes()));
            double scale = Math.min(1.0, (double) maximumDimension / Math.max(image.width(), image.height()));
            BufferedImage result = new BufferedImage(Math.max(1, (int) (image.width() * scale)),
                    Math.max(1, (int) (image.height() * scale)), BufferedImage.TYPE_INT_RGB);
            var graphics = result.createGraphics();
            try { graphics.drawImage(original, 0, 0, result.getWidth(), result.getHeight(), null); }
            finally { graphics.dispose(); }
            var output = new ByteArrayOutputStream();
            ImageIO.write(result, "jpeg", output);
            return output.toByteArray();
        } catch (IOException error) { throw BusinessException.invalid("Cannot decode image"); }
    }
}
